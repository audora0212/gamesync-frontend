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
// Capacitor 존재 여부를 동기적으로 확인해 네이티브 여부를 판단

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
      const data = await authService.login({ username, password })
      toast.success("로그인 성공", {
        description: "환영합니다!",
      })
      // 모바일 웹이면, 사용자 제스처 컨텍스트 내에서 앱 열기 시도 → 실패 시 TestFlight로 폴백
      try {
        const cookies = typeof document !== 'undefined' ? document.cookie : ''
        const isMobileWeb = /(?:^|; )oauth_target=mobile-web/.test(cookies)
        if (isMobileWeb) {
          const token = data.token
          const userObj = { id: data.userId, nickname: data.nickname }
          const user = encodeURIComponent(JSON.stringify(userObj))
          const appScheme = `gamesync://oauth/callback?token=${encodeURIComponent(token)}&user=${user}`
          const universal = `https://gamesync.cloud/oauth/callback?token=${encodeURIComponent(token)}&user=${user}`
          // 우선 커스텀 스킴 시도 (사용자 제스처 컨텍스트)
          window.location.href = appScheme
          // 800ms 후 유니버설 링크 시도
          setTimeout(() => { try { window.location.href = universal } catch {} }, 800)
          // 1600ms 후 TestFlight 폴백
          setTimeout(() => {
            const tf = (process as any).env.NEXT_PUBLIC_IOS_TESTFLIGHT_URL
            if (tf) {
              window.location.href = tf
            }
          }, 1600)
          return
        }
      } catch {}
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

  const handleDiscordLogin = () => {
    setIsDiscordLoading(true)
    // 환경에 맞춰 oauth_target 쿠키 설정: app | mobile-web | web (동기 판별)
    try {
      const ua = typeof navigator !== 'undefined' ? navigator.userAgent : ''
      const isMobile = /iphone|ipad|ipod|android|mobile/i.test(ua)
      const Cap = (typeof window !== 'undefined' ? (window as any).Capacitor : null)
      let target: 'app' | 'mobile-web' | 'web' = 'web'
      try { if (Cap && typeof Cap.isNativePlatform === 'function' && Cap.isNativePlatform()) target = 'app'; else if (isMobile) target = 'mobile-web' } catch { if (isMobile) target = 'mobile-web' }
      const attrs: string[] = ["path=/", "samesite=lax", "max-age=300"]
      try { if (typeof window !== 'undefined' && window.location.protocol === 'https:') attrs.push("secure") } catch {}
      document.cookie = `oauth_target=${target}; ${attrs.join("; ")}`
    } catch {}
    // Discord 로그인 페이지로 이동
    window.location.href = `${process.env.NEXT_PUBLIC_API_URL!.replace(/\/api$/, "")}/oauth2/authorization/discord`
  }

  const handleKakaoLogin = () => {
    setIsKakaoLoading(true)
    // 환경에 맞춰 oauth_target 쿠키 설정: app | mobile-web | web (동기 판별)
    try {
      const ua = typeof navigator !== 'undefined' ? navigator.userAgent : ''
      const isMobile = /iphone|ipad|ipod|android|mobile/i.test(ua)
      const Cap = (typeof window !== 'undefined' ? (window as any).Capacitor : null)
      let target: 'app' | 'mobile-web' | 'web' = 'web'
      try { if (Cap && typeof Cap.isNativePlatform === 'function' && Cap.isNativePlatform()) target = 'app'; else if (isMobile) target = 'mobile-web' } catch { if (isMobile) target = 'mobile-web' }
      const attrs: string[] = ["path=/", "samesite=lax", "max-age=300"]
      try { if (typeof window !== 'undefined' && window.location.protocol === 'https:') attrs.push("secure") } catch {}
      document.cookie = `oauth_target=${target}; ${attrs.join("; ")}`
    } catch {}
    window.location.href = `${process.env.NEXT_PUBLIC_API_URL!.replace(/\/api$/, "")}/oauth2/authorization/kakao`
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
