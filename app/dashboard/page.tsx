"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"
import { serverService } from "@/lib/server-service"
import { authService } from "@/lib/auth-service"
import { CreateServerModal } from "@/components/create-server-modal"
import { Navbar } from "@/components/navbar"
import { Plus, Users, Clock } from "lucide-react"

interface Server {
  id: number
  name: string
  owner: string
  members: string[]
  admins: string[]
  resetTime: string
}

export default function DashboardPage() {
  const [servers, setServers] = useState<Server[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const router = useRouter()

  useEffect(() => {
    loadServers()
  }, [])

  const loadServers = async () => {
    try {
      const data = await serverService.getServers()
      setServers(data)
    } catch (error) {
      toast.error("서버 목록 로드 실패", {
        description: "서버 목록을 불러오는데 실패했습니다.",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleServerCreated = (newServer: Server) => {
    setServers([...servers, newServer])
    setShowCreateModal(false)
    toast.success("서버 생성 완료", {
      description: `${newServer.name} 서버가 생성되었습니다.`,
    })
  }

  const handleJoinServer = async (serverId: number) => {
    try {
      await serverService.joinServer(serverId)
      await loadServers()
      toast.success("서버 참가 완료", {
        description: "서버에 성공적으로 참가했습니다.",
      })
    } catch (error) {
      toast.error("서버 참가 실패", {
        description: "서버 참가에 실패했습니다.",
      })
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

  return (
    <div className="min-h-screen">
      <Navbar />
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">대시보드</h1>
            <p className="text-white/70">게임 서버를 관리하고 스케줄을 확인하세요</p>
          </div>
          <Button onClick={() => setShowCreateModal(true)} className="glass-button">
            <Plus className="mr-2 h-4 w-4" />
            서버 생성
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {servers.map((server) => (
            <Card
              key={server.id}
              className="glass bg-white/10 border-white/20 hover:bg-white/20 transition-all duration-300"
            >
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-white">{server.name}</CardTitle>
                  <Badge variant="secondary" className="glass text-white">
                    {server.owner === authService.getCurrentUser() ? "소유자" : "멤버"}
                  </Badge>
                </div>
                <CardDescription className="text-white/70">서버장: {server.owner}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center text-white/80">
                    <Users className="mr-2 h-4 w-4" />
                    <span>{server.members.length}명 참여</span>
                  </div>
                  <div className="flex items-center text-white/80">
                    <Clock className="mr-2 h-4 w-4" />
                    <span>초기화: {server.resetTime}</span>
                  </div>
                  <div className="flex gap-2 pt-2">
                    <Button
                      onClick={() => router.push(`/server/${server.id}`)}
                      className="flex-1 glass-button"
                      size="sm"
                    >
                      입장
                    </Button>
                    {server.owner !== authService.getCurrentUser() && (
                      <Button
                        onClick={() => handleJoinServer(server.id)}
                        variant="outline"
                        className="glass border-white/30 text-white hover:bg-white/20"
                        size="sm"
                      >
                        참가
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {servers.length === 0 && (
          <div className="text-center py-12">
            <div className="glass-card max-w-md mx-auto">
              <h3 className="text-xl font-semibold text-white mb-2">서버가 없습니다</h3>
              <p className="text-white/70 mb-4">새 서버를 생성하거나 다른 서버에 참가해보세요.</p>
              <Button onClick={() => setShowCreateModal(true)} className="glass-button">
                <Plus className="mr-2 h-4 w-4" />첫 서버 만들기
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
    </div>
  )
}
