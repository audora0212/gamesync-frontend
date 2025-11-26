"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { createPortal } from "react-dom"
import { X, UserPlus, Check, XCircle, Users, Trash2 } from "lucide-react"
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
        className={`fixed top-0 right-0 h-screen w-full sm:w-[420px] max-w-[100vw] bg-[#0a0a0f] border-l border-cyan-500/30 text-foreground z-[11000] transform transition-transform duration-300 ${
          open ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between p-4 border-b border-cyan-500/20 bg-cyan-500/10">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-cyan-500/20">
              <Users className="w-5 h-5 text-cyan-400" />
            </div>
            <h2 className="text-lg font-semibold text-cyan-400">친구</h2>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose} className="text-white/70 hover:text-white hover:bg-white/10">
            <X className="w-5 h-5" />
          </Button>
        </div>

        <div className="p-4 space-y-6 overflow-y-auto h-[calc(100vh-64px)]">
          {/* My Friend Code */}
          <div>
            <h3 className="text-sm font-semibold mb-2 text-cyan-400">내 친구코드</h3>
            <div className="flex items-center justify-between bg-cyan-500/10 border border-cyan-500/20 rounded-xl p-3">
              <div className="text-base font-mono tracking-widest text-white">{myCode?.code ?? "-"}</div>
              <Button
                variant="ghost"
                size="sm"
                className="text-cyan-400 hover:text-cyan-300 hover:bg-cyan-500/20"
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
            <h3 className="text-sm font-semibold mb-2 text-cyan-400">친구 추가</h3>
            <div className="flex gap-2">
              <Input
                value={friendCode}
                onChange={(e) => {
                  const v = e.target.value.replace(/\D+/g, '')
                  setFriendCode(v)
                }}
                placeholder="친구 코드 입력 (예: 123456)"
                className="input-cyber text-sm"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={6}
              />
              <Button onClick={handleSendByCode} disabled={isLoading} className="btn-cyber whitespace-nowrap">
                <UserPlus className="w-4 h-4 mr-1" />추가
              </Button>
            </div>
          </div>

          {/* Pending Received */}
          <div>
            <h3 className="text-sm font-semibold mb-2 text-emerald-400">받은 요청</h3>
            <div className="space-y-2">
              {received.requests.length === 0 && (
                <div className="text-white/60 text-sm">받은 요청이 없습니다.</div>
              )}
              {received.requests.map((r) => (
                <div key={r.requestId} className="flex items-center justify-between bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-3">
                  <div>
                    <div className="text-sm font-medium text-white">{r.user.nickname}</div>
                    <div className="text-xs text-white/60">@{r.user.username}</div>
                  </div>
                  <div className="flex gap-2">
                    <Button size="icon" variant="ghost" className="hover:bg-emerald-500/20 text-emerald-400" onClick={() => handleRespond(r.requestId, true)} disabled={isLoading}>
                      <Check className="w-4 h-4" />
                    </Button>
                    <Button size="icon" variant="ghost" className="hover:bg-red-500/20 text-red-400" onClick={() => handleRespond(r.requestId, false)} disabled={isLoading}>
                      <XCircle className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Pending Sent */}
          <div>
            <h3 className="text-sm font-semibold mb-2 text-purple-400">보낸 요청</h3>
            <div className="space-y-2">
              {sent.requests.length === 0 && (
                <div className="text-white/60 text-sm">보낸 요청이 없습니다.</div>
              )}
              {sent.requests.map((r) => (
                <div key={r.requestId} className="flex items-center justify-between bg-purple-500/10 border border-purple-500/20 rounded-xl p-3">
                  <div>
                    <div className="text-sm font-medium text-white">{r.user.nickname}</div>
                    <div className="text-xs text-white/60">@{r.user.username}</div>
                  </div>
                  <div className="text-xs text-purple-400">대기중</div>
                </div>
              ))}
            </div>
          </div>

          {/* Friends list */}
          <div>
            <h3 className="text-sm font-semibold mb-2 text-pink-400">친구 목록</h3>
            <div className="space-y-2">
              {friends.friends.length === 0 && (
                <div className="text-white/60 text-sm">친구가 없습니다.</div>
              )}
              {uniqueFriends.map((u) => (
                <div key={`friend-${u.id}`} className="flex items-center justify-between bg-pink-500/10 border border-pink-500/20 rounded-xl p-3 hover:bg-pink-500/15 transition-colors">
                  <div>
                    <div className="text-sm font-medium text-white">{u.nickname}</div>
                    <div className="text-xs text-white/60">@{u.username}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      size="icon"
                      variant="ghost"
                      className="hover:bg-red-500/20 text-red-400"
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
        {deleteOpen && (
          <>
            <div className="fixed inset-0 bg-black/60 z-[11001]" />
            <div className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-[11002] w-[90%] max-w-sm card-cyber border-red-500/30 rounded-xl p-4">
              <div className="text-red-400 text-base font-semibold mb-2">친구 삭제</div>
              <div className="text-white/80 text-sm mb-4">{deleteTarget ? `${deleteTarget.nickname} 님을 친구에서 삭제할까요?` : "선택된 친구가 없습니다."}</div>
              <div className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  className="btn-cyber-outline text-sm px-4 py-2"
                  onClick={() => { setDeleteOpen(false); setDeleteTarget(null) }}
                >
                  취소
                </Button>
                <Button
                  className="bg-red-500/20 border border-red-500/30 text-red-400 hover:bg-red-500/30 text-sm px-4 py-2"
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


