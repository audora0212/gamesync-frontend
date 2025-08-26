// lib/fetch-with-auth.ts
import { authService } from "./auth-service"

export async function fetchWithAuth(input: RequestInfo, init: RequestInit = {}) {
  const headers = {
    ...init.headers,
    ...authService.getAuthHeaders(),
  }

  const res = await fetch(input, { ...init, headers })

  if (res.status === 401 || res.status === 403) {
    // 인증 만료 - 모든 인증 데이터 클리어
    authService.clearAllAuthData()
    
    // 로그인 페이지로 리다이렉트 (현재 위치를 return으로 전달)
    if (typeof window !== "undefined") {
      const path = window.location.pathname || ""
      // 콜백/인증 경로에서는 자동 리다이렉트하지 않음 (콜백 처리 방해 방지)
      if (!path.startsWith("/auth/")) {
        const current = path + window.location.search
        const next = `/auth/login?return=${encodeURIComponent(current)}`
        window.location.replace(next) // href 대신 replace 사용
      }
    }
    // 이후 코드는 실행되지 않도록
    throw new Error("UNAUTHORIZED")
  }

  return res
}
