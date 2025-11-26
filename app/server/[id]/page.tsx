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
import { Copy, ArrowLeft, LogOut } from "lucide-react"

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
      <div className="min-h-screen grid-bg">
        <Navbar />
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center h-64">
            <div className="text-muted-foreground">로딩 중...</div>
          </div>
        </div>
      </div>
    )
  }

  if (!server) {
    return (
      <div className="min-h-screen grid-bg">
        <Navbar />
        <div className="container mx-auto px-4 py-8">
          <motion.div
            className="text-center py-12"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="card-cyber max-w-md mx-auto p-8">
              <h2 className="text-2xl font-bold neon-text-primary mb-2">
                서버를 찾을 수 없습니다
              </h2>
              <p className="text-muted-foreground">
                요청한 서버가 존재하지 않거나 접근 권한이 없습니다.
              </p>
            </div>
          </motion.div>
        </div>
      </div>
    )
  }

  const currentUser = localStorage.getItem("current-user")
  const isOwner = server.owner === currentUser

  return (
    <div className="min-h-screen grid-bg">
      <Navbar />
      <div className="container mx-auto px-4 py-6">
        {/* 모바일 전용 뒤로가기 버튼: 우측 정렬 */}
        <div className="mb-4 md:hidden flex justify-end">
          <Button
            className="btn-cyber-outline text-sm px-4 py-2"
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
          <Card className="card-cyber mb-6">
            <CardHeader className="space-y-1">
              <CardTitle className="text-3xl font-bold neon-text-primary">
                {server.name}
              </CardTitle>
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 w-full">
                <CardDescription className="text-white/70">
                  서버장: <span className="text-cyan-400">{server.owner}</span>
                </CardDescription>
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 w-full sm:w-auto">
                  <CardDescription className="text-white/70">
                    초대코드 <span className="text-purple-400 font-mono">{server.inviteCode}</span>
                  </CardDescription>
                  <Button
                    className="w-full sm:w-auto btn-cyber-purple-outline text-sm px-4 py-2"
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

        {/* 메인 레이아웃: 모바일은 세로, 데스크탑은 9:3 컬럼 */}
        <motion.div
          className="grid grid-cols-1 lg:grid-cols-12 gap-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <div className="lg:col-span-9">
            <TimetableView serverId={serverId} />
          </div>
          <div className="lg:col-span-3 flex flex-col gap-6">
            <ServerOverview
              server={server}
              onServerUpdate={(s) => setServer(s)}
            />
            <GameManagement serverId={serverId} />
            {!isOwner && (
              <>
                <Button
                  className="w-full mt-2 btn-cyber-pink-outline"
                  onClick={() => setLeaveOpen(true)}
                >
                  <LogOut className="w-4 h-4 mr-2" />
                  서버 떠나기
                </Button>
                <ConfirmDialog open={leaveOpen} onOpenChange={setLeaveOpen}>
                  <ConfirmContent className="card-cyber border-pink-500/30 max-w-sm">
                    <ConfirmHeader>
                      <ConfirmTitle className="neon-text-accent">서버 떠나기</ConfirmTitle>
                    </ConfirmHeader>
                    <div className="text-white/80 text-sm">이 서버를 떠나시겠습니까?</div>
                    <div className="flex justify-end space-x-2 pt-4">
                      <ConfirmClose asChild>
                        <Button className="btn-cyber-outline text-sm px-4 py-2">취소</Button>
                      </ConfirmClose>
                      <Button
                        className="btn-cyber-pink text-sm px-4 py-2"
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
      </div>
    </div>
  )
}
