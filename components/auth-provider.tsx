"use client"

import type React from "react"

import { createContext, useContext, useEffect, useState } from "react"
import { useRouter, usePathname } from "next/navigation"
import { authService } from "@/lib/auth-service"
import { requestFcmToken, onForegroundMessage } from "@/lib/fcm"
import { isNative, registerNativePush, onAppUrlOpen, getPlatform, secureSet, getLaunchUrl, onAppStateChange, closeBrowser, markLaunchUrlProcessed, onNativeNotificationOpen } from "@/lib/native"
import { notificationService } from "@/lib/notification-service"
import { toast } from "sonner"

interface AuthContextType {
  user: string | null
  isLoading: boolean
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  isLoading: true,
  logout: async () => {},
})

export const useAuth = () => useContext(AuthContext)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isLoggingOut, setIsLoggingOut] = useState(false) // 로그아웃 중 상태 추가
  const router = useRouter()
  const pathname = usePathname()
  const [deepLinkListeners, setDeepLinkListeners] = useState<(() => void)[]>([]) // 리스너 관리

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
  
  // 모든 딥링크 리스너 해제 함수
  const cleanupDeepLinkListeners = () => {
    deepLinkListeners.forEach(unsub => {
      try { unsub() } catch {}
    })
    setDeepLinkListeners([])
  }

  // 로그아웃 함수
  const logout = async () => {
    if (isLoggingOut) return // 중복 실행 방지
    
    try {
      setIsLoggingOut(true)
      
      // 1. 모든 딥링크 리스너 즉시 해제
      cleanupDeepLinkListeners()
      
      // 2. 상태를 즉시 초기화
      setUser(null)
      
      // 3. 모든 진행 중인 네트워크 요청 취소 시도
      try {
        // 모든 fetch 요청에 AbortController 신호 전달하여 취소
        const abortController = new AbortController()
        abortController.abort()
      } catch {}
      
      // 4. authService로 백엔드 로그아웃 및 로컬 데이터 정리
      await authService.logout()
      
      // 5. replace를 사용하여 히스토리 스택에서 현재 페이지 제거
      // 이렇게 하면 뒤로가기로 대시보드로 돌아갈 수 없음
      window.location.replace("/auth/login")
    } catch (error) {
      console.error("Logout error:", error)
      // 실패해도 강제로 로그인 페이지로 이동 (히스토리 제거)
      authService.clearAllAuthData()
      window.location.replace("/auth/login")
    }
    // finally 블록 제거 - 페이지가 이동되므로 상태 업데이트 불필요
  }

  useEffect(() => {
    // 로그아웃 중이면 처리 스킵
    if (isLoggingOut) return
    
    const token = authService.getToken()
    const currentUser = authService.getCurrentUser()

    // 토큰이 없으면 모든 딥링크 리스너 해제
    if (!token || !currentUser) {
      cleanupDeepLinkListeners()
      setUser(null)
      setIsLoading(false)
      return
    }

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
            // Listen notification open to route using embedded url
            try {
              const unsubNotif = await onNativeNotificationOpen((data: any) => {
                try {
                  const url = (data && typeof data.url === 'string') ? data.url : null
                  if (!url) return
                  // 친구 패널 오픈 플래그 지원
                  if (url === '/dashboard?friends=1') {
                    router.replace('/dashboard?friends=1')
                    return
                  }
                  router.replace(url)
                } catch {}
              })
              if (unsubNotif) setDeepLinkListeners(prev => [...prev, unsubNotif])
            } catch {}
            // Listen deep links (e.g., gamesync://oauth/callback?code=...)
            const unsub = await onAppUrlOpen((url) => {
              // 로그아웃 중이거나 토큰이 없으면 리스너가 동작하지 않도록  
              if (isLoggingOut || !authService.getToken()) return;
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
                  try { markLaunchUrlProcessed(url) } catch {}
                  return
                }
                // Discord
                if (u.pathname.startsWith('/auth/discord/callback') || u.pathname.startsWith('/oauth/callback')) {
                  try { console.log('[DL] route→ /auth/discord/callback', query) } catch {}
                  router.replace(`/auth/discord/callback${query}`)
                  if (isDebug) { try { toast('DL route: discord', { description: 'closing browser (authed)' }) } catch {} }
                  closeBrowserWithRetries('authed/discord')
                  try { markLaunchUrlProcessed(url) } catch {}
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
                    try { markLaunchUrlProcessed(url) } catch {}
                    return
                  }
                  if (pathAndQuery.startsWith('/auth/discord/callback') || pathAndQuery.startsWith('/oauth/callback')) {
                    try { console.log('[DL] (fallback) route→ /auth/discord/callback', pathAndQuery) } catch {}
                    const q = pathAndQuery.includes('?') ? pathAndQuery.substring(pathAndQuery.indexOf('?')) : ''
                    router.replace(`/auth/discord/callback${q}`)
                    if (isDebug) { try { toast('DL route: discord(fallback)', { description: 'closing browser (authed)' }) } catch {} }
                    closeBrowserWithRetries('authed/discord/fallback')
                    try { markLaunchUrlProcessed(url) } catch {}
                    return
                  }
                }
              } catch {}
            })
            // 리스너를 배열에 추가하여 나중에 해제할 수 있도록
            if (unsub) {
              setDeepLinkListeners(prev => [...prev, unsub])
            }

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
                      try { await markLaunchUrlProcessed(launchUrl) } catch {}
                    } else if (u.pathname.startsWith('/auth/discord/callback') || u.pathname.startsWith('/oauth/callback')) {
                      router.replace(`/auth/discord/callback${query}`)
                      if (isDebug) { try { toast('DL cold: discord', { description: 'closing browser (authed)' }) } catch {} }
                      closeBrowserWithRetries('authed/discord/cold')
                      try { await markLaunchUrlProcessed(launchUrl) } catch {}
                    } else if (isAppScheme && (!u.pathname || u.pathname === '')) {
                      const raw = launchUrl.replace('gamesync://', '')
                      const pathAndQuery = raw.startsWith('/') ? raw : `/${raw}`
                      const q = pathAndQuery.includes('?') ? pathAndQuery.substring(pathAndQuery.indexOf('?')) : ''
                      if (pathAndQuery.startsWith('/auth/kakao/callback')) {
                        router.replace(`/auth/kakao/callback${q}`)
                        if (isDebug) { try { toast('DL cold: kakao(fallback)', { description: 'closing browser (authed)' }) } catch {} }
                        closeBrowserWithRetries('authed/kakao/cold/fallback')
                        try { await markLaunchUrlProcessed(launchUrl) } catch {}
                      } else if (pathAndQuery.startsWith('/auth/discord/callback') || pathAndQuery.startsWith('/oauth/callback')) {
                        router.replace(`/auth/discord/callback${q}`)
                        if (isDebug) { try { toast('DL cold: discord(fallback)', { description: 'closing browser (authed)' }) } catch {} }
                        closeBrowserWithRetries('authed/discord/cold/fallback')
                        try { await markLaunchUrlProcessed(launchUrl) } catch {}
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
            onForegroundMessage(async (payload) => {
              const dataTitle = (payload?.data?.title as string) || undefined
              const notifTitle = (payload?.notification?.title as string) || undefined
              const title = dataTitle || notifTitle || '알림'
              const type = payload?.data?.type as string | undefined
              const raw = payload?.data?.payload as string | undefined
              const bodyFromData = (payload?.data?.body as string) || ''
              let description = bodyFromData
              let shouldRefreshOnMobile = false
              if (type === 'INVITE') {
                try {
                  const p = raw ? JSON.parse(raw) : undefined
                  if (p && p.serverName && p.fromNickname) {
                    description = `${p.fromNickname} → ${p.serverName}`
                  }
                  // 서버 초대 수신 시 모바일 앱에서는 자동 새로고침
                  if (p && p.kind === 'server_invite') {
                    shouldRefreshOnMobile = true
                  }
                } catch {}
              } else if (type === 'GENERIC') {
                try {
                  const p = raw ? JSON.parse(raw) : undefined
                  if (p && p.kind === 'friend_request' && p.fromNickname) {
                    description = `알림 패널에서 수락/거절할 수 있어요`
                  }
                  // 친구 초대(요청) 수신 시 모바일 앱에서는 자동 새로고침
                  if (p && p.kind === 'friend_request') {
                    shouldRefreshOnMobile = true
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

              // 모바일 네이티브 앱에서 초대/친구요청 수신 시 자동 새로고침
              try {
                if (shouldRefreshOnMobile && (await isNative())) {
                  router.refresh()
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
    
    // cleanup: 컴포넌트 unmount 시 또는 인증 상태 변경 시 모든 리스너 해제
    return () => {
      cleanupDeepLinkListeners()
    }
  }, [pathname, router, isLoggingOut])

  // 서비스워커로부터 초대 관련 메시지 수신 시 모바일 앱에서 새로고침
  useEffect(() => {
    function handleSwMessage(e: MessageEvent) {
      try {
        const data: any = e?.data
        if (data && data.type === 'REFRESH_ON_INVITE') {
          ;(async () => {
            try {
              if (await isNative()) {
                router.refresh()
              }
            } catch {}
          })()
        }
      } catch {}
    }
    if (typeof window !== 'undefined' && navigator?.serviceWorker) {
      try { navigator.serviceWorker.addEventListener('message', handleSwMessage) } catch {}
      return () => { try { navigator.serviceWorker.removeEventListener('message', handleSwMessage) } catch {} }
    }
  }, [router])

  // 로그인 전에도 딥링크를 처리하여 콜백 페이지로 이동할 수 있도록 리스너를 등록
  useEffect(() => {
    let unsub: (() => void) | undefined
    // 이미 로그인한 경우 위의 리스너가 동작하므로 중복 등록을 피할 필요는 없지만, 안전하게 항상 동작하도록 동일 로직 등록
    ;(async () => {
      try {
        unsub = await onAppUrlOpen((url) => {
          // 로그아웃 중이면 동작하지 않음
          if (isLoggingOut) return;
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
              try { markLaunchUrlProcessed(url) } catch {}
              return
            }
            if (u.pathname.startsWith('/auth/discord/callback') || u.pathname.startsWith('/oauth/callback')) {
              router.replace(`/auth/discord/callback${query}`)
              if (isDebug) { try { toast('DL route: discord', { description: 'closing browser (unauth)' }) } catch {} }
              closeBrowserWithRetries('unauth/discord')
              try { markLaunchUrlProcessed(url) } catch {}
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
                try { markLaunchUrlProcessed(url) } catch {}
                return
              }
              if (pathAndQuery.startsWith('/auth/discord/callback') || pathAndQuery.startsWith('/oauth/callback')) {
                const q = pathAndQuery.includes('?') ? pathAndQuery.substring(pathAndQuery.indexOf('?')) : ''
                router.replace(`/auth/discord/callback${q}`)
                if (isDebug) { try { toast('DL route: discord(fallback)', { description: 'closing browser (unauth)' }) } catch {} }
                closeBrowserWithRetries('unauth/discord/fallback')
                try { markLaunchUrlProcessed(url) } catch {}
                return
              }
            }
          } catch {}
        })
      } catch {}
    })()
    return () => { try { unsub?.() } catch {} }
  }, [router, isLoggingOut])

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
            try { await markLaunchUrlProcessed(launchUrl) } catch {}
            return
          }
          if (u.pathname.startsWith('/auth/discord/callback') || u.pathname.startsWith('/oauth/callback')) {
            router.replace(`/auth/discord/callback${query}`)
            if (isDebug) { try { toast('DL cold: discord', { description: 'closing browser (unauth)' }) } catch {} }
            closeBrowserWithRetries('unauth/discord/cold')
            try { await markLaunchUrlProcessed(launchUrl) } catch {}
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
              try { await markLaunchUrlProcessed(launchUrl) } catch {}
              return
            }
            if (pathAndQuery.startsWith('/auth/discord/callback') || pathAndQuery.startsWith('/oauth/callback')) {
              router.replace(`/auth/discord/callback${q}`)
              if (isDebug) { try { toast('DL cold: discord(fallback)', { description: 'closing browser (unauth)' }) } catch {} }
              closeBrowserWithRetries('unauth/discord/cold/fallback')
              try { await markLaunchUrlProcessed(launchUrl) } catch {}
              return
            }
          }
        } catch {}
      } catch {}
    })()
  }, [router, isLoggingOut])

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
                try { await markLaunchUrlProcessed(launchUrl) } catch {}
                return
              }
              if (u.pathname.startsWith('/auth/discord/callback') || u.pathname.startsWith('/oauth/callback')) {
                router.replace(`/auth/discord/callback${query}`)
                if (isDebug) { try { toast('DL foreground: discord', { description: 'closing browser' }) } catch {} }
                closeBrowserWithRetries('unauth/discord/fg')
                try { await markLaunchUrlProcessed(launchUrl) } catch {}
                return
              }
            } catch {}
          } catch {}
        })
      } catch {}
    })()
    return () => { try { unsub?.() } catch {} }
  }, [router, isLoggingOut])

  return <AuthContext.Provider value={{ user, isLoading, logout }}>{children}</AuthContext.Provider>
}
