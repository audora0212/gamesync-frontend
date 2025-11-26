// components/join-by-code-modal.tsx
"use client"

import React, { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogClose,
  DialogDescription,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { toast } from "sonner"
import { serverService } from "@/lib/server-service"
import { UserPlus, Server, Users, Clock, KeyRound, ArrowLeft } from "lucide-react"

interface JoinByCodeModalProps {
  open: boolean
  onClose: () => void
  onJoinSuccess: () => void
}

export function JoinByCodeModal({ open, onClose, onJoinSuccess }: JoinByCodeModalProps) {
  const [code, setCode] = useState<string>("")
  const [preview, setPreview] = useState<null | { name: string; members: number; resetTime: string }>(null)
  const [step, setStep] = useState<"input" | "confirm">("input")

  const handleJoin = async () => {
    try {
      await serverService.joinByCode(code)
      toast.success("서버 참가 완료")
      onJoinSuccess()
      onClose()
    } catch {
      toast.error("초대 코드가 올바르지 않습니다")
    }
  }

  const handlePreview = async () => {
    try {
      const s = await serverService.lookupByCode(code)
      setPreview({ name: s.name, members: (s.members?.length || 0), resetTime: s.resetTime })
      setStep("confirm")
    } catch {
      toast.error("초대 코드가 올바르지 않습니다")
    }
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2.5 rounded-xl bg-neon-magenta/20 shadow-[0_0_15px_rgba(217,4,142,0.2)]">
              <KeyRound className="w-5 h-5 text-neon-magenta" />
            </div>
            <DialogTitle className="text-neon-magenta drop-shadow-[0_0_10px_rgba(217,4,142,0.5)] text-lg font-display">
              {step === "input" ? "초대 코드로 참가" : "서버 참가 확인"}
            </DialogTitle>
          </div>
          <DialogDescription>
            초대 코드를 확인하고 서버 참가를 진행합니다.
          </DialogDescription>
        </DialogHeader>
        {step === "input" ? (
          <>
            <div className="py-4">
              <Input
                placeholder="초대 코드 (6자리)"
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                maxLength={6}
                className="text-center font-mono text-lg tracking-[0.3em] uppercase"
              />
            </div>
            <div className="flex justify-end space-x-2 pt-2">
              <DialogClose asChild>
                <Button variant="outline">취소</Button>
              </DialogClose>
              <Button
                onClick={handlePreview}
                disabled={code.length !== 6}
                variant="secondary"
              >
                다음
              </Button>
            </div>
          </>
        ) : (
          <>
            <div className="py-4 space-y-3">
              <div className="flex justify-between items-center p-3 rounded-lg bg-white/5 border border-white/10">
                <span className="text-muted-foreground flex items-center gap-2 text-sm">
                  <Server className="w-4 h-4 text-neon-cyan" />
                  서버 이름
                </span>
                <span className="text-neon-cyan font-medium">{preview?.name}</span>
              </div>
              <div className="flex justify-between items-center p-3 rounded-lg bg-white/5 border border-white/10">
                <span className="text-muted-foreground flex items-center gap-2 text-sm">
                  <Users className="w-4 h-4 text-neon-magenta" />
                  참여자 수
                </span>
                <span className="text-neon-magenta font-medium">{preview?.members}명</span>
              </div>
              <div className="flex justify-between items-center p-3 rounded-lg bg-white/5 border border-white/10">
                <span className="text-muted-foreground flex items-center gap-2 text-sm">
                  <Clock className="w-4 h-4 text-neon-pink" />
                  초기화 시간
                </span>
                <span className="text-neon-pink font-medium">{preview?.resetTime}</span>
              </div>
            </div>
            <div className="flex justify-end space-x-2 pt-2">
              <Button variant="outline" onClick={() => setStep("input")}>
                <ArrowLeft className="w-4 h-4 mr-2" />
                뒤로
              </Button>
              <Button onClick={handleJoin}>
                <UserPlus className="w-4 h-4 mr-2" />
                참가
              </Button>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}
