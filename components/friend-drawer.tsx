"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { createPortal } from "react-dom"
import { X, UserPlus, Check, XCircle, Users, Trash2, Copy } from "lucide-react"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import { Input } from "@/components/ui/input"
import { friendService, FriendListResponse, PendingListResponse, FriendCodeResponse } from "@/lib/friend-service"

interface FriendDrawerProps {
  open: boolean
  onClose: () => void
}

export function FriendDrawer({ open, onClose }: FriendDrawerProps) {
  const panelRef = useRef<HTMLDivElement>(null)
  const overlayRef = useRef<HTMLDivElement>(null)
  const [friends, setFriends] = useState<FriendListResponse>({ friends: [] })
  const [received, setReceived] = useState<PendingListResponse>({ requests: [] })
  const [sent, setSent] = useState<PendingListResponse>({ requests: [] })
  const [friendCode, setFriendCode] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [myCode, setMyCode] = useState<FriendCodeResponse | null>(null)
  const uniqueFriends = useMemo(() => {
    const seen = new Set<number>()
    return friends.friends.filter((u) => {
      if (seen.has(u.id)) return false
      seen.add(u.id)
      return true
    })
  }, [friends])

  const [deleteOpen, setDeleteOpen] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<{ id: number; nickname: string } | null>(null)

  useEffect(() => {
    if (!open) return
    let isActive = true
    ;(async () => {
      setIsLoading(true)
      try {
        const [f, r, s, c] = await Promise.all([
          friendService.getFriends(),
          friendService.getPendingReceived(),
          friendService.getPendingSent(),
          friendService.getMyFriendCode(),
        ])
        if (!isActive) return
        setFriends(f)
        setReceived(r)
        setSent(s)
        setMyCode(c)
      } finally {
        if (isActive) setIsLoading(false)
      }
    })()
    return () => {
      isActive = false
    }
  }, [open])

  useEffect(() => {
    function handleOutside(e: MouseEvent) {
      if (!open) return
      const target = e.target as Node
      if (panelRef.current && !panelRef.current.contains(target)) {
        onClose()
      }
    }
    document.addEventListener("mousedown", handleOutside)
    return () => document.removeEventListener("mousedown", handleOutside)
  }, [open, onClose])

  const handleSendByCode = async () => {
    if (!friendCode.trim()) return
    setIsLoading(true)
    try {
      await friendService.sendRequestByCode(friendCode.trim())
      const r = await friendService.getPendingSent()
      setSent(r)
      setFriendCode("")
    } finally {
      setIsLoading(false)
    }
  }

  const handleRespond = async (requestId: number, accept: boolean) => {
    setIsLoading(true)
    try {
      await friendService.respond(requestId, accept)
      const [f, r] = await Promise.all([
        friendService.getFriends(),
        friendService.getPendingReceived(),
      ])
      setFriends(f)
      setReceived(r)
    } finally {
      setIsLoading(false)
    }
  }

  const [mounted, setMounted] = useState(false)
  useEffect(() => {
    setMounted(true)
  }, [])

  const drawerUi = (
    <>
      {/* Overlay */}
      <div
        ref={overlayRef}
        className={`fixed inset-0 transition-opacity duration-300 ${
          open ? "bg-black/70 backdrop-blur-sm pointer-events-auto" : "bg-black/0 pointer-events-none"
        } z-[10000]`}
        aria-hidden="true"
      />

      {/* Drawer Panel */}
      <div
        ref={panelRef}
        className={`fixed top-0 right-0 h-screen w-full sm:w-[420px] max-w-[100vw] bg-background/95 backdrop-blur-xl border-l border-neon-cyan/30 text-foreground z-[11000] transform transition-transform duration-300 ${
          open ? "translate-x-0" : "translate-x-full"
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-neon-cyan/20 bg-neon-cyan/5">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-neon-cyan/20 shadow-[0_0_15px_rgba(5,242,219,0.2)]">
              <Users className="w-5 h-5 text-neon-cyan" />
            </div>
            <h2 className="text-lg font-display font-semibold text-neon-cyan drop-shadow-[0_0_10px_rgba(5,242,219,0.5)]">
              친구
            </h2>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="text-muted-foreground hover:text-neon-cyan hover:bg-neon-cyan/10"
          >
            <X className="w-5 h-5" />
          </Button>
        </div>

        <div className="p-4 space-y-6 overflow-y-auto h-[calc(100vh-64px)]">
          {/* My Friend Code */}
          <div>
            <h3 className="text-sm font-medium mb-2 text-neon-cyan">내 친구코드</h3>
            <div className="flex items-center justify-between bg-neon-cyan/10 border border-neon-cyan/20 rounded-xl p-3">
              <div className="text-base font-mono tracking-[0.2em] text-white">{myCode?.code ?? "-"}</div>
              <Button
                variant="ghost"
                size="sm"
                className="text-neon-cyan hover:text-neon-cyan hover:bg-neon-cyan/20"
                onClick={async () => {
                  try {
                    if (myCode?.code) {
                      await navigator.clipboard.writeText(myCode.code)
                      toast.success("친구코드가 복사되었습니다")
                    }
                  } catch {
                    toast.error("친구코드 복사 실패")
                  }
                }}
              >
                <Copy className="w-4 h-4 mr-1" />
                복사
              </Button>
            </div>
          </div>

          {/* Add Friend by Code */}
          <div>
            <h3 className="text-sm font-medium mb-2 text-neon-cyan">친구 추가</h3>
            <div className="flex gap-2">
              <Input
                value={friendCode}
                onChange={(e) => {
                  const v = e.target.value.replace(/\D+/g, '')
                  setFriendCode(v)
                }}
                placeholder="친구 코드 입력 (예: 123456)"
                className="text-sm"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={6}
              />
              <Button onClick={handleSendByCode} disabled={isLoading} className="whitespace-nowrap">
                <UserPlus className="w-4 h-4 mr-1" />
                추가
              </Button>
            </div>
          </div>

          {/* Pending Received */}
          <div>
            <h3 className="text-sm font-medium mb-2 text-neon-green">받은 요청</h3>
            <div className="space-y-2">
              {received.requests.length === 0 && (
                <div className="text-muted-foreground text-sm p-3 rounded-xl bg-white/5 border border-white/10">
                  받은 요청이 없습니다.
                </div>
              )}
              {received.requests.map((r) => (
                <div key={r.requestId} className="flex items-center justify-between bg-neon-green/10 border border-neon-green/20 rounded-xl p-3">
                  <div>
                    <div className="text-sm font-medium text-white">{r.user.nickname}</div>
                    <div className="text-xs text-muted-foreground">@{r.user.username}</div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="icon"
                      variant="ghost"
                      className="hover:bg-neon-green/20 text-neon-green"
                      onClick={() => handleRespond(r.requestId, true)}
                      disabled={isLoading}
                    >
                      <Check className="w-4 h-4" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="hover:bg-neon-red/20 text-neon-red"
                      onClick={() => handleRespond(r.requestId, false)}
                      disabled={isLoading}
                    >
                      <XCircle className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Pending Sent */}
          <div>
            <h3 className="text-sm font-medium mb-2 text-neon-magenta">보낸 요청</h3>
            <div className="space-y-2">
              {sent.requests.length === 0 && (
                <div className="text-muted-foreground text-sm p-3 rounded-xl bg-white/5 border border-white/10">
                  보낸 요청이 없습니다.
                </div>
              )}
              {sent.requests.map((r) => (
                <div key={r.requestId} className="flex items-center justify-between bg-neon-magenta/10 border border-neon-magenta/20 rounded-xl p-3">
                  <div>
                    <div className="text-sm font-medium text-white">{r.user.nickname}</div>
                    <div className="text-xs text-muted-foreground">@{r.user.username}</div>
                  </div>
                  <div className="text-xs text-neon-magenta">대기중</div>
                </div>
              ))}
            </div>
          </div>

          {/* Friends list */}
          <div>
            <h3 className="text-sm font-medium mb-2 text-neon-pink">친구 목록</h3>
            <div className="space-y-2">
              {friends.friends.length === 0 && (
                <div className="text-muted-foreground text-sm p-3 rounded-xl bg-white/5 border border-white/10">
                  친구가 없습니다.
                </div>
              )}
              {uniqueFriends.map((u) => (
                <div key={`friend-${u.id}`} className="flex items-center justify-between bg-neon-pink/10 border border-neon-pink/20 rounded-xl p-3 hover:bg-neon-pink/15 transition-colors">
                  <div>
                    <div className="text-sm font-medium text-white">{u.nickname}</div>
                    <div className="text-xs text-muted-foreground">@{u.username}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      size="icon"
                      variant="ghost"
                      className="hover:bg-neon-red/20 text-neon-red"
                      disabled={isLoading}
                      title="친구 삭제"
                      onClick={() => {
                        setDeleteTarget({ id: u.id, nickname: u.nickname })
                        setDeleteOpen(true)
                      }}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Delete Confirmation Modal */}
        {deleteOpen && (
          <>
            <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[11001]" onClick={() => { setDeleteOpen(false); setDeleteTarget(null) }} />
            <div className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-[11002] w-[90%] max-w-sm bg-card/95 backdrop-blur-xl border border-neon-red/30 rounded-xl overflow-hidden shadow-[0_0_30px_rgba(255,51,102,0.2)]">
              <div className="p-4 border-b border-white/10">
                <h3 className="text-neon-red text-base font-display font-semibold">친구 삭제</h3>
              </div>
              <div className="p-4 text-foreground/80 text-sm">
                {deleteTarget ? `${deleteTarget.nickname} 님을 친구에서 삭제할까요?` : "선택된 친구가 없습니다."}
              </div>
              <div className="p-4 border-t border-white/10 flex justify-end gap-2">
                <Button
                  variant="outline"
                  onClick={() => { setDeleteOpen(false); setDeleteTarget(null) }}
                >
                  취소
                </Button>
                <Button
                  variant="destructive"
                  disabled={isLoading || !deleteTarget}
                  onClick={async () => {
                    if (!deleteTarget) return
                    setIsLoading(true)
                    try {
                      await friendService.deleteFriend(deleteTarget.id)
                      const f = await friendService.getFriends()
                      setFriends(f)
                      toast.success("친구를 삭제했습니다")
                    } catch {
                      toast.error("친구 삭제 실패")
                    } finally {
                      setIsLoading(false)
                      setDeleteOpen(false)
                      setDeleteTarget(null)
                    }
                  }}
                >
                  삭제
                </Button>
              </div>
            </div>
          </>
        )}
      </div>
    </>
  )

  if (!mounted) return null
  return createPortal(drawerUi, document.body)
}
