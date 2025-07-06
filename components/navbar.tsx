"use client"

import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { authService } from "@/lib/auth-service"
import { toast } from "sonner"
import { GamepadIcon, LogOut, Home } from "lucide-react"

export function Navbar() {
  const router = useRouter()

  const handleLogout = async () => {
    try {
      await authService.logout()
      toast.success("로그아웃 완료", {
        description: "성공적으로 로그아웃되었습니다.",
      })
      router.push("/auth/login")
    } catch (error) {
      toast.error("로그아웃 실패", {
        description: "로그아웃 중 오류가 발생했습니다.",
      })
    }
  }

  return (
    <nav className="glass border-b border-white/20">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <Link href="/dashboard" className="flex items-center space-x-2">
            <GamepadIcon className="h-8 w-8 text-white" />
            <span className="text-xl font-bold text-white">GameSync</span>
          </Link>

          <div className="flex items-center space-x-4">
            <Link href="/dashboard">
              <Button variant="ghost" className="text-white hover:bg-white/20">
                <Home className="mr-2 h-4 w-4" />
                대시보드
              </Button>
            </Link>
            <Button onClick={handleLogout} variant="ghost" className="text-white hover:bg-white/20">
              <LogOut className="mr-2 h-4 w-4" />
              로그아웃
            </Button>
          </div>
        </div>
      </div>
    </nav>
  )
}
