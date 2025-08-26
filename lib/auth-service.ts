const API_BASE = process.env.NEXT_PUBLIC_API_URL || "/api"

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
  private _isLoggingOut = false // 전역 로그아웃 플래그

  setToken(token: string) {
    localStorage.setItem(this.tokenKey, token)
    // 쿠키에도 저장하여 서버사이드에서 인증 상태를 판별할 수 있게 함 (랜딩→대시보드 리다이렉트)
    this.setAuthCookie(token)
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
    // 이미 로그아웃 중이면 리턴
    if (this._isLoggingOut) return
    
    // 로그아웃 플래그 설정
    this._isLoggingOut = true
    
    const token = this.getToken()
    const fcmToken = this.getFcmToken()
    
    // 백엔드 로그아웃 API 호출 (실패해도 계속 진행)
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
    
    // FCM 토큰 삭제
    if (fcmToken) {
      try {
        const url = new URL(`${API_BASE}/push-tokens`)
        url.searchParams.set("token", fcmToken)
        await fetch(url, { method: "DELETE", headers: this.getAuthHeaders() })
      } catch {}
    }
    
    // 모든 로컬 데이터 즉시 삭제
    this.clearAllAuthData()
    
    // 네이티브 앱인 경우 secure storage와 launch URL 클리어
    try {
      const { isNative, secureRemove, clearLaunchUrl } = await import("@/lib/native")
      if (await isNative()) {
        // secure storage에서 모든 인증 관련 데이터 삭제
        await secureRemove("auth-token")
        await secureRemove("current-user")
        await secureRemove("current-user-id")
        await secureRemove("fcm-token")
        await clearLaunchUrl()
        
        // Preferences에도 저장된 데이터가 있을 수 있으므로 클리어
        try {
          const w = window as any
          const Preferences = w?.Capacitor?.Plugins?.Preferences
          if (Preferences) {
            await Preferences.remove({ key: "auth-token" })
            await Preferences.remove({ key: "current-user" })
            await Preferences.remove({ key: "current-user-id" })
            await Preferences.remove({ key: "fcm-token" })
          }
        } catch {}
      }
    } catch {}
  }
  
  clearAllAuthData() {
    // localStorage 전체 클리어
    try {
      localStorage.removeItem(this.tokenKey)
      localStorage.removeItem(this.userKey)
      localStorage.removeItem(this.userIdKey)
      localStorage.removeItem(this.fcmTokenKey)
      // 추가로 가능한 모든 auth 관련 키 제거
      const keysToRemove = []
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i)
        if (key && (key.includes('auth') || key.includes('token') || key.includes('user'))) {
          keysToRemove.push(key)
        }
      }
      keysToRemove.forEach(key => localStorage.removeItem(key))
    } catch {}
    
    // sessionStorage도 클리어
    try {
      sessionStorage.clear()
    } catch {}
    
    // 쿠키 클리어
    this.clearAuthCookie()
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
  
  isLoggingOut(): boolean {
    return this._isLoggingOut
  }

  private setAuthCookie(token: string) {
    try {
      // JWT exp 기반 만료 설정 (가능하다면)
      const parts = token.split(".")
      let attrs: string[] = ["Path=/", "SameSite=None"]
      try {
        if (typeof window !== "undefined" && window.location.protocol === "https:") {
          attrs.push("Secure")
        }
      } catch {}

      try {
        if (parts.length === 3) {
          const payloadJson = atob(parts[1].replace(/-/g, "+").replace(/_/g, "/"))
          const payload = JSON.parse(payloadJson)
          const expMs = typeof payload.exp === "number" ? payload.exp * 1000 : undefined
          if (expMs && expMs > Date.now()) {
            const maxAge = Math.max(0, Math.floor((expMs - Date.now()) / 1000))
            attrs.push(`max-age=${maxAge}`)
          }
        }
      } catch {}

      document.cookie = `auth-token=${encodeURIComponent(token)}; ${attrs.join("; ")}`
    } catch {}
  }

  private clearAuthCookie() {
    try {
      // 모든 경로와 도메인에서 쿠키 삭제 시도
      const domains = [
        window.location.hostname,
        `.${window.location.hostname}`,
        ''
      ]
      
      const paths = ['/', '/auth', '/dashboard', '']
      
      domains.forEach(domain => {
        paths.forEach(path => {
          let attrs: string[] = ["Max-Age=0", "expires=Thu, 01 Jan 1970 00:00:00 GMT"]
          
          if (path) attrs.push(`Path=${path}`)
          if (domain) attrs.push(`Domain=${domain}`)
          
          attrs.push("SameSite=None")
          
          if (typeof window !== "undefined" && window.location.protocol === "https:") {
            attrs.push("Secure")
          }
          
          document.cookie = `auth-token=; ${attrs.join("; ")}`
        })
      })
      
      // 추가로 다른 가능한 auth 관련 쿠키들도 삭제
      const cookies = document.cookie.split(';')
      cookies.forEach(cookie => {
        const eqPos = cookie.indexOf('=')
        const name = eqPos > -1 ? cookie.substr(0, eqPos).trim() : cookie.trim()
        if (name.includes('auth') || name.includes('token') || name.includes('session')) {
          document.cookie = `${name}=; Max-Age=0; expires=Thu, 01 Jan 1970 00:00:00 GMT; Path=/`
        }
      })
    } catch {}
  }
}

export const authService = new AuthService()
