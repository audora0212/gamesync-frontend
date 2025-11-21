"use client"

import { Suspense, useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogClose, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import { Navbar } from "@/components/navbar"
import { authService } from "@/lib/auth-service"

export default function InviteByIdPage() {
  return (
    <Suspense fallback={<div className="min-h-screen"><Navbar /></div>}>
      <InviteByIdInner />
    </Suspense>
  )
}

function InviteByIdInner() {
  const router = useRouter()
  const params = useSearchParams()
  const inviteIdParam = params.get("inviteId")
  const inviteId = inviteIdParam ? Number(inviteIdParam) : NaN
  const [open, setOpen] = useState(true)
  const [info, setInfo] = useState<{ serverId: number; serverName: string } | null>(null)

  useEffect(() => {
    ;(async () => {
      if (!inviteIdParam || Number.isNaN(inviteId)) {
        toast.error("유효하지 않은 초대입니다")
        router.replace("/")
        return
      }
      if (!authService.isAuthenticated()) {
        toast.error("로그인을 먼저 해주세요")
        const returnUrl = `/invite/by-id?inviteId=${encodeURIComponent(inviteIdParam)}`
        router.replace(`/auth/login?return=${encodeURIComponent(returnUrl)}`)
        return
      }
      try {
        const API_BASE = process.env.NEXT_PUBLIC_API_URL || "/api"
        const res = await fetch(`${API_BASE}/servers/invites/me`, { headers: authService.getAuthHeaders() })
        if (!res.ok) throw new Error("INVITE_LIST_FAILED")
        const list: Array<{
          id: number
          serverId: number
          serverName: string
        }> = await res.json()
        const target = (list || []).find(x => x.id === inviteId)
        if (!target) {
          toast.error("초대를 찾을 수 없습니다")
          router.replace("/")
          return
        }
        setInfo({ serverId: target.serverId, serverName: target.serverName })
      } catch {
        toast.error("초대 정보를 불러오지 못했습니다")
        router.replace("/")
      }
    })()
  }, [inviteIdParam, inviteId, router])

  return (
    <div className="min-h-screen">
      <Navbar />
      <Dialog open={open} onOpenChange={(v)=>{setOpen(v); if(!v){ /* stay on page */ }}}>
        <DialogContent className="glass border-white/20 max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-white">서버 참가 확인</DialogTitle>
            <DialogDescription className="text-white/60">아래 정보를 확인하고 참가를 진행하세요.</DialogDescription>
          </DialogHeader>
          <div className="p-4 space-y-2 text-white">
            <div className="flex justify-between"><span className="text-white/70">서버 이름</span><span>{info?.serverName || ""}</span></div>
          </div>
          <div className="flex justify-end space-x-2 pt-2">
            <DialogClose asChild>
              <Button variant="outline" className="glass border-white/30 text-white" onClick={()=>router.push("/")}>취소</Button>
            </DialogClose>
            <Button className="glass-button text-white" onClick={async()=>{
              try {
                const API_BASE = process.env.NEXT_PUBLIC_API_URL || "/api"
                await fetch(`${API_BASE}/servers/invites/${inviteId}/respond`, {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json', ...authService.getAuthHeaders() },
                  body: JSON.stringify({ accept: true })
                })
                toast.success("서버 참가 완료")
                router.replace(info ? `/server/${info.serverId}` : "/dashboard")
              } catch {
                toast.error("초대 처리 실패")
                router.replace("/dashboard")
              }
            }}>참가</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}







