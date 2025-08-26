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
import { openExternal } from "@/lib/native"

export default function LoginPage() {
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [isDiscordLoading, setIsDiscordLoading] = useState(false)
  const [isKakaoLoading, setIsKakaoLoading] = useState(false)
  const router = useRouter()
  const params = typeof window !== "undefined" ? new URLSearchParams(window.location.search) : null
  const inviteCode = params?.get("code") || null
  const returnUrl = params?.get("return") || null

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
    // 인앱 브라우저(SFSafariViewController)에서는 콜백 페이지에서 Browser.close()로 복귀하므로 웹 콜백을 사용
    const target = isNativeWebView() ? "web" : (isIOSMobileWeb() ? "mobile-web" : "web")
    // Safari 쿠키 분리 회피를 위해 target 파라미터를 쿼리로 전달 (서버 필터가 쿠키로 저장)
    const url = `${base}/oauth2/authorization/discord?target=${encodeURIComponent(target)}`
    if (isNativeWebView()) {
      try { await openExternal(url) } catch { window.location.href = url }
    } else {
      window.location.href = url
    }
  }

  const handleKakaoLogin = async () => {
    setIsKakaoLoading(true)
    const base = process.env.NEXT_PUBLIC_API_URL!.replace(/\/api$/, "")
    const target = isNativeWebView() ? "web" : (isIOSMobileWeb() ? "mobile-web" : "web")
    const url = `${base}/oauth2/authorization/kakao?target=${encodeURIComponent(target)}`
    if (isNativeWebView()) {
      try { await openExternal(url) } catch { window.location.href = url }
    } else {
      window.location.href = url
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-background">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 glass rounded-2xl mb-4">
            <GamepadIcon className="w-8 h-8 text-white" />
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
            {/* Discord 로그인 버튼 */}
            <Button
              onClick={handleDiscordLogin}
              disabled={isDiscordLoading || isKakaoLoading || isLoading}
              className="w-full bg-none !bg-[#5865F2] hover:!bg-[#4752C4] text-white font-medium py-3 px-4 rounded-lg transition-all duration-200 flex items-center justify-center gap-3 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed focus-visible:ring-2 focus-visible:ring-[#5865F2]/50"
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

            {/* Kakao 로그인 버튼 */}
            <Button
              onClick={handleKakaoLogin}
              disabled={isKakaoLoading || isDiscordLoading || isLoading}
              className="w-full bg-none !bg-[#FEE500] hover:!bg-[#F7D400] text-black font-medium py-3 px-4 rounded-lg transition-all duration-200 flex items-center justify-center gap-3 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed focus-visible:ring-2 focus-visible:ring-[#FEE500]/50"
            >
              {isKakaoLoading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>카카오 연결 중...</span>
                </>
              ) : (
                <>
                  <span>카카오로 계속하기</span>
                </>
              )}
            </Button>

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
