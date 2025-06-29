// lib/fetch-with-auth.ts
import { authService } from "./auth-service"

export async function fetchWithAuth(input: RequestInfo, init: RequestInit = {}) {
  const headers = {
    ...init.headers,
    ...authService.getAuthHeaders(),
  }

  const res = await fetch(input, { ...init, headers })

  if (res.status === 403) {
    // 인증 만료
    authService.logout()
    // 로그인 페이지로 바로 이동
    if (typeof window !== "undefined") window.location.href = "/auth/login"
    // 이후 코드는 실행되지 않도록
    throw new Error("UNAUTHORIZED")
  }

  return res
}
