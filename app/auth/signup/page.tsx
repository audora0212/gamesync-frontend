"use client"

import type React from "react"
import { useState } from "react"
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

export default function SignupPage() {
  const [username, setUsername] = useState("")
  const [nickname, setNickname] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [isDiscordLoading, setIsDiscordLoading] = useState(false)
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // 아이디 유효성 검사
    if (username.length < 3 || username.length > 20) {
      toast.error("아이디 길이 오류", {
        description: "아이디는 3자 이상 20자 이하로 입력해주세요.",
      })
      return
    }
    if (!/^[a-zA-Z0-9_]+$/.test(username)) {
      toast.error("아이디 형식 오류", {
        description: "아이디는 영문, 숫자, 밑줄(_)만 사용할 수 있습니다.",
      })
      return
    }

    // 사용자명 유효성 검사
    if (nickname.length < 2 || nickname.length > 30) {
      toast.error("사용자명 길이 오류", {
        description: "사용자명은 2자 이상 30자 이하로 입력해주세요.",
      })
      return
    }

    // 비밀번호 유효성 검사
    if (password.length < 8) {
      toast.error("비밀번호 길이 오류", {
        description: "비밀번호는 최소 8자 이상이어야 합니다.",
      })
      return
    }

    if (password !== confirmPassword) {
      toast.error("비밀번호 확인 오류", {
        description: "비밀번호가 일치하지 않습니다.",
      })
      return
    }

    setIsLoading(true)

    try {
      await authService.signup({ username, password, nickname })
      toast.success("회원가입 성공", {
        description: "계정이 생성되었습니다. 로그인해주세요.",
      })
      router.push("/auth/login")
    } catch (error) {
      toast.error("회원가입 실패", {
        description: "다시 시도해주세요.",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleDiscordSignup = () => {
    setIsDiscordLoading(true)
    window.location.href = `${process.env.NEXT_PUBLIC_API_URL!.replace(/\/api$/, "")}/oauth2/authorization/discord`
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 glass rounded-2xl mb-4">
            <GamepadIcon className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">GameSync</h1>
          <p className="text-white/70">게임 스케줄링 플랫폼에 가입하세요</p>
        </div>

        <Card className="glass border-white/20">
          <CardHeader>
            <CardTitle className="text-white">회원가입</CardTitle>
            <CardDescription className="text-white/70">새 계정을 만들어보세요</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Discord 회원가입 버튼 */}
            <Button
              onClick={handleDiscordSignup}
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
                  <span>Discord로 빠른 가입</span>
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

            {/* 일반 회원가입 폼 */}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="username" className="text-white">
                  로그인 아이디 (3~20자, 영문,숫자)
                </Label>
                <Input
                  id="username"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  minLength={3}
                  maxLength={20}
                  pattern="^[a-zA-Z0-9_]+$"
                  title="3~20자 영문, 숫자, 밑줄(_)만 가능"
                  className="glass border-white/30 text-white placeholder:text-white/50 focus:border-white/50 focus:ring-white/20"
                  placeholder="로그인 아이디를 입력하세요"
                  required
                  disabled={isDiscordLoading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="nickname" className="text-white">
                  사용자명 (2~30자)
                </Label>
                <Input
                  id="nickname"
                  type="text"
                  value={nickname}
                  onChange={(e) => setNickname(e.target.value)}
                  minLength={2}
                  maxLength={30}
                  title="2~30자 사이로 입력해주세요"
                  className="glass border-white/30 text-white placeholder:text-white/50 focus:border-white/50 focus:ring-white/20"
                  placeholder="사용자명을 입력하세요"
                  required
                  disabled={isDiscordLoading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-white">
 비밀번호 (최소 8자)
</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  minLength={8}
                  title="비밀번호는 최소 8자 이상이어야 합니다."
                  className="glass border-white/30 text-white placeholder:text-white/50 focus:border-white/50 focus:ring-white/20"
                  placeholder="비밀번호를 입력하세요"
                  required
                  disabled={isDiscordLoading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword" className="text-white">
                  비밀번호 확인
                </Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  minLength={8}
                  title="비밀번호를 다시 입력하세요"
                  className="glass border-white/30 text-white placeholder:text-white/50 focus:border-white/50 focus:ring-white/20"
                  placeholder="비밀번호를 다시 입력하세요"
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
                    가입 중...
                  </>
                ) : (
                  "회원가입"
                )}
              </Button>
            </form>

            <div className="text-center">
              <p className="text-white/70 text-sm">
                이미 계정이 있으신가요? {" "}
                <Link
                  href="/auth/login"
                  className="text-blue-300 hover:text-blue-200 underline font-medium transition-colors"
                >
                  로그인
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
