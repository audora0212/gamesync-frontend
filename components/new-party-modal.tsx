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
import { partyService } from "@/lib/party-service"
import { isNative } from "@/lib/native"
import { Users, Gamepad2 } from "lucide-react"

interface Game {
  id: number
  name: string
}

interface NewPartyModalProps {
  open: boolean
  onClose: () => void
  serverId: number
  selectedDate: string
  defaultGames: Game[]
  customGames: Game[]
  timeOptions: string[]
  onCreated: () => Promise<void> | void
}

export function NewPartyModal({
  open,
  onClose,
  serverId,
  selectedDate,
  defaultGames,
  customGames,
  timeOptions,
  onCreated,
}: NewPartyModalProps) {
  const [isNativeApp, setIsNativeApp] = useState<boolean>(false)

  React.useEffect(() => {
    let mounted = true
    isNative().then((v) => { if (mounted) setIsNativeApp(!!v) })
    return () => { mounted = false }
  }, [])

  const [selectedTime, setSelectedTime] = useState<string>("")
  const [selectedGame, setSelectedGame] = useState<string>("")
  const [capacity, setCapacity] = useState<string>("4")
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false)

  const canSubmit = useMemo(() => !!selectedTime && !!selectedGame && Number(capacity) > 0, [selectedTime, selectedGame, capacity])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!canSubmit) {
      toast.error("입력 오류", { description: "모든 필드를 올바르게 입력해주세요." })
      return
    }
    setIsSubmitting(true)
    const slot = `${selectedDate}T${selectedTime}:00`
    const [type, id] = selectedGame.split("-")
    try {
      await partyService.create({
        serverId,
        slot,
        capacity: Math.max(1, Number(capacity)),
        defaultGameId: type === "default" ? Number(id) : undefined,
        customGameId: type === "custom" ? Number(id) : undefined,
      })
      await onCreated?.()
      setSelectedTime("")
      setSelectedGame("")
      setCapacity("4")
      toast.success("파티가 생성되었습니다.")
      onClose()
    } catch {
      toast.error("파티 생성 실패", { description: "파티 생성 중 오류가 발생했습니다." })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2.5 rounded-xl bg-neon-pink/20 shadow-[0_0_15px_rgba(242,5,203,0.2)]">
              <Users className="w-5 h-5 text-neon-pink" />
            </div>
            <DialogTitle className="text-neon-pink drop-shadow-[0_0_10px_rgba(242,5,203,0.5)] font-display">새 파티 모집</DialogTitle>
          </div>
          <DialogDescription>
            원하는 시간과 게임, 정원을 설정하세요.
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
                  <SelectLabel className="text-neon-pink">시간</SelectLabel>
                  {timeOptions.map((time) => (
                    <SelectItem key={time} value={time}>
                      {time}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>
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
          <div className="space-y-2">
            <label className="text-neon-pink text-sm flex items-center gap-2">
              <Gamepad2 className="w-4 h-4" />
              정원
            </label>
            <Input type="number" min={1} value={capacity} onChange={(e) => setCapacity(e.target.value)} className="text-base sm:text-sm" />
          </div>
          <div className="flex justify-end space-x-2 pt-4">
            <DialogClose asChild>
              <Button type="button" variant="outline">
                취소
              </Button>
            </DialogClose>
            <Button type="submit" variant="secondary" disabled={!canSubmit || isSubmitting}>
              {isSubmitting ? "생성 중..." : "파티 모집하기"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
