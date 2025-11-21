// lib/fetch-with-auth.ts
import { authService } from "./auth-service"

let refreshing: Promise<string | null> | null = null

async function refreshAccessToken(): Promise<string | null> {
  if (!refreshing) {
    refreshing = (async () => {
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "/api"}/auth/refresh`, {
          method: "POST",
          credentials: "include", // refresh-token 쿠키 포함
        })
        if (!res.ok) return null
        const data = await res.json()
        const token: string | undefined = data?.token
        if (token) {
          authService.setToken(token)
          return token
        }
        return null
      } catch {
        return null
      } finally {
        refreshing = null
      }
    })()
  }
  return refreshing
}

export async function fetchWithAuth(input: RequestInfo, init: RequestInit = {}) {
  // 로그아웃 중이면 모든 API 호출 차단
  if (authService.isLoggingOut()) {
    throw new Error("LOGOUT_IN_PROGRESS")
  }
  
  const headers = {
    ...init.headers,
    ...authService.getAuthHeaders(),
  }

  let res = await fetch(input, { ...init, headers, credentials: (init as any).credentials ?? "include" })

  if (res.status === 401) {
    // 액세스 만료 → 리프레시 시도
    const newToken = await refreshAccessToken()
    if (newToken) {
      const retryHeaders = {
        ...init.headers,
        Authorization: `Bearer ${newToken}`,
      }
      res = await fetch(input, { ...init, headers: retryHeaders, credentials: (init as any).credentials ?? "include" })
      if (res.ok) return res
    }

    // 실패 시 인증 데이터 클리어 및 로그인 이동
    authService.clearAllAuthData()
    if (typeof window !== "undefined") {
      const path = window.location.pathname || ""
      if (!path.startsWith("/auth/")) {
        const current = path + window.location.search
        const next = `/auth/login?return=${encodeURIComponent(current)}`
        window.location.replace(next)
      }
    }
    throw new Error("UNAUTHORIZED")
  }

  if (res.status === 403) {
    // 권한 부족은 그대로 전파
    return res
  }

  return res
}
