"use client"

import Link from "next/link"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { authService } from "@/lib/auth-service"
import { LogOut, Bell, Users, Shield, Menu, X } from "lucide-react"
import Image from "next/image"
import { SettingModal } from "@/components/ChangeNicknameModal"
import { FriendDrawer } from "@/components/friend-drawer"
import { NotificationPanel } from "@/components/notification-panel"
import { notificationService } from "@/lib/notification-service"
import { useAuth } from "@/components/auth-provider"

export function Navbar() {
  const { logout: authLogout } = useAuth()
  const [user, setUser] = useState<string | null>(null)
  const [isAdmin, setIsAdmin] = useState<boolean>(false)
  const [friendOpen, setFriendOpen] = useState(false)
  const [notifOpen, setNotifOpen] = useState(false)
  const [unread, setUnread] = useState(0)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  useEffect(() => {
    const nickname = authService.getCurrentUser()
    setUser(nickname)

    if (nickname) {
      ;(async () => {
        try {
          const data = await notificationService.getNotifications()
          setUnread(data.unreadCount)
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
    try {
      const usp = new URLSearchParams(window.location.search)
      if (usp.get('friends') === '1') {
        setFriendOpen(true)
        usp.delete('friends')
        const qs = usp.toString()
        const clean = window.location.pathname + (qs ? `?${qs}` : '')
        window.history.replaceState({}, '', clean)
      }
    } catch {}
  }, [])

  const handleLogout = async () => {
    await authLogout()
  }

  const handleLogoClick = (e: React.MouseEvent) => {
    try {
      const w: any = typeof window !== 'undefined' ? window : null
      const Cap = w?.Capacitor || null
      const isNative = !!(Cap && typeof Cap.isNativePlatform === 'function' && Cap.isNativePlatform())
      if (isNative) {
        e.preventDefault()
        if (typeof location !== 'undefined') {
          const target = '/dashboard'
          if (location.pathname === target) location.reload()
          else location.href = target
        }
        return
      }
    } catch {}
  }

  return (
    <nav className="relative z-40 bg-white/[0.02] backdrop-blur-2xl border-b border-white/[0.08] shadow-[inset_0_-1px_1px_rgba(255,255,255,0.03),0_4px_30px_rgba(5,242,219,0.08)]">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* 로고 및 타이틀 */}
          <Link
            href="/dashboard"
            className="flex items-center space-x-3 group"
            onClick={handleLogoClick}
          >
            <div className="relative">
              <div className="absolute inset-0 bg-neon-cyan/30 rounded-xl blur-md opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              <div className="relative w-10 h-10 rounded-xl bg-cyber-dark/60 border border-neon-cyan/30 overflow-hidden backdrop-blur-sm">
                <Image src="/logo_round.png" alt="GameSync" width={40} height={40} className="w-full h-full" />
              </div>
            </div>
            <span className="hidden sm:inline font-display font-bold text-lg text-neon-cyan drop-shadow-[0_0_10px_rgba(5,242,219,0.5)] group-hover:drop-shadow-[0_0_15px_rgba(5,242,219,0.8)] transition-all">
              GameSync
            </span>
          </Link>

          {/* 데스크탑 메뉴 */}
          <div className="hidden md:flex items-center space-x-2">
            {user && (
              <div className="flex items-center px-4 py-2 rounded-xl bg-white/[0.03] backdrop-blur-xl border border-white/[0.08] shadow-[inset_0_1px_1px_rgba(255,255,255,0.03)] mr-2">
                <span className="text-sm font-medium text-neon-magenta drop-shadow-[0_0_5px_rgba(217,4,142,0.5)]">
                  {user}
                </span>
              </div>
            )}

            {isAdmin && (
              <Link href="/admin">
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-muted-foreground hover:text-neon-cyan hover:bg-neon-cyan/10"
                >
                  <Shield className="h-4 w-4 mr-1" />
                  관리
                </Button>
              </Link>
            )}

            <Button
              variant="ghost"
              size="icon"
              className="relative text-muted-foreground hover:text-neon-cyan hover:bg-neon-cyan/10 hover:shadow-[0_0_15px_rgba(5,242,219,0.3)] transition-all"
              onClick={() => setFriendOpen(true)}
              aria-label="친구 열기"
            >
              <Users className="h-5 w-5" />
            </Button>

            <Button
              variant="ghost"
              size="icon"
              className="relative text-muted-foreground hover:text-neon-cyan hover:bg-neon-cyan/10 hover:shadow-[0_0_15px_rgba(5,242,219,0.3)] transition-all"
              onClick={() => setNotifOpen(v => !v)}
            >
              <Bell className="h-5 w-5" />
              {unread > 0 && (
                <span className="absolute top-1 right-1 h-2.5 w-2.5 rounded-full bg-neon-red shadow-[0_0_10px_rgba(255,51,102,0.8)] animate-pulse" />
              )}
            </Button>

            <SettingModal />

            <Button
              onClick={handleLogout}
              variant="ghost"
              size="sm"
              className="text-muted-foreground hover:text-neon-red hover:bg-neon-red/10 hover:shadow-[0_0_15px_rgba(255,51,102,0.3)] transition-all"
            >
              <LogOut className="mr-1 h-4 w-4" />
              로그아웃
            </Button>
          </div>

          {/* 모바일 메뉴 버튼 */}
          <div className="flex md:hidden items-center space-x-2">
            <Button
              variant="ghost"
              size="icon"
              className="relative text-muted-foreground hover:text-neon-cyan"
              onClick={() => setNotifOpen(v => !v)}
            >
              <Bell className="h-5 w-5" />
              {unread > 0 && (
                <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-neon-red shadow-[0_0_10px_rgba(255,51,102,0.8)] animate-pulse" />
              )}
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="text-muted-foreground hover:text-neon-cyan"
            >
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
          </div>
        </div>

        {/* 모바일 드롭다운 메뉴 */}
        {mobileMenuOpen && (
          <div className="md:hidden absolute left-0 right-0 top-16 bg-white/[0.02] backdrop-blur-2xl border-b border-white/[0.08] shadow-[inset_0_1px_1px_rgba(255,255,255,0.03),0_10px_40px_rgba(0,0,0,0.5)] animate-slide-down">
            <div className="px-4 py-4 space-y-2">
              {user && (
                <div className="px-4 py-3 rounded-xl bg-white/[0.03] backdrop-blur-xl border border-white/[0.08] shadow-[inset_0_1px_1px_rgba(255,255,255,0.03)] mb-4">
                  <span className="text-sm font-medium text-neon-magenta">
                    {user}
                  </span>
                </div>
              )}

              {isAdmin && (
                <Link href="/admin" onClick={() => setMobileMenuOpen(false)}>
                  <Button variant="ghost" className="w-full justify-start text-muted-foreground hover:text-neon-cyan">
                    <Shield className="h-4 w-4 mr-2" />
                    관리자
                  </Button>
                </Link>
              )}

              <Button
                variant="ghost"
                className="w-full justify-start text-muted-foreground hover:text-neon-cyan"
                onClick={() => { setFriendOpen(true); setMobileMenuOpen(false); }}
              >
                <Users className="h-4 w-4 mr-2" />
                친구
              </Button>

              <div className="py-2">
                <SettingModal />
              </div>

              <div className="pt-2 border-t border-white/10">
                <Button
                  onClick={handleLogout}
                  variant="ghost"
                  className="w-full justify-start text-neon-red hover:bg-neon-red/10"
                >
                  <LogOut className="h-4 w-4 mr-2" />
                  로그아웃
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 패널들 */}
      <FriendDrawer open={friendOpen} onClose={() => setFriendOpen(false)} />
      <NotificationPanel
        open={notifOpen}
        onClose={() => setNotifOpen(false)}
        onUnreadChange={setUnread}
        onInviteAction={async (inviteId, accept) => {
          try {
            const API_BASE = process.env.NEXT_PUBLIC_API_URL || "/api"
            await fetch(`${API_BASE}/servers/invites/${inviteId}/respond`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json', ...authService.getAuthHeaders() },
              body: JSON.stringify({ accept })
            })
          } catch {
            console.error('초대 응답 실패')
          }
        }}
      />
    </nav>
  )
}
