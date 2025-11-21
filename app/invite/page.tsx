"use client"

import { Suspense, useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogClose, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { serverService } from "@/lib/server-service"
import { authService } from "@/lib/auth-service"
import { toast } from "sonner"
import { Navbar } from "@/components/navbar"

export default function InvitePage() {
  // useSearchParams()를 사용하는 클라이언트 컴포넌트를 Suspense 경계로 감쌉니다
  return (
    <Suspense fallback={<div className="min-h-screen"><Navbar /></div>}>
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
          // fetch-with-auth가 로그인으로 이동; 로그인 후 이 페이지로 복귀하도록 쿼리 보존
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
    <div className="min-h-screen">
      <Navbar />
      <Dialog open={open} onOpenChange={(v)=>{setOpen(v); if(!v) {/* stay */}}}>
        <DialogContent className="glass border-white/20 max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-white">서버 참가 확인</DialogTitle>
            <DialogDescription className="text-white/60">아래 정보를 확인하고 참가를 진행하세요.</DialogDescription>
          </DialogHeader>
          <div className="p-4 space-y-2 text-white">
            <div className="flex justify-between"><span className="text-white/70">서버 이름</span><span>{info?.name || ""}</span></div>
            <div className="flex justify-between"><span className="text-white/70">참여자 수</span><span>{info?.members ?? 0}명</span></div>
            <div className="flex justify-between"><span className="text-white/70">초기화 시간</span><span>{info?.resetTime || ""}</span></div>
          </div>
          <div className="flex justify-end space-x-2 pt-2">
            <DialogClose asChild>
              <Button variant="outline" className="glass border-white/30 text-white" onClick={()=>router.push("/")}>취소</Button>
            </DialogClose>
            <Button className="glass-button text-white" onClick={async()=>{
              try{
                await serverService.joinByCode(code)
                toast.success("서버 참가 완료")
                router.replace(info ? `/server/${info.id}` : "/dashboard")
              }catch{
                toast.info("이미 서버에 참여중입니다")
                router.replace(info ? `/server/${info.id}` : "/dashboard")
              }
            }}>참가</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}


