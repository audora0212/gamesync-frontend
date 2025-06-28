"use client"

import type React from "react"
import { useState, useEffect } from "react"
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
import { Calendar, Clock, Filter } from "lucide-react"

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

export function TimetableView({ serverId }: TimetableViewProps) {
  const today = new Date().toISOString().split("T")[0]

  const [entries, setEntries] = useState<TimetableEntry[]>([])
  const [defaultGames, setDefaultGames] = useState<Game[]>([])
  const [customGames, setCustomGames] = useState<Game[]>([])
  const [selectedDate, setSelectedDate] = useState<string>(today)
  const [selectedTime, setSelectedTime] = useState<string>("")
  const [selectedGame, setSelectedGame] = useState<string>("")
  const [gameFilter, setGameFilter] = useState<string>("")
  const [sortByGame, setSortByGame] = useState<boolean>(false)
  const [isLoading, setIsLoading] = useState<boolean>(true)

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
          타임테이블
        </CardTitle>
        <CardDescription className="text-white/70">게임 세션을 예약하고 관리하세요</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* 예약 추가 폼 */}
        <form onSubmit={handleAddEntry} className="space-y-4 p-4 glass rounded-lg">
          <h3 className="text-white font-medium">새 예약 추가</h3>
          <div className="grid grid-cols-2 gap-3">
            <Input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="glass border-white/30 text-white"
              required
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
          <Button type="submit" className="w-full glass-button text-white">
            예약 추가
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
            className={`glass border-white/30 text-white ${sortByGame ? "bg-white/10" : ""}`}
          >
            <Filter className="mr-2 h-4 w-4 text-white" />
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
                <Badge variant={entry.custom ? "secondary" : "default"} className="glass text-white">
                  {entry.custom ? "커스텀" : "기본"}
                </Badge>
              </div>
              <div className="text-white/80 text-sm">
                <div>게임: {entry.gameName}</div>
                <div>플레이어: {entry.user}</div>
              </div>
            </div>
          ))}
          {entries.length === 0 && (
            <div className="text-center py-8 text-white/60">예약된 게임이 없습니다.</div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
