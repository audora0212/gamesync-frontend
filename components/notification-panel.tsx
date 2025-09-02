"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { createPortal } from "react-dom"
import { notificationService, type NotificationItem } from "@/lib/notification-service"
import { friendService } from "@/lib/friend-service"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { toast } from "sonner"

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

        // 패널을 연 시점에 모두 읽음 처리
        const unreadIds = data.notifications.filter(n => !n.read).map(n => n.id)
        if (unreadIds.length > 0) {
          await Promise.allSettled(unreadIds.map(id => notificationService.markAsRead(id)))
          if (!active) return
          // 로컬 상태 업데이트 및 배지 제거
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

  const heightClass = useMemo(() => {
    // 아이템 수에 따라 높이 동적 조절: 최대 420px, 최소 160px
    const base = Math.min(Math.max(items.length * 80 + 80, 160), 420)
    return `max-h-[${base}px]`
  }, [items.length])

  // 개별 읽음 버튼은 제거. 수동 호출이 필요한 내부 시나리오만 유지할 경우 아래 유틸 사용
  const markRead = async (id: number) => {
    try {
      await notificationService.markAsRead(id)
      setItems(prev => prev.map(i => (i.id === id ? { ...i, read: true } : i)))
    } catch {}
  }

  // 메시지가 JSON이면 파싱, 아니면 null
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
    <div className={`fixed top-16 right-4 z-[11000] transition ${open ? "opacity-100" : "opacity-0 pointer-events-none"}`}>
      <div ref={panelRef} className={`w-[360px] glass border border-white/10 rounded-xl overflow-hidden`}>
        <div className="px-4 py-3 border-b border-white/10 flex items-center justify-between">
          <div className="text-sm text-white/80">알림 {unread > 0 ? `(미읽음 ${unread})` : ""}</div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              className="text-white/70"
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
              알림 지우기
            </Button>
            <Button variant="ghost" size="sm" className="text-white/70" onClick={onClose}>
              닫기
            </Button>
          </div>
        </div>
        <div className={`p-2 overflow-y-auto ${heightClass}`}>
          {loading && <div className="text-white/70 p-4">불러오는 중...</div>}
          {!loading && items.length === 0 && <div className="text-white/60 p-4 text-sm">알림이 없습니다.</div>}
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
            // 표시할 본문 생성 로직 (메시지 우선, 없으면 종류별 구성)
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
              <Card key={n.id} className="glass border-white/10 p-3 mb-2">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    {/* 제목은 숨기고, 최종 본문만 표시 (길면 말줄임) */}
                    <div className="text-sm text-white mt-0.5 whitespace-nowrap truncate max-w-[280px]">{displayText}</div>
                  </div>
                  <div className="flex items-center gap-1" />
                </div>
                {/* 서버 초대 알림이면 확인 페이지로 이동 및 거절 제공 */}
                {inviteId && (
                  <div className="mt-2 flex gap-2">
                    <Button
                      size="sm"
                      className="glass-button"
                      onClick={() => {
                        try { window.location.href = `/invite/by-id?inviteId=${inviteId}` } catch {}
                      }}
                    >
                      확인
                    </Button>
                    {onInviteAction && (
                      <Button size="sm" variant="outline" className="glass border-white/30 text-white" onClick={() => handleInviteDecision(n, false, inviteId)}>
                        거절
                      </Button>
                    )}
                  </div>
                )}
                {/* 친구 요청 알림이면 수락/거절 버튼 */}
                {isFriendRequest && (
                  <div className="mt-2 flex gap-2">
                    <Button size="sm" className="glass-button" onClick={() => handleFriendRequestDecision(n, payload!.requestId!, true)}>
                      수락
                    </Button>
                    <Button size="sm" variant="outline" className="glass border-white/30 text-white" onClick={() => handleFriendRequestDecision(n, payload!.requestId!, false)}>
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


