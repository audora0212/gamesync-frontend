"use client"

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
import { useProtectedRoute } from "@/app/hooks/useProtectedRoute"

export default function ServerDetailPage() {
  useProtectedRoute()
  const params = useParams()
  const router = useRouter()
  const serverId = Number(params.id)

  const [server, setServer] = useState<IServer | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    loadServer()
  }, [serverId])

  async function loadServer() {
    try {
      const data = await serverService.getServer(serverId)
      console.log("서버 정보:", data)
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
        <Card className="glass border-white/20 mb-6">
          <CardHeader className="space-y-1">
            <CardTitle className="text-3xl font-bold text-white">
              {server.name}
            </CardTitle>
            <div className="flex items-center justify-between">
              <CardDescription className="text-white/70">
                서버장: {server.owner}
              </CardDescription>
              <div className="flex items-center">
                <CardDescription className="text-white/70">
                  초대코드 {server.inviteCode}
                </CardDescription>
                <Button
                  variant="outline"
                  className="w-full glass-button text-white hover:bg-black/10"
                  onClick={() => {
                    navigator.clipboard.writeText(server.inviteCode)
                      .then(() => toast.success("초대 코드가 복사되었습니다"))
                      .catch(() => toast.error("초대 코드 복사 실패"))
                  }}
                >
                  복사
                </Button>
              </div>
            </div>
          </CardHeader>
        </Card>

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
              <Button
                variant="destructive"
                className="w-full mt-2 glass-button"
                onClick={async () => {
                  if (!confirm("이 서버를 떠나시겠습니까?")) return
                  try {
                    await serverService.leaveServer(serverId)
                    toast.success("서버를 떠났습니다")
                    router.push("/dashboard")
                  } catch {
                    toast.error("서버 떠나기 실패")
                  }
                }}
              >
                서버 떠나기
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
