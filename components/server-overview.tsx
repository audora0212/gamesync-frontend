"use client"

import React, { useState, useEffect } from "react"
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
import { Users, Crown, Settings as SettingsIcon, BarChart3, UserPlus, Trash2 } from "lucide-react"
import { Dialog as ConfirmDialog, DialogContent as ConfirmContent, DialogHeader as ConfirmHeader, DialogFooter as ConfirmFooter, DialogTitle as ConfirmTitle, DialogClose as ConfirmClose } from "@/components/ui/dialog"
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
import { timetableService } from "@/lib/timetable-service"
import { friendService, type FriendListResponse } from "@/lib/friend-service"

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
  const currentUserId = authService.getCurrentUserId()
  const isOwner = server.ownerId === currentUserId
  const isAdmin = server.admins.some((a) => a.id === currentUserId)
  const isMember = server.members.some((m) => m.id === currentUserId)

  const [isLoading, setIsLoading] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const [newName, setNewName] = useState(server.name)
  const [newResetTime, setNewResetTime] = useState(server.resetTime)
  const [inviteOpen, setInviteOpen] = useState(false)
  const [friends, setFriends] = useState<FriendListResponse>({ friends: [] })
  const [inviteLoading, setInviteLoading] = useState(false)
  const [serverNameConfirm, setServerNameConfirm] = useState("")
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [requestedIds, setRequestedIds] = useState<Set<number>>(new Set())
  const [kickOpen, setKickOpen] = useState(false)
  const [kickTarget, setKickTarget] = useState<MemberInfo | null>(null)
  const [noStatsOpen, setNoStatsOpen] = useState(false)
  const [checkingStats, setCheckingStats] = useState(false)

  // 친구 목록 미리 로드 (멤버 리스트에서 친구추가 버튼 노출 판단)
  useEffect(() => {
    let active = true
    ;(async () => {
      try {
        const f = await friendService.getFriends()
        if (active) setFriends(f)
      } catch {}
    })()
    return () => { active = false }
  }, [])

  // 멤버 강퇴 핸들러
  async function handleConfirmKick() {
    if (!kickTarget) return
    setIsLoading(true)
    try {
      await serverService.kickMember(server.id, kickTarget.id)
      toast.success("멤버 강퇴 완료")
      const updated = await serverService.getServer(server.id)
      onServerUpdate(updated)
    } catch {
      toast.error("강퇴 실패")
    } finally {
      setIsLoading(false)
      setKickOpen(false)
      setKickTarget(null)
    }
  }

  // 관리자 임명 핸들러
  async function handleGrantAdmin(member: MemberInfo) {
    if (!confirm(`${member.nickname}을(를) 관리자로 임명하시겠습니까?`)) return
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
    if (!confirm(`${member.nickname} 관리자 권한을 해임하시겠습니까?`)) return
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
    <>
    <Card className="flex flex-col">
      <CardHeader>
        <CardTitle className="text-neon-cyan drop-shadow-[0_0_10px_rgba(5,242,219,0.5)] flex items-center">
          <Users className="mr-2 h-5 w-5 text-neon-cyan" /> 서버 개요
        </CardTitle>
        <CardDescription>
          서버 정보와 멤버를 관리합니다
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* 서버 기본 정보 */}
        <div className="space-y-3">
          <h3 className="text-neon-cyan font-medium text-sm">서버 정보</h3>
          <div className="space-y-2 text-sm text-foreground/70">
            <div className="flex justify-between">
              <span>서버 이름:</span>
              <span className="text-foreground">{server.name}</span>
            </div>
            <div className="flex justify-between">
              <span>초기화 시간:</span>
              <span className="text-neon-green">{server.resetTime}</span>
            </div>
            <div className="flex justify-between">
              <span>총 멤버:</span>
              <span className="text-neon-magenta">{server.members.length}명</span>
            </div>
            {/* 초대 */}
            {isMember && (
              <div className="pt-3 space-y-2">
                <div className="text-neon-pink text-sm">초대</div>
                <div className="flex items-center gap-3">
                  <Button
                    size="sm"
                    className="flex-1"
                    onClick={async () => {
                      setInviteOpen(true)
                      try {
                        const f = await friendService.getFriends()
                        setFriends(f)
                      } catch {
                        toast.error("친구 목록 로드 실패")
                      }
                    }}
                  >
                    <UserPlus className="h-4 w-4 mr-1" /> 친구 초대
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={async () => {
                      const origin = typeof window !== 'undefined' ? window.location.origin : ''
                      const link = `${origin}/invite?code=${server.inviteCode}`
                      try {
                        await navigator.clipboard.writeText(link)
                        toast.success("초대 링크가 복사되었습니다")
                      } catch {
                        toast.error("초대 링크 복사 실패")
                      }
                    }}
                  >
                    링크 복사
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* 멤버 목록 */}
        <div className="space-y-3">
          <h3 className="text-neon-cyan font-medium text-sm">멤버 목록</h3>
          <div className="space-y-2 max-h-48 overflow-y-auto overflow-x-hidden">
            {server.members.map((member) => (
              <div
                key={member.id}
                className="flex items-center justify-between px-3 py-2 bg-neon-cyan/5 rounded-xl border border-neon-cyan/20 hover:bg-neon-cyan/10 transition-colors"
              >
                {/* 닉네임 왼쪽 */}
                <span className="text-foreground text-sm truncate min-w-0 flex-1 mr-2" title={member.nickname}>
                  {member.nickname}
                </span>

                {/* 왕관 및 액션 버튼 우측 */}
                <div className="flex items-center space-x-2">
                  {member.id === server.ownerId && (
                    <Crown className="h-4 w-4 text-neon-yellow" />
                  )}
                  {server.admins.some((a) => a.id === member.id) &&
                    member.id !== server.ownerId && (
                      <Crown className="h-4 w-4 text-blue-400" />
                    )}

                  {/* 친구 추가 아이콘: 본인이 아니고, 아직 친구가 아니며, 요청을 보내지 않은 경우 */}
                  {member.id !== currentUserId &&
                    !friends.friends.some((f) => f.id === member.id) &&
                    !requestedIds.has(member.id) && (
                      <Button
                        size="icon"
                        variant="ghost"
                        className="hover:bg-neon-cyan/20 text-neon-cyan"
                        title="친구 추가"
                        onClick={async () => {
                          try {
                            await friendService.sendRequestByUserId(member.id)
                            toast.success("친구 요청을 보냈습니다")
                            setRequestedIds((prev) => {
                              const next = new Set(prev)
                              next.add(member.id)
                              return next
                            })
                          } catch {
                            toast.error("친구 요청 실패")
                          }
                        }}
                      >
                        <UserPlus className="h-4 w-4" />
                      </Button>
                    )}

                  {/* 소유자 또는 관리자만 액션 */}
                  {(isOwner || isAdmin) && member.id !== server.ownerId && (
                    <>
                      {/* 임명/해임 (소유자만) */}
                      {!server.admins.some((a) => a.id === member.id) && isOwner && (
                        <Button
                          onClick={() => handleGrantAdmin(member)}
                          size="sm"
                          variant="secondary"
                          disabled={isLoading}
                        >
                          임명
                        </Button>
                      )}
                      {server.admins.some((a) => a.id === member.id) && isOwner && (
                        <Button
                          onClick={() => handleRevokeAdmin(member)}
                          size="sm"
                          variant="outline"
                          disabled={isLoading}
                        >
                          해임
                        </Button>
                      )}

                      {/* 강퇴: 관리자에게는 표시하지 않음 */}
                      {!server.admins.some((a) => a.id === member.id) && (
                        <Button
                          onClick={() => { setKickTarget(member); setKickOpen(true) }}
                          size="sm"
                          variant="ghost"
                          className="text-neon-red hover:text-neon-red hover:bg-neon-red/20"
                          disabled={isLoading}
                        >
                          강퇴
                        </Button>
                      )}
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 통계 및 설정 버튼 */}
        <div className="space-y-3 pt-2">
          <Button
            variant="outline"
            className="w-full"
            disabled={checkingStats}
            onClick={async () => {
              setCheckingStats(true)
              try {
                const entries = await timetableService.getTimetable(server.id)
                if (!entries || entries.length === 0) {
                  setNoStatsOpen(true)
                  return
                }
                router.push(`/stats/${server.id}`)
              } catch {
                toast.error("통계 확인 실패", { description: "스케줄 정보를 확인할 수 없습니다." })
              } finally {
                setCheckingStats(false)
              }
            }}
          >
            <BarChart3 className="mr-2 h-4 w-4" /> 통계 보기
          </Button>
          {(isOwner || isAdmin) && (
            <Dialog open={showSettings} onOpenChange={setShowSettings}>
              <DialogTrigger asChild>
                <Button variant="secondary" className="w-full">
                  <SettingsIcon className="mr-2 h-4 w-4" /> 서버 설정
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <div className="flex items-center gap-3 mb-2">
                    <div className="p-2.5 rounded-xl bg-neon-cyan/20 shadow-[0_0_15px_rgba(5,242,219,0.2)]">
                      <SettingsIcon className="w-5 h-5 text-neon-cyan" />
                    </div>
                    <DialogTitle className="text-neon-cyan drop-shadow-[0_0_10px_rgba(5,242,219,0.5)] font-display">서버 설정</DialogTitle>
                  </div>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="space-y-1">
                    <Label htmlFor="srv-name">
                      서버 이름
                    </Label>
                    <Input
                      id="srv-name"
                      value={newName}
                      onChange={(e) => setNewName(e.target.value)}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="srv-reset">
                      초기화 시간
                    </Label>
                    <Input
                      id="srv-reset"
                      type="time"
                      value={newResetTime}
                      onChange={(e) => setNewResetTime(e.target.value)}
                    />
                  </div>
                </div>
                <DialogFooter>
                  <DialogClose asChild>
                    <Button variant="outline">
                      취소
                    </Button>
                  </DialogClose>
                  <Button
                    onClick={handleSaveSettings}
                    disabled={isLoading}
                  >
                    저장
                  </Button>
                </DialogFooter>
                {isOwner && (
                  <div className="mt-4 border-t border-white/10 pt-4 space-y-2">
                    <Label htmlFor="srv-delete-confirm" className="text-neon-red">서버 이름을 입력하여 삭제를 확인하세요</Label>
                    <Input
                      id="srv-delete-confirm"
                      value={serverNameConfirm}
                      onChange={(e) => setServerNameConfirm(e.target.value)}
                      placeholder={server.name}
                    />
                    <Button
                      variant="destructive"
                      className="w-full"
                      onClick={() => setDeleteOpen(true)}
                      disabled={isLoading || serverNameConfirm !== server.name}
                    >
                      <Trash2 className="mr-2 h-4 w-4" /> 서버 삭제
                    </Button>
                  </div>
                )}
              </DialogContent>
            </Dialog>
          )}
        </div>
      </CardContent>
    </Card>
    {/* 스케줄 없음 안내 모달 */}
    <Dialog open={noStatsOpen} onOpenChange={setNoStatsOpen}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2.5 rounded-xl bg-neon-yellow/20 shadow-[0_0_15px_rgba(255,215,0,0.2)]">
              <BarChart3 className="w-5 h-5 text-neon-yellow" />
            </div>
            <DialogTitle className="text-neon-yellow drop-shadow-[0_0_10px_rgba(255,215,0,0.5)] font-display">통계 데이터 없음</DialogTitle>
          </div>
        </DialogHeader>
        <div className="text-foreground/80 text-sm py-2">아직 통계가 없습니다. 스케줄을 먼저 등록해주세요.</div>
        <div className="flex justify-end space-x-2 pt-4">
          <DialogClose asChild>
            <Button variant="outline">닫기</Button>
          </DialogClose>
        </div>
      </DialogContent>
    </Dialog>
    {/* 초대 모달 */}
    <Dialog open={inviteOpen} onOpenChange={setInviteOpen} key="invite">
      <DialogContent className="max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2.5 rounded-xl bg-neon-green/20 shadow-[0_0_15px_rgba(0,255,136,0.2)]">
              <UserPlus className="w-5 h-5 text-neon-green" />
            </div>
            <DialogTitle className="text-neon-green drop-shadow-[0_0_10px_rgba(0,255,136,0.5)] font-display">친구 초대</DialogTitle>
          </div>
        </DialogHeader>
        <div className="space-y-2 max-h-72 overflow-y-auto">
          {friends.friends.filter((f) => !server.members.some((m) => m.id === f.id)).length === 0 && (
            <div className="text-muted-foreground text-sm p-3 rounded-xl bg-white/5 border border-white/10">초대 가능한 친구가 없습니다.</div>
          )}
          {friends.friends
            .filter((f) => !server.members.some((m) => m.id === f.id))
            .map((f) => (
            <div key={f.id} className="flex items-center justify-between p-3 bg-neon-green/5 border border-neon-green/20 rounded-xl hover:bg-neon-green/10 transition-colors">
              <div className="text-foreground text-sm">
                {f.nickname} <span className="text-muted-foreground">@{f.username}</span>
              </div>
              <Button
                size="sm"
                disabled={inviteLoading}
                onClick={async () => {
                  setInviteLoading(true)
                  try {
                    await serverService.inviteUser(server.id, f.id)
                    toast.success("초대가 전송되었습니다")
                  } catch {
                    toast.error("초대 전송 실패")
                  } finally {
                    setInviteLoading(false)
                  }
                }}
              >
                초대
              </Button>
            </div>
          ))}
        </div>
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline">닫기</Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
    {/* 강퇴 확인 다이얼로그 */}
    <ConfirmDialog open={kickOpen} onOpenChange={setKickOpen}>
      <ConfirmContent className="max-w-sm">
        <ConfirmHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2.5 rounded-xl bg-neon-red/20 shadow-[0_0_15px_rgba(255,51,102,0.2)]">
              <Users className="w-5 h-5 text-neon-red" />
            </div>
            <ConfirmTitle className="text-neon-red drop-shadow-[0_0_10px_rgba(255,51,102,0.5)] font-display">멤버 강퇴</ConfirmTitle>
          </div>
        </ConfirmHeader>
        <div className="text-foreground/80 text-sm py-2">
          {kickTarget ? `${kickTarget.nickname} 을(를) 강퇴하시겠습니까?` : "대상을 선택해주세요."}
        </div>
        <ConfirmFooter>
          <ConfirmClose asChild>
            <Button variant="outline">취소</Button>
          </ConfirmClose>
          <Button
            variant="destructive"
            disabled={isLoading || !kickTarget}
            onClick={handleConfirmKick}
          >
            강퇴
          </Button>
        </ConfirmFooter>
      </ConfirmContent>
    </ConfirmDialog>
    {/* 서버 삭제 확인 다이얼로그 */}
    <ConfirmDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
      <ConfirmContent className="max-w-sm">
        <ConfirmHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2.5 rounded-xl bg-neon-red/20 shadow-[0_0_15px_rgba(255,51,102,0.2)]">
              <Trash2 className="w-5 h-5 text-neon-red" />
            </div>
            <ConfirmTitle className="text-neon-red drop-shadow-[0_0_10px_rgba(255,51,102,0.5)] font-display">서버 삭제</ConfirmTitle>
          </div>
        </ConfirmHeader>
        <div className="text-foreground/80 text-sm py-2">
          정말 서버를 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.
        </div>
        <ConfirmFooter>
          <ConfirmClose asChild>
            <Button variant="outline">취소</Button>
          </ConfirmClose>
          <Button
            variant="destructive"
            disabled={isLoading || serverNameConfirm !== server.name}
            onClick={handleDeleteServer}
          >
            삭제
          </Button>
        </ConfirmFooter>
      </ConfirmContent>
    </ConfirmDialog>
    </>
  )
}
