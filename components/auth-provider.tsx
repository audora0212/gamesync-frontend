"use client"

import type React from "react"

import { createContext, useContext, useEffect, useState } from "react"
import { useRouter, usePathname } from "next/navigation"
import { authService } from "@/lib/auth-service"
import { requestFcmToken, onForegroundMessage } from "@/lib/fcm"
import { notificationService } from "@/lib/notification-service"
import { toast } from "sonner"

interface AuthContextType {
  user: string | null
  isLoading: boolean
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  isLoading: true,
})

export const useAuth = () => useContext(AuthContext)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    const token = authService.getToken()
    const currentUser = authService.getCurrentUser()

    if (token && currentUser) {
      setUser(currentUser)
      // Attempt to register FCM token (ignore failures)
      ;(async () => {
        try {
          const vapidKey = process.env.NEXT_PUBLIC_FCM_VAPID_KEY || "BNPiSmtH-uSrFLgGI-4N75uPFIWsLVxfQgJ6kmm4ixhwc3QjdUbp_qSqHaf0xsLrG3sVNRnqbNmAoi7FAQCk6dk"
          if (typeof window !== "undefined" && 'Notification' in window) {
            const permission = await Notification.requestPermission()
            if (permission === 'granted') {
              const fcmToken = await requestFcmToken(vapidKey)
              if (fcmToken) {
                await notificationService.registerPushToken(fcmToken, 'web')
                authService.setFcmToken(fcmToken)
              }
            }
            // Foreground push handling: show toast (page가 포커스일 때 OS 알림은 표시되지 않을 수 있음)
            onForegroundMessage((payload) => {
              const title = (payload?.notification?.title as string) || '알림'
              const type = payload?.data?.type as string | undefined
              const raw = payload?.data?.payload as string | undefined
              let description = ''
              if (type === 'INVITE') {
                try {
                  const p = raw ? JSON.parse(raw) : undefined
                  if (p && p.serverName && p.fromNickname) {
                    description = `${p.fromNickname} → ${p.serverName}`
                  }
                } catch {}
              } else if (type === 'GENERIC') {
                try {
                  const p = raw ? JSON.parse(raw) : undefined
                  if (p && p.kind === 'friend_request' && p.fromNickname) {
                    description = `${p.fromNickname}님이 보냈습니다`
                  }
                } catch {}
              }
              toast(title, { description })
              // 포그라운드에서도 OS 알림 배너 표시
              try {
                if (Notification.permission === 'granted') {
                  new Notification(title, { body: description })
                }
              } catch {}
            })
          }
        } catch {}
      })()
    } else if (!pathname.startsWith("/auth")) {
      // router.push("/auth/login")
    }

    setIsLoading(false)
  }, [pathname, router])

  return <AuthContext.Provider value={{ user, isLoading }}>{children}</AuthContext.Provider>
}
