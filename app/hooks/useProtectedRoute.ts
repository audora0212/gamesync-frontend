"use client"
import { useEffect } from "react"
import { useRouter, usePathname } from "next/navigation"
import { authService } from "@/lib/auth-service"

export function useProtectedRoute() {
  const router = useRouter()
  const pathname = usePathname()
  
  useEffect(() => {
    // OAuth 콜백 페이지면 처리하지 않음 (콜백 컴포넌트가 자체 처리)
    if (pathname?.includes('/callback')) {
      return
    }
    
    // 토큰만 있으면 무한 리다이렉트가 발생할 수 있어 사용자 정보까지 확인
    const hasToken = authService.isAuthenticated()
    const hasUser = !!authService.getCurrentUser()
    if (!(hasToken && hasUser)) {
      router.replace("/auth/login")
    }
  }, [router, pathname])
}
