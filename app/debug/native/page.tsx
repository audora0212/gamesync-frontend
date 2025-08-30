"use client"

import { useEffect, useMemo, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { toast } from "sonner"
import { authService } from "@/lib/auth-service"
import { notificationService } from "@/lib/notification-service"

export default function NativeDebugPage() {
  const [isNative, setIsNative] = useState<boolean>(false)
  const [platform, setPlatform] = useState<string>("unknown")
  const [hasCapacitor, setHasCapacitor] = useState<boolean>(false)
  const [hasFirebaseMessaging, setHasFirebaseMessaging] = useState<boolean>(false)
  const [pluginKeys, setPluginKeys] = useState<string[]>([])
  const [fcmToken, setFcmToken] = useState<string | null>(null)
  const [lastAction, setLastAction] = useState<string>("")

  const userId = useMemo(() => authService.getCurrentUserId(), [])
  const userNickname = useMemo(() => authService.getCurrentUser(), [])

  useEffect(() => {
    try {
      const w: any = typeof window !== 'undefined' ? window : null
      const Cap = w?.Capacitor || null
      setHasCapacitor(!!Cap)
      setIsNative(!!(Cap && typeof Cap.isNativePlatform === 'function' && Cap.isNativePlatform()))
      setPlatform(Cap && typeof Cap.getPlatform === 'function' ? (Cap.getPlatform() as string) : 'web')
      const FM = (Cap?.FirebaseMessaging) || (Cap?.Plugins?.FirebaseMessaging) || (Cap?.Plugins?.CapacitorFirebaseMessaging) || (Cap?.CapacitorFirebaseMessaging)
      setHasFirebaseMessaging(!!FM)
      try {
        const keys = Cap?.Plugins ? Object.keys(Cap.Plugins) : []
        setPluginKeys(keys)
      } catch { setPluginKeys([]) }
      const saved = authService.getFcmToken()
      if (saved) setFcmToken(saved)
    } catch {}
  }, [])

  const tryRequestToken = async () => {
    setLastAction("토큰 요청 중...")
    try {
      const w: any = typeof window !== 'undefined' ? window : null
      const Cap = w?.Capacitor || null
      const FM = (Cap?.FirebaseMessaging) || (Cap?.Plugins?.FirebaseMessaging) || (Cap?.Plugins?.CapacitorFirebaseMessaging) || (Cap?.CapacitorFirebaseMessaging)
      if (!FM || typeof FM.getToken !== 'function') {
        setLastAction("FirebaseMessaging 플러그인 없음")
        toast.error("FirebaseMessaging 플러그인을 찾을 수 없습니다")
        return
      }
      if (typeof FM.requestPermissions === 'function') {
        try { await FM.requestPermissions() } catch {}
      }
      const res = await FM.getToken()
      const token = (res && typeof res.token === 'string') ? res.token as string : null
      setFcmToken(token)
      if (token) {
        authService.setFcmToken(token)
        setLastAction("토큰 발급 성공")
        toast.success("FCM 토큰 발급", { description: token.slice(0, 12) + "..." })
      } else {
        setLastAction("토큰 없음(null)")
        toast.error("FCM 토큰을 발급받지 못했습니다")
      }
    } catch (e: any) {
      setLastAction("토큰 요청 실패")
      toast.error("토큰 요청 실패", { description: String(e?.message || e) })
    }
  }

  const tryRegisterToken = async () => {
    if (!fcmToken) {
      toast.error("토큰이 없습니다", { description: "먼저 토큰을 발급받아주세요" })
      return
    }
    setLastAction("서버 등록 중...")
    try {
      const w: any = typeof window !== 'undefined' ? window : null
      const Cap = w?.Capacitor || null
      const currentPlatform = Cap && typeof Cap.getPlatform === 'function' ? Cap.getPlatform() : 'ios'
      await notificationService.registerPushToken(fcmToken, currentPlatform)
      setLastAction("서버 등록 성공")
      toast.success("서버에 토큰 등록 완료")
    } catch (e: any) {
      setLastAction("서버 등록 실패")
      toast.error("서버 등록 실패", { description: String(e?.message || e) })
    }
  }

  return (
    <div className="min-h-screen p-6">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-2xl font-bold text-white mb-4">네이티브 디버그</h1>
        <Card className="bg-white/10 border-white/20">
          <CardHeader>
            <CardTitle className="text-white">환경 상태</CardTitle>
          </CardHeader>
          <CardContent className="text-white/80 space-y-2">
            <div>사용자: {userNickname ?? '(알 수 없음)'} (ID: {userId ?? 'n/a'})</div>
            <div>Capacitor 주입: {hasCapacitor ? '예' : '아니오'}</div>
            <div>네이티브 실행: {isNative ? '예' : '아니오'}</div>
            <div>플랫폼: {platform}</div>
            <div>FirebaseMessaging 플러그인: {hasFirebaseMessaging ? '감지됨' : '없음'}</div>
            <div>등록된 플러그인 키: {pluginKeys.length > 0 ? pluginKeys.join(', ') : '(없음)'}</div>
            <div>저장된 FCM 토큰: {fcmToken ? (fcmToken.slice(0, 20) + '...') : '(없음)'}</div>
            <div>최근 동작: {lastAction || '-'}</div>
            <div className="flex gap-2 mt-3">
              <Button onClick={tryRequestToken} className="glass-button">토큰 발급</Button>
              <Button onClick={tryRegisterToken} className="glass-button" variant="secondary">서버 등록</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}


