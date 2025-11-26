"use client"

import React, { useMemo, useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogClose,
} from "@/components/ui/dialog"
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
import { toast } from "sonner"
import { timetableService } from "@/lib/timetable-service"
import { isNative } from "@/lib/native"
import { Clock, Gamepad2 } from "lucide-react"

interface Game {
  id: number
  name: string
}

interface NewTimetableEntryModalProps {
  open: boolean
  onClose: () => void
  serverId: number
  selectedDate: string
  defaultGames: Game[]
  customGames: Game[]
  timeOptions: string[]
  onAdded: () => Promise<void> | void
}

export function NewTimetableEntryModal({
  open,
  onClose,
  serverId,
  selectedDate,
  defaultGames,
  customGames,
  timeOptions,
  onAdded,
}: NewTimetableEntryModalProps) {
  const [isNativeApp, setIsNativeApp] = useState<boolean>(false)

  React.useEffect(() => {
    let mounted = true
    isNative().then((v) => { if (mounted) setIsNativeApp(!!v) })
    return () => { mounted = false }
  }, [])

  const [selectedTime, setSelectedTime] = useState<string>("")
  const [selectedGame, setSelectedGame] = useState<string>("")
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false)

  const canSubmit = useMemo(() => !!selectedTime && !!selectedGame, [selectedTime, selectedGame])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!canSubmit) {
      toast.error("입력 오류", { description: "모든 필드를 입력해주세요." })
      return
    }
    setIsSubmitting(true)
    const slot = `${selectedDate}T${selectedTime}:00`
    const [type, id] = selectedGame.split("-")
    try {
      await timetableService.addEntry({
        serverId,
        slot,
        defaultGameId: type === "default" ? Number(id) : undefined,
        customGameId: type === "custom" ? Number(id) : undefined,
      })
      await onAdded?.()
      setSelectedTime("")
      setSelectedGame("")
      toast.success("예약 완료", { description: "게임이 예약되었습니다." })
      onClose()
    } catch {
      toast.error("예약 실패", { description: "게임 예약 중 오류가 발생했습니다." })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2.5 rounded-xl bg-neon-cyan/20 shadow-[0_0_15px_rgba(5,242,219,0.2)]">
              <Clock className="w-5 h-5 text-neon-cyan" />
            </div>
            <DialogTitle className="text-neon-cyan drop-shadow-[0_0_10px_rgba(5,242,219,0.5)] font-display">새 합류 시간 예약</DialogTitle>
          </div>
          <DialogDescription>
            오늘 날짜 기준으로 합류 시간을 예약합니다.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className={isNativeApp ? "w-full flex justify-center" : "w-full"}>
              <Input
                type="date"
                value={selectedDate}
                disabled
                className={"text-sm appearance-none h-11 py-0 " + (isNativeApp ? "inline-block w-auto text-center px-3" : "w-full px-3")}
              />
            </div>
            <Select value={selectedTime} onValueChange={setSelectedTime} required>
              <SelectTrigger className="text-sm w-full h-11">
                <SelectValue placeholder="시간 선택" />
              </SelectTrigger>
              <SelectContent className="text-sm max-h-60 overflow-y-auto">
                <SelectGroup>
                  <SelectLabel className="text-neon-cyan">시간</SelectLabel>
                  {timeOptions.map((time) => (
                    <SelectItem key={time} value={time}>
                      {time}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <label className="text-neon-cyan text-sm flex items-center gap-2">
              <Gamepad2 className="w-4 h-4" />
              게임 선택
            </label>
            <Select value={selectedGame} onValueChange={setSelectedGame} defaultValue="">
              <SelectTrigger className="text-sm h-11">
                <SelectValue placeholder="게임 선택" />
              </SelectTrigger>
              <SelectContent className="text-sm max-h-60 overflow-y-auto">
                <SelectGroup>
                  <SelectLabel className="text-neon-cyan">기본 게임</SelectLabel>
                  {defaultGames.map((game) => (
                    <SelectItem key={`default-${game.id}`} value={`default-${game.id}`}>
                      {game.name}
                    </SelectItem>
                  ))}
                </SelectGroup>
                <SelectGroup>
                  <SelectLabel className="text-neon-magenta">커스텀 게임</SelectLabel>
                  {customGames.map((game) => (
                    <SelectItem key={`custom-${game.id}`} value={`custom-${game.id}`}>
                      {game.name}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>
          <div className="flex justify-end space-x-2 pt-4">
            <DialogClose asChild>
              <Button type="button" variant="outline">
                취소
              </Button>
            </DialogClose>
            <Button type="submit" disabled={!canSubmit || isSubmitting}>
              {isSubmitting ? "예약 중..." : "합류 시간 예약"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
