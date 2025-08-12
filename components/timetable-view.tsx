// components/TimetableView.tsx
"use client"

import React, { useState, useEffect, useMemo } from "react"
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
import { serverService } from "@/lib/server-service"
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
  const today = new Date().toLocaleDateString("en-CA")
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
  const [resetHour, setResetHour] = useState<number | null>(null)

  // 30분 단위 시간 옵션 생성
  const timeOptions = useMemo(() => {
    const times: string[] = []
    for (let h = 0; h < 24; h++) {
      const hour = h.toString().padStart(2, "0")
      times.push(`${hour}:00`)
      times.push(`${hour}:30`)
    }
    return times
  }, [])

  // 사용자별 스케줄 데이터 처리 (게임별로 묶고, 게임 내에서는 시간 순)
  const userSchedules = useMemo(() => {
    const schedulesRaw: UserSchedule[] = entries.map((entry) => {
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

    // 1) 시간 순으로 한 번 정렬
    const sortedByTime = [...schedulesRaw].sort((a, b) => a.joinTime - b.joinTime)

    // 2) 최초 등장 순서대로 게임 그룹 순서를 결정
    const gameOrder: string[] = []
    for (const s of sortedByTime) {
      if (!gameOrder.includes(s.gameName)) gameOrder.push(s.gameName)
    }

    // 3) 각 게임 그룹별로 시간 순 정렬을 유지한 채로 이어붙이기
    const grouped = gameOrder.flatMap((game) => sortedByTime.filter((s) => s.gameName === game))

    return grouped
  }, [entries])

  const hours = Array.from({ length: 24 }, (_, i) => i)

  useEffect(() => { loadData() }, [serverId])
  useEffect(() => { loadTimetable() }, [gameFilter, sortByGame])

  const loadData = async () => {
    try {
      const [defaultData, customData] = await Promise.all([
        gameService.getDefaultGames(),
        gameService.getCustomGames(serverId),
      ])
      setDefaultGames(defaultData.defaultGames)
      setCustomGames(customData.customGames)
      const serverInfo = await serverService.getServer(serverId)
      setResetHour(Number(serverInfo.resetTime.split(":")[0]))
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
    if (!selectedTime || !selectedGame) {
      toast.error("입력 오류", { description: "모든 필드를 입력해주세요." })
      return
    }
    const slot = `${selectedDate}T${selectedTime}:00`
    const [type, id] = selectedGame.split("-")
    try {
      await timetableService.addEntry({
        serverId,
        slot,
        defaultGameId: type === "default" ? Number(id) : undefined,
        customGameId: type === "custom" ? Number(id) : undefined,
      })
      await loadTimetable()
      setSelectedTime("")
      setSelectedGame("")
      toast.success("예약 완료", { description: "게임이 예약되었습니다." })
    } catch {
      toast.error("예약 실패", { description: "게임 예약 중 오류가 발생했습니다." })
    }
  }

  const formatDateTime = (dateTime: string) =>
    new Date(dateTime).toLocaleString("ko-KR", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })

  const isUserOnlineAtHour = (schedule: UserSchedule, hour: number) => hour >= schedule.joinTime

  // 게임별 색상 고정
  const getGameColor = (gameName: string, custom: boolean) => {
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
    const hash = gameName.split("").reduce((a, b) => ((a << 5) - a + b.charCodeAt(0)) & a, 0)
    return colors[Math.abs(hash) % colors.length]
  }

  if (isLoading) {
    return (
      <Card className="glass border-white/20 h-full">
        <CardHeader>
          <CardTitle className="text-white flex items-center">
            <Calendar className="mr-2 h-5 w-5" />합류 시간표
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
          <Calendar className="mr-2 h-5 w-5" />합류 시간표
        </CardTitle>
        <CardDescription className="text-white/70">
          친구들이 언제 합류하는지 확인하고 예약하세요
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {userSchedules.length > 0 && (
          <div className="glass rounded-lg p-4 overflow-x-auto">
            <h3 className="text-white font-medium mb-4 flex items-center text-sm">
              <Users className="mr-2 h-5 w-5" />오늘의 합류 예정 ({userSchedules.length}명)
            </h3>
            <div className="min-w-[600px]">
              <div className="flex items-center border-b border-white/20 pb-2">
                <div className="w-32 text-xs text-white/80 font-medium">사용자 / 게임</div>
                <div className="flex-1 flex">
                  {hours.map((hour) => (
                    <div key={hour} className="flex-1 text-center">
                      <div className="text-[10px] text-white/60 font-medium">
                        {hour.toString().padStart(2, "0")}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="space-y-2 mt-3">
                {userSchedules.map((schedule) => (
                  <div
                    key={`${schedule.user}-${schedule.entry.id}`}
                    className="flex items-center group"
                    onMouseEnter={() => setHoveredUser(schedule.user)}
                    onMouseLeave={() => setHoveredUser(null)}
                  >
                    <div className="w-32 pr-2">
                      <div className="text-white font-medium text-[12px] truncate">
                        {schedule.user}
                      </div>
                      <div className="flex items-center gap-1">
                        <GamepadIcon className="h-3 w-3 text-white/60" />
                        <span className="text-[10px] text-white/70 truncate">
                          {schedule.gameName}
                        </span>
                      </div>
                    </div>
                    <div className="flex-1 flex h-8 gap-px">
                      {hours.map((hour) => (
                        <div
                          key={hour}
                          className={`flex-1 relative transition-all duration-300 ${
                            isUserOnlineAtHour(schedule, hour)
                              ? `bg-gradient-to-r ${getGameColor(schedule.gameName, schedule.custom)} border ${
                                  hoveredUser === schedule.user ? "scale-y-110 brightness-125" : ""
                                }`
                              : "bg-white/5 border border-white/10"
                          } ${
                            hour === schedule.joinTime
                              ? "rounded-l-sm border-l-2"
                              : hour === 23 && isUserOnlineAtHour(schedule, hour)
                              ? "rounded-r-sm border-r-2"
                              : ""
                          }`}
                        >
                          {hour === new Date().getHours() && (
                            <div className="absolute top-0 left-1/2 w-[1px] h-full bg-green-400 opacity-80" />
                          )}
                          {resetHour !== null && hour === resetHour && (
                            <div className="absolute top-0 left-1/2 w-[1px] h-full bg-red-400 opacity-80" />
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-4 pt-2 border-t border-white/20 text-[10px] text-white/60 flex gap-4">
                <div className="flex items-center gap-1">
                  <div className="w-4 h-2 bg-gradient-to-r from-blue-500/60 to-blue-600/40 rounded-sm" />
                  온라인 시간
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-[1px] h-3 bg-green-400" />
                  현재 시간
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-[1px] h-3 bg-red-400" />
                  초기화 시간
                </div>
              </div>
            </div>
          </div>
        )}

        <form onSubmit={handleAddEntry} className="space-y-3 p-4 glass rounded-lg">
          <h3 className="text-white font-medium text-sm">새 합류 시간 예약</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <Input
              type="date"
              value={selectedDate}
              disabled
              className="glass border-white/30 text-white text-sm"
            />
            <Select
              value={selectedTime}
              onValueChange={setSelectedTime}
              required
            >
              <SelectTrigger className="glass border-white/30 text-white text-sm">
                <SelectValue placeholder="시간 선택" />
              </SelectTrigger>
              <SelectContent className="glass border-white/20 text-white text-sm max-h-60 overflow-y-auto">
                <SelectGroup>
                  <SelectLabel>시간</SelectLabel>
                  {timeOptions.map((time) => (
                    <SelectItem key={time} value={time}>
                      {time}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>
          <Select
            value={selectedGame}
            onValueChange={setSelectedGame}
            defaultValue=""
          >
            <SelectTrigger className="glass border-white/30 text-white text-sm">
              <SelectValue placeholder="게임 선택" />
            </SelectTrigger>
            <SelectContent className="glass border-white/20 text-white text-sm max-h-60 overflow-y-auto">
              <SelectGroup>
                <SelectLabel>기본 게임</SelectLabel>
                {defaultGames.map((game) => (
                  <SelectItem key={`default-${game.id}`} value={`default-${game.id}`}>
                    {game.name}
                  </SelectItem>
                ))}
              </SelectGroup>
              <SelectGroup>
                <SelectLabel>커스텀 게임</SelectLabel>
                {customGames.map((game) => (
                  <SelectItem key={`custom-${game.id}`} value={`custom-${game.id}`}>
                    {game.name}
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>
          <Button
            type="submit"
            className="w-full glass border-white/30 text-white hover:bg-black/10 hover:text-white"
          >
            합류 시간 예약
          </Button>
        </form>

        <div className="flex flex-col sm:flex-row gap-2">
          <Input
            placeholder="게임 이름으로 필터"
            value={gameFilter}
            onChange={(e) => setGameFilter(e.target.value)}
            className="glass border-white/30 text-white placeholder:text-white/50 text-sm"
          />
          <Button
            onClick={() => setSortByGame(!sortByGame)}
            variant="outline"
            className={`glass border-white/30 text-white hover:bg-black/10 text-sm ${
              sortByGame ? "bg-white/10" : ""
            }`}
          >
            <Filter className="mr-1 h-4 w-4" /> 게임순
          </Button>
        </div>

        <div className="space-y-2 max-h-64 sm:max-h-96 overflow-y-auto">
          {entries.map((entry) => (
            <div key={entry.id} className="p-3 glass rounded-lg">
              <div className="flex items-center justify-between mb-1 text-sm">
                <div className="flex items-center space-x-1">
                  <Clock className="h-4 w-4 text-white/60" />
                  <span className="text-white font-medium text-[12px]">
                    {formatDateTime(entry.slot)}
                  </span>
                </div>
                <Badge variant={entry.custom ? "secondary" : "default"} className="text-[10px]">
                  {entry.custom ? "커스텀" : "기본"}
                </Badge>
              </div>
              <div className="text-white/80 text-[12px]">
                <div>게임: {entry.gameName}</div>
                <div>플레이어: {entry.user}</div>
              </div>
            </div>
          ))}
          {entries.length === 0 && (
            <div className="text-center py-6 text-white/60 text-sm">
              예약된 게임이 없습니다.
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
