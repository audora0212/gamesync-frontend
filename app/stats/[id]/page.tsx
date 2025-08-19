"use client"

import { useState, useEffect, useMemo } from "react"
import { useParams, useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Navbar } from "@/components/navbar"
import { toast } from "sonner"
import { timetableService } from "@/lib/timetable-service"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip as ReTooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts"
import { Trophy, Clock, TrendingUp, Users, ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
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
  const router = useRouter()
  const [stats, setStats] = useState<Stats | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [entries, setEntries] = useState<Array<{ slot: string; gameName: string; user: string }>>([])

  useEffect(() => {
    loadAll()
  }, [serverId])

  const loadAll = async () => {
    try {
      const data = await timetableService.getStats(serverId)
      setStats(data)
      const list = await timetableService.getTimetable(serverId)
      setEntries(list)
    } catch (error) {
      toast.error("통계 로드 실패", {
        description: "통계 정보를 불러오는데 실패했습니다.",
      })
    } finally {
      setIsLoading(false)
    }
  }

  // 파생 데이터: 게임별 빈도, 시간대별 빈도
  const gameFreq = useMemo(() => {
    const map = new Map<string, number>()
    for (const e of entries) {
      map.set(e.gameName, (map.get(e.gameName) || 0) + 1)
    }
    return Array.from(map.entries()).map(([name, value]) => ({ name, value }))
  }, [entries])

  const hourlyFreq = useMemo(() => {
    const arr = Array.from({ length: 24 }, (_, h) => ({ hour: h, count: 0 }))
    for (const e of entries) {
      const d = new Date(e.slot)
      const h = d.getHours()
      arr[h].count += 1
    }
    return arr
  }, [entries])

  const userActivity = useMemo(() => {
    const map = new Map<string, number>()
    for (const e of entries) {
      map.set(e.user, (map.get(e.user) || 0) + 1)
    }
    return Array.from(map.entries())
      .map(([user, count]) => ({ user, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10)
  }, [entries])

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
        <div className="flex items-center justify-end mb-4">
          <Button size="sm" variant="outline" className="glass border-white/30 text-white hover:bg-black/10" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4 mr-1" /> 뒤로가기
          </Button>
        </div>
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

        {/* 그래프 섹션 */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 mt-8">
          {/* 게임별 분포 (파이차트) */}
          <Card className="glass border-white/20">
            <CardHeader className="pb-2">
              <CardTitle className="text-white text-base">게임별 예약 분포</CardTitle>
            </CardHeader>
            <CardContent className="h-72">
              {gameFreq.length === 0 ? (
                <div className="text-white/60">데이터 없음</div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={gameFreq} dataKey="value" nameKey="name" label outerRadius={90}>
                      {gameFreq.map((_, i) => (
                        <Cell key={i} fill={["#60a5fa", "#34d399", "#a78bfa", "#fb923c", "#f472b6", "#22d3ee"][i % 6]} />
                      ))}
                    </Pie>
                    <Legend />
                    <ReTooltip />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>

          {/* 시간대별 예약 수 (라인차트) */}
          <Card className="glass border-white/20">
            <CardHeader className="pb-2">
              <CardTitle className="text-white text-base">시간대별 예약 수</CardTitle>
            </CardHeader>
            <CardContent className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={hourlyFreq} margin={{ left: 8, right: 16, top: 10, bottom: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#ffffff20" />
                  <XAxis dataKey="hour" stroke="#ffffff80" tickFormatter={(h)=>String(h).padStart(2,'0')} />
                  <YAxis stroke="#ffffff80" />
                  <ReTooltip />
                  <Line type="monotone" dataKey="count" stroke="#60a5fa" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* 상위 활동 유저 (막대차트) */}
          <Card className="glass border-white/20 xl:col-span-2">
            <CardHeader className="pb-2">
              <CardTitle className="text-white text-base">상위 활동 유저 Top 10</CardTitle>
            </CardHeader>
            <CardContent className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={userActivity} layout="vertical" margin={{ left: 32, right: 16, top: 10, bottom: 10 }}>
                  <CartesianGrid horizontal={false} stroke="#ffffff20" />
                  <XAxis type="number" stroke="#ffffff80" />
                  <YAxis type="category" dataKey="user" stroke="#ffffff80" width={100} />
                  <ReTooltip />
                  <Bar dataKey="count" fill="#34d399" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
