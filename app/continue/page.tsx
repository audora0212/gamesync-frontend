"use client"

import { useEffect, useMemo, useState, Suspense } from "react"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Smartphone, ExternalLink, Download } from "lucide-react"

function ContinueInAppClient() {
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
    return "gamesync:///"
  }, [])

  const universal = useMemo(() => {
    return "https://gamesync.cloud/"
  }, [])

  const iosInstallUrl = (process as any).env.NEXT_PUBLIC_IOS_TESTFLIGHT_URL as string | undefined
  const androidInstallUrl = (process as any).env.NEXT_PUBLIC_ANDROID_DOWNLOAD_URL as string | undefined

  useEffect(() => {
    setDidAttemptOpenApp(true)
    try { window.location.href = appScheme } catch {}
    const t1 = setTimeout(() => { try { window.location.replace(universal) } catch {} }, 600)
    return () => { clearTimeout(t1) }
  }, [appScheme, universal])

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      {/* 배경 효과 */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute inset-0 bg-[linear-gradient(rgba(5,242,219,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(5,242,219,0.03)_1px,transparent_1px)] bg-[size:50px_50px]" />
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-neon-cyan/10 rounded-full blur-[150px]" />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-neon-green/10 rounded-full blur-[150px]" />
      </div>

      <div className="w-full max-w-md z-10">
        <Card>
          <CardContent className="p-6 space-y-5 text-center">
            <Badge className="mx-auto bg-neon-cyan/10 border-neon-cyan/30 text-neon-cyan">앱에서 계속하기</Badge>
            <div className="flex items-center justify-center gap-3">
              <Smartphone className="w-6 h-6 text-neon-cyan" />
              <h1 className="text-foreground text-xl font-semibold font-display">GameSync 앱으로 이동합니다</h1>
            </div>
            <p className="text-muted-foreground text-sm">
              앱이 자동으로 열리지 않으면 아래 버튼을 눌러주세요.
            </p>
            <div className="flex flex-col gap-2">
              <a href={appScheme} className="inline-flex w-full">
                <Button className="w-full">
                  앱에서 열기
                </Button>
              </a>
              <a href={universal} className="inline-flex w-full">
                <Button variant="outline" className="w-full">
                  유니버설 링크 <ExternalLink className="w-4 h-4 ml-2" />
                </Button>
              </a>
              {(isIOS && iosInstallUrl) && (
                <a href={iosInstallUrl} className="inline-flex w-full">
                  <Button variant="outline" className="w-full">
                    설치/업데이트 (iOS) <Download className="w-4 h-4 ml-2" />
                  </Button>
                </a>
              )}
              {(isAndroid && androidInstallUrl) && (
                <a href={androidInstallUrl} className="inline-flex w-full">
                  <Button variant="outline" className="w-full">
                    설치/업데이트 (Android) <Download className="w-4 h-4 ml-2" />
                  </Button>
                </a>
              )}
            </div>
            <div className="text-muted-foreground text-xs">
              오래 걸리면 앱을 완전히 종료 후 다시 열어주세요.
            </div>
            <div className="pt-1">
              <Link href={returnPath} className="text-neon-cyan/70 text-xs underline hover:text-neon-cyan">
                웹으로 계속하기
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default function ContinueInAppPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="fixed inset-0 overflow-hidden pointer-events-none">
          <div className="absolute inset-0 bg-[linear-gradient(rgba(5,242,219,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(5,242,219,0.03)_1px,transparent_1px)] bg-[size:50px_50px]" />
        </div>
        <div className="flex items-center gap-3 text-muted-foreground z-10">
          <div className="w-5 h-5 border-2 border-neon-cyan border-t-transparent rounded-full animate-spin" />
          처리 중입니다...
        </div>
      </div>
    }>
      <ContinueInAppClient />
    </Suspense>
  )
}
