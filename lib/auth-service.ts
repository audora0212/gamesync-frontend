const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080/api"

interface LoginRequest {
  username: string
  password: string
}

interface SignupRequest {
  username: string
  nickname: string
  password: string
}

// 백엔드 응답 형태에 맞춰 LoginResponse 수정
interface LoginResponse {
  token: string
  message: string
  userId: number    // 사용자 ID
  nickname: string  // 사용자 닉네임
}

// 백엔드에서 Signup 시 userId, nickname을 반환하면 저장할 수 있도록 옵션 추가
interface SignupResponse {
  message: string
  userId?: number
  nickname?: string
}

class AuthService {
  private tokenKey = "auth-token"
  private userKey = "current-user"
  private userIdKey = "current-user-id"
  private fcmTokenKey = "fcm-token"

  setToken(token: string) {
    localStorage.setItem(this.tokenKey, token)
  }

  setCurrentUser(user: { id: number; nickname: string }) {
    localStorage.setItem(this.userIdKey, String(user.id))
    localStorage.setItem(this.userKey, user.nickname)
  }

  setFcmToken(token: string) {
    localStorage.setItem(this.fcmTokenKey, token)
  }

  getFcmToken(): string | null {
    return typeof window !== "undefined" ? localStorage.getItem(this.fcmTokenKey) : null
  }

  async login(credentials: LoginRequest): Promise<LoginResponse> {
    const response = await fetch(`${API_BASE}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(credentials),
    })
    if (!response.ok) throw new Error("Login failed")

    const data: LoginResponse = await response.json()

    // 토큰 및 사용자 정보 저장
    this.setToken(data.token)
    this.setCurrentUser({ id: data.userId, nickname: data.nickname })

    return data
  }

  async signup(credentials: SignupRequest): Promise<SignupResponse> {
    const response = await fetch(`${API_BASE}/auth/signup`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(credentials),
    })
    if (!response.ok) throw new Error("Signup failed")

    const data: SignupResponse = await response.json()

    // 응답에 userId와 nickname이 포함되면 저장
    if (data.userId !== undefined && data.nickname) {
      this.setCurrentUser({ id: data.userId, nickname: data.nickname })
    }
    return data
  }

  async logout(): Promise<void> {
    const token = this.getToken()
    const fcmToken = this.getFcmToken()
    if (token) {
      try {
        await fetch(`${API_BASE}/auth/logout`, {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
        })
      } catch {
        // 무시
      }
    }
    if (fcmToken) {
      try {
        const url = new URL(`${API_BASE}/push-tokens`)
        url.searchParams.set("token", fcmToken)
        await fetch(url, { method: "DELETE", headers: this.getAuthHeaders() })
      } catch {}
    }
    localStorage.removeItem(this.tokenKey)
    localStorage.removeItem(this.userKey)
    localStorage.removeItem(this.userIdKey)
    localStorage.removeItem(this.fcmTokenKey)
  }

  getToken(): string | null {
    return typeof window !== "undefined" ? localStorage.getItem(this.tokenKey) : null
  }

  getCurrentUser(): string | null {
    return typeof window !== "undefined" ? localStorage.getItem(this.userKey) : null
  }

  getCurrentUserId(): number | null {
    const v = typeof window !== "undefined" ? localStorage.getItem(this.userIdKey) : null
    return v ? Number(v) : null
  }

  isAuthenticated(): boolean {
    return !!this.getToken()
  }

  getAuthHeaders(): Record<string, string> {
    const token = this.getToken()
    return token ? { Authorization: `Bearer ${token}` } : {}
  }
}

export const authService = new AuthService()
