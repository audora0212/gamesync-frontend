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
      <div className="min-h-screen bg-background flex flex-col">
        {/* 배경 효과 */}
        <div className="fixed inset-0 overflow-hidden pointer-events-none">
          <div className="absolute inset-0 bg-[linear-gradient(rgba(5,242,219,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(5,242,219,0.03)_1px,transparent_1px)] bg-[size:50px_50px]" />
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-neon-cyan/10 rounded-full blur-[150px]" />
          <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-neon-magenta/10 rounded-full blur-[150px]" />
        </div>
        <Navbar />
        <div className="flex-1 container mx-auto px-4 py-8 z-10">
          <div className="flex flex-col items-center justify-center h-64 gap-4">
            <div className="w-10 h-10 border-2 border-neon-cyan border-t-transparent rounded-full animate-spin shadow-[0_0_15px_rgba(5,242,219,0.5)]" />
            <p className="text-neon-cyan/80 text-sm font-medium">로딩 중...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* 배경 효과 */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute inset-0 bg-[linear-gradient(rgba(5,242,219,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(5,242,219,0.03)_1px,transparent_1px)] bg-[size:50px_50px]" />
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-neon-magenta/10 rounded-full blur-[150px]" />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-neon-cyan/10 rounded-full blur-[150px]" />
      </div>

      <Navbar />

      <main className="flex-1 container mx-auto px-4 py-8 z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-neon-magenta/20 shadow-[0_0_15px_rgba(217,4,142,0.2)]">
                <BarChart3 className="w-6 h-6 text-neon-magenta" />
              </div>
              <h1 className="text-3xl font-display font-bold text-neon-magenta drop-shadow-[0_0_10px_rgba(217,4,142,0.5)]">서버 통계</h1>
            </div>
            <Button variant="outline" onClick={() => router.back()}>
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
            <h2 className="text-xl font-semibold text-neon-cyan drop-shadow-[0_0_10px_rgba(5,242,219,0.5)] mb-3 flex items-center gap-2">
              <TrendingUp className="w-5 h-5" />
              오늘의 통계
            </h2>
          </div>
          {today ? (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 md:gap-6">
              <Card className="min-w-[240px] shrink-0 md:min-w-0">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-foreground/80">최다 플레이 예약</CardTitle>
                  <div className="p-2 rounded-lg bg-neon-yellow/20">
                    <Trophy className="h-4 w-4 text-neon-yellow" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-neon-yellow">{today.topGame || "데이터 없음"}</div>
                  <p className="text-xs text-muted-foreground">가장 인기 있는 게임</p>
                </CardContent>
              </Card>

              <Card className="min-w-[240px] shrink-0 md:min-w-0">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-foreground/80">접속 시간 평균</CardTitle>
                  <div className="p-2 rounded-lg bg-neon-cyan/20">
                    <Clock className="h-4 w-4 text-neon-cyan" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-neon-cyan drop-shadow-[0_0_10px_rgba(5,242,219,0.5)]">{toTime(today.avgMinuteOfDay)}</div>
                  <p className="text-xs text-muted-foreground">오늘 평균 접속 시간</p>
                </CardContent>
              </Card>

              <Card className="min-w-[240px] shrink-0 md:min-w-0">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-foreground/80">피크 참여자 수</CardTitle>
                  <div className="p-2 rounded-lg bg-neon-magenta/20">
                    <Users className="h-4 w-4 text-neon-magenta" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-neon-magenta drop-shadow-[0_0_10px_rgba(217,4,142,0.5)]">{today.peakHourCount}명</div>
                  <p className="text-xs text-muted-foreground">피크 시간대 {String(today.peakHour).padStart(2,'0')}:00</p>
                </CardContent>
              </Card>
            </div>
          ) : (
            <div className="text-center py-12">
              <Card className="max-w-md mx-auto p-8">
                <h3 className="text-xl font-semibold text-neon-cyan drop-shadow-[0_0_10px_rgba(5,242,219,0.5)] mb-2">통계 데이터 없음</h3>
                <p className="text-muted-foreground">아직 충분한 데이터가 없습니다. 게임을 예약해보세요!</p>
              </Card>
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
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-neon-cyan text-base">오늘 시간대별 유저 수 (누적)</CardTitle>
            </CardHeader>
            <CardContent className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={cumulativeHourly} margin={{ left: 8, right: 16, top: 10, bottom: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(5,242,219,0.1)" />
                  <XAxis dataKey="hour" stroke="rgba(255,255,255,0.5)" tickFormatter={(h)=>String(h).padStart(2,'0')} />
                  <YAxis stroke="rgba(255,255,255,0.5)" allowDecimals={false} ticks={yTicks} domain={[0, (dataMax) => Math.max(dataMax || 0, 0)]} />
                  <ReTooltip contentStyle={{ backgroundColor: 'rgba(26, 31, 46, 0.95)', border: '1px solid rgba(5, 242, 219, 0.3)', borderRadius: '8px' }} />
                  <Line type="monotone" dataKey="count" stroke="#05F2DB" strokeWidth={2} dot={false} />
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
            <h2 className="text-xl font-semibold text-neon-pink drop-shadow-[0_0_10px_rgba(242,5,203,0.5)] mb-3 flex items-center gap-2">
              <BarChart3 className="w-5 h-5" />
              주간 통계
            </h2>
          </div>
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-neon-green text-base">가장 자주 접속한 유저 (Top 3)</CardTitle>
              </CardHeader>
              <CardContent className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={topUsersData} margin={{ left: 8, right: 16, top: 10, bottom: 10 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,255,136,0.1)" />
                    <XAxis dataKey="name" stroke="rgba(255,255,255,0.5)" interval={0} angle={-15} height={50} />
                    <YAxis stroke="rgba(255,255,255,0.5)" domain={[0,7]} />
                    <ReTooltip contentStyle={{ backgroundColor: 'rgba(26, 31, 46, 0.95)', border: '1px solid rgba(0,255,136, 0.3)', borderRadius: '8px' }} />
                    <Bar dataKey="count" fill="#00FF88" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-neon-pink text-base">요일별 평균 접속 시간대</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-2 text-foreground text-sm">
                  <div className="font-semibold text-neon-pink">요일</div>
                  <div className="font-semibold text-neon-pink">평균 시간</div>
                  <div className="font-semibold text-neon-pink">샘플 수</div>
                  {dowAvgData.map((r, idx) => (
                    <div key={`row-${idx}`} className="contents">
                      <div className="text-foreground/90">{r.dow}</div>
                      <div className="text-neon-cyan font-mono">{r.time}</div>
                      <div className="text-foreground/90">{r.samples}</div>
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
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-neon-magenta drop-shadow-[0_0_10px_rgba(217,4,142,0.5)] text-base">요일별 플레이된 게임</CardTitle>
            </CardHeader>
            <CardContent className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={dowGamesData} margin={{ left: 8, right: 16, top: 10, bottom: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(217,4,142,0.1)" />
                  <XAxis dataKey="dow" stroke="rgba(255,255,255,0.5)" />
                  <YAxis stroke="rgba(255,255,255,0.5)" />
                  <Legend />
                  <ReTooltip contentStyle={{ backgroundColor: 'rgba(26, 31, 46, 0.95)', border: '1px solid rgba(217, 4, 142, 0.3)', borderRadius: '8px' }} />
                  {gameKeys.map((k, i) => (
                    <Bar key={k} dataKey={k} stackId="g" fill={["#05F2DB", "#00FF88", "#D9048E", "#FFD700", "#F205CB", "#60a5fa", "#f59e0b", "#10b981"][i % 8]} radius={i === gameKeys.length - 1 ? [4, 4, 0, 0] : [0, 0, 0, 0]} />
                  ))}
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </motion.div>
      </main>
    </div>
  )
}
