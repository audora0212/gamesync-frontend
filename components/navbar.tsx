"use client"

import Link from "next/link"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { authService } from "@/lib/auth-service"
import { GamepadIcon, LogOut, Bell, Users } from "lucide-react"
import { ChangeNicknameModal } from "@/components/ChangeNicknameModal"
import { FriendDrawer } from "@/components/friend-drawer"

export function Navbar() {
  const [user, setUser] = useState<string | null>(null)
  const [friendOpen, setFriendOpen] = useState(false)

  useEffect(() => {
    // 클라이언트에서만 실행
    const nickname = authService.getCurrentUser()
    setUser(nickname)
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
            >
              <Bell className="h-5 w-5" />
              <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-destructive" />
            </Button>
            <ChangeNicknameModal />
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
      {/* 친구창이 항상 최상단에 오도록 nav 내부의 맨 마지막에 두고, 고정 z-index 사용 */}
      <FriendDrawer open={friendOpen} onClose={() => setFriendOpen(false)} />
    </nav>
  )
}
