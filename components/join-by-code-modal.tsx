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
import { UserPlus, Server, Users, Clock, KeyRound } from "lucide-react"

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
      <DialogContent className="card-cyber border-purple-500/30 max-w-sm">
        <DialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-xl bg-purple-500/20">
              <KeyRound className="w-5 h-5 text-purple-400" />
            </div>
            <DialogTitle className="neon-text-purple text-lg">{step === "input" ? "초대 코드로 가입" : "서버 참가 확인"}</DialogTitle>
          </div>
          <DialogDescription className="text-white/60">
            초대 코드를 확인하고 서버 참가를 진행합니다.
          </DialogDescription>
        </DialogHeader>
        {step === "input" ? (
          <>
            <div className="p-4">
              <Input
                placeholder="초대 코드 (6자리)"
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                maxLength={6}
                className="input-cyber text-center font-mono text-lg tracking-widest"
              />
            </div>
            <div className="flex justify-end space-x-2 pt-4">
              <DialogClose asChild>
                <Button className="btn-cyber-outline text-sm px-4 py-2">취소</Button>
              </DialogClose>
              <Button onClick={handlePreview} disabled={code.length !== 6} className="btn-cyber-purple text-sm px-4 py-2">다음</Button>
            </div>
          </>
        ) : (
          <>
            <div className="p-4 space-y-3 text-white">
              <div className="flex justify-between items-center">
                <span className="text-white/70 flex items-center gap-2"><Server className="w-4 h-4" />서버 이름</span>
                <span className="text-cyan-400 font-medium">{preview?.name}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-white/70 flex items-center gap-2"><Users className="w-4 h-4" />참여자 수</span>
                <span className="text-purple-400">{preview?.members}명</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-white/70 flex items-center gap-2"><Clock className="w-4 h-4" />초기화 시간</span>
                <span className="text-pink-400">{preview?.resetTime}</span>
              </div>
            </div>
            <div className="flex justify-end space-x-2 pt-2">
              <Button className="btn-cyber-outline text-sm px-4 py-2" onClick={() => setStep("input")}>뒤로</Button>
              <Button onClick={handleJoin} className="btn-cyber-emerald text-sm px-4 py-2">
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
