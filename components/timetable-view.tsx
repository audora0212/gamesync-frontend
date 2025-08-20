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
import { Calendar, Clock, Filter, Users, GamepadIcon, Plus, PartyPopper } from "lucide-react"
import { NewTimetableEntryModal } from "@/components/new-timetable-entry-modal"
import { NewPartyModal } from "@/components/new-party-modal"
import { Dialog as ConfirmDialog, DialogContent as ConfirmContent, DialogHeader as ConfirmHeader, DialogFooter as ConfirmFooter, DialogTitle as ConfirmTitle, DialogClose as ConfirmClose } from "@/components/ui/dialog"
import { partyService, type PartyResponse } from "@/lib/party-service"

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
  const [isNewEntryOpen, setIsNewEntryOpen] = useState<boolean>(false)
  const [isNewPartyOpen, setIsNewPartyOpen] = useState<boolean>(false)
  const [parties, setParties] = useState<PartyResponse[]>([])
  const [deleteParty, setDeleteParty] = useState<PartyResponse | null>(null)
  const [labelStep, setLabelStep] = useState<number>(1)
  const isJoinedSomeParty = useMemo(() => parties.some(p => p.joined), [parties])
  const currentUserName = useMemo(() => (typeof window !== "undefined" ? localStorage.getItem("current-user") : null), [])
  const hasOwnEntryToday = useMemo(() => {
    if (!currentUserName) return false
    const todayStr = new Date().toLocaleDateString("en-CA")
    return entries.some(e => {
      const d = new Date(e.slot)
      const dStr = d.toLocaleDateString("en-CA")
      return e.user === currentUserName && dStr === todayStr
    })
  }, [entries, currentUserName])

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

  // 범례 표시용: 현재 표시 중인 게임의 고유 목록(등장 순서 유지)
  const gameLegendItems = useMemo(() => {
    const seen = new Set<string>()
    const list: { name: string; custom: boolean }[] = []
    for (const s of userSchedules) {
      if (!seen.has(s.gameName)) {
        seen.add(s.gameName)
        list.push({ name: s.gameName, custom: s.custom })
      }
    }
    return list
  }, [userSchedules])

  const hours = Array.from({ length: 24 }, (_, i) => i)

  useEffect(() => {
    const updateLabelStep = () => {
      const w = typeof window !== 'undefined' ? window.innerWidth : 1024
      if (w < 380) setLabelStep(6)
      else if (w < 640) setLabelStep(3)
      else setLabelStep(1)
    }
    updateLabelStep()
    window.addEventListener('resize', updateLabelStep)
    return () => window.removeEventListener('resize', updateLabelStep)
  }, [])

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
      await Promise.all([loadTimetable(), loadParties()])
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

  const loadParties = async () => {
    try {
      const data = await partyService.list(serverId)
      setParties(data)
    } catch {
      toast.error("파티 목록 로드 실패", { description: "파티 목록을 불러오는데 실패했습니다." })
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
    // 안정적인 문자열 해시 (32-bit)
    let hash = 0
    for (let i = 0; i < gameName.length; i++) {
      hash = ((hash << 5) - hash + gameName.charCodeAt(i)) | 0
    }
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
        <div className="flex flex-col sm:flex-row items-start sm:items-start justify-start sm:justify-between gap-2">
          <div className="min-w-0">
            <CardTitle className="text-white flex items-center break-keep">
              <Calendar className="mr-2 h-5 w-5 shrink-0" />
              <span className="truncate">합류 시간표</span>
            </CardTitle>
            <CardDescription className="text-white/70 break-keep text-sm">
              친구들이 언제 합류하는지 확인하고 예약하세요
            </CardDescription>
          </div>
          <div className="pt-0 sm:pt-1 mt-2 sm:mt-0 w-full sm:w-auto flex justify-end">
            <div className="flex items-center gap-2">
              {hasOwnEntryToday && (
                <Button
                  onClick={async () => {
                    try {
                      await timetableService.deleteMyEntry(serverId)
                      await Promise.all([loadTimetable(), loadParties()])
                      toast.success("합류 시간이 취소되었습니다.")
                    } catch {
                      toast.error("합류 시간 취소 실패")
                    }
                  }}
                  variant="outline"
                  className="glass border-white/30 text-white hover:bg-black/10 hover:text-white text-sm"
                >
                  합류 시간 취소하기
                </Button>
              )}
              <div
                title={isJoinedSomeParty ? "파티를 떠난 후에 합류 시간을 등록할 수 있습니다" : undefined}
                className={isJoinedSomeParty ? "cursor-not-allowed" : undefined}
              >
                <Button
                  onClick={() => setIsNewEntryOpen(true)}
                  className="glass border-white/30 text-white hover:bg-black/10 hover:text-white text-xs sm:text-sm rainbow-border"
                  disabled={isJoinedSomeParty}
                >
                  <Plus className="mr-1 h-4 w-4" /> {hasOwnEntryToday ? "합류 시간 다시 정하기" : "새 합류 시간 예약하기"}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {userSchedules.length > 0 ? (
          <div className="glass rounded-lg p-4 overflow-x-auto">
            <h3 className="text-white font-medium mb-4 flex items-center text-sm">
              <Users className="mr-2 h-5 w-5" />오늘의 합류 예정 ({userSchedules.length}명)
            </h3>
            <div className="w-full sm:min-w-[600px]">
              <div className="flex items-center border-b border-white/20 pb-2 relative">
                <div className="w-32 text-xs text-white/80 font-medium">사용자 / 게임</div>
                <div className="flex-1 flex">
                  {hours.map((hour) => (
                    <div key={hour} className="flex-1 text-center">
                      <div className="text-[10px] text-white/60 font-medium">
                        {hour % labelStep === 0 ? (labelStep === 1 ? hour.toString().padStart(2, "0") : String(hour)) : ''}
                      </div>
                    </div>
                  ))}
                </div>
                {labelStep > 1 && (
                  <div className="absolute right-0 translate-x-1/2 text-[10px] text-white/60 font-medium">24</div>
                )}
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
                    <div className="flex-1 flex h-6 sm:h-8 gap-px">
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
              <div className="mt-4 pt-2 border-t border-white/20 text-[10px] text-white/60 flex flex-col gap-2">
                <div className="flex items-center gap-3 flex-wrap">
                  {gameLegendItems.map((g) => (
                    <div key={g.name} className="flex items-center gap-1">
                      <div className={`w-4 h-2 bg-gradient-to-r ${getGameColor(g.name, g.custom)} rounded-sm`} />
                      <span className="text-white/70">{g.name}</span>
                    </div>
                  ))}
                </div>
                <div className="flex items-center gap-4">
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
          </div>
        ) : (
          <div className="glass rounded-lg p-8 text-center">
            <div className="text-white/60 mb-3 text-sm">아직 등록된 합류 시간이 없습니다.</div>
            <Button
              onClick={() => setIsNewEntryOpen(true)}
              className="glass border-white/30 text-white hover:bg-black/10 hover:text-white text-sm rainbow-border"
              disabled={isJoinedSomeParty}
              title={isJoinedSomeParty ? "파티를 떠난 후에 합류 시간을 등록할 수 있습니다" : undefined}
            >
              <Plus className="mr-1 h-4 w-4" /> 새 합류 시간 예약하기
            </Button>
          </div>
        )}

        {/* 파티 모집 헤더 (상단) */}
        <div className="flex items-start justify-between gap-2">
          <div>
            <h3 className="text-white font-medium text-sm flex items-center">
              <PartyPopper className="mr-2 h-5 w-5" />파티 모집
            </h3>
          </div>
          <div className="pt-1"
            title={isJoinedSomeParty ? "파티를 떠난 후에 파티를 모집할 수 있습니다" : undefined}
          >
            <Button
              onClick={() => setIsNewPartyOpen(true)}
              className="glass border-white/30 text-white hover:bg-black/10 hover:text-white text-xs sm:text-sm rainbow-border"
              disabled={isJoinedSomeParty}
            >
              <Plus className="mr-1 h-4 w-4" /> 새 파티 모집하기
            </Button>
          </div>
        </div>

        {/* 파티 모집 영역 (리스트 박스) */}
        <div className="glass rounded-lg p-4">
          <div className="space-y-2">
            {parties.map((p) => {
              const full = p.full || p.participants >= p.capacity
              const joined = !!p.joined
              return (
                <div key={p.id} className={`p-3 glass rounded-lg ${joined ? "bg-white/10" : ""}`}>
                  <div className="flex items-center justify-between mb-1 text-sm">
                    <div className="text-white font-medium text-[12px]">
                      {new Date(p.slot).toLocaleString("ko-KR", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })} · {p.gameName}
                    </div>
                    <div className={`text-[12px] ${full ? "text-red-400" : "text-white/70"}`}>
                      정원 {p.participants}/{p.capacity}
                    </div>
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <div className="text-white/70 text-[12px]">모집자: {p.creator}{p.participantNames?.length ? ` · 참가자: ${p.participantNames.join(", ")}` : ""}</div>
                    <div className="flex items-center gap-2">
                      {p.owner && (
                        <Button
                          size="sm"
                          onClick={() => setDeleteParty(p)}
                          className="glass border-red-400/60 text-red-400 hover:bg-red-500/15 hover:text-red-300 text-xs"
                        >
                          파티 삭제
                        </Button>
                      )}
                      {p.joined ? (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={async () => {
                            try {
                              await partyService.leave(serverId, p.id)
                              await Promise.all([loadParties(), loadTimetable()])
                              toast.success("파티에서 떠났습니다.")
                            } catch (e) {
                              toast.error("파티 떠나기 실패")
                            }
                          }}
                          className="glass border-white/30 text-white hover:bg-black/10 hover:text-white text-xs"
                        >
                          파티 떠나기
                        </Button>
                      ) : (
                        <Button
                          size="sm"
                          disabled={full}
                          onClick={async () => {
                            try {
                              // 다른 파티에 참가 중인 경우 확인
                              const alreadyJoined = parties.some(pp => pp.joined)
                              if (alreadyJoined) {
                                const ok = window.confirm("현재 참가 중인 파티에서 떠나고 새로운 파티에 가입하시겠습니까?")
                                if (!ok) return
                              }
                              await partyService.join(serverId, p.id)
                              await Promise.all([loadParties(), loadTimetable()])
                              toast.success("파티에 참가했습니다.")
                            } catch (e) {
                              toast.error("파티 참가 실패", { description: "정원이 찼거나 오류가 발생했습니다." })
                            }
                          }}
                          className="glass border-white/30 text-white hover:bg-black/10 hover:text-white text-xs"
                        >
                          {full ? "정원 마감" : "파티 참가하기"}
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
            {parties.length === 0 && (
              <div className="text-center py-6 text-white/60 text-sm">
                진행 중인 파티 모집이 없습니다.
                <div className="mt-3">
                  <Button
                    onClick={() => setIsNewPartyOpen(true)}
                    className="glass border-white/30 text-white hover:bg-black/10 hover:text-white text-sm rainbow-border"
                    disabled={isJoinedSomeParty}
                    title={isJoinedSomeParty ? "파티를 떠난 후에 파티를 모집할 수 있습니다" : undefined}
                  >
                    <Plus className="mr-1 h-4 w-4" /> 새 파티 모집하기
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>

        <NewTimetableEntryModal
          open={isNewEntryOpen}
          onClose={() => setIsNewEntryOpen(false)}
          serverId={serverId}
          selectedDate={selectedDate}
          defaultGames={defaultGames}
          customGames={customGames}
          timeOptions={timeOptions}
          onAdded={async () => {
            await loadTimetable()
          }}
        />
        <NewPartyModal
          open={isNewPartyOpen}
          onClose={() => setIsNewPartyOpen(false)}
          serverId={serverId}
          selectedDate={selectedDate}
          defaultGames={defaultGames}
          customGames={customGames}
          timeOptions={timeOptions}
          onCreated={async () => {
            await Promise.all([loadParties(), loadTimetable()])
          }}
        />

        {/* 파티 삭제 확인 모달 */}
        <ConfirmDialog open={!!deleteParty} onOpenChange={(open) => { if (!open) setDeleteParty(null) }}>
          <ConfirmContent className="glass border-white/20 max-w-sm">
            <ConfirmHeader>
              <ConfirmTitle className="text-white">파티 삭제</ConfirmTitle>
            </ConfirmHeader>
            <div className="text-white/80 text-sm">이 파티를 삭제하시겠습니까?</div>
            <ConfirmFooter>
              <ConfirmClose asChild>
                <Button variant="outline" className="glass border-white/30 text-white">취소</Button>
              </ConfirmClose>
              <Button
                className="glass-button bg-red-500/20 hover:bg-red-500/30 text-red-300"
                onClick={async () => {
                  if (!deleteParty) return
                  try {
                    await partyService.delete(serverId, deleteParty.id)
                    await Promise.all([loadParties(), loadTimetable()])
                    toast.success("파티가 삭제되었습니다.")
                  } catch {
                    toast.error("파티 삭제 실패")
                  } finally {
                    setDeleteParty(null)
                  }
                }}
              >
                삭제
              </Button>
            </ConfirmFooter>
          </ConfirmContent>
        </ConfirmDialog>

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
            className={`glass border-white/30 text-white hover:bg-black/10 text-xs sm:text-sm ${
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
