"use client"
import { useEffect } from "react"
import { useRouter, usePathname } from "next/navigation"
import { useAuth } from "@/components/auth-provider"

export function useProtectedRoute() {
  const router = useRouter()
  const pathname = usePathname()
  const { user, isLoading } = useAuth()
  
  useEffect(() => {
    // OAuth 콜백 페이지면 처리하지 않음 (콜백 컴포넌트가 자체 처리)
    if (pathname?.includes('/callback')) {
      return
    }
    
    // AuthProvider가 로딩 중이면 대기
    if (isLoading) {
      return
    }
    
    // AuthProvider 상태를 통해 인증 확인
    if (!user) {
      router.replace("/auth/login")
    }
  }, [router, pathname, user, isLoading])
}
