"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"
import { serverService, Server as IServer } from "@/lib/server-service"
import { authService } from "@/lib/auth-service"
import { CreateServerModal } from "@/components/create-server-modal"
import { SearchServerModal } from "@/components/search-server-modal"
import { Navbar } from "@/components/navbar"
import { Plus, Users, Clock } from "lucide-react"
import { useProtectedRoute } from "../hooks/useProtectedRoute"

export default function DashboardPage() {
  useProtectedRoute()

  const [servers, setServers] = useState<IServer[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showSearchModal, setShowSearchModal] = useState(false)
  const router = useRouter()

  useEffect(() => {
    loadServers()
  }, [])

  const loadServers = async () => {
    setIsLoading(true)
    try {
      const data = await serverService.getMyServers()
      setServers(data)
    } catch {
      toast.error("서버 로드 실패", {
        description: "내 서버 정보를 불러오는데 실패했습니다.",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleServerCreated = (newServer: IServer) => {
    setServers((prev) => [...prev, newServer])
    setShowCreateModal(false)
    toast.success("서버 생성 완료", {
      description: `${newServer.name} 서버가 생성되었습니다.`,
    })
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

  // 현재 로그인한 유저의 ID
  const currentUserId = authService.getCurrentUserId()

  return (
    <div className="min-h-screen">
      <Navbar />
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">대시보드</h1>
            <p className="text-white/70">
              내가 참여한 서버를 관리하고 스케줄을 확인하세요
            </p>
          </div>
          <div className="flex">
            <Button
              onClick={() => setShowSearchModal(true)}
              className="mr-2 glass-button hover:bg-white/20 h-12 px-6"
            >
              서버 찾기
            </Button>
            <Button
              onClick={() => setShowCreateModal(true)}
              className="glass-button hover:bg-white/20 h-12 px-6"
            >
              <Plus className="mr-2 h-4 w-4" />서버 생성
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {servers.map((server) => {
            const isOwner = server.ownerId === currentUserId

            return (
              <Card
                key={server.id}
                className="glass bg-white/10 border-white/20 hover:bg-white/20 transition-all duration-300 lg:p-8"
              >
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-white">{server.name}</CardTitle>
                    <Badge variant="secondary" className="glass text-white">
                      {isOwner ? "소유자" : "멤버"}
                    </Badge>
                  </div>
                  <CardDescription className="text-white/70">
                    서버장: {server.owner}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center text-white/80">
                      <Users className="mr-2 h-4 w-4" />
                      <span>{server.members.length}명 참여</span>
                    </div>

                    <div className="flex items-center justify-between text-white/80">
                      <div className="flex items-center">
                        <Clock className="mr-2 h-4 w-4" />
                        <span>초기화: {server.resetTime}</span>
                      </div>
                      <Button
                        onClick={() => router.push(`/server/${server.id}`)}
                        className="glass-button hover:bg-white/20 h-15 px-8"
                        size="sm"
                      >
                        입장
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>

        {servers.length === 0 && (
          <div className="text-center py-12">
            <div className="glass max-w-md mx-auto p-8">
              <h3 className="text-xl font-semibold text-white mb-2">
                서버가 없습니다
              </h3>
              <p className="text-white/70 mb-4">
                서버를 찾거나 생성해보세요.
              </p>
              <Button
                onClick={() => setShowSearchModal(true)}
                className="glass-button hover:bg-white/20 h-12 px-6 mr-2"
              >
                서버 찾기
              </Button>
              <Button
                onClick={() => setShowCreateModal(true)}
                className="glass-button hover:bg-white/20 h-12 px-6"
              >
                서버 생성
              </Button>
            </div>
          </div>
        )}
      </div>

      <CreateServerModal
        open={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onServerCreated={handleServerCreated}
      />
      <SearchServerModal
        open={showSearchModal}
        onClose={() => setShowSearchModal(false)}
        onJoinSuccess={loadServers}
      />
    </div>
  )
}