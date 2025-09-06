'use client'

import { useState, useEffect } from "react"
import Link from "next/link"
// Demo image section removed; no Image import needed
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Calendar, RefreshCw, BarChart3, ArrowRight, Zap, Megaphone } from "lucide-react"
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
    // 시작하기는 회원가입으로 가정
    if (!isNativeWebView() && isIOSMobileWeb()) router.push('/continue?return=%2Fauth%2Fsignup')
    else router.push('/auth/signup')
  }

  useEffect(() => {
    setIsVisible(true)
  }, [])

  return (
    <div className="min-h-screen text-foreground font-['Inter'] overflow-x-hidden">
      {/* Header */}
      <header className="relative z-50 px-4 py-6">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/5 backdrop-blur-sm border border-white/10 overflow-hidden">
              <Image src="/logo_round.png" alt="GameSync" width={40} height={40} className="w-full h-full" />
            </div>
            <span className="text-2xl font-bold">GameSync</span>
          </div>
          <div className="flex items-center gap-3">
            <Button onClick={goLogin}
              variant="ghost"
              className="text-muted-foreground hover:bg-white/10 backdrop-blur-sm border border-white/10"
            >
              로그인
            </Button>
            <Button onClick={goSignup}>회원가입</Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative px-4 py-16 sm:py-20">
        <div className="max-w-4xl mx-auto text-center">
          <div
            className={`transition-all duration-1000 ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}
          >
            <Badge className="mb-6 bg-white/5 backdrop-blur-sm border border-white/10 text-foreground hover:bg-white/10">
              <Zap className="w-4 h-4 mr-2" />더 이상 &quot;언제 할래?&quot; 묻지 마세요
            </Badge>
            <h1 className="text-4xl sm:text-5xl md:text-7xl font-bold mb-6 leading-tight text-balance">
              게임 약속,
              <br />
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-primary to-accent">
                GameSync
              </span>
            </h1>
            <p className="text-[15px] sm:text-lg md:text-2xl text-white/80 mb-8 max-w-2xl mx-auto leading-relaxed">
              매번 단톡방에서 &quot;몇 시에 할까?&quot; 물어보기 지치셨나요?
              <br />
              GameSync로 한 번에 정리하고, 자동으로 관리하세요
              <br />
              <span className="text-primary font-semibold">5분이면 충분합니다.</span>
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-0">
              <Button onClick={goStart} size="lg" className="w-full sm:w-auto px-8 py-4 text-lg font-semibold rounded-xl">
                시작하기
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="relative px-4 py-16 sm:py-20">
        <div className="max-w-6xl mx-auto">
          <div
            className={`text-center mb-12 sm:mb-16 transition-all duration-1000 delay-300 ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}
          >
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4 text-balance">
              이제 이런 고민은 안 해도 돼요
            </h2>
            <p className="text-[15px] sm:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
              복잡한 기능은 빼고, 정말 필요한 것만 담았어요
              <br />
              <span className="text-primary">직관적이고 간단합니다.</span>
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            {[
              {
                icon: Calendar,
                title: "스마트 약속 관리",
                description: "클릭 한 번으로 약속 생성. 참여자들이 알아서 시간을 선택해요.",
                delay: "delay-500",
              },
              {
                icon: RefreshCw,
                title: "자동 정리 시스템",
                description: "매일 자정에 자동으로 초기화. 어제 일정에 신경 쓸 필요 없어요.",
                delay: "delay-700",
              },
              {
                icon: BarChart3,
                title: "팀 활동 인사이트",
                description: "우리 팀이 언제 가장 활발한지 데이터로 확인하세요.",
                delay: "delay-1100",
              },
              {
                icon: Megaphone,
                title: "파티원 모집",
                description: "부족한 팀원을 쉽게 모집하고, 새로운 사람들과 만나보세요.",
                delay: "delay-1300",
              },
            ].map((feature, idx) => (
              <Card
                key={idx}
                className={`bg-white/5 backdrop-blur-sm border border-white/10 hover:bg-white/10 transition-all duration-500 ${feature.delay} ${
                  isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
                }`}
              >
                <CardContent className="p-6 text-center">
                  <div className="mb-4 p-3 rounded-xl bg-primary/10 w-fit mx-auto">
                    <feature.icon className="w-8 h-8 text-primary" />
                  </div>
                  <h3 className="text-xl font-semibold mb-3 text-foreground">{feature.title}</h3>
                  <p className="text-muted-foreground leading-relaxed">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative px-4 py-16 sm:py-20">
        <div className="max-w-4xl mx-auto text-center">
          <Card
            className={`bg-white/5 backdrop-blur-sm border border-white/10 overflow-hidden transition-all duration-1000 delay-1500 ${
              isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
            }`}
          >
            <CardContent className="p-6 sm:p-12">
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-6 text-foreground text-balance">
                오늘부터 달라져요
              </h2>
              <p className="text-[15px] sm:text-xl text-muted-foreground mb-8 max-w-2xl mx-auto leading-relaxed">
                더 이상 단톡방에서 시간 조율하느라
                <br />
                스트레스 받지 마세요.
                <br />
                지금 바로 시작하면
                <br />
                <span className="text-primary font-semibold">5분내로 첫 약속을 만들 수 있어요</span>
              </p>
              <Button
                onClick={goStart}
                size="lg"
                className="w-full sm:w-auto px-8 sm:px-12 py-4 text-lg sm:text-xl font-semibold rounded-xl"
              >
                시작하기
                <ArrowRight className="w-5 sm:w-6 h-5 sm:h-6 ml-2" />
              </Button>
            </CardContent>
          </Card>
        </div>
      </section>
      {/* Footer는 전역 레이아웃에서 렌더링 */}
    </div>
  )
}
