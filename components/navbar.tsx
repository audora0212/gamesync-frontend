"use client"

import Link from "next/link"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { authService } from "@/lib/auth-service"
import { LogOut, Bell, Users } from "lucide-react"
import Image from "next/image"
import { SettingModal } from "@/components/ChangeNicknameModal"
import { FriendDrawer } from "@/components/friend-drawer"
import { NotificationPanel } from "@/components/notification-panel"
import { serverService } from "@/lib/server-service"
import { notificationService } from "@/lib/notification-service"
import { useAuth } from "@/components/auth-provider"

export function Navbar() {
  const { logout: authLogout } = useAuth() // AuthProvider의 logout 함수 사용
  const [user, setUser] = useState<string | null>(null)
  const [isAdmin, setIsAdmin] = useState<boolean>(false)
  const [friendOpen, setFriendOpen] = useState(false)
  const [notifOpen, setNotifOpen] = useState(false)
  const [unread, setUnread] = useState(0)

  useEffect(() => {
    // 클라이언트에서만 실행
    const nickname = authService.getCurrentUser()
    setUser(nickname)
    
    // 인증된 사용자만 알림 API 호출
    if (nickname) {
      ;(async () => {
        try {
          const data = await notificationService.getNotifications()
          setUnread(data.unreadCount)
          // 관리자 여부 로드
          try {
            const meRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/users/me`, { headers: authService.getAuthHeaders() })
            if (meRes.ok) {
              const me = await meRes.json()
              setIsAdmin(!!me?.admin)
            }
          } catch {}
        } catch {}
      })()
    }
    // 쿼리 friends=1 이면 친구 패널 자동 오픈
    try {
      const usp = new URLSearchParams(window.location.search)
      if (usp.get('friends') === '1') {
        setFriendOpen(true)
        // URL 정리 (히스토리 유지)
        usp.delete('friends')
        const qs = usp.toString()
        const clean = window.location.pathname + (qs ? `?${qs}` : '')
        window.history.replaceState({}, '', clean)
      }
    } catch {}
  }, [])

  const handleLogout = async () => {
    // AuthProvider의 logout 함수를 사용하여 상태와 데이터를 함께 정리
    await authLogout()
  }

  return (
    <nav className="glass border-b border-cyan-500/20">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16 space-x-4">
          {/* 로고 및 타이틀 */}
          <Link href="/dashboard" className="flex items-center space-x-2" onClick={(e)=>{
            try {
              const w: any = typeof window !== 'undefined' ? window : null
              const Cap = w?.Capacitor || null
              const isNative = !!(Cap && typeof Cap.isNativePlatform === 'function' && Cap.isNativePlatform())
              if (isNative) {
                e.preventDefault()
                // 네이티브(WebView)에서는 강제 새로고침
                if (typeof location !== 'undefined') {
                  const target = '/dashboard'
                  if (location.pathname === target) location.reload()
                  else location.href = target
                }
                return
              }
            } catch {}
          }}>
            <Image src="/logo_round.png" alt="GameSync" width={24} height={24} className="h-6 w-6 animate-float" />
            <span className="hidden sm:inline text-xs sm:text-sm md:text-base lg:text-lg font-bold neon-text-primary whitespace-nowrap">
              GameSync
            </span>
          </Link>

          {/* 사용자 정보 및 액션 */}
          <div className="flex items-center space-x-3">
            {user && (
              <span className="max-w-[30vw] truncate text-xs sm:text-sm md:text-base neon-text-accent font-medium whitespace-nowrap">
                {user}
              </span>
            )}
            {isAdmin && (
              <Link href="/admin" className="hidden sm:inline-block">
                <Button
                  variant="ghost"
                  className="text-xs sm:text-sm md:text-base text-muted-foreground hover:neon-text-primary whitespace-nowrap transition-all"
                >
                  관리
                </Button>
              </Link>
            )}
            <Button
              variant="ghost"
              size="icon"
              className="relative text-muted-foreground hover:text-cyan-400 hover:drop-shadow-[0_0_8px_rgba(0,255,255,0.8)] transition-all"
              onClick={() => setFriendOpen(true)}
              aria-label="친구 열기"
            >
              <Users className="h-5 w-5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="relative text-muted-foreground hover:text-cyan-400 hover:drop-shadow-[0_0_8px_rgba(0,255,255,0.8)] transition-all"
              onClick={() => setNotifOpen(v => !v)}
            >
              <Bell className="h-5 w-5" />
              {unread > 0 && (
                <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-red-500 shadow-[0_0_10px_rgba(255,0,0,0.8)] animate-pulse" />
              )}
            </Button>
            <SettingModal />
            <Button
              onClick={handleLogout}
              variant="ghost"
              className="flex items-center text-xs sm:text-sm md:text-base text-muted-foreground hover:text-cyan-400 hover:drop-shadow-[0_0_8px_rgba(0,255,255,0.8)] whitespace-nowrap transition-all"
            >
              <LogOut className="mr-1 h-4 w-4" />
              로그아웃
            </Button>
          </div>
        </div>
      </div>
      {/* 친구/알림 패널이 항상 최상단에 오도록 nav 내부의 맨 마지막에 두고, 고정 z-index 사용 */}
      <FriendDrawer open={friendOpen} onClose={() => setFriendOpen(false)} />
      <NotificationPanel
        open={notifOpen}
        onClose={() => setNotifOpen(false)}
        onUnreadChange={setUnread}
        onInviteAction={async (inviteId, accept) => {
          try {
            // 초대 응답 API
            const API_BASE = process.env.NEXT_PUBLIC_API_URL || "/api"
            await fetch(`${API_BASE}/servers/invites/${inviteId}/respond`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json', ...authService.getAuthHeaders() },
              body: JSON.stringify({ accept })
            })
            // 수락이면 대시보드/서버 목록 새로고침은 사용자가 수동으로 함. 여기선 토스트만 처리
          } catch {
            console.error('초대 응답 실패')
          }
        }}
      />
    </nav>
  )
}
