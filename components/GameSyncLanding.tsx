'use client'

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Calendar, ArrowRight, Zap, Users, Clock } from "lucide-react"
import { useRouter } from "next/navigation"

export default function GameSyncLanding() {
  const [isVisible, setIsVisible] = useState(false)
  const router = useRouter()

  const isIOSMobileWeb = () => {
    try { return /iphone|ipad|ipod/i.test(navigator.userAgent) } catch { return false }
  }
  const isNativeWebView = () => {
    try { const w: any = window; return !!(w?.Capacitor?.isNativePlatform?.() === true) } catch { return false }
  }

  const goLogin = () => {
    if (!isNativeWebView() && isIOSMobileWeb()) router.push('/continue?return=%2Fauth%2Flogin')
    else router.push('/auth/login')
  }
  const goSignup = () => {
    if (!isNativeWebView() && isIOSMobileWeb()) router.push('/continue?return=%2Fauth%2Fsignup')
    else router.push('/auth/signup')
  }
  const goStart = () => {
    if (!isNativeWebView() && isIOSMobileWeb()) router.push('/continue?return=%2Fauth%2Fsignup')
    else router.push('/auth/signup')
  }

  useEffect(() => {
    setIsVisible(true)
  }, [])

  return (
    <div className="min-h-screen text-foreground overflow-x-hidden bg-background">
      {/* 배경 효과 */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        {/* 그리드 패턴 */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(5,242,219,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(5,242,219,0.03)_1px,transparent_1px)] bg-[size:50px_50px]" />

        {/* 글로우 오브 */}
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-neon-cyan/10 rounded-full blur-[150px]" />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-neon-magenta/10 rounded-full blur-[150px]" />
        <div className="absolute top-1/2 right-0 w-64 h-64 bg-neon-pink/10 rounded-full blur-[100px]" />
      </div>

      {/* Header */}
      <header className="relative z-50 px-4 py-4 bg-background/80 backdrop-blur-xl border-b border-neon-cyan/20">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="absolute inset-0 bg-neon-cyan/30 rounded-xl blur-md" />
              <div className="relative w-10 h-10 rounded-xl bg-cyber-dark/60 border border-neon-cyan/30 overflow-hidden">
                <Image src="/logo_round.png" alt="GameSync" width={40} height={40} className="w-full h-full" />
              </div>
            </div>
            <span className="font-display font-bold text-2xl text-white drop-shadow-[0_0_15px_rgba(255,255,255,0.5)]">
              GameSync
            </span>
          </div>
          <div className="flex items-center gap-3">
            <Button
              onClick={goLogin}
              variant="outline"
              className="hidden sm:flex"
            >
              로그인
            </Button>
            <Button onClick={goSignup}>
              회원가입
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative px-4 py-20 sm:py-32">
        <div className="max-w-5xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            {/* Title */}
            <h1 className="mb-8">
              <span className="block text-2xl sm:text-3xl md:text-4xl text-white/90 font-body mb-4">
                게임 약속, 이제 한 곳에서
              </span>
              <span className="block font-display font-black text-5xl sm:text-7xl md:text-8xl text-white animate-text-glow">
                GameSync
              </span>
            </h1>

            {/* Description */}
            <p className="text-lg sm:text-xl md:text-2xl text-muted-foreground mb-12 max-w-2xl mx-auto leading-relaxed font-body">
              복잡한 일정 조율은 그만!
              <br />
              <span className="text-neon-cyan">5분이면</span> 팀 스케줄이 정리됩니다.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Button
                  onClick={goStart}
                  size="xl"
                  className="group"
                >
                  무료로 시작하기
                  <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
                </Button>
              </motion.div>
              <Button
                onClick={goLogin}
                variant="outline"
                size="lg"
                className="sm:hidden"
              >
                로그인
              </Button>
            </div>

            {/* Stats */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6, duration: 0.6 }}
              className="mt-16 grid grid-cols-3 gap-8 max-w-lg mx-auto"
            >
              {[
                { value: "1000+", label: "사용자", icon: Users },
                { value: "5000+", label: "약속", icon: Calendar },
                { value: "24/7", label: "자동화", icon: Clock },
              ].map((stat, idx) => (
                <div key={idx} className="text-center">
                  <stat.icon className="w-5 h-5 mx-auto mb-2 text-neon-cyan/60" />
                  <div className="font-display font-bold text-2xl sm:text-3xl text-neon-cyan drop-shadow-[0_0_10px_rgba(5,242,219,0.5)]">
                    {stat.value}
                  </div>
                  <div className="text-sm text-muted-foreground">{stat.label}</div>
                </div>
              ))}
            </motion.div>
          </motion.div>
        </div>
      </section>
    </div>
  )
}
