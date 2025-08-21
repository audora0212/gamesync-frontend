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
      <DialogContent className="glass border-white/20 max-w-sm">
        <DialogHeader>
          <DialogTitle className="text-white">{step === "input" ? "초대 코드로 가입" : "서버 참가 확인"}</DialogTitle>
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
                className="glass border-white/30 text-white"
              />
            </div>
            <div className="flex justify-end space-x-2 pt-4">
              <DialogClose asChild>
                <Button variant="outline" className="glass border-white/30 text-white">취소</Button>
              </DialogClose>
              <Button onClick={handlePreview} disabled={code.length !== 6} className="glass-button text-white">다음</Button>
            </div>
          </>
        ) : (
          <>
            <div className="p-4 space-y-2 text-white">
              <div className="flex justify-between"><span className="text-white/70">서버 이름</span><span>{preview?.name}</span></div>
              <div className="flex justify-between"><span className="text-white/70">참여자 수</span><span>{preview?.members}명</span></div>
              <div className="flex justify-between"><span className="text-white/70">초기화 시간</span><span>{preview?.resetTime}</span></div>
            </div>
            <div className="flex justify-end space-x-2 pt-2">
              <Button variant="outline" className="glass border-white/30 text-white" onClick={() => setStep("input")}>뒤로</Button>
              <Button onClick={handleJoin} className="glass-button text-white">참가</Button>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}
