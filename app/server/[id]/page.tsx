'use client'

import React, { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { motion } from "framer-motion"
import { Navbar } from "@/components/navbar"
import { TimetableView } from "@/components/timetable-view"
import { ServerOverview } from "@/components/server-overview"
import { GameManagement } from "@/components/game-management"
import { toast } from "sonner"
import { serverService, Server as IServer } from "@/lib/server-service"
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Dialog as ConfirmDialog, DialogContent as ConfirmContent, DialogHeader as ConfirmHeader, DialogTitle as ConfirmTitle, DialogClose as ConfirmClose } from "@/components/ui/dialog"
import { useProtectedRoute } from "@/app/hooks/useProtectedRoute"
import { Copy, ArrowLeft, LogOut, Gamepad2 } from "lucide-react"

async function copyText(text: string) {
  if (navigator.clipboard?.writeText) {
    return navigator.clipboard.writeText(text)
  } else {
    const textarea = document.createElement("textarea")
    textarea.value = text
    textarea.style.position = "fixed"
    textarea.style.opacity = "0"
    document.body.appendChild(textarea)
    textarea.focus()
    textarea.select()
    document.execCommand("copy")
    document.body.removeChild(textarea)
    return Promise.resolve()
  }
}

export default function ServerDetailPage() {
  useProtectedRoute()
  const params = useParams()
  const router = useRouter()
  const serverId = Number(params.id)

  const [server, setServer] = useState<IServer | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [leaveOpen, setLeaveOpen] = useState(false)

  useEffect(() => {
    loadServer()
  }, [serverId])

  async function loadServer() {
    try {
      const data = await serverService.getServer(serverId)
      setServer(data)
    } catch {
      toast.error("서버 정보 로드 실패", {
        description: "서버 정보를 불러오는데 실패했습니다.",
      })
    } finally {
      setIsLoading(false)
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        {/* 배경 효과 */}
        <div className="fixed inset-0 overflow-hidden pointer-events-none">
          <div className="absolute inset-0 bg-[linear-gradient(rgba(5,242,219,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(5,242,219,0.03)_1px,transparent_1px)] bg-[size:50px_50px]" />
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-neon-cyan/10 rounded-full blur-[150px]" />
          <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-neon-magenta/10 rounded-full blur-[150px]" />
        </div>
        <Navbar />
        <div className="flex-1 container mx-auto px-4 py-8 z-10">
          <div className="flex flex-col items-center justify-center h-64 gap-4">
            <div className="w-10 h-10 border-2 border-neon-cyan border-t-transparent rounded-full animate-spin shadow-[0_0_15px_rgba(5,242,219,0.5)]" />
            <p className="text-neon-cyan/80 text-sm font-medium">로딩 중...</p>
          </div>
        </div>
      </div>
    )
  }

  if (!server) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        {/* 배경 효과 */}
        <div className="fixed inset-0 overflow-hidden pointer-events-none">
          <div className="absolute inset-0 bg-[linear-gradient(rgba(5,242,219,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(5,242,219,0.03)_1px,transparent_1px)] bg-[size:50px_50px]" />
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-neon-cyan/10 rounded-full blur-[150px]" />
          <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-neon-magenta/10 rounded-full blur-[150px]" />
        </div>
        <Navbar />
        <div className="flex-1 container mx-auto px-4 py-8 z-10">
          <motion.div
            className="text-center py-12"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Card className="max-w-md mx-auto">
              <CardHeader className="text-center">
                <div className="w-16 h-16 rounded-2xl bg-neon-red/10 flex items-center justify-center mx-auto mb-4">
                  <Gamepad2 className="w-8 h-8 text-neon-red/50" />
                </div>
                <CardTitle className="text-neon-red drop-shadow-[0_0_10px_rgba(255,51,102,0.5)]">
                  서버를 찾을 수 없습니다
                </CardTitle>
                <CardDescription>
                  요청한 서버가 존재하지 않거나 접근 권한이 없습니다.
                </CardDescription>
              </CardHeader>
            </Card>
          </motion.div>
        </div>
      </div>
    )
  }

  const currentUser = localStorage.getItem("current-user")
  const isOwner = server.owner === currentUser

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* 배경 효과 */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute inset-0 bg-[linear-gradient(rgba(5,242,219,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(5,242,219,0.03)_1px,transparent_1px)] bg-[size:50px_50px]" />
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-neon-cyan/10 rounded-full blur-[150px]" />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-neon-magenta/10 rounded-full blur-[150px]" />
        <div className="absolute top-1/2 right-0 w-64 h-64 bg-neon-pink/5 rounded-full blur-[100px]" />
      </div>

      <Navbar />

      <main className="flex-1 container mx-auto px-4 py-6 z-10">
        {/* 모바일 전용 뒤로가기 버튼 */}
        <div className="mb-4 md:hidden flex justify-end">
          <Button
            variant="outline"
            onClick={() => router.push("/dashboard")}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            대시보드로 가기
          </Button>
        </div>

        {/* 서버 정보 카드 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Card className="mb-6">
            <CardHeader className="space-y-1">
              <CardTitle className="text-2xl sm:text-3xl font-display text-neon-cyan drop-shadow-[0_0_10px_rgba(5,242,219,0.5)]">
                {server.name}
              </CardTitle>
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 w-full">
                <CardDescription>
                  서버장: <span className="text-neon-cyan">{server.owner}</span>
                </CardDescription>
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 w-full sm:w-auto">
                  <CardDescription>
                    초대코드 <span className="text-neon-magenta font-mono tracking-wider">{server.inviteCode}</span>
                  </CardDescription>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={async () => {
                      try {
                        await copyText(server.inviteCode)
                        toast.success("초대 코드가 복사되었습니다")
                      } catch {
                        toast.error("초대 코드 복사 실패")
                      }
                    }}
                  >
                    <Copy className="w-4 h-4 mr-2" />
                    복사
                  </Button>
                </div>
              </div>
            </CardHeader>
          </Card>
        </motion.div>

        {/* 메인 레이아웃 */}
        <motion.div
          className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <div className="lg:col-span-9">
            <TimetableView serverId={serverId} />
          </div>
          <div className="lg:col-span-3 space-y-6">
            <ServerOverview
              server={server}
              onServerUpdate={(s) => setServer(s)}
            />
            <GameManagement serverId={serverId} />
            {!isOwner && (
              <>
                <Button
                  variant="destructive"
                  className="w-full"
                  onClick={() => setLeaveOpen(true)}
                >
                  <LogOut className="w-4 h-4 mr-2" />
                  서버 떠나기
                </Button>
                <ConfirmDialog open={leaveOpen} onOpenChange={setLeaveOpen}>
                  <ConfirmContent className="max-w-sm">
                    <ConfirmHeader>
                      <div className="flex items-center gap-3 mb-2">
                        <div className="p-2.5 rounded-xl bg-neon-red/20 shadow-[0_0_15px_rgba(255,51,102,0.2)]">
                          <LogOut className="w-5 h-5 text-neon-red" />
                        </div>
                        <ConfirmTitle className="text-neon-red drop-shadow-[0_0_10px_rgba(255,51,102,0.5)] font-display">
                          서버 떠나기
                        </ConfirmTitle>
                      </div>
                    </ConfirmHeader>
                    <div className="text-foreground/80 text-sm py-2">
                      이 서버를 떠나시겠습니까?
                    </div>
                    <div className="flex justify-end space-x-2 pt-4">
                      <ConfirmClose asChild>
                        <Button variant="outline">취소</Button>
                      </ConfirmClose>
                      <Button
                        variant="destructive"
                        onClick={async () => {
                          try {
                            await serverService.leaveServer(serverId)
                            toast.success("서버를 떠났습니다")
                            router.push("/dashboard")
                          } catch {
                            toast.error("서버 떠나기 실패")
                          } finally {
                            setLeaveOpen(false)
                          }
                        }}
                      >
                        떠나기
                      </Button>
                    </div>
                  </ConfirmContent>
                </ConfirmDialog>
              </>
            )}
          </div>
        </motion.div>
      </main>
    </div>
  )
}
