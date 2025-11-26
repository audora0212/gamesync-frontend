"use client"

import type React from "react"
import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { toast } from "sonner"
import { authService } from "@/lib/auth-service"
import { Loader2, UserPlus } from "lucide-react"
import Image from "next/image"
import { DiscordIcon } from "@/components/icons/discord-icon"
import { openOAuthInBrowser, isNative } from "@/lib/native"

export default function SignupPage() {
  const REVIEW_MODE = process.env.NEXT_PUBLIC_REVIEW_MODE === 'true'
  const [username, setUsername] = useState("")
  const [nickname, setNickname] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [isDiscordLoading, setIsDiscordLoading] = useState(false)
  const [isKakaoLoading, setIsKakaoLoading] = useState(false)
  const router = useRouter()
  const inviteCode = typeof window !== "undefined" ? new URLSearchParams(window.location.search).get("code") : null
  const returnUrl = typeof window !== "undefined" ? new URLSearchParams(window.location.search).get("return") : null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (username.length < 3 || username.length > 20) {
      toast.error("아이디 길이 오류", { description: "아이디는 3자 이상 20자 이하로 입력해주세요." })
      return
    }
    if (!/^[a-zA-Z0-9_]+$/.test(username)) {
      toast.error("아이디 형식 오류", { description: "아이디는 영문, 숫자, 밑줄(_)만 사용할 수 있습니다." })
      return
    }
    if (nickname.length < 2 || nickname.length > 30) {
      toast.error("사용자명 길이 오류", { description: "사용자명은 2자 이상 30자 이하로 입력해주세요." })
      return
    }
    if (password.length < 8) {
      toast.error("비밀번호 길이 오류", { description: "비밀번호는 최소 8자 이상이어야 합니다." })
      return
    }
    if (password !== confirmPassword) {
      toast.error("비밀번호 확인 오류", { description: "비밀번호가 일치하지 않습니다." })
      return
    }

    setIsLoading(true)

    try {
      await authService.signup({ username, password, nickname })
      toast.success("회원가입 성공", { description: "계정이 생성되었습니다. 로그인해주세요." })
      if (inviteCode) {
        const next = `/invite?code=${inviteCode}`
        router.push(`/auth/login?return=${encodeURIComponent(next)}`)
      } else if (returnUrl) {
        router.push(`/auth/login?return=${encodeURIComponent(returnUrl)}`)
      } else {
        router.push("/auth/login")
      }
    } catch (error) {
      toast.error("회원가입 실패", { description: "다시 시도해주세요." })
    } finally {
      setIsLoading(false)
    }
  }

  const isIOSMobileWeb = () => {
    try {
      const ua = navigator.userAgent
      return /iphone|ipad|ipod/i.test(ua)
    } catch {
      return false
    }
  }

  const handleDiscordSignup = async () => {
    setIsDiscordLoading(true)
    const base = process.env.NEXT_PUBLIC_API_URL!.replace(/\/api$/, "")
    const isNativeApp = await isNative()
    const target = isNativeApp ? "app" : (isIOSMobileWeb() ? "mobile-web" : "web")
    const url = `${base}/oauth2/authorization/discord?target=${encodeURIComponent(target)}`

    if (isNativeApp) {
      const opened = await openOAuthInBrowser(url)
      if (!opened) {
        window.location.href = url
      }
    } else {
      window.location.href = url
    }
  }

  const handleKakaoSignup = async () => {
    setIsKakaoLoading(true)
    const base = process.env.NEXT_PUBLIC_API_URL!.replace(/\/api$/, "")
    const isNativeApp = await isNative()
    const target = isNativeApp ? "app" : (isIOSMobileWeb() ? "mobile-web" : "web")
    const url = `${base}/oauth2/authorization/kakao?target=${encodeURIComponent(target)}`

    if (isNativeApp) {
      const opened = await openOAuthInBrowser(url)
      if (!opened) {
        window.location.href = url
      }
    } else {
      window.location.href = url
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-background">
      {/* 배경 효과 */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute inset-0 bg-[linear-gradient(rgba(5,242,219,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(5,242,219,0.03)_1px,transparent_1px)] bg-[size:50px_50px]" />
        <div className="absolute top-1/4 right-1/4 w-96 h-96 bg-neon-magenta/10 rounded-full blur-[150px]" />
        <div className="absolute bottom-1/4 left-1/4 w-80 h-80 bg-neon-cyan/10 rounded-full blur-[150px]" />
      </div>

      <motion.div
        className="relative w-full max-w-md z-10"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        {/* 로고 영역 */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-block group">
            <div className="relative">
              <div className="absolute inset-0 bg-neon-magenta/30 rounded-2xl blur-xl opacity-50 group-hover:opacity-100 transition-opacity" />
              <div className="relative w-20 h-20 rounded-2xl bg-cyber-dark/60 border border-neon-magenta/30 overflow-hidden mx-auto mb-4 backdrop-blur-sm">
                <Image src="/logo_round.png" alt="GameSync" width={80} height={80} className="w-full h-full" />
              </div>
            </div>
          </Link>
          <h1 className="font-display font-bold text-3xl text-neon-cyan drop-shadow-[0_0_15px_rgba(5,242,219,0.5)] mb-2">
            GameSync
          </h1>
          <p className="text-muted-foreground font-body">게임 스케줄링 플랫폼에 가입하세요</p>
        </div>

        <Card>
          <CardHeader className="text-center">
            <CardTitle className="flex items-center justify-center gap-2">
              <UserPlus className="w-5 h-5" />
              회원가입
            </CardTitle>
            <CardDescription>새 계정을 만들어보세요</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {!REVIEW_MODE && (
              <>
                {/* Discord 회원가입 버튼 */}
                <Button
                  onClick={handleDiscordSignup}
                  disabled={isDiscordLoading || isKakaoLoading || isLoading}
                  className="w-full !bg-[#5865F2] hover:!bg-[#4752C4] text-white border-none shadow-[0_0_15px_rgba(88,101,242,0.4)] hover:shadow-[0_0_25px_rgba(88,101,242,0.6)]"
                >
                  {isDiscordLoading ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin mr-2" />
                      Discord 연결 중...
                    </>
                  ) : (
                    <>
                      <DiscordIcon className="w-5 h-5 mr-2" />
                      Discord로 계속하기
                    </>
                  )}
                </Button>

                {/* Kakao 회원가입 버튼 */}
                <Button
                  onClick={handleKakaoSignup}
                  disabled={isKakaoLoading || isDiscordLoading || isLoading}
                  className="w-full !bg-[#FEE500] hover:!bg-[#F7D400] !text-black border-none shadow-[0_0_15px_rgba(254,229,0,0.4)] hover:shadow-[0_0_25px_rgba(254,229,0,0.6)]"
                >
                  {isKakaoLoading ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin mr-2" />
                      카카오 연결 중...
                    </>
                  ) : (
                    <>카카오로 계속하기</>
                  )}
                </Button>

                {/* 구분선 */}
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t border-white/10" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="px-3 text-muted-foreground bg-cyber-dark">또는</span>
                  </div>
                </div>
              </>
            )}

            {/* 일반 회원가입 폼 */}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="username">로그인 아이디 (3~20자, 영문,숫자)</Label>
                <Input
                  id="username"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  minLength={3}
                  maxLength={20}
                  pattern="^[a-zA-Z0-9_]+$"
                  title="3~20자 영문, 숫자, 밑줄(_)만 가능"
                  placeholder="로그인 아이디를 입력하세요"
                  required
                  disabled={isDiscordLoading || isKakaoLoading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="nickname">사용자명 (2~30자)</Label>
                <Input
                  id="nickname"
                  type="text"
                  value={nickname}
                  onChange={(e) => setNickname(e.target.value)}
                  minLength={2}
                  maxLength={30}
                  title="2~30자 사이로 입력해주세요"
                  placeholder="사용자명을 입력하세요"
                  required
                  disabled={isDiscordLoading || isKakaoLoading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">비밀번호 (최소 8자)</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  minLength={8}
                  title="비밀번호는 최소 8자 이상이어야 합니다."
                  placeholder="비밀번호를 입력하세요"
                  required
                  disabled={isDiscordLoading || isKakaoLoading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">비밀번호 확인</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  minLength={8}
                  title="비밀번호를 다시 입력하세요"
                  placeholder="비밀번호를 다시 입력하세요"
                  required
                  disabled={isDiscordLoading || isKakaoLoading}
                />
              </div>

              <Button
                type="submit"
                variant="secondary"
                className="w-full"
                disabled={isLoading || isDiscordLoading || isKakaoLoading}
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
              <p className="text-muted-foreground text-sm">
                이미 계정이 있으신가요?{" "}
                <Link
                  href="/auth/login"
                  className="text-neon-cyan hover:text-neon-cyan/80 hover:drop-shadow-[0_0_10px_rgba(5,242,219,0.6)] font-medium transition-all"
                >
                  로그인
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  )
}
