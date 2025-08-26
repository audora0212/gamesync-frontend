"use client"
import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { authService } from "@/lib/auth-service"

export function useProtectedRoute() {
  const router = useRouter()
  useEffect(() => {
    // 토큰만 있으면 무한 리다이렉트가 발생할 수 있어 사용자 정보까지 확인
    const hasToken = authService.isAuthenticated()
    const hasUser = !!authService.getCurrentUser()
    if (!(hasToken && hasUser)) {
      router.replace("/auth/login")
    }
  }, [router])
}
