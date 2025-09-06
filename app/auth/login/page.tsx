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
import { Loader2, Apple as AppleIcon } from "lucide-react"
import Image from "next/image"
import { DiscordIcon } from "@/components/icons/discord-icon"
import { openOAuthInBrowser, isNative } from "@/lib/native"
import { useAuth } from "@/components/auth-provider"

export default function LoginPage() {
  const { user: authUser, isLoading: authLoading } = useAuth() // AuthProvider 상태 사용
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [isDiscordLoading, setIsDiscordLoading] = useState(false)
  const [isKakaoLoading, setIsKakaoLoading] = useState(false)
  const [showRebootHint, setShowRebootHint] = useState(false)
  const [isAppleLoading, setIsAppleLoading] = useState(false)
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
    // AuthProvider의 상태를 통해 인증 확인
    if (!authLoading && authUser) {
      // 이미 로그인 되어 있으면 대시보드로 이동
      router.replace("/dashboard")
      return
    }
    
    // OAuth 에러 처리
    if (!authLoading && !authUser && error === 'oauth_email_linked') {
      if (existingProvider === 'kakao') {
        toast.error('이미 카카오 계정으로 가입된 이메일입니다. 카카오로 로그인해 주세요.')
      } else if (existingProvider === 'discord') {
        toast.error('이미 디스코드 계정으로 가입된 이메일입니다. 디스코드로 로그인해 주세요.')
      } else {
        toast.error('이미 가입된 이메일입니다. 해당 소셜로 로그인해 주세요.')
      }
    }
  }, [authLoading, authUser, router, error, existingProvider]) // AuthProvider 상태 기반으로 체크

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      await authService.login({ username, password })
      toast.success("로그인 성공", {
        description: "환영합니다!",
      })
      if (returnUrl) {
        router.push(returnUrl)
      } else if (inviteCode) {
        router.push(`/invite?code=${inviteCode}`)
      } else {
        router.push("/dashboard")
      }
    } catch (error) {
      toast.error("로그인 실패", {
        description: "아이디 또는 비밀번호를 확인해주세요.",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const setCookie = (name: string, value: string) => {
    try {
      const attrs: string[] = ["path=/", "samesite=lax"]
      if (typeof window !== "undefined" && window.location.protocol === "https:") {
        attrs.push("secure")
      }
      document.cookie = `${name}=${encodeURIComponent(value)}; ${attrs.join("; ")}`
    } catch {}
  }

  const isNativeWebView = () => {
    try {
      const w = window as any
      return !!(w?.Capacitor?.isNativePlatform?.() === true)
    } catch {
      return false
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
    
    // 네이티브 앱인지 확인
    const isNativeApp = await isNative()
    const target = isNativeApp ? "app" : (isIOSMobileWeb() ? "mobile-web" : "web")
    
    // Safari 쿠키 분리 회피를 위해 target 파라미터를 쿼리로 전달 (서버 필터가 쿠키로 저장)
    const url = `${base}/oauth2/authorization/discord?target=${encodeURIComponent(target)}`
    
    if (isNativeApp) {
      // 네이티브 앱에서는 Capacitor Browser 플러그인 사용
      const opened = await openOAuthInBrowser(url)
      if (!opened) {
        // 브라우저 플러그인이 없으면 일반 웹뷰로 열기
        window.location.href = url
      }
    } else {
      // 웹에서는 일반 리다이렉트
      window.location.href = url
    }
  }

  const handleKakaoLogin = async () => {
    setIsKakaoLoading(true)
    const base = process.env.NEXT_PUBLIC_API_URL!.replace(/\/api$/, "")
    
    // 네이티브 앱인지 확인
    const isNativeApp = await isNative()
    const target = isNativeApp ? "app" : (isIOSMobileWeb() ? "mobile-web" : "web")
    
    const url = `${base}/oauth2/authorization/kakao?target=${encodeURIComponent(target)}`
    
    if (isNativeApp) {
      // 네이티브 앱에서는 Capacitor Browser 플러그인 사용
      const opened = await openOAuthInBrowser(url)
      if (!opened) {
        // 브라우저 플러그인이 없으면 일반 웹뷰로 열기
        window.location.href = url
      }
    } else {
      // 웹에서는 일반 리다이렉트
      window.location.href = url
    }
  }

  const handleAppleLogin = async () => {
    setIsAppleLoading(true)
    const base = process.env.NEXT_PUBLIC_API_URL!.replace(/\/api$/, "")
    const isNativeApp = await isNative()
    const target = isNativeApp ? "app" : (isIOSMobileWeb() ? "mobile-web" : "web")
    const url = `${base}/oauth2/authorization/apple?target=${encodeURIComponent(target)}`
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
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-white text-center">
          <div>처리 중입니다...</div>
          {showRebootHint && (
            <div className="text-white/70 text-sm mt-2">오래 걸리면 앱을 완전히 종료 후 다시 열어주세요.</div>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-background">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-16 h-16 glass rounded-2xl mb-4 overflow-hidden mx-auto">
            <Image src="/logo_round.png" alt="GameSync" width={64} height={64} className="w-16 h-16" />
          </div>
          <h1 className="text-3xl font-bold text-foreground mb-2">GameSync</h1>
          <p className="text-muted-foreground">게임 스케줄링 플랫폼에 로그인하세요</p>
        </div>

        <Card className="glass border-white/10">
          <CardHeader>
            <CardTitle className="text-foreground">로그인</CardTitle>
            <CardDescription className="text-muted-foreground">계정 정보를 입력해주세요</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* 소셜 로그인: 원형 버튼들 */}
            <div className="flex items-center justify-center gap-4">
              {/* Discord */}
              <Button
                onClick={handleDiscordLogin}
                disabled={isDiscordLoading || isKakaoLoading || isAppleLoading || isLoading}
                className="h-12 w-12 rounded-full p-0 bg-[#5865F2] hover:bg-[#4752C4] text-white shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
                aria-label="Discord로 계속하기"
                title="Discord로 계속하기"
              >
                {isDiscordLoading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <DiscordIcon className="w-5 h-5" />
                )}
              </Button>
              {/* Kakao */}
              <Button
                onClick={handleKakaoLogin}
                disabled={isKakaoLoading || isDiscordLoading || isAppleLoading || isLoading}
                className="h-12 w-12 rounded-full p-0 bg-[#FEE500] hover:bg-[#F7D400] text-black shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
                aria-label="카카오로 계속하기"
                title="카카오로 계속하기"
              >
                {isKakaoLoading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <span className="font-bold text-base">K</span>
                )}
              </Button>
              {/* Apple (env로 토글 가능) */}
              {(process.env.NEXT_PUBLIC_ENABLE_APPLE_LOGIN ?? 'true') === 'true' && (
                <Button
                  onClick={handleAppleLogin}
                  disabled={isAppleLoading || isDiscordLoading || isKakaoLoading || isLoading}
                  className="h-12 w-12 rounded-full p-0 bg-black hover:bg-zinc-800 text-white shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
                  aria-label="Apple 계정으로 계속하기"
                  title="Apple 계정으로 계속하기"
                >
                  {isAppleLoading ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <AppleIcon className="w-5 h-5" />
                  )}
                </Button>
              )}
            </div>

            {/* 구분선 */}
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-white/20" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-transparent px-2 text-muted-foreground">또는</span>
              </div>
            </div>

            {/* 일반 로그인 폼 */}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="username" className="text-foreground">
                  로그인 아이디
                </Label>
                <Input
                  id="username"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="glass border-white/10 text-foreground placeholder:text-muted-foreground focus:border-white/20 focus:ring-white/10"
                  placeholder="로그인 아이디를 입력하세요"
                  required
                  disabled={isDiscordLoading || isKakaoLoading}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password" className="text-foreground">
                  비밀번호
                </Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="glass border-white/10 text-foreground placeholder:text-muted-foreground focus:border-white/20 focus:ring-white/10"
                  placeholder="비밀번호를 입력하세요"
                  required
                  disabled={isDiscordLoading || isKakaoLoading}
                />
              </div>
              <Button
                type="submit"
                className="w-full glass-button font-medium py-3"
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
                  className="text-muted-foreground hover:text-foreground underline font-medium transition-colors"
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
