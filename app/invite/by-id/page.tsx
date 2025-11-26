"use client"

import { Suspense, useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogClose, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import { Navbar } from "@/components/navbar"
import { authService } from "@/lib/auth-service"
import { Server, UserPlus } from "lucide-react"

export default function InviteByIdPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-background flex flex-col">
        <div className="fixed inset-0 overflow-hidden pointer-events-none">
          <div className="absolute inset-0 bg-[linear-gradient(rgba(5,242,219,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(5,242,219,0.03)_1px,transparent_1px)] bg-[size:50px_50px]" />
        </div>
        <Navbar />
        <div className="flex-1 flex items-center justify-center">
          <div className="w-10 h-10 border-2 border-neon-cyan border-t-transparent rounded-full animate-spin" />
        </div>
      </div>
    }>
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
    <div className="min-h-screen bg-background flex flex-col">
      {/* 배경 효과 */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute inset-0 bg-[linear-gradient(rgba(5,242,219,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(5,242,219,0.03)_1px,transparent_1px)] bg-[size:50px_50px]" />
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-neon-green/10 rounded-full blur-[150px]" />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-neon-cyan/10 rounded-full blur-[150px]" />
      </div>

      <Navbar />

      <main className="flex-1 z-10">
        <Dialog open={open} onOpenChange={(v)=>{setOpen(v); if(!v){ /* stay on page */ }}}>
          <DialogContent className="max-w-sm">
            <DialogHeader>
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2.5 rounded-xl bg-neon-green/20 shadow-[0_0_15px_rgba(0,255,136,0.2)]">
                  <UserPlus className="w-5 h-5 text-neon-green" />
                </div>
                <DialogTitle className="text-neon-green drop-shadow-[0_0_10px_rgba(0,255,136,0.5)] font-display">서버 참가 확인</DialogTitle>
              </div>
              <DialogDescription>아래 정보를 확인하고 참가를 진행하세요.</DialogDescription>
            </DialogHeader>
            <div className="py-4 space-y-3">
              <div className="flex justify-between items-center p-3 rounded-lg bg-white/5 border border-white/10">
                <span className="text-muted-foreground flex items-center gap-2 text-sm"><Server className="w-4 h-4 text-neon-cyan" />서버 이름</span>
                <span className="text-neon-cyan font-medium">{info?.serverName || ""}</span>
              </div>
            </div>
            <div className="flex justify-end space-x-2 pt-2">
              <DialogClose asChild>
                <Button variant="outline" onClick={()=>router.push("/")}>취소</Button>
              </DialogClose>
              <Button onClick={async()=>{
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
              }}>
                <UserPlus className="w-4 h-4 mr-2" />
                참가
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </main>
    </div>
  )
}
