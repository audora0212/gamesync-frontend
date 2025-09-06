'use client'

import React, { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
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
      <div className="min-h-screen">
        <Navbar />
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center h-64">
            <div className="text-white">로딩 중...</div>
          </div>
        </div>
      </div>
    )
  }

  if (!server) {
    return (
      <div className="min-h-screen">
        <Navbar />
        <div className="container mx-auto px-4 py-8">
          <div className="text-center py-12">
            <h2 className="text-2xl font-bold text-white mb-2">
              서버를 찾을 수 없습니다
            </h2>
            <p className="text-white/70">
              요청한 서버가 존재하지 않거나 접근 권한이 없습니다.
            </p>
          </div>
        </div>
      </div>
    )
  }

  const currentUser = localStorage.getItem("current-user")
  const isOwner = server.owner === currentUser

  return (
    <div className="min-h-screen">
      <Navbar />
      <div className="container mx-auto px-4 py-6">
        {/* 모바일 전용 뒤로가기 버튼: 우측 정렬 */}
        <div className="mb-4 md:hidden flex justify-end">
          <Button
            variant="outline"
            className="glass border-white/30 text-white hover:bg-black/10 hover:text-white"
            onClick={() => router.push("/dashboard")}
          >
            대시보드로 가기
          </Button>
        </div>
        {/* 서버 정보 카드 */}
        <Card className="glass border-white/20 mb-6">
          <CardHeader className="space-y-1">
            <CardTitle className="text-3xl font-bold text-white">
              {server.name}
            </CardTitle>
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 w-full">
              <CardDescription className="text-white/70">
                서버장: {server.owner}
              </CardDescription>
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 w-full sm:w-auto">
                <CardDescription className="text-white/70">
                  초대코드 {server.inviteCode}
                </CardDescription>
                <Button
                  variant="outline"
                  className="w-full sm:w-auto glass border-white/30 text-white hover:bg-black/10 hover:text-white"
                  onClick={async () => {
                    try {
                      await copyText(server.inviteCode)
                      toast.success("초대 코드가 복사되었습니다")
                    } catch {
                      toast.error("초대 코드 복사 실패")
                    }
                  }}
                >
                  복사
                </Button>
              </div>
            </div>
          </CardHeader>
        </Card>

        {/* 메인 레이아웃: 모바일은 세로, 데스크탑은 9:3 컬럼 */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
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
                  variant="destructive"
                  className="w-full mt-2 glass-button"
                  onClick={() => setLeaveOpen(true)}
                >
                  서버 떠나기
                </Button>
                <ConfirmDialog open={leaveOpen} onOpenChange={setLeaveOpen}>
                  <ConfirmContent className="glass border-white/20 max-w-sm">
                    <ConfirmHeader>
                      <ConfirmTitle className="text-white">서버 떠나기</ConfirmTitle>
                    </ConfirmHeader>
                    <div className="text-white/80 text-sm">이 서버를 떠나시겠습니까?</div>
                    <div className="flex justify-end space-x-2 pt-4">
                      <ConfirmClose asChild>
                        <Button variant="outline" className="glass border-white/30 text-white">취소</Button>
                      </ConfirmClose>
                      <Button
                        className="glass-button bg-red-500/20 hover:bg-red-500/30 text-red-300"
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
        </div>
      </div>
    </div>
  )
}
