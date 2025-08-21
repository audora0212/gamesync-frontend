// lib/fetch-with-auth.ts
import { authService } from "./auth-service"

export async function fetchWithAuth(input: RequestInfo, init: RequestInit = {}) {
  const headers = {
    ...init.headers,
    ...authService.getAuthHeaders(),
  }

  const res = await fetch(input, { ...init, headers })

  if (res.status === 401 || res.status === 403) {
    // 인증 만료
    // 토큰만 제거(푸시 토큰 등은 유지). 강제 로그아웃 호출은 생략해 루프 방지
    try { localStorage.removeItem("auth-token") } catch {}
    // 로그인 페이지로 리다이렉트 (현재 위치를 return으로 전달)
    if (typeof window !== "undefined") {
      const current = window.location.pathname + window.location.search
      const next = `/auth/login?return=${encodeURIComponent(current)}`
      window.location.href = next
    }
    // 이후 코드는 실행되지 않도록
    throw new Error("UNAUTHORIZED")
  }

  return res
}
