const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080/api"

interface LoginRequest {
  username: string
  password: string
}

interface SignupRequest {
  username: string
  password: string
}

interface LoginResponse {
  token: string
  message: string
}

interface SignupResponse {
  message: string
}

class AuthService {
  private tokenKey = "auth-token"
  private userKey = "current-user"

  async login(credentials: LoginRequest): Promise<LoginResponse> {
    const response = await fetch(`${API_BASE}/auth/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(credentials),
    })

    if (!response.ok) {
      throw new Error("Login failed")
    }

    const data: LoginResponse = await response.json()

    // Store token and user info
    localStorage.setItem(this.tokenKey, data.token)
    localStorage.setItem(this.userKey, credentials.username)

    return data
  }

  async signup(credentials: SignupRequest): Promise<SignupResponse> {
    const response = await fetch(`${API_BASE}/auth/signup`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(credentials),
    })

    if (!response.ok) {
      throw new Error("Signup failed")
    }

    return response.json()
  }

  async logout(): Promise<void> {
    const token = this.getToken()
    if (token) {
      try {
        await fetch(`${API_BASE}/auth/logout`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })
      } catch (error) {
        console.error("Logout request failed:", error)
      }
    }

    localStorage.removeItem(this.tokenKey)
    localStorage.removeItem(this.userKey)
  }

  getToken(): string | null {
    if (typeof window === "undefined") return null
    return localStorage.getItem(this.tokenKey)
  }

  getCurrentUser(): string | null {
    if (typeof window === "undefined") return null
    return localStorage.getItem(this.userKey)
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
