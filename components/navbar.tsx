"use client"

import Link from "next/link"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { authService } from "@/lib/auth-service"
import { GamepadIcon, LogOut, Bell, Users } from "lucide-react"
import { SettingModal } from "@/components/ChangeNicknameModal"
import { FriendDrawer } from "@/components/friend-drawer"
import { NotificationPanel } from "@/components/notification-panel"
import { serverService } from "@/lib/server-service"
import { notificationService } from "@/lib/notification-service"

export function Navbar() {
  const [user, setUser] = useState<string | null>(null)
  const [friendOpen, setFriendOpen] = useState(false)
  const [notifOpen, setNotifOpen] = useState(false)
  const [unread, setUnread] = useState(0)

  useEffect(() => {
    // 클라이언트에서만 실행
    const nickname = authService.getCurrentUser()
    setUser(nickname)
    ;(async () => {
      try {
        const data = await notificationService.getNotifications()
        setUnread(data.unreadCount)
      } catch {}
    })()
  }, [])

  const handleLogout = async () => {
    try {
      await authService.logout()
      window.location.href = "/auth/login"
    } catch {
      console.error("Logout failed")
    }
  }

  return (
    <nav className="glass border-b border-white/10/60">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16 space-x-4">
          {/* 로고 및 타이틀 */}
          <Link href="/dashboard" className="flex items-center space-x-2">
            <GamepadIcon className="h-6 w-6 text-muted-foreground" />
            <span className="text-xs sm:text-sm md:text-base lg:text-lg font-bold text-foreground whitespace-nowrap">
              GameSync
            </span>
          </Link>

          {/* 사용자 정보 및 액션 */}
          <div className="flex items-center space-x-3">
            {user && (
              <span className="text-xs sm:text-sm md:text-base text-foreground font-medium whitespace-nowrap">
                {user}
              </span>
            )}
            <Button
              variant="ghost"
              size="icon"
              className="relative text-muted-foreground hover:bg-white/10 hover:text-foreground"
              onClick={() => setFriendOpen(true)}
              aria-label="친구 열기"
            >
              <Users className="h-5 w-5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="relative text-muted-foreground hover:bg-white/10 hover:text-foreground"
              onClick={() => setNotifOpen(v => !v)}
            >
              <Bell className="h-5 w-5" />
              {unread > 0 && (
                <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-destructive" />
              )}
            </Button>
            <SettingModal />
            <Button
              onClick={handleLogout}
              variant="ghost"
              className="flex items-center text-xs sm:text-sm md:text-base text-muted-foreground hover:bg-white/10 hover:text-foreground whitespace-nowrap"
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
