"use client"

import type React from "react"

import { createContext, useContext, useEffect, useState } from "react"
import { useRouter, usePathname } from "next/navigation"
import { authService } from "@/lib/auth-service"
import { requestFcmToken, onForegroundMessage } from "@/lib/fcm"
import { isNative, registerNativePush, onAppUrlOpen, getPlatform, secureSet, getLaunchUrl, onAppStateChange, closeBrowser } from "@/lib/native"
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

  const isDebug = (() => {
    try {
      if (typeof window === 'undefined') return false
      const usp = new URLSearchParams(window.location.search)
      return usp.get('debug') === '1'
    } catch { return false }
  })()

  const closeBrowserWithRetries = async (label?: string) => {
    // Capacitor Browser 플러그인으로 브라우저 닫기 시도
    await closeBrowser();
    // 안전을 위해 재시도
    setTimeout(async () => { await closeBrowser(); }, 350)
    setTimeout(async () => { await closeBrowser(); }, 1000)
  }

  useEffect(() => {
    const token = authService.getToken()
    const currentUser = authService.getCurrentUser()

    if (token && currentUser) {
      setUser(currentUser)
      // Attempt to register FCM token (ignore failures)
      ;(async () => {
        try {
          // If inside native app, register native push (APNs/FCM) and handle deep links
          if (await isNative()) {
            const platform = await getPlatform()
            const nativeToken = await registerNativePush()
            if (nativeToken) {
              await notificationService.registerPushToken(nativeToken, platform)
              authService.setFcmToken(nativeToken)
            }
            // Listen deep links (e.g., gamesync://oauth/callback?code=...)
            onAppUrlOpen((url) => {
              try { console.log('[DL] appUrlOpen (authed)', url) } catch {}
              try {
                const u = new URL(url)
                const isAppScheme = u.protocol.startsWith('gamesync')
                const isUniversalLink = (u.protocol === 'https:' && u.host.endsWith('gamesync.cloud'))
                if (!isAppScheme && !isUniversalLink) return
                const query = u.search || ''
                // Kakao
                if (u.pathname.startsWith('/auth/kakao/callback')) {
                  try { console.log('[DL] route→ /auth/kakao/callback', query) } catch {}
                  router.replace(`/auth/kakao/callback${query}`)
                  if (isDebug) { try { toast('DL route: kakao', { description: 'closing browser (authed)' }) } catch {} }
                  closeBrowserWithRetries('authed/kakao')
                  return
                }
                // Discord
                if (u.pathname.startsWith('/auth/discord/callback') || u.pathname.startsWith('/oauth/callback')) {
                  try { console.log('[DL] route→ /auth/discord/callback', query) } catch {}
                  router.replace(`/auth/discord/callback${query}`)
                  if (isDebug) { try { toast('DL route: discord', { description: 'closing browser (authed)' }) } catch {} }
                  closeBrowserWithRetries('authed/discord')
                  return
                }
                // 일부 iOS 버전에서 커스텀 스킴이 'gamesync:///auth/..'로 넘어올 때 pathname이 빈 문자열로 파싱될 수 있어 보정
                if (isAppScheme && (!u.pathname || u.pathname === '')) {
                  const raw = url.replace('gamesync://', '')
                  const pathAndQuery = raw.startsWith('/') ? raw : `/${raw}`
                  if (pathAndQuery.startsWith('/auth/kakao/callback')) {
                    try { console.log('[DL] (fallback) route→ /auth/kakao/callback', pathAndQuery) } catch {}
                    const q = pathAndQuery.includes('?') ? pathAndQuery.substring(pathAndQuery.indexOf('?')) : ''
                    router.replace(`/auth/kakao/callback${q}`)
                    if (isDebug) { try { toast('DL route: kakao(fallback)', { description: 'closing browser (authed)' }) } catch {} }
                    closeBrowserWithRetries('authed/kakao/fallback')
                    return
                  }
                  if (pathAndQuery.startsWith('/auth/discord/callback') || pathAndQuery.startsWith('/oauth/callback')) {
                    try { console.log('[DL] (fallback) route→ /auth/discord/callback', pathAndQuery) } catch {}
                    const q = pathAndQuery.includes('?') ? pathAndQuery.substring(pathAndQuery.indexOf('?')) : ''
                    router.replace(`/auth/discord/callback${q}`)
                    if (isDebug) { try { toast('DL route: discord(fallback)', { description: 'closing browser (authed)' }) } catch {} }
                    closeBrowserWithRetries('authed/discord/fallback')
                    return
                  }
                }
              } catch {}
            })

            // Handle cold-start deep link (app launched via URL)
            try {
              const launchUrl = await getLaunchUrl()
              if (launchUrl) {
                console.log('[DL] getLaunchUrl (authed)', launchUrl)
                // 재사용: 위와 동일한 라우팅 로직을 호출
                try {
                  const u = new URL(launchUrl)
                  const isAppScheme = u.protocol.startsWith('gamesync')
                  const isUniversalLink = (u.protocol === 'https:' && u.host.endsWith('gamesync.cloud'))
                  if (isAppScheme || isUniversalLink) {
                    const query = u.search || ''
                    if (u.pathname.startsWith('/auth/kakao/callback')) {
                      router.replace(`/auth/kakao/callback${query}`)
                      if (isDebug) { try { toast('DL cold: kakao', { description: 'closing browser (authed)' }) } catch {} }
                      closeBrowserWithRetries('authed/kakao/cold')
                    } else if (u.pathname.startsWith('/auth/discord/callback') || u.pathname.startsWith('/oauth/callback')) {
                      router.replace(`/auth/discord/callback${query}`)
                      if (isDebug) { try { toast('DL cold: discord', { description: 'closing browser (authed)' }) } catch {} }
                      closeBrowserWithRetries('authed/discord/cold')
                    } else if (isAppScheme && (!u.pathname || u.pathname === '')) {
                      const raw = launchUrl.replace('gamesync://', '')
                      const pathAndQuery = raw.startsWith('/') ? raw : `/${raw}`
                      const q = pathAndQuery.includes('?') ? pathAndQuery.substring(pathAndQuery.indexOf('?')) : ''
                      if (pathAndQuery.startsWith('/auth/kakao/callback')) {
                        router.replace(`/auth/kakao/callback${q}`)
                        if (isDebug) { try { toast('DL cold: kakao(fallback)', { description: 'closing browser (authed)' }) } catch {} }
                        closeBrowserWithRetries('authed/kakao/cold/fallback')
                      } else if (pathAndQuery.startsWith('/auth/discord/callback') || pathAndQuery.startsWith('/oauth/callback')) {
                        router.replace(`/auth/discord/callback${q}`)
                        if (isDebug) { try { toast('DL cold: discord(fallback)', { description: 'closing browser (authed)' }) } catch {} }
                        closeBrowserWithRetries('authed/discord/cold/fallback')
                      }
                    }
                  }
                } catch {}
              }
            } catch {}
          }

          const vapidKey = process.env.NEXT_PUBLIC_FCM_VAPID_KEY || "BNPiSmtH-uSrFLgGI-4N75uPFIWsLVxfQgJ6kmm4ixhwc3QjdUbp_qSqHaf0xsLrG3sVNRnqbNmAoi7FAQCk6dk"
          // In native app, skip Web FCM (APNs를 사용)
          if (!(await isNative()) && typeof window !== "undefined" && 'Notification' in window) {
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
              const dataTitle = (payload?.data?.title as string) || undefined
              const notifTitle = (payload?.notification?.title as string) || undefined
              const title = dataTitle || notifTitle || '알림'
              const type = payload?.data?.type as string | undefined
              const raw = payload?.data?.payload as string | undefined
              const bodyFromData = (payload?.data?.body as string) || ''
              let description = bodyFromData
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
                    description = `알림 패널에서 수락/거절할 수 있어요`
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
      // 비로그인 상태에서는 전역적으로 로그인 페이지로 유도하되,
      // 보호 라우팅 훅과 중복 이동을 피하기 위해 여기서는 이동하지 않음
    }

    setIsLoading(false)
  }, [pathname, router])

  // 로그인 전에도 딥링크를 처리하여 콜백 페이지로 이동할 수 있도록 리스너를 등록
  useEffect(() => {
    // 이미 로그인한 경우 위의 리스너가 동작하므로 중복 등록을 피할 필요는 없지만, 안전하게 항상 동작하도록 동일 로직 등록
    (async () => {
      try {
        onAppUrlOpen((url) => {
          try {
            const u = new URL(url)
            const isAppScheme = u.protocol.startsWith('gamesync')
            const isUniversalLink = (u.protocol === 'https:' && u.host.endsWith('gamesync.cloud'))
            if (!isAppScheme && !isUniversalLink) return
            const query = u.search || ''
            if (u.pathname.startsWith('/auth/kakao/callback')) {
              router.replace(`/auth/kakao/callback${query}`)
              if (isDebug) { try { toast('DL route: kakao', { description: 'closing browser (unauth)' }) } catch {} }
              closeBrowserWithRetries('unauth/kakao')
              return
            }
            if (u.pathname.startsWith('/auth/discord/callback') || u.pathname.startsWith('/oauth/callback')) {
              router.replace(`/auth/discord/callback${query}`)
              if (isDebug) { try { toast('DL route: discord', { description: 'closing browser (unauth)' }) } catch {} }
              closeBrowserWithRetries('unauth/discord')
              return
            }
            if (isAppScheme && (!u.pathname || u.pathname === '')) {
              const raw = url.replace('gamesync://', '')
              const pathAndQuery = raw.startsWith('/') ? raw : `/${raw}`
              if (pathAndQuery.startsWith('/auth/kakao/callback')) {
                const q = pathAndQuery.includes('?') ? pathAndQuery.substring(pathAndQuery.indexOf('?')) : ''
                router.replace(`/auth/kakao/callback${q}`)
                if (isDebug) { try { toast('DL route: kakao(fallback)', { description: 'closing browser (unauth)' }) } catch {} }
                closeBrowserWithRetries('unauth/kakao/fallback')
                return
              }
              if (pathAndQuery.startsWith('/auth/discord/callback') || pathAndQuery.startsWith('/oauth/callback')) {
                const q = pathAndQuery.includes('?') ? pathAndQuery.substring(pathAndQuery.indexOf('?')) : ''
                router.replace(`/auth/discord/callback${q}`)
                if (isDebug) { try { toast('DL route: discord(fallback)', { description: 'closing browser (unauth)' }) } catch {} }
                closeBrowserWithRetries('unauth/discord/fallback')
                return
              }
            }
          } catch {}
        })
      } catch {}
    })()
  }, [router])

  // 로그인 전 콜드 스타트 딥링크 처리 (앱이 URL로 런치된 경우)
  useEffect(() => {
    (async () => {
      try {
        if (!(await isNative())) return
        const launchUrl = await getLaunchUrl()
        if (!launchUrl) return
        try { console.log('[DL] getLaunchUrl (unauth)', launchUrl) } catch {}
        try {
          const u = new URL(launchUrl)
          const isAppScheme = u.protocol.startsWith('gamesync')
          const isUniversalLink = (u.protocol === 'https:' && u.host.endsWith('gamesync.cloud'))
          if (!isAppScheme && !isUniversalLink) return
          const query = u.search || ''
          if (u.pathname.startsWith('/auth/kakao/callback')) {
            router.replace(`/auth/kakao/callback${query}`)
            if (isDebug) { try { toast('DL cold: kakao', { description: 'closing browser (unauth)' }) } catch {} }
            closeBrowserWithRetries('unauth/kakao/cold')
            return
          }
          if (u.pathname.startsWith('/auth/discord/callback') || u.pathname.startsWith('/oauth/callback')) {
            router.replace(`/auth/discord/callback${query}`)
            if (isDebug) { try { toast('DL cold: discord', { description: 'closing browser (unauth)' }) } catch {} }
            closeBrowserWithRetries('unauth/discord/cold')
            return
          }
          if (isAppScheme && (!u.pathname || u.pathname === '')) {
            const raw = launchUrl.replace('gamesync://', '')
            const pathAndQuery = raw.startsWith('/') ? raw : `/${raw}`
            const q = pathAndQuery.includes('?') ? pathAndQuery.substring(pathAndQuery.indexOf('?')) : ''
            if (pathAndQuery.startsWith('/auth/kakao/callback')) {
              router.replace(`/auth/kakao/callback${q}`)
              if (isDebug) { try { toast('DL cold: kakao(fallback)', { description: 'closing browser (unauth)' }) } catch {} }
              closeBrowserWithRetries('unauth/kakao/cold/fallback')
              return
            }
            if (pathAndQuery.startsWith('/auth/discord/callback') || pathAndQuery.startsWith('/oauth/callback')) {
              router.replace(`/auth/discord/callback${q}`)
              if (isDebug) { try { toast('DL cold: discord(fallback)', { description: 'closing browser (unauth)' }) } catch {} }
              closeBrowserWithRetries('unauth/discord/cold/fallback')
              return
            }
          }
        } catch {}
      } catch {}
    })()
  }, [router])

  // 앱이 백그라운드→포그라운드로 전환될 때, 콜드스타트 딥링크를 한 번 더 체크 (일부 iOS 버전 대응)
  useEffect(() => {
    let unsub: (() => void) | undefined
    ;(async () => {
      try {
        if (!(await isNative())) return
        unsub = await onAppStateChange(async (isActive) => {
          if (!isActive) return
          try {
            const launchUrl = await getLaunchUrl()
            if (!launchUrl) return
            try { console.log('[DL] appStateChange (unauth)', launchUrl) } catch {}
            try {
              const u = new URL(launchUrl)
              const isAppScheme = u.protocol.startsWith('gamesync')
              const isUniversalLink = (u.protocol === 'https:' && u.host.endsWith('gamesync.cloud'))
              if (!isAppScheme && !isUniversalLink) return
              const query = u.search || ''
              if (u.pathname.startsWith('/auth/kakao/callback')) {
                router.replace(`/auth/kakao/callback${query}`)
                if (isDebug) { try { toast('DL foreground: kakao', { description: 'closing browser' }) } catch {} }
                closeBrowserWithRetries('unauth/kakao/fg')
                return
              }
              if (u.pathname.startsWith('/auth/discord/callback') || u.pathname.startsWith('/oauth/callback')) {
                router.replace(`/auth/discord/callback${query}`)
                if (isDebug) { try { toast('DL foreground: discord', { description: 'closing browser' }) } catch {} }
                closeBrowserWithRetries('unauth/discord/fg')
                return
              }
            } catch {}
          } catch {}
        })
      } catch {}
    })()
    return () => { try { unsub?.() } catch {} }
  }, [router])

  return <AuthContext.Provider value={{ user, isLoading }}>{children}</AuthContext.Provider>
}
