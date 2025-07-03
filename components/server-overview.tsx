// frontend/components/server-overview.tsx

"use client"

import React, { useState } from "react"
import { useRouter } from "next/navigation"
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import { Users, Crown, Settings as SettingsIcon, BarChart3 } from "lucide-react"
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { authService } from "@/lib/auth-service"
import { serverService, Server, MemberInfo } from "@/lib/server-service"

// Props 타입 정의
interface ServerOverviewProps {
  server: Server
  onServerUpdate: (srv: Server) => void
}

export function ServerOverview({
  server,
  onServerUpdate,
}: ServerOverviewProps) {
  const router = useRouter()
  const currentUser = authService.getCurrentUser()
  const isOwner = server.owner === currentUser
  const isAdmin = server.admins.some((a) => a.username === currentUser)

  const [isLoading, setIsLoading] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const [newName, setNewName] = useState(server.name)
  const [newResetTime, setNewResetTime] = useState(server.resetTime)

  // 멤버 강퇴 핸들러
  async function handleKickMember(member: MemberInfo) {
    if (!confirm(`${member.username}을(를) 강퇴하시겠습니까?`)) return
    setIsLoading(true)
    try {
      await serverService.kickMember(server.id, member.id)
      toast.success("멤버 강퇴 완료")
      const updated = await serverService.getServer(server.id)
      onServerUpdate(updated)
    } catch {
      toast.error("강퇴 실패")
    } finally {
      setIsLoading(false)
    }
  }

  // 관리자 임명 핸들러
  async function handleGrantAdmin(member: MemberInfo) {
    if (!confirm(`${member.username}을(를) 관리자로 임명하시겠습니까?`)) return
    setIsLoading(true)
    try {
      await serverService.updateAdmin(server.id, member.id, true)
      toast.success("관리자 임명 완료")
      const updated = await serverService.getServer(server.id)
      onServerUpdate(updated)
    } catch {
      toast.error("관리자 임명 실패")
    } finally {
      setIsLoading(false)
    }
  }

  // 관리자 해임 핸들러
  async function handleRevokeAdmin(member: MemberInfo) {
    if (!confirm(`${member.username} 관리자를 해임하시겠습니까?`)) return
    setIsLoading(true)
    try {
      await serverService.updateAdmin(server.id, member.id, false)
      toast.success("관리자 해임 완료")
      const updated = await serverService.getServer(server.id)
      onServerUpdate(updated)
    } catch {
      toast.error("관리자 해임 실패")
    } finally {
      setIsLoading(false)
    }
  }

  // 설정 저장 핸들러
  async function handleSaveSettings() {
    setIsLoading(true)
    try {
      if (newName !== server.name) {
        await serverService.renameServer(server.id, newName)
      }
      if (newResetTime !== server.resetTime) {
        await serverService.updateResetTime(server.id, newResetTime)
      }
      toast.success("설정 저장 완료")
      const updated = await serverService.getServer(server.id)
      onServerUpdate(updated)
      setShowSettings(false)
    } catch {
      toast.error("설정 저장 실패")
    } finally {
      setIsLoading(false)
    }
  }

  // 서버 삭제 핸들러 (소유자 전용)
  async function handleDeleteServer() {
    if (!confirm("정말 서버를 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.")) return
    setIsLoading(true)
    try {
      await serverService.deleteServer(server.id)
      toast.success("서버가 삭제되었습니다")
      router.push("/dashboard")
    } catch {
      toast.error("서버 삭제 실패")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card className="glass border-white/20 h-full flex flex-col">
      <CardHeader>
        <CardTitle className="text-white flex items-center">
          <Users className="mr-2 h-5 w-5 text-white" /> 서버 개요
        </CardTitle>
        <CardDescription className="text-white/70">
          서버 정보와 멤버를 관리합니다
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6 flex-grow">
        {/* 서버 기본 정보 */}
        <div className="space-y-3">
          <h3 className="text-white font-medium">서버 정보</h3>
          <div className="space-y-2 text-sm text-white/70">
            <div className="flex justify-between">
              <span>서버 이름:</span>
              <span>{server.name}</span>
            </div>
            <div className="flex justify-between">
              <span>초기화 시간:</span>
              <span>{server.resetTime}</span>
            </div>
            <div className="flex justify-between">
              <span>총 멤버:</span>
              <span>{server.members.length}명</span>
            </div>
          </div>
        </div>

        {/* 멤버 목록 */}
        <div className="space-y-3">
          <h3 className="text-white font-medium">멤버 목록</h3>
          <div className="space-y-2 max-h-48 overflow-y-auto overflow-x-hidden">
            {server.members.map((member) => (
              <div
                key={member.id}
                className="flex items-center justify-between pl-4 p-2 glass rounded-lg hover:bg-black/10"
              >
                <div className="flex items-center space-x-2 truncate">
                  <span className="text-white text-sm truncate w-32">
                    {member.username}
                  </span>
                  {member.username === server.owner && (
                    <Crown className="h-4 w-4 text-yellow-400" />
                  )}
                  {server.admins.some((a) => a.id === member.id) &&
                    member.username !== server.owner && (
                      <Crown className="h-4 w-4 text-blue-400" />
                    )}
                </div>
                <div className="flex space-x-2">
                  {(isOwner || isAdmin) &&
                    member.username !== server.owner && (
                      <>
                        {!server.admins.some((a) => a.id === member.id) &&
                          isOwner && (
                            <Button
                              onClick={() => handleGrantAdmin(member)}
                              size="sm"
                              variant="ghost"
                              className="text-blue-400 truncate hover:text-blue-300 hover:bg-blue-500/20"
                              disabled={isLoading}
                            >
                              임명
                            </Button>
                          )}
                        {server.admins.some((a) => a.id === member.id) &&
                          isOwner && (
                            <Button
                              onClick={() => handleRevokeAdmin(member)}
                              size="sm"
                              variant="ghost"
                              className="text-gray-400 truncate hover:text-gray-300 hover:bg-gray-500/20"
                              disabled={isLoading}
                            >
                              해임
                            </Button>
                          )}
                        <Button
                          onClick={() => handleKickMember(member)}
                          size="sm"
                          variant="ghost"
                          className="text-red-400 truncate hover:text-red-300 hover:bg-red-500/20"
                          disabled={isLoading}
                        >
                          강퇴
                        </Button>
                      </>
                    )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 통계 및 설정 버튼 */}
        <div className="space-y-2 p-4">
          <Button
            variant="outline"
            className="w-full glass border-white/30 text-white hover:bg-black/10"
            disabled={!isAdmin && !isOwner}
            onClick={() => router.push(`/stats/${server.id}`)}
          >
            <BarChart3 className="mr-2 h-4 w-4 text-white" /> 통계 보기
          </Button>
          {(isOwner || isAdmin) && (
            <Dialog open={showSettings} onOpenChange={setShowSettings}>
              <DialogTrigger asChild>
                <Button className="w-full glass border-white/30 text-white hover:bg-black/10">
                  <SettingsIcon className="mr-2 h-4 w-4 text-white" /> 서버 설정
                </Button>
              </DialogTrigger>
              <DialogContent className="glass border-white/20 max-w-md">
                <DialogHeader>
                  <DialogTitle className="text-white">서버 설정</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="space-y-1">
                    <Label htmlFor="srv-name" className="text-white">
                      서버 이름
                    </Label>
                    <Input
                      id="srv-name"
                      value={newName}
                      onChange={(e) => setNewName(e.target.value)}
                      className="glass border-white/30 text-white"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="srv-reset" className="text-white">
                      초기화 시간
                    </Label>
                    <Input
                      id="srv-reset"
                      type="time"
                      value={newResetTime}
                      onChange={(e) => setNewResetTime(e.target.value)}
                      className="glass border-white/30 text-white"
                    />
                  </div>
                </div>
                <DialogFooter>
                  <DialogClose asChild>
                    <Button
                      variant="outline"
                      className="glass border-white/30 text-white hover:bg-black/10"
                    >
                      취소
                    </Button>
                  </DialogClose>
                  <Button
                    onClick={handleSaveSettings}
                    className="glass-button text-white"
                    disabled={isLoading}
                  >
                    저장
                  </Button>
                </DialogFooter>
                {isOwner && (
                  <div className="mt-4 border-t border-white/20 pt-4">
                    <Button
                      variant="destructive"
                      className="w-full"
                      onClick={handleDeleteServer}
                      disabled={isLoading}
                    >
                      서버 삭제
                    </Button>
                  </div>
                )}
              </DialogContent>
            </Dialog>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
