"use client"

import type React from "react"
import { useState, useEffect, useMemo } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectGroup,
  SelectLabel,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"
import { timetableService } from "@/lib/timetable-service"
import { gameService } from "@/lib/game-service"
import { Calendar, Clock, Filter, Users, GamepadIcon } from "lucide-react"

interface TimetableEntry {
  id: number
  user: string
  slot: string
  gameId: number
  gameName: string
  custom: boolean
}

interface Game {
  id: number
  name: string
}

interface TimetableViewProps {
  serverId: number
}

interface UserSchedule {
  user: string
  joinTime: number // 시간 (0-23)
  gameName: string
  custom: boolean
  entry: TimetableEntry
}

export function TimetableView({ serverId }: TimetableViewProps) {
  const today = new Date().toLocaleDateString("en-CA");
  const [entries, setEntries] = useState<TimetableEntry[]>([])
  const [defaultGames, setDefaultGames] = useState<Game[]>([])
  const [customGames, setCustomGames] = useState<Game[]>([])
  const [selectedDate, setSelectedDate] = useState<string>(today)
  const [selectedTime, setSelectedTime] = useState<string>("")
  const [selectedGame, setSelectedGame] = useState<string>("")
  const [gameFilter, setGameFilter] = useState<string>("")
  const [sortByGame, setSortByGame] = useState<boolean>(false)
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const [hoveredUser, setHoveredUser] = useState<string | null>(null)

  // 사용자별 스케줄 데이터 처리
  const userSchedules = useMemo(() => {
    const schedules: UserSchedule[] = entries.map((entry) => {
      const date = new Date(entry.slot)
      const joinTime = date.getHours()
      return {
        user: entry.user,
        joinTime,
        gameName: entry.gameName,
        custom: entry.custom,
        entry,
      }
    })

    // 합류 시간 순으로 정렬
    return schedules.sort((a, b) => a.joinTime - b.joinTime)
  }, [entries])

  // 시간 배열 생성 (0-23)
  const hours = Array.from({ length: 24 }, (_, i) => i)

  useEffect(() => {
    loadData()
  }, [serverId])

  useEffect(() => {
    loadTimetable()
  }, [gameFilter, sortByGame])

  const loadData = async () => {
    try {
      const [defaultData, customData] = await Promise.all([
        gameService.getDefaultGames(),
        gameService.getCustomGames(serverId),
      ])
      setDefaultGames(defaultData.defaultGames)
      setCustomGames(customData.customGames)
      await loadTimetable()
    } catch {
      toast.error("데이터 로드 실패", { description: "데이터를 불러오는데 실패했습니다." })
    } finally {
      setIsLoading(false)
    }
  }

  const loadTimetable = async () => {
    try {
      const data = await timetableService.getTimetable(serverId, gameFilter, sortByGame)
      setEntries(data)
    } catch {
      toast.error("타임테이블 로드 실패", { description: "타임테이블을 불러오는데 실패했습니다." })
    }
  }

  const handleAddEntry = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedDate || !selectedTime || !selectedGame) {
      toast.error("입력 오류", { description: "모든 필드를 입력해주세요." })
      return
    }

    const slot = `${selectedDate}T${selectedTime}:00`
    const [gameType, gameId] = selectedGame.split("-")

    try {
      await timetableService.addEntry({
        serverId,
        slot,
        defaultGameId: gameType === "default" ? Number(gameId) : undefined,
        customGameId: gameType === "custom" ? Number(gameId) : undefined,
      })
      await loadTimetable()
      setSelectedDate(today)
      setSelectedTime("")
      setSelectedGame("")
      toast.success("예약 완료", { description: "게임이 예약되었습니다." })
    } catch {
      toast.error("예약 실패", { description: "게임 예약 중 오류가 발생했습니다." })
    }
  }

  const formatDateTime = (dateTime: string) => {
    return new Date(dateTime).toLocaleString("ko-KR", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  // 특정 시간에 해당 사용자가 온라인인지 확인
  const isUserOnlineAtHour = (schedule: UserSchedule, hour: number) => {
    return hour >= schedule.joinTime
  }

  // 사용자별 색상 생성 (랜덤)
  const getUserColor = (user: string, custom: boolean) => {
    const colors = [
      "from-blue-500/60 to-blue-600/40 border-blue-400/60",
      "from-green-500/60 to-green-600/40 border-green-400/60",
      "from-purple-500/60 to-purple-600/40 border-purple-400/60",
      "from-orange-500/60 to-orange-600/40 border-orange-400/60",
      "from-pink-500/60 to-pink-600/40 border-pink-400/60",
      "from-cyan-500/60 to-cyan-600/40 border-cyan-400/60",
      "from-red-500/60 to-red-600/40 border-red-400/60",
      "from-indigo-500/60 to-indigo-600/40 border-indigo-400/60",
    ]

    const hash = user.split("").reduce((a, b) => {
      a = (a << 5) - a + b.charCodeAt(0)
      return a & a
    }, 0)

    return colors[Math.abs(hash) % colors.length]
  }

  if (isLoading) {
    return (
      <Card className="glass border-white/20 h-full">
        <CardHeader>
          <CardTitle className="text-white flex items-center">
            <Calendar className="mr-2 h-5 w-5 text-white" />
            타임테이블
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-white/70">로딩 중...</div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="glass border-white/20 h-full">
      <CardHeader>
        <CardTitle className="text-white flex items-center">
          <Calendar className="mr-2 h-5 w-5 text-white" />
          합류 시간표
        </CardTitle>
        <CardDescription className="text-white/70">
          친구들이 언제 합류하는지 확인하고 새로운 예약을 추가하세요
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* 디스코드 합류 시간표 시각화 */}
        {userSchedules.length > 0 && (
          <div className="glass rounded-lg p-6">
            <h3 className="text-white font-medium mb-6 flex items-center">
              <Users className="mr-2 h-5 w-5" />
              오늘의 합류 예정 ({userSchedules.length}명)
            </h3>

            <div className="space-y-4">
              {/* 시간 헤더 */}
              <div className="flex items-center border-b border-white/20 pb-3">
                <div className="w-48 text-sm text-white/80 font-medium">사용자 / 게임</div>
                <div className="flex-1 flex">
                  {hours.map((hour) => (
                    <div key={hour} className="flex-1 text-center">
                      <div className="text-xs text-white/60 font-medium">{hour.toString().padStart(2, "0")}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* 사용자별 스케줄 */}
              <div className="space-y-3">
                {userSchedules.map((schedule, index) => (
                  <div
                    key={`${schedule.user}-${schedule.entry.id}`}
                    className="flex items-center group"
                    onMouseEnter={() => setHoveredUser(schedule.user)}
                    onMouseLeave={() => setHoveredUser(null)}
                  >
                    {/* 사용자 정보 */}
                    <div className="w-48 pr-4">
                      <div className="text-white font-medium text-sm mb-1">{schedule.user}</div>
                      <div className="flex items-center gap-2">
                        <GamepadIcon className="h-3 w-3 text-white/60 flex-shrink-0" />
                        <span className="text-xs text-white/70 truncate">{schedule.gameName}</span>
                        <Badge
                          variant={schedule.custom ? "secondary" : "default"}
                          className="text-xs px-1.5 py-0.5 bg-white/10 text-white/80 border-white/20"
                        >
                          {schedule.custom ? "커스텀" : "기본"}
                        </Badge>
                      </div>
                    </div>

                    {/* 시간 바 */}
                    <div className="flex-1 flex h-10 gap-px">
                      {hours.map((hour) => (
                        <div
                          key={hour}
                          className={`flex-1 relative transition-all duration-300 ${
                            isUserOnlineAtHour(schedule, hour)
                              ? `bg-gradient-to-r ${getUserColor(schedule.user, schedule.custom)} border ${
                                  hoveredUser === schedule.user ? "scale-y-110 brightness-125" : ""
                                }`
                              : "bg-white/5 border border-white/10"
                          } ${
                            hour === schedule.joinTime
                              ? "rounded-l-md border-l-2"
                              : hour === 23 && isUserOnlineAtHour(schedule, hour)
                                ? "rounded-r-md border-r-2"
                                : ""
                          }`}
                        >
                          {hour === new Date().getHours() && (
                            <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-0.5 h-full bg-red-400 opacity-80" />
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              {/* 범례 */}
              <div className="mt-6 pt-4 border-t border-white/20">
                <div className="flex items-center gap-6 text-xs text-white/60">

                  <div className="flex items-center gap-2">
                    <div className="w-6 h-3 bg-gradient-to-r from-blue-500/60 to-blue-600/40 rounded" />
                    <span>온라인 시간</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-0.5 h-4 bg-red-400" />
                    <span>현재 시간</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 예약 추가 폼 */}
        <form onSubmit={handleAddEntry} className="space-y-4 p-4 glass rounded-lg">
          <h3 className="text-white font-medium">새 합류 시간 예약</h3>
          <div className="grid grid-cols-2 gap-3">
            <Input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="glass border-white/30 text-white"
              disabled
            />
            <Input
              type="time"
              value={selectedTime}
              onChange={(e) => setSelectedTime(e.target.value)}
              className="glass border-white/30 text-white"
              required
            />
          </div>
          <Select value={selectedGame} onValueChange={setSelectedGame} defaultValue="">
            <SelectTrigger className="glass border-white/30 text-white">
              <SelectValue placeholder="게임 선택" />
            </SelectTrigger>
            <SelectContent className="glass border-white/20 text-white">
              <SelectGroup>
                <SelectLabel>기본 게임</SelectLabel>
                {defaultGames.map((game) => (
                  <SelectItem key={`default-${game.id}`} value={`default-${game.id}`}>
                    {`${game.name} (기본)`}
                  </SelectItem>
                ))}
              </SelectGroup>
              <SelectGroup>
                <SelectLabel>커스텀 게임</SelectLabel>
                {customGames.map((game) => (
                  <SelectItem key={`custom-${game.id}`} value={`custom-${game.id}`}>
                    {`${game.name} (커스텀)`}
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>
          <Button type="submit" className="w-full glass-button text-white hover:bg-black/10">
            합류 시간 예약
          </Button>
        </form>

        {/* 필터 및 정렬 */}
        <div className="flex gap-3">
          <Input
            placeholder="게임 이름으로 필터"
            value={gameFilter}
            onChange={(e) => setGameFilter(e.target.value)}
            className="glass border-white/30 text-white placeholder:text-white/50"
          />
          <Button
            onClick={() => setSortByGame(!sortByGame)}
            variant="outline"
            className={`glass border-white/30 text-white hover:bg-black/10 ${sortByGame ? "bg-white/10" : ""}`}
          >
            <Filter className="mr-2 h-4 w-4 text-white " />
            게임순
          </Button>
        </div>

        {/* 타임테이블 엔트리 */}
        <div className="space-y-3 max-h-96 overflow-y-auto">
          {entries.map((entry) => (
            <div key={entry.id} className="p-3 glass rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-2">
                  <Clock className="h-4 w-4 text-white/60" />
                  <span className="text-white font-medium">{formatDateTime(entry.slot)}</span>
                </div>
                <Badge variant={entry.custom ? "secondary" : "default"} className="glass text-white hover:bg-black/10">
                  {entry.custom ? "커스텀" : "기본"}
                </Badge>
              </div>
              <div className="text-white/80 text-sm">
                <div>게임: {entry.gameName}</div>
                <div>플레이어: {entry.user}</div>
              </div>
            </div>
          ))}
          {entries.length === 0 && <div className="text-center py-8 text-white/60">예약된 게임이 없습니다.</div>}
        </div>
      </CardContent>
    </Card>
  )
}
