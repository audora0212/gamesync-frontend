// components/join-by-code-modal.tsx
"use client"

import React, { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
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

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="glass border-white/20 max-w-sm">
        <DialogHeader>
          <DialogTitle className="text-white">초대 코드로 가입</DialogTitle>
        </DialogHeader>
        <div className="p-4">
          <Input
            placeholder="초대 코드 (6자리)"
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            maxLength={6}
            className="glass border-white/30 text-white"
          />
        </div>
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline" className="glass border-white/30 text-white">취소</Button>
          </DialogClose>
          <Button onClick={handleJoin} className="glass-button text-white">참가</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
