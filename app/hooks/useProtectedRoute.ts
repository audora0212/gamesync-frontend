"use client"
import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { authService } from "@/lib/auth-service"

export function useProtectedRoute() {
  const router = useRouter()
  useEffect(() => {
    if (!authService.isAuthenticated()) {
      router.replace("/auth/login")
    }
  }, [router])
}
