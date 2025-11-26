"use client"

import type React from "react"

import { useState } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"
import { serverService } from "@/lib/server-service"
import { Loader2, Server, Clock, Plus } from "lucide-react"

interface CreateServerModalProps {
  open: boolean
  onClose: () => void
  onServerCreated: (server: any) => void
}

export function CreateServerModal({ open, onClose, onServerCreated }: CreateServerModalProps) {
  const [name, setName] = useState("")
  const [resetTime, setResetTime] = useState("06:00")
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const server = await serverService.createServer({
        name,
        resetTime,
      })
      onServerCreated(server)
      setName("")
      setResetTime("06:00")
    } catch (error) {
      toast.error("서버 생성 실패", {
        description: "서버 생성 중 오류가 발생했습니다.",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="card-cyber border-cyan-500/30 max-w-sm">
        <DialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-xl bg-cyan-500/20">
              <Plus className="w-5 h-5 text-cyan-400" />
            </div>
            <DialogTitle className="neon-text-primary text-lg">새 서버 생성</DialogTitle>
          </div>
          <DialogDescription className="text-white/70">새로운 게임 서버를 생성합니다.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name" className="text-cyan-400 flex items-center gap-2">
              <Server className="w-4 h-4" />
              서버 이름
            </Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="input-cyber w-full"
              placeholder="서버 이름을 입력하세요"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="resetTime" className="text-cyan-400 flex items-center gap-2">
              <Clock className="w-4 h-4" />
              초기화 시간
            </Label>
            <Input
              id="resetTime"
              type="time"
              value={resetTime}
              onChange={(e) => setResetTime(e.target.value)}
              className="input-cyber w-full"
              required
            />
          </div>
          <div className="flex justify-end space-x-2 pt-4">
            <Button
              type="button"
              onClick={onClose}
              className="btn-cyber-outline text-sm px-4 py-2"
            >
              취소
            </Button>
            <Button type="submit" className="btn-cyber text-sm px-4 py-2" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  생성 중...
                </>
              ) : (
                <>
                  <Plus className="mr-2 h-4 w-4" />
                  생성
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
