'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Gamepad2,
  Calendar,
  RefreshCw,
  Users,
  BarChart3,
  Star,
  ArrowRight,
  Clock,
  Zap,
} from 'lucide-react'

export default function GameSyncLanding() {
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    setIsVisible(true)
  }, [])

  return (
    <div className="min-h-screen text-foreground font-['Inter'] overflow-x-hidden">
      {/* Header */}
      <header className="relative z-50 px-4 py-6">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-white/5 backdrop-blur-sm border border-white/10">
              <Gamepad2 className="w-6 h-6 text-muted-foreground" />
            </div>
            <span className="text-2xl font-bold">GameSync</span>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/auth/login" passHref>
              <Button variant="ghost" className="text-muted-foreground hover:bg-white/10 backdrop-blur-sm border border-white/10">
                로그인
              </Button>
            </Link>
            <Link href="/auth/signup" passHref>
              <Button className="bg-white/10 hover:bg-white/15 backdrop-blur-sm border border-white/10 text-foreground">
                회원가입
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative px-4 py-20">
        <div className="max-w-4xl mx-auto text-center">
          <div className={`transition-all duration-1000 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
            <Badge className="mb-6 bg-white/5 backdrop-blur-sm border border-white/10 text-foreground hover:bg-white/10">
              <Zap className="w-4 h-4 mr-2" />
              새로운 게임 예약 플랫폼
            </Badge>
            <h1 className="text-5xl md:text-7xl font-bold mb-6 leading-tight">
              팀원들과 간편하게
              <br />
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-primary to-accent">
                게임 시간을 예약하세요
              </span>
            </h1>
            <p className="text-xl md:text-2xl text-white/80 mb-8 max-w-2xl mx-auto leading-relaxed">
              GameSync는 일정 공유, 초대 코드, 자동 초기화 기능을 제공하여 팀 게임을 더욱 쉽게 만들어줍니다.
            </p>
            <Link href="/auth/signup" passHref>
              <Button
                size="lg"
                className="px-8 py-4 text-lg font-semibold rounded-xl"
              >
                지금 시작하기
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="relative px-4 py-20">
        <div className="max-w-6xl mx-auto">
          <div className={`text-center mb-16 transition-all duration-1000 delay-300 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
            <h2 className="text-4xl md:text-5xl font-bold mb-4">왜 GameSync를 사용하나요?</h2>
             <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              게이머들을 위해 특별히 설계된 강력한 기능들을 만나보세요
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                icon: Calendar,
                title: '예약 관리',
                description: '원하는 시간에 게임 합류 일정을 간편하게 등록하고 관리하세요',
                delay: 'delay-500',
              },
              {
                icon: RefreshCw,
                title: '자동 초기화',
                description: '매일 지정된 시각에 자동으로 리셋되어 항상 깔끔한 상태를 유지합니다',
                delay: 'delay-700',
              },
              {
                icon: Users,
                title: '초대 코드',
                description: '간단한 코드 하나로 팀원들을 쉽게 초대하고 참여할 수 있습니다',
                delay: 'delay-900',
              },
              {
                icon: BarChart3,
                title: '통계 대시보드',
                description: '인기 게임과 피크 시간을 분석하여 최적의 게임 시간을 찾아보세요',
                delay: 'delay-1100',
              },
            ].map((feature, idx) => (
              <Card
                key={idx}
                className={`bg-white/5 backdrop-blur-sm border border-white/10 hover:bg-white/10 transition-all duration-500 ${feature.delay} ${
                  isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
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

      {/* Demo Section */}
      <section className="relative px-4 py-20">
        <div className="max-w-6xl mx-auto">
          <div className={`text-center mb-16 transition-all duration-1000 delay-1300 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
            <h2 className="text-4xl md:text-5xl font-bold mb-4">실제 대시보드를 미리 체험해보세요</h2>
            <p className="text-xl text-muted-foreground">직관적인 인터페이스로 누구나 쉽게 사용할 수 있습니다</p>
          </div>
          <Card
            className={`bg-white/5 backdrop-blur-sm border border-white/10 overflow-hidden transition-all duration-1000 delay-1500 ${
              isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
            }`}
          >
            <CardContent className="p-8 flex justify-center">
              <Image
                src="/pic.png"
                alt="Dashboard Preview"
                width={800}
                height={450}
                className="rounded-xl object-cover"
              />
            </CardContent>
          </Card>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative px-4 py-20">
        <div className="max-w-4xl mx-auto text-center">
          <Card
            className={`bg-white/5 backdrop-blur-sm border border-white/10 overflow-hidden transition-all duration-1000 delay-1500 ${
              isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
            }`}
          >
            <CardContent className="p-12">
              <h2 className="text-4xl md:text-5xl font-bold mb-6 text-foreground">지금 바로 시작해보세요!</h2>
              <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
                GameSync와 함께 더 체계적이고 즐거운 게임 라이프를 경험해보세요. 무료로 시작할 수 있습니다.
              </p>
              <Link href="/auth/signup" passHref>
                <Button
                  size="lg"
                  className="px-12 py-4 text-xl font-semibold rounded-xl bg-[hsl(235,60%,58%)] hover:bg-[hsl(235,60%,54%)] text-white"
                >
                  무료로 시작하기
                  <ArrowRight className="w-6 h-6 ml-2" />
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  )
}
