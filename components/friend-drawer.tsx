"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { createPortal } from "react-dom"
import { X, UserPlus, Check, XCircle, Users, Trash2 } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogFooter, DialogTitle, DialogClose } from "@/components/ui/dialog"
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

  // 클라이언트 마운트 이후에만 포털 렌더링하여 SSR/CSR 불일치 방지
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
          open ? "bg-black/60 pointer-events-auto" : "bg-black/0 pointer-events-none"
        } z-[10000]`}
        aria-hidden="true"
      />

      {/* Drawer Panel */}
      <div
        ref={panelRef}
        className={`fixed top-0 right-0 h-screen w-full sm:w-[420px] max-w-[100vw] bg-background border-l border-white/10 text-foreground z-[10001] transform transition-transform duration-300 ${
          open ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between p-4 border-b border-white/10">
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            <h2 className="text-lg font-semibold">친구</h2>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose} className="text-muted-foreground hover:bg-white/10">
            <X className="w-5 h-5" />
          </Button>
        </div>

        <div className="p-4 space-y-6 overflow-y-auto h-[calc(100vh-64px)]">
          {/* My Friend Code */}
          <div>
            <h3 className="text-sm font-semibold mb-2">내 친구코드</h3>
            <div className="flex items-center justify-between bg-white/5 border border-white/10 rounded-md p-2">
              <div className="text-base font-mono tracking-widest">{myCode?.code ?? "-"}</div>
              <Button
                variant="ghost"
                size="sm"
                className="text-muted-foreground hover:bg-white/10"
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
                복사
              </Button>
            </div>
          </div>
          {/* Add Friend by Code */}
          <div>
            <h3 className="text-sm font-semibold mb-2">친구 추가</h3>
            <div className="flex gap-2">
              <Input
                value={friendCode}
                onChange={(e) => setFriendCode(e.target.value)}
                placeholder="친구 코드 입력 (예: 123456)"
                className="bg-white/5 border-white/10 text-foreground placeholder:text-muted-foreground"
              />
              <Button onClick={handleSendByCode} disabled={isLoading} className="whitespace-nowrap">
                <UserPlus className="w-4 h-4 mr-1" />추가
              </Button>
            </div>
          </div>

          {/* Pending Received */}
          <div>
            <h3 className="text-sm font-semibold mb-2">받은 요청</h3>
            <div className="space-y-2">
              {received.requests.length === 0 && (
                <div className="text-muted-foreground text-sm">받은 요청이 없습니다.</div>
              )}
              {received.requests.map((r) => (
                <div key={r.requestId} className="flex items-center justify-between bg-white/5 border border-white/10 rounded-md p-2">
                  <div>
                    <div className="text-sm font-medium">{r.user.nickname}</div>
                    <div className="text-xs text-muted-foreground">@{r.user.username}</div>
                  </div>
                  <div className="flex gap-2">
                    <Button size="icon" variant="ghost" className="hover:bg-white/10" onClick={() => handleRespond(r.requestId, true)} disabled={isLoading}>
                      <Check className="w-4 h-4" />
                    </Button>
                    <Button size="icon" variant="ghost" className="hover:bg-white/10" onClick={() => handleRespond(r.requestId, false)} disabled={isLoading}>
                      <XCircle className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Pending Sent */}
          <div>
            <h3 className="text-sm font-semibold mb-2">보낸 요청</h3>
            <div className="space-y-2">
              {sent.requests.length === 0 && (
                <div className="text-muted-foreground text-sm">보낸 요청이 없습니다.</div>
              )}
              {sent.requests.map((r) => (
                <div key={r.requestId} className="flex items-center justify-between bg-white/5 border border-white/10 rounded-md p-2">
                  <div>
                    <div className="text-sm font-medium">{r.user.nickname}</div>
                    <div className="text-xs text-muted-foreground">@{r.user.username}</div>
                  </div>
                  <div className="text-xs text-muted-foreground">대기중</div>
                </div>
              ))}
            </div>
          </div>

          {/* Friends list */}
          <div>
            <h3 className="text-sm font-semibold mb-2">친구 목록</h3>
            <div className="space-y-2">
              {friends.friends.length === 0 && (
                <div className="text-muted-foreground text-sm">친구가 없습니다.</div>
              )}
              {uniqueFriends.map((u) => (
                <div key={`friend-${u.id}`} className="flex items-center justify-between bg-white/5 border border-white/10 rounded-md p-2">
                  <div>
                    <div className="text-sm font-medium">{u.nickname}</div>
                    <div className="text-xs text-muted-foreground">@{u.username}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      size="icon"
                      variant="ghost"
                      className="hover:bg-white/10 text-red-400"
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
      </div>
    </>
  )

  if (!mounted) return null
  return createPortal(
    <>
      {drawerUi}
      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent className="glass border-white/20 max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-white">친구 삭제</DialogTitle>
          </DialogHeader>
          <div className="text-white/80 text-sm">
            {deleteTarget ? `${deleteTarget.nickname} 님을 친구에서 삭제할까요?` : "선택된 친구가 없습니다."}
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline" className="glass border-white/30 text-white">취소</Button>
            </DialogClose>
            <Button
              className="glass-button bg-red-500/20 hover:bg-red-500/30 text-red-300"
              disabled={isLoading || !deleteTarget}
              onClick={async () => {
                if (!deleteTarget) return
                try {
                  await friendService.deleteFriend(deleteTarget.id)
                  const f = await friendService.getFriends()
                  setFriends(f)
                  toast.success("친구를 삭제했습니다")
                } catch {
                  toast.error("친구 삭제 실패")
                } finally {
                  setDeleteOpen(false)
                  setDeleteTarget(null)
                }
              }}
            >
              삭제
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>,
    document.body
  )
}


