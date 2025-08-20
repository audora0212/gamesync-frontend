"use client"

import React, { useMemo, useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
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
      <DialogContent className="glass border-white/20">
        <DialogHeader>
          <DialogTitle className="text-white">새 파티 모집</DialogTitle>
          <DialogDescription className="text-white/70">
            원하는 시간과 게임, 정원을 설정하세요.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <Input type="date" value={selectedDate} disabled className="glass border-white/30 text-white text-sm" />
            <Select value={selectedTime} onValueChange={setSelectedTime} required>
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
          <Select value={selectedGame} onValueChange={setSelectedGame} defaultValue="">
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
          <div className="space-y-2">
            <label className="text-white text-sm">정원</label>
            <Input type="number" min={1} value={capacity} onChange={(e) => setCapacity(e.target.value)} className="glass border-white/30 text-white text-sm" />
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="outline" className="glass border-white/30 text-white">
                취소
              </Button>
            </DialogClose>
            <Button type="submit" className="glass border-white/30 text-white" disabled={!canSubmit || isSubmitting}>
              {isSubmitting ? "생성 중..." : "파티 모집하기"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}








