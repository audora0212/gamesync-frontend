"use client"

import type React from "react"

import { useState } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"
import { serverService } from "@/lib/server-service"
import { Loader2 } from "lucide-react"

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
      <DialogContent className="glass border-white/20 max-w-sm">
        <DialogHeader>
          <DialogTitle className="text-white">새 서버 생성</DialogTitle>
          <DialogDescription className="text-white/70">새로운 게임 서버를 생성합니다.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name" className="text-white">
              서버 이름
            </Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="glass border-white/30 text-white placeholder:text-white/50 w-full"
              placeholder="서버 이름을 입력하세요"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="resetTime" className="text-white">
              초기화 시간
            </Label>
            <Input
              id="resetTime"
              type="time"
              value={resetTime}
              onChange={(e) => setResetTime(e.target.value)}
              className="glass border-white/30 text-white w-full"
              required
            />
          </div>
          <div className="flex justify-end space-x-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="glass-button"
            >
              취소
            </Button>
            <Button type="submit" className="glass-button" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  생성 중...
                </>
              ) : (
                "생성"
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
