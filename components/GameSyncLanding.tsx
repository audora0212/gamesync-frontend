// components/GameSyncLanding.tsx
'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
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
    <div className="min-h-screen bg-gradient-to-br from-[#4B0082] via-[#1E3A8A] to-[#312E81] text-white font-['Inter'] overflow-x-hidden">
      {/* Header */}
      <header className="relative z-50 px-4 py-6">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-white/10 backdrop-blur-sm border border-white/20">
              <Gamepad2 className="w-6 h-6 text-white" />
            </div>
            <span className="text-2xl font-bold">GameSync</span>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/auth/login" passHref>
              <Button variant="ghost" className="text-white hover:bg-white/10 backdrop-blur-sm border border-white/20">
                로그인
              </Button>
            </Link>
            <Link href="/auth/signup" passHref>
              <Button className="bg-white/20 hover:bg-white/30 backdrop-blur-sm border border-white/30 text-white">
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
            <Badge className="mb-6 bg-white/10 backdrop-blur-sm border border-white/20 text-white hover:bg-white/20">
              <Zap className="w-4 h-4 mr-2" />
              새로운 게임 예약 플랫폼
            </Badge>
            <h1 className="text-5xl md:text-7xl font-bold mb-6 leading-tight">
              팀원들과 간편하게
              <br />
              <span className="bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                게임 시간을 예약하세요
              </span>
            </h1>
            <p className="text-xl md:text-2xl text-white/80 mb-8 max-w-2xl mx-auto leading-relaxed">
              GameSync는 일정 공유, 초대 코드, 자동 초기화 기능을 제공하여 팀 게임을 더욱 쉽게 만들어줍니다.
            </p>
            <Button
              size="lg"
              className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white px-8 py-4 text-lg font-semibold rounded-xl shadow-2xl hover:shadow-blue-500/25 transition-all duration-300 transform hover:scale-105"
            >
              지금 시작하기
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="relative px-4 py-20">
        <div className="max-w-6xl mx-auto">
          <div className={`text-center mb-16 transition-all duration-1000 delay-300 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
            <h2 className="text-4xl md:text-5xl font-bold mb-4">왜 GameSync를 사용하나요?</h2>
            <p className="text-xl text-white/70 max-w-2xl mx-auto">
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
                className={`bg-white/10 backdrop-blur-sm border border-white/20 hover:bg-white/20 transition-all duration-500 hover:scale-105 hover:shadow-2xl hover:shadow-blue-500/10 ${feature.delay} ${
                  isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
                }`}
              >
                <CardContent className="p-6 text-center">
                  <div className="mb-4 p-3 rounded-xl bg-gradient-to-br from-blue-500/20 to-purple-600/20 w-fit mx-auto">
                    <feature.icon className="w-8 h-8 text-blue-300" />
                  </div>
                  <h3 className="text-xl font-semibold mb-3 text-white">{feature.title}</h3>
                  <p className="text-white/70 leading-relaxed">{feature.description}</p>
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
            <p className="text-xl text-white/70">직관적인 인터페이스로 누구나 쉽게 사용할 수 있습니다</p>
          </div>
          <Card
            className={`bg-white/5 backdrop-blur-sm border border-white/20 overflow-hidden transition-all duration-1000 delay-1500 ${
              isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
            }`}
          >
            <CardContent className="p-8">
              <div className="bg-gradient-to-br from-slate-900/50 to-slate-800/50 rounded-xl p-6 min-h-[400px] flex items-center justify-center">
                <div className="text-center">
                  <div className="mb-6 p-4 rounded-full bg-white/10 w-fit mx-auto">
                    <Gamepad2 className="w-12 h-12 text-blue-300" />
                  </div>
                  <h3 className="text-2xl font-semibold mb-4">대시보드 미리보기</h3>
                  <p className="text-white/70 mb-6 leading-relaxed">
                    실시간 게임 일정, 팀원 현황, 통계 등을 한눈에 확인할 수 있는
                    <br />
                    직관적인 대시보드를 제공합니다
                  </p>
                  <div className="flex items-center justify-center gap-4 text-sm text-white/60">
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4" />
                      실시간 업데이트
                    </div>
                    <div className="flex items-center gap-2">
                      <Users className="w-4 h-4" />
                      팀원 관리
                    </div>
                    <div className="flex items-center gap-2">
                      <BarChart3 className="w-4 h-4" />
                      상세 통계
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>



{/* CTA Section */}
<section className="relative px-4 py-20">
  <div className="max-w-4xl mx-auto text-center">
    <Card
      className={`bg-gradient-to-br from-purple-700/30 via-blue-800/30 to-indigo-900/30 backdrop-blur-sm border border-white/10 transition-all duration-1000 delay-2500 ${
        isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
      }`}
    >
      <CardContent className="p-12">
        <h2 className="text-4xl md:text-5xl font-bold mb-6 text-white">
          지금 바로 시작해보세요!
        </h2>
        <p className="text-xl text-white/80 mb-8 max-w-2xl mx-auto">
          GameSync와 함께 더 체계적이고 즐거운 게임 라이프를 경험해보세요. 무료로 시작할 수 있습니다.
        </p>
        <Link href="/auth/signup" passHref>
          <Button
            size="lg"
            className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-12 py-4 text-xl font-semibold rounded-xl shadow-lg hover:shadow-indigo-800/50 transition-all duration-300 transform hover:scale-105"
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
