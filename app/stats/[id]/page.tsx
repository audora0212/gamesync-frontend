"use client"

import { useState, useEffect } from "react"
import { useParams } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Navbar } from "@/components/navbar"
import { toast } from "sonner"
import { timetableService } from "@/lib/timetable-service"
import { Trophy, Clock, TrendingUp, Users } from "lucide-react"
import { useProtectedRoute } from "@/app/hooks/useProtectedRoute"

interface Stats {
  topGame: string
  avgSlot: string
  peakSlot: string
  peakCount: number
}

export default function StatsPage() {
  useProtectedRoute()
  const params = useParams()
  const serverId = Number.parseInt(params.id as string)
  const [stats, setStats] = useState<Stats | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    loadStats()
  }, [serverId])

  const loadStats = async () => {
    try {
      const data = await timetableService.getStats(serverId)
      setStats(data)
    } catch (error) {
      toast.error("통계 로드 실패", {
        description: "통계 정보를 불러오는데 실패했습니다.",
      })
    } finally {
      setIsLoading(false)
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen">
        <Navbar />
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center h-64">
            <div className="text-white">로딩 중...</div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen">
      <Navbar />
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">서버 통계</h1>
          <p className="text-white/70">게임 플레이 패턴과 인기 시간대를 확인하세요</p>
        </div>

        {stats ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card className="glass border-white/20">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-white/80">최다 플레이 게임</CardTitle>
                <Trophy className="h-4 w-4 text-yellow-400" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-white">{stats.topGame}</div>
                <p className="text-xs text-white/60">가장 인기 있는 게임</p>
              </CardContent>
            </Card>

            <Card className="glass border-white/20">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-white/80">평균 플레이 시간</CardTitle>
                <Clock className="h-4 w-4 text-blue-400" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-white">
                  {new Date(stats.avgSlot).toLocaleTimeString("ko-KR", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </div>
                <p className="text-xs text-white/60">평균적인 게임 시작 시간</p>
              </CardContent>
            </Card>

            <Card className="glass border-white/20">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-white/80">피크 시간대</CardTitle>
                <TrendingUp className="h-4 w-4 text-green-400" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-white">
                  {new Date(stats.peakSlot).toLocaleTimeString("ko-KR", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </div>
                <p className="text-xs text-white/60">가장 활발한 시간대</p>
              </CardContent>
            </Card>

            <Card className="glass border-white/20">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-white/80">피크 참여자 수</CardTitle>
                <Users className="h-4 w-4 text-purple-400" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-white">{stats.peakCount}명</div>
                <p className="text-xs text-white/60">최대 동시 참여자</p>
              </CardContent>
            </Card>
          </div>
        ) : (
          <div className="text-center py-12">
            <div className="glass-card max-w-md mx-auto">
              <h3 className="text-xl font-semibold text-white mb-2">통계 데이터 없음</h3>
              <p className="text-white/70">아직 충분한 데이터가 없습니다. 게임을 예약해보세요!</p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
