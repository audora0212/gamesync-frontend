"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"
import { authService } from "@/lib/auth-service"
import { Users, Crown, Shield, Settings, BarChart3 } from "lucide-react"
import Link from "next/link"

interface Server {
  id: number
  name: string
  owner: string
  members: string[]
  admins: string[]
  resetTime: string
}

interface ServerOverviewProps {
  server: Server
  onServerUpdate: (server: Server) => void
}

export function ServerOverview({ server, onServerUpdate }: ServerOverviewProps) {
  const [isLoading, setIsLoading] = useState(false)
  const currentUser = authService.getCurrentUser()
  const isOwner = server.owner === currentUser
  const isAdmin = server.admins.includes(currentUser || "")

  const handleKickMember = async (username: string) => {
    if (!confirm(`${username}을(를) 강퇴하시겠습니까?`)) return

    setIsLoading(true)
    try {
      toast.error("기능 준비 중", {
        description: "멤버 강퇴 기능은 준비 중입니다.",
      })
    } catch {
      toast.error("강퇴 실패", {
        description: "멤버 강퇴 중 오류가 발생했습니다.",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card className="glass border-white/20 h-full">
      <CardHeader>
        <CardTitle className="text-white flex items-center">
          <Users className="mr-2 h-5 w-5 text-white" />
          서버 개요
        </CardTitle>
        <CardDescription className="text-white/70">서버 정보와 멤버를 관리하세요</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* 서버 정보 */}
        <div className="space-y-3">
          <h3 className="text-white font-medium">서버 정보</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-white/70">서버 이름:</span>
              <span className="text-white">{server.name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-white/70">초기화 시간:</span>
              <span className="text-white">{server.resetTime}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-white/70">총 멤버:</span>
              <span className="text-white">{server.members.length}명</span>
            </div>
          </div>
        </div>

        {/* 멤버 목록 */}
        <div className="space-y-3">
          <h3 className="text-white font-medium">멤버 목록</h3>
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {server.members.map((member) => (
              <div
                key={member}
                className="flex items-center justify-between pl-4 p-2 glass rounded-lg hover:bg-black/10"
              >
                <div className="flex items-center space-x-2">
                  <span className="text-white text-sm">{member}</span>
                  {server.owner === member && <Crown className="h-4 w-4 text-yellow-400" />}
                  {server.admins.includes(member) && server.owner !== member && (
                    <Shield className="h-4 w-4 text-blue-400" />
                  )}
                </div>
                {(isOwner || isAdmin) && member !== server.owner && member !== currentUser && (
                  <Button
                    onClick={() => handleKickMember(member)}
                    size="sm"
                    variant="ghost"
                    className="text-red-400 hover:text-red-300 hover:bg-red-500/20"
                    disabled={isLoading}
                  >
                    강퇴
                  </Button>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* 액션 버튼 */}
        <div className="space-y-2">
          <Link href={`/stats/${server.id}`}>
            <Button
              variant="outline"
              className="w-full glass border-white/30 text-white hover:bg-black/10 hover:text-white"
            >
              <BarChart3 className="mr-2 h-4 w-4 text-white" />
              통계 보기
            </Button>
          </Link>
          {(isOwner || isAdmin) && (
            <Button
              variant="outline"
              className="w-full glass border-white/30 text-white hover:bg-black/10 hover:text-white"
            >
              <Settings className="mr-2 h-4 w-4 text-white" />
              서버 설정
            </Button>
          )}
        </div>

        {/* 권한 표시 */}
        <div className="pt-4 border-t border-white/20">
          <div className="flex flex-wrap gap-2">
            {isOwner && (
              <Badge variant="secondary" className="glass text-white hover:bg-black/10">
                <Crown className="mr-1 h-3 w-3 text-white" />
                소유자
              </Badge>
            )}
            {isAdmin && !isOwner && (
              <Badge variant="secondary" className="glass text-white hover:bg-black/10">
                <Shield className="mr-1 h-3 w-3 text-white" />
                관리자
              </Badge>
            )}
            <Badge variant="outline" className="glass border-white/30 text-white hover:bg-black/10">
              멤버
            </Badge>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
