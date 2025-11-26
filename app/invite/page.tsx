"use client"

import { Suspense, useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogClose, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { serverService } from "@/lib/server-service"
import { authService } from "@/lib/auth-service"
import { toast } from "sonner"
import { Navbar } from "@/components/navbar"
import { Users, Clock, Server, UserPlus } from "lucide-react"

export default function InvitePage() {
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
      <InviteInner />
    </Suspense>
  )
}

function InviteInner() {
  const router = useRouter()
  const params = useSearchParams()
  const code = params.get("code") || ""
  const [open, setOpen] = useState(true)
  const [info, setInfo] = useState<{ id: number; name: string; members: number; resetTime: string } | null>(null)

  useEffect(() => {
    ;(async () => {
      if (!code) {
        toast.error("초대 코드가 필요합니다")
        router.replace("/")
        return
      }
      // 인증되지 않은 경우: 바로 로그인 유도 (lookup 호출하지 않음)
      if (!authService.isAuthenticated()) {
        toast.error("로그인을 먼저 해주세요")
        const returnUrl = `/invite?code=${encodeURIComponent(code)}`
        router.replace(`/auth/login?return=${encodeURIComponent(returnUrl)}`)
        return
      }
      try {
        const s = await serverService.lookupByCode(code)
        const me = authService.getCurrentUserId()
        const amMember = !!me && Array.isArray(s.members) && s.members.some((m:any)=> m.id === me)
        if (amMember) {
          toast.info("이미 서버에 참여중입니다")
          router.replace(`/server/${s.id}`)
          return
        }
        setInfo({ id: s.id as number, name: s.name, members: s.members?.length || 0, resetTime: s.resetTime })
      } catch (e: any) {
        if (typeof e?.message === 'string' && e.message.includes('UNAUTHORIZED')) {
          const returnUrl = `/invite?code=${encodeURIComponent(code)}`
          toast.error("로그인을 먼저 해주세요")
          router.replace(`/auth/login?return=${encodeURIComponent(returnUrl)}`)
          return
        }
        toast.error("유효하지 않은 초대 코드")
        router.replace("/")
      }
    })()
  }, [code, router])

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
        <Dialog open={open} onOpenChange={(v)=>{setOpen(v); if(!v) {/* stay */}}}>
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
                <span className="text-neon-cyan font-medium">{info?.name || ""}</span>
              </div>
              <div className="flex justify-between items-center p-3 rounded-lg bg-white/5 border border-white/10">
                <span className="text-muted-foreground flex items-center gap-2 text-sm"><Users className="w-4 h-4 text-neon-magenta" />참여자 수</span>
                <span className="text-neon-magenta font-medium">{info?.members ?? 0}명</span>
              </div>
              <div className="flex justify-between items-center p-3 rounded-lg bg-white/5 border border-white/10">
                <span className="text-muted-foreground flex items-center gap-2 text-sm"><Clock className="w-4 h-4 text-neon-pink" />초기화 시간</span>
                <span className="text-neon-pink font-medium">{info?.resetTime || ""}</span>
              </div>
            </div>
            <div className="flex justify-end space-x-2 pt-2">
              <DialogClose asChild>
                <Button variant="outline" onClick={()=>router.push("/")}>취소</Button>
              </DialogClose>
              <Button onClick={async()=>{
                try{
                  await serverService.joinByCode(code)
                  toast.success("서버 참가 완료")
                  router.replace(info ? `/server/${info.id}` : "/dashboard")
                }catch{
                  toast.info("이미 서버에 참여중입니다")
                  router.replace(info ? `/server/${info.id}` : "/dashboard")
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
