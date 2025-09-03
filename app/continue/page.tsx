"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Smartphone, ExternalLink, Download } from "lucide-react"

export default function ContinueInAppPage() {
  const params = useSearchParams()
  const returnPath = params.get("return") || "/auth/login"
  const [didAttemptOpenApp, setDidAttemptOpenApp] = useState(false)
  const isIOS = useMemo(() => {
    try { return /iphone|ipad|ipod/i.test(navigator.userAgent) } catch { return false }
  }, [])
  const isAndroid = useMemo(() => {
    try { return /android/i.test(navigator.userAgent) } catch { return false }
  }, [])

  const appScheme = useMemo(() => {
    // 일반 진입: 앱만 열고, 내부에서 라우팅하도록
    return "gamesync:///"
  }, [])

  const universal = useMemo(() => {
    // 유니버설 링크: 사이트 루트로 복귀
    return "https://gamesync.cloud/"
  }, [])

  const iosInstallUrl = (process as any).env.NEXT_PUBLIC_IOS_TESTFLIGHT_URL as string | undefined
  const androidInstallUrl = (process as any).env.NEXT_PUBLIC_ANDROID_DOWNLOAD_URL as string | undefined

  useEffect(() => {
    // 모바일 웹 진입 시 자동으로 앱 열기 시도 → 실패하면 유니버설 링크 폴백
    setDidAttemptOpenApp(true)
    try { window.location.href = appScheme } catch {}
    const t1 = setTimeout(() => { try { window.location.replace(universal) } catch {} }, 600)
    return () => { clearTimeout(t1) }
  }, [appScheme, universal])

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <Card className="glass border-white/10">
          <CardContent className="p-6 space-y-5 text-center">
            <Badge className="mx-auto bg-white/5 border-white/10">앱에서 계속하기</Badge>
            <div className="flex items-center justify-center gap-3">
              <Smartphone className="w-6 h-6 text-primary" />
              <h1 className="text-foreground text-xl font-semibold">GameSync 앱으로 이동합니다</h1>
            </div>
            <p className="text-muted-foreground text-sm">
              앱이 자동으로 열리지 않으면 아래 버튼을 눌러주세요.
            </p>
            <div className="flex flex-col gap-2">
              <a href={appScheme} className="inline-flex">
                <Button className="w-full glass-button">
                  앱에서 열기
                </Button>
              </a>
              <a href={universal} className="inline-flex">
                <Button variant="outline" className="w-full glass border-white/20 text-white">
                  유니버설 링크 <ExternalLink className="w-4 h-4 ml-2" />
                </Button>
              </a>
              {(isIOS && iosInstallUrl) && (
                <a href={iosInstallUrl} className="inline-flex">
                  <Button variant="outline" className="w-full glass border-white/20 text-white">
                    설치/업데이트 (iOS) <Download className="w-4 h-4 ml-2" />
                  </Button>
                </a>
              )}
              {(isAndroid && androidInstallUrl) && (
                <a href={androidInstallUrl} className="inline-flex">
                  <Button variant="outline" className="w-full glass border-white/20 text-white">
                    설치/업데이트 (Android) <Download className="w-4 h-4 ml-2" />
                  </Button>
                </a>
              )}
            </div>
            <div className="text-white/60 text-xs">
              오래 걸리면 앱을 완전히 종료 후 다시 열어주세요.
            </div>
            <div className="pt-1">
              <Link href={returnPath} className="text-white/70 text-xs underline">
                웹으로 계속하기
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
