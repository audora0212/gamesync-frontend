"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { toast } from "sonner"
import { authService } from "@/lib/auth-service"
import { Loader2, GamepadIcon } from "lucide-react"
import { DiscordIcon } from "@/components/icons/discord-icon"

export default function LoginPage() {
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [isDiscordLoading, setIsDiscordLoading] = useState(false)
  const router = useRouter()

  useEffect(() => {
    if (authService.isAuthenticated()) {
      router.replace("/dashboard")
    }
  }, [router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      await authService.login({ username, password })
      toast.success("로그인 성공", {
        description: "환영합니다!",
      })
      router.push("/dashboard")
    } catch (error) {
      toast.error("로그인 실패", {
        description: "아이디 또는 비밀번호를 확인해주세요.",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleDiscordLogin = () => {
    setIsDiscordLoading(true)
    // Discord 로그인 페이지로 리다이렉트하기 전에 로딩 상태 표시
    window.location.href = "http://localhost:8080/oauth2/authorization/discord"
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 glass rounded-2xl mb-4">
            <GamepadIcon className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">GameSlots</h1>
          <p className="text-white/70">게임 스케줄링 플랫폼에 로그인하세요</p>
        </div>

        <Card className="glass border-white/20">
          <CardHeader>
            <CardTitle className="text-white">로그인</CardTitle>
            <CardDescription className="text-white/70">계정 정보를 입력해주세요</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Discord 로그인 버튼 */}
            <Button
              onClick={handleDiscordLogin}
              disabled={isDiscordLoading || isLoading}
              className="w-full bg-[#5865F2] hover:bg-[#4752C4] text-white font-medium py-3 px-4 rounded-lg transition-all duration-200 flex items-center justify-center gap-3 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isDiscordLoading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Discord 연결 중...</span>
                </>
              ) : (
                <>
                  <DiscordIcon className="w-5 h-5" />
                  <span>Discord로 계속하기</span>
                </>
              )}
            </Button>

            {/* 구분선 */}
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-white/20" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-transparent px-2 text-white/50">또는</span>
              </div>
            </div>

            {/* 일반 로그인 폼 */}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="username" className="text-white">
                  사용자명
                </Label>
                <Input
                  id="username"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="glass border-white/30 text-white placeholder:text-white/50 focus:border-white/50 focus:ring-white/20"
                  placeholder="사용자명을 입력하세요"
                  required
                  disabled={isDiscordLoading}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password" className="text-white">
                  비밀번호
                </Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="glass border-white/30 text-white placeholder:text-white/50 focus:border-white/50 focus:ring-white/20"
                  placeholder="비밀번호를 입력하세요"
                  required
                  disabled={isDiscordLoading}
                />
              </div>
              <Button
                type="submit"
                className="w-full glass-button font-medium py-3"
                disabled={isLoading || isDiscordLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    로그인 중...
                  </>
                ) : (
                  "로그인"
                )}
              </Button>
            </form>

            <div className="text-center">
              <p className="text-white/70 text-sm">
                계정이 없으신가요?{" "}
                <Link
                  href="/auth/signup"
                  className="text-blue-300 hover:text-blue-200 underline font-medium transition-colors"
                >
                  회원가입
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
