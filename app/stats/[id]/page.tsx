"use client"

import { useState, useEffect, useMemo } from "react"
import { useParams, useRouter } from "next/navigation"
import { motion } from "framer-motion"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Navbar } from "@/components/navbar"
import { toast } from "sonner"
import { getTodayStats, getWeeklyStats, TodayStatsResponse, WeeklyStatsResponse } from "@/lib/server-service"
import { BarChart, Bar, XAxis, YAxis, Tooltip as ReTooltip, ResponsiveContainer, LineChart, Line, CartesianGrid, Legend } from "recharts"
import { Trophy, Clock, Users, ArrowLeft, BarChart3, TrendingUp } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useProtectedRoute } from "@/app/hooks/useProtectedRoute"

// reworked to today/weekly

export default function StatsPage() {
  useProtectedRoute()
  const params = useParams()
  const serverId = Number.parseInt(params.id as string)
  const router = useRouter()
  const [today, setToday] = useState<TodayStatsResponse | null>(null)
  const [weekly, setWeekly] = useState<WeeklyStatsResponse | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    loadAll()
  }, [serverId])

  const loadAll = async () => {
    try {
      const [t, w] = await Promise.all([
        getTodayStats(serverId),
        getWeeklyStats(serverId),
      ])
      setToday(t)
      setWeekly(w)
    } catch (error) {
      toast.error("통계 로드 실패", {
        description: "통계 정보를 불러오는데 실패했습니다.",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const toTime = (minutes: number) => {
    const h = Math.floor(minutes / 60)
    const m = minutes % 60
    return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`
  }
  const dowName = (d: number) => ["", "월", "화", "수", "목", "금", "토", "일"][d] || String(d)

  const topUsersData = useMemo(() => {
    if (!weekly) return []
    return weekly.topUsers.map(u => ({ name: u.nickname || `유저 ${u.userId}`, count: u.count }))
  }, [weekly])

  const dowAvgData = useMemo(() => {
    if (!weekly) return []
    return weekly.dowAvg.map(d => ({ dow: dowName(d.dow), time: toTime(d.avgMinuteOfDay), samples: d.sampleCount }))
  }, [weekly])

  const { dowGamesData, gameKeys } = useMemo(() => {
    if (!weekly) return { dowGamesData: [] as any[], gameKeys: [] as string[] }
    const gameSet = new Set<string>()
    weekly.dowGames.forEach(g => g.items.forEach(it => gameSet.add(it.name)))
    const keys = Array.from(gameSet)
    const data = Array.from({ length: 7 }, (_, i) => {
      const dow = i + 1
      const label = dowName(dow)
      const found = weekly.dowGames.find(d => d.dow === dow)
      const row: Record<string, any> = { dow: label }
      if (found) {
        for (const k of keys) {
          const item = found.items.find(it => it.name === k)
          row[k] = item ? item.count : 0
        }
      } else {
        for (const k of keys) row[k] = 0
      }
      return row
    })
    return { dowGamesData: data, gameKeys: keys }
  }, [weekly])

  // 오늘: 시간대별 누적 유저 수 데이터 및 Y축 ticks(1단위)
  const { cumulativeHourly, yTicks } = useMemo(() => {
    const src = today?.hourlyCounts || []
    let cum = 0
    const data = src.map((p) => {
      cum += (p.count || 0)
      return { hour: p.hour, count: cum }
    })
    const max = data.reduce((m, p) => Math.max(m, p.count || 0), 0)
    const ticks = Array.from({ length: max + 1 }, (_, i) => i)
    return { cumulativeHourly: data, yTicks: ticks }
  }, [today])

  if (isLoading) {
    return (
      <div className="min-h-screen grid-bg">
        <Navbar />
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center h-64">
            <div className="text-muted-foreground">로딩 중...</div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen grid-bg">
      <Navbar />
      <div className="container mx-auto px-4 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-purple-500/20">
                <BarChart3 className="w-6 h-6 text-purple-400" />
              </div>
              <h1 className="text-3xl font-bold neon-text-purple">서버 통계</h1>
            </div>
            <Button className="btn-cyber-outline text-sm px-4 py-2" onClick={() => router.back()}>
              <ArrowLeft className="h-4 w-4 mr-2" /> 뒤로가기
            </Button>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <div className="mb-3">
            <h2 className="text-xl font-semibold text-emerald-400 mb-3 flex items-center gap-2">
              <TrendingUp className="w-5 h-5" />
              오늘의 통계
            </h2>
          </div>
          {today ? (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 md:gap-6">
              <Card className="card-cyber hover-lift min-w-[240px] shrink-0 md:min-w-0">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-white/80">최다 플레이 예약</CardTitle>
                  <div className="p-2 rounded-lg bg-yellow-500/20">
                    <Trophy className="h-4 w-4 text-yellow-400" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-yellow-400">{today.topGame || "데이터 없음"}</div>
                  <p className="text-xs text-white/60">가장 인기 있는 게임</p>
                </CardContent>
              </Card>

              <Card className="card-cyber hover-lift min-w-[240px] shrink-0 md:min-w-0">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-white/80">접속 시간 평균</CardTitle>
                  <div className="p-2 rounded-lg bg-cyan-500/20">
                    <Clock className="h-4 w-4 text-cyan-400" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold neon-text-primary">{toTime(today.avgMinuteOfDay)}</div>
                  <p className="text-xs text-white/60">오늘 평균 접속 시간</p>
                </CardContent>
              </Card>

              <Card className="card-cyber hover-lift min-w-[240px] shrink-0 md:min-w-0">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-white/80">피크 참여자 수</CardTitle>
                  <div className="p-2 rounded-lg bg-purple-500/20">
                    <Users className="h-4 w-4 text-purple-400" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold neon-text-purple">{today.peakHourCount}명</div>
                  <p className="text-xs text-white/60">피크 시간대 {String(today.peakHour).padStart(2,'0')}:00</p>
                </CardContent>
              </Card>
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="card-cyber max-w-md mx-auto p-8">
                <h3 className="text-xl font-semibold neon-text-primary mb-2">통계 데이터 없음</h3>
                <p className="text-white/70">아직 충분한 데이터가 없습니다. 게임을 예약해보세요!</p>
              </div>
            </div>
          )}
        </motion.div>

        {/* 오늘: 시간대별 유저 수(누적) */}
        <motion.div
          className="grid grid-cols-1 gap-6 mt-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <Card className="card-cyber">
            <CardHeader className="pb-2">
              <CardTitle className="text-cyan-400 text-base">오늘 시간대별 유저 수 (누적)</CardTitle>
            </CardHeader>
            <CardContent className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={cumulativeHourly} margin={{ left: 8, right: 16, top: 10, bottom: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#22d3ee20" />
                  <XAxis dataKey="hour" stroke="#ffffff80" tickFormatter={(h)=>String(h).padStart(2,'0')} />
                  <YAxis stroke="#ffffff80" allowDecimals={false} ticks={yTicks} domain={[0, (dataMax) => Math.max(dataMax || 0, 0)]} />
                  <ReTooltip contentStyle={{ backgroundColor: 'rgba(15, 23, 42, 0.9)', border: '1px solid rgba(34, 211, 238, 0.3)', borderRadius: '8px' }} />
                  <Line type="monotone" dataKey="count" stroke="#22d3ee" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </motion.div>

        {/* 주간 통계 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          <div className="mt-10 mb-3">
            <h2 className="text-xl font-semibold neon-text-accent mb-3 flex items-center gap-2">
              <BarChart3 className="w-5 h-5" />
              주간 통계
            </h2>
          </div>
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            <Card className="card-cyber hover-lift">
              <CardHeader className="pb-2">
                <CardTitle className="text-emerald-400 text-base">가장 자주 접속한 유저 (Top 3)</CardTitle>
              </CardHeader>
              <CardContent className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={topUsersData} margin={{ left: 8, right: 16, top: 10, bottom: 10 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#34d39920" />
                    <XAxis dataKey="name" stroke="#ffffff80" interval={0} angle={-15} height={50} />
                    <YAxis stroke="#ffffff80" domain={[0,7]} />
                    <ReTooltip contentStyle={{ backgroundColor: 'rgba(15, 23, 42, 0.9)', border: '1px solid rgba(52, 211, 153, 0.3)', borderRadius: '8px' }} />
                    <Bar dataKey="count" fill="#34d399" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card className="card-cyber hover-lift">
              <CardHeader className="pb-2">
                <CardTitle className="text-pink-400 text-base">요일별 평균 접속 시간대</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-2 text-white text-sm">
                  <div className="font-semibold text-pink-400">요일</div>
                  <div className="font-semibold text-pink-400">평균 시간</div>
                  <div className="font-semibold text-pink-400">샘플 수</div>
                  {dowAvgData.map((r, idx) => (
                    <div key={`row-${idx}`} className="contents">
                      <div className="text-white/90">{r.dow}</div>
                      <div className="text-cyan-400 font-mono">{r.time}</div>
                      <div className="text-white/90">{r.samples}</div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </motion.div>

        <motion.div
          className="grid grid-cols-1 gap-6 mt-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
        >
          <Card className="card-cyber">
            <CardHeader className="pb-2">
              <CardTitle className="neon-text-purple text-base">요일별 플레이된 게임</CardTitle>
            </CardHeader>
            <CardContent className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={dowGamesData} margin={{ left: 8, right: 16, top: 10, bottom: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#c084fc20" />
                  <XAxis dataKey="dow" stroke="#ffffff80" />
                  <YAxis stroke="#ffffff80" />
                  <Legend />
                  <ReTooltip contentStyle={{ backgroundColor: 'rgba(15, 23, 42, 0.9)', border: '1px solid rgba(192, 132, 252, 0.3)', borderRadius: '8px' }} />
                  {gameKeys.map((k, i) => (
                    <Bar key={k} dataKey={k} stackId="g" fill={["#22d3ee", "#34d399", "#c084fc", "#fb923c", "#f472b6", "#60a5fa", "#f59e0b", "#10b981"][i % 8]} radius={i === gameKeys.length - 1 ? [4, 4, 0, 0] : [0, 0, 0, 0]} />
                  ))}
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  )
}
