"use client"

import { useState, useEffect } from "react"
import { useParams } from "next/navigation"
import { Navbar } from "@/components/navbar"
import { GameManagement } from "@/components/game-management"
import { TimetableView } from "@/components/timetable-view"
import { ServerOverview } from "@/components/server-overview"
import { toast } from "sonner"
import { serverService } from "@/lib/server-service"
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { useProtectedRoute } from "@/app/hooks/useProtectedRoute"

interface Server {
  id: number
  name: string
  owner: string
  members: string[]
  admins: string[]
  resetTime: string
}

export default function ServerDetailPage() {
  
  useProtectedRoute()
  const params = useParams()
  const serverId = Number.parseInt(params.id as string)
  const [server, setServer] = useState<Server | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    loadServer()
  }, [serverId])

  const loadServer = async () => {
    try {
      const data = await serverService.getServer(serverId)
      setServer(data)
    } catch (error) {
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

  return (
    <div className="min-h-screen">
      <Navbar />
      <div className="container mx-auto px-4 py-6">
        {/* ─── Server Header with Glass effect ─── */}
        <Card className="glass border-white/20 mb-6">
          <CardHeader className="space-y-1">
            <CardTitle className="text-3xl font-bold text-white">
              {server.name}
            </CardTitle>
            <CardDescription className="text-white/70">
              서버장: {server.owner}
            </CardDescription>
          </CardHeader>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-auto lg:h-[calc(100vh-200px)]">
          {/* 게임 관리 (왼쪽) */}
          <div className="lg:col-span-3">
            <GameManagement serverId={serverId} />
          </div>

          {/* 타임테이블 (중앙) */}
          <div className="lg:col-span-6">
            <TimetableView serverId={serverId} />
          </div>

          {/* 서버 개요 (오른쪽) */}
          <div className="lg:col-span-3">
            <ServerOverview server={server} onServerUpdate={setServer} />
          </div>
        </div>
      </div>
    </div>
  )
}
