"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { createPortal } from "react-dom"
import { notificationService, type NotificationItem } from "@/lib/notification-service"
import { friendService } from "@/lib/friend-service"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { toast } from "sonner"
import { Bell, Trash2, X, Check, XCircle, ExternalLink } from "lucide-react"

interface Props {
  open: boolean
  onClose: () => void
  onInviteAction?: (inviteId: number, accept: boolean) => Promise<void>
  onUnreadChange?: (unread: number) => void
}

export function NotificationPanel({ open, onClose, onInviteAction, onUnreadChange }: Props) {
  const panelRef = useRef<HTMLDivElement>(null)
  const [items, setItems] = useState<NotificationItem[]>([])
  const [unread, setUnread] = useState(0)
  const [loading, setLoading] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => { setMounted(true) }, [])

  useEffect(() => {
    if (!open) return
    let active = true
    ;(async () => {
      setLoading(true)
      try {
        const data = await notificationService.getNotifications()
        if (!active) return
        setItems(data.notifications)
        setUnread(data.unreadCount)
        onUnreadChange?.(data.unreadCount)

        const unreadIds = data.notifications.filter(n => !n.read).map(n => n.id)
        if (unreadIds.length > 0) {
          await Promise.allSettled(unreadIds.map(id => notificationService.markAsRead(id)))
          if (!active) return
          setItems(prev => prev.map(i => ({ ...i, read: true })))
          setUnread(0)
          onUnreadChange?.(0)
        }
      } catch {
        toast.error("알림 로드 실패")
      } finally {
        if (active) setLoading(false)
      }
    })()
    return () => {
      active = false
    }
  }, [open])

  useEffect(() => {
    function onOutside(e: MouseEvent) {
      if (!open) return
      const t = e.target as Node
      if (panelRef.current && !panelRef.current.contains(t)) onClose()
    }
    document.addEventListener("mousedown", onOutside)
    return () => document.removeEventListener("mousedown", onOutside)
  }, [open, onClose])

  const markRead = async (id: number) => {
    try {
      await notificationService.markAsRead(id)
      setItems(prev => prev.map(i => (i.id === id ? { ...i, read: true } : i)))
    } catch {}
  }

  function parseMessage<T = any>(msg: string | null): T | null {
    if (!msg) return null
    try { return JSON.parse(msg) as T } catch { return null }
  }

  async function handleInviteDecision(n: NotificationItem, accept: boolean, inviteId: number) {
    if (!onInviteAction) return
    try {
      await onInviteAction(inviteId, accept)
      await markRead(n.id)
      setItems(prev => prev.filter(i => i.id !== n.id))
      toast.success(accept ? "초대를 수락했습니다" : "초대를 거절했습니다")
    } catch {
      toast.error("초대 응답 실패")
    }
  }

  async function handleFriendRequestDecision(n: NotificationItem, requestId: number, accept: boolean) {
    try {
      await friendService.respond(requestId, accept)
      await markRead(n.id)
      setItems(prev => prev.filter(i => i.id !== n.id))
      toast.success(accept ? "친구 요청을 수락했습니다" : "친구 요청을 거절했습니다")
    } catch {
      toast.error("친구 요청 처리 실패")
    }
  }

  const panel = (
    <div className={`fixed top-16 right-4 z-[11000] transition-all duration-300 ${open ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-2 pointer-events-none"}`}>
      <div
        ref={panelRef}
        className="w-[360px] bg-card/95 backdrop-blur-xl border border-neon-yellow/30 rounded-xl overflow-hidden shadow-[0_0_30px_rgba(255,215,0,0.15)]"
      >
        {/* Header */}
        <div className="px-4 py-3 border-b border-neon-yellow/20 flex items-center justify-between bg-neon-yellow/5">
          <div className="flex items-center gap-2">
            <Bell className="w-4 h-4 text-neon-yellow" />
            <span className="text-sm font-medium text-neon-yellow">
              알림 {unread > 0 ? `(미읽음 ${unread})` : ""}
            </span>
          </div>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              className="text-neon-yellow/70 hover:text-neon-yellow hover:bg-neon-yellow/10"
              onClick={async () => {
                try {
                  await notificationService.clearAll()
                  setItems([])
                  setUnread(0)
                  onUnreadChange?.(0)
                } catch {
                  toast.error("알림 삭제 실패")
                }
              }}
            >
              <Trash2 className="w-4 h-4 mr-1" />
              비우기
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="text-muted-foreground hover:text-neon-yellow hover:bg-neon-yellow/10"
              onClick={onClose}
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Content */}
        <div className="p-2 overflow-y-auto max-h-[420px]">
          {loading && (
            <div className="flex items-center justify-center py-8">
              <div className="w-6 h-6 border-2 border-neon-yellow border-t-transparent rounded-full animate-spin" />
            </div>
          )}
          {!loading && items.length === 0 && (
            <div className="text-muted-foreground text-sm p-4 text-center">
              알림이 없습니다.
            </div>
          )}
          {!loading && items
            .slice()
            .sort((a,b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
            .map((n) => {
            const isInvite = n.type === "INVITE"
            const payload = parseMessage<{ kind?: string, inviteId?: number, requestId?: number, serverName?: string, fromNickname?: string, userNickname?: string, nickname?: string, reservationName?: string, slotName?: string, title?: string, name?: string, partyName?: string, gameName?: string, description?: string }>(n.message)
            const friendMarker = n.message?.includes('"kind":"friend_request"')
            const inviteMarker = n.message?.includes('"kind":"server_invite"')
            const isFriendRequest = (payload?.kind === 'friend_request' && typeof payload.requestId === 'number') || !!friendMarker
            const inviteId = payload?.kind === 'server_invite' && typeof payload.inviteId === 'number' ? payload.inviteId : undefined
            const fromNickname = payload?.fromNickname || (n.message && (n.message.match(/\"fromNickname\":\"([^\"]+)\"/)?.[1])) || undefined

            let displayText: string = ''
            if (isFriendRequest) {
              displayText = `${fromNickname ?? '상대방'} 님이 친구 요청을 보냈습니다.`
            } else if (isInvite && ((payload?.kind === 'server_invite') || inviteMarker)) {
              const serverName = payload?.serverName ?? '서버'
              displayText = `${fromNickname ?? '상대방'} 님이 ${serverName} 서버에 초대했어요`
            } else if (n.type === 'TIMETABLE') {
              const actor = payload?.userNickname || payload?.fromNickname || payload?.nickname
              const serverName = payload?.serverName || '서버'
              const what = payload?.reservationName || payload?.slotName || payload?.title || payload?.name || '스케줄'
              if (actor) {
                displayText = `${actor} 님이 ${serverName} 서버에 ${what} 예약을 등록했습니다.`
              }
            } else if (n.type === 'PARTY' || payload?.kind === 'party') {
              const actor = payload?.fromNickname || payload?.userNickname || payload?.nickname
              const serverName = payload?.serverName || '서버'
              const partyName = payload?.partyName || payload?.title || payload?.name || payload?.gameName
              if (actor && partyName) {
                displayText = `${actor} 님이 ${serverName} 서버에서 ${partyName} 파티를 모집했어요`
              } else if (actor) {
                displayText = `${actor} 님이 ${serverName} 서버에서 파티를 모집했어요`
              } else {
                displayText = '새 파티 모집 알림이 도착했습니다.'
              }
            }
            if (!displayText) {
              displayText = (n.message && !(isFriendRequest || (isInvite && inviteMarker)) ? n.message : '') || n.title || ''
            }

            return (
              <Card key={n.id} className="p-3 mb-2 hover:border-neon-yellow/40">
                <div className="text-sm text-foreground/90 whitespace-nowrap truncate max-w-[310px]">
                  {displayText}
                </div>

                {/* 서버 초대 알림 */}
                {inviteId && (
                  <div className="mt-2 flex gap-2">
                    <Button
                      size="sm"
                      onClick={() => {
                        try { window.location.href = `/invite/by-id?inviteId=${inviteId}` } catch {}
                      }}
                    >
                      <ExternalLink className="w-3 h-3 mr-1" />
                      확인
                    </Button>
                    {onInviteAction && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleInviteDecision(n, false, inviteId)}
                      >
                        거절
                      </Button>
                    )}
                  </div>
                )}

                {/* 친구 요청 알림 */}
                {isFriendRequest && (
                  <div className="mt-2 flex gap-2">
                    <Button
                      size="sm"
                      onClick={() => handleFriendRequestDecision(n, payload!.requestId!, true)}
                    >
                      <Check className="w-3 h-3 mr-1" />
                      수락
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleFriendRequestDecision(n, payload!.requestId!, false)}
                    >
                      <XCircle className="w-3 h-3 mr-1" />
                      거절
                    </Button>
                  </div>
                )}
              </Card>
            )
          })}
        </div>
      </div>
    </div>
  )

  if (!mounted) return null
  return createPortal(panel, document.body)
}
