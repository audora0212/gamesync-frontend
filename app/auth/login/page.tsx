"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { toast } from "sonner"
import { authService } from "@/lib/auth-service"
import { Loader2, Gamepad2 } from "lucide-react"
import Image from "next/image"
import { DiscordIcon } from "@/components/icons/discord-icon"
import { openOAuthInBrowser, isNative } from "@/lib/native"
import { useAuth } from "@/components/auth-provider"

export default function LoginPage() {
  const { user: authUser, isLoading: authLoading } = useAuth()
  const REVIEW_MODE = process.env.NEXT_PUBLIC_REVIEW_MODE === 'true'
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [isDiscordLoading, setIsDiscordLoading] = useState(false)
  const [isKakaoLoading, setIsKakaoLoading] = useState(false)
  const [showRebootHint, setShowRebootHint] = useState(false)
  const router = useRouter()
  const params = typeof window !== "undefined" ? new URLSearchParams(window.location.search) : null
  const inviteCode = params?.get("code") || null
  const returnUrl = params?.get("return") || null
  const error = params?.get("error") || null
  const existingProvider = params?.get("existingProvider") || null

  useEffect(() => {
    if (!authLoading) {
      setShowRebootHint(false)
      return
    }
    const t = setTimeout(() => setShowRebootHint(true), 8000)
    return () => clearTimeout(t)
  }, [authLoading])

  useEffect(() => {
    if (!authLoading && authUser) {
      router.replace("/dashboard")
      return
    }

    if (!authLoading && !authUser && error === 'oauth_email_linked') {
      if (REVIEW_MODE) {
        toast.error('이미 가입된 이메일입니다. 아이디/비밀번호로 로그인해 주세요.')
      } else {
        if (existingProvider === 'kakao') {
          toast.error('이미 카카오 계정으로 가입된 이메일입니다. 카카오로 로그인해 주세요.')
        } else if (existingProvider === 'discord') {
          toast.error('이미 디스코드 계정으로 가입된 이메일입니다. 디스코드로 로그인해 주세요.')
        } else {
          toast.error('이미 가입된 이메일입니다. 해당 소셜로 로그인해 주세요.')
        }
      }
    }
  }, [authLoading, authUser, router, error, existingProvider])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      await authService.login({ username, password })
      toast.success("로그인 성공", { description: "환영합니다!" })
      if (returnUrl) {
        router.push(returnUrl)
      } else if (inviteCode) {
        router.push(`/invite?code=${inviteCode}`)
      } else {
        router.push("/dashboard")
      }
    } catch (error) {
      toast.error("로그인 실패", { description: "아이디 또는 비밀번호를 확인해주세요." })
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

  const handleDiscordLogin = async () => {
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

  const handleKakaoLogin = async () => {
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

  // 로딩 중이면 로딩 표시
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        {/* 배경 효과 */}
        <div className="fixed inset-0 overflow-hidden pointer-events-none">
          <div className="absolute inset-0 bg-[linear-gradient(rgba(5,242,219,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(5,242,219,0.03)_1px,transparent_1px)] bg-[size:50px_50px]" />
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-neon-cyan/10 rounded-full blur-[150px]" />
          <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-neon-magenta/10 rounded-full blur-[150px]" />
        </div>
        <div className="relative text-center">
          <div className="w-12 h-12 border-2 border-neon-cyan border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <div className="text-neon-cyan font-display text-lg">처리 중입니다...</div>
          {showRebootHint && (
            <div className="text-muted-foreground text-sm mt-2">오래 걸리면 앱을 완전히 종료 후 다시 열어주세요.</div>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-background">
      {/* 배경 효과 */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute inset-0 bg-[linear-gradient(rgba(5,242,219,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(5,242,219,0.03)_1px,transparent_1px)] bg-[size:50px_50px]" />
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-neon-cyan/10 rounded-full blur-[150px]" />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-neon-magenta/10 rounded-full blur-[150px]" />
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
              <div className="absolute inset-0 bg-neon-cyan/30 rounded-2xl blur-xl opacity-50 group-hover:opacity-100 transition-opacity" />
              <div className="relative w-20 h-20 rounded-2xl bg-cyber-dark/60 border border-neon-cyan/30 overflow-hidden mx-auto mb-4 backdrop-blur-sm">
                <Image src="/logo_round.png" alt="GameSync" width={80} height={80} className="w-full h-full" />
              </div>
            </div>
          </Link>
          <h1 className="font-display font-bold text-3xl text-neon-cyan drop-shadow-[0_0_15px_rgba(5,242,219,0.5)] mb-2">
            GameSync
          </h1>
          <p className="text-muted-foreground font-body">게임 스케줄링 플랫폼에 로그인하세요</p>
        </div>

        <Card>
          <CardHeader className="text-center">
            <CardTitle className="flex items-center justify-center gap-2">
              <Gamepad2 className="w-5 h-5" />
              로그인
            </CardTitle>
            <CardDescription>계정 정보를 입력해주세요</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {!REVIEW_MODE && (
              <>
                {/* Discord 로그인 버튼 */}
                <Button
                  onClick={handleDiscordLogin}
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

                {/* Kakao 로그인 버튼 */}
                <Button
                  onClick={handleKakaoLogin}
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

            {/* 일반 로그인 폼 */}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="username">로그인 아이디</Label>
                <Input
                  id="username"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="로그인 아이디를 입력하세요"
                  required
                  disabled={isDiscordLoading || isKakaoLoading}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">비밀번호</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="비밀번호를 입력하세요"
                  required
                  disabled={isDiscordLoading || isKakaoLoading}
                />
              </div>
              <Button
                type="submit"
                className="w-full"
                disabled={isLoading || isDiscordLoading || isKakaoLoading}
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
              <p className="text-muted-foreground text-sm">
                계정이 없으신가요?{" "}
                <Link
                  href="/auth/signup"
                  className="text-neon-magenta hover:text-neon-pink hover:drop-shadow-[0_0_10px_rgba(242,5,203,0.6)] font-medium transition-all"
                >
                  회원가입
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  )
}
