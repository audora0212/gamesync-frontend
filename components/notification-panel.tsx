"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { notificationService, type NotificationItem } from "@/lib/notification-service"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { toast } from "sonner"

interface Props {
  open: boolean
  onClose: () => void
  onInviteAction?: (inviteId: number, accept: boolean) => Promise<void>
}

export function NotificationPanel({ open, onClose, onInviteAction }: Props) {
  const panelRef = useRef<HTMLDivElement>(null)
  const [items, setItems] = useState<NotificationItem[]>([])
  const [unread, setUnread] = useState(0)
  const [loading, setLoading] = useState(false)

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

  const markRead = async (id: number) => {
    try {
      await notificationService.markAsRead(id)
      setItems(prev => prev.map(i => (i.id === id ? { ...i, read: true } : i)))
      setUnread(prev => Math.max(0, prev - 1))
    } catch {
      toast.error("읽음 처리 실패")
    }
  }

  return (
    <div className={`fixed top-16 right-4 z-[10002] transition ${open ? "opacity-100" : "opacity-0 pointer-events-none"}`}>
      <div ref={panelRef} className={`w-[360px] glass border border-white/10 rounded-xl overflow-hidden`}>
        <div className="px-4 py-3 border-b border-white/10 flex items-center justify-between">
          <div className="text-sm text-white/80">알림 {unread > 0 ? `(미읽음 ${unread})` : ""}</div>
          <Button variant="ghost" size="sm" className="text-white/70" onClick={onClose}>
            닫기
          </Button>
        </div>
        <div className={`p-2 overflow-y-auto ${heightClass}`}>
          {loading && <div className="text-white/70 p-4">불러오는 중...</div>}
          {!loading && items.length === 0 && <div className="text-white/60 p-4 text-sm">알림이 없습니다.</div>}
          {!loading && items.map((n) => {
            const isInvite = n.type === "INVITE"
            return (
              <Card key={n.id} className="glass border-white/10 p-3 mb-2">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="text-sm text-white font-medium">{n.title}</div>
                    {n.message && <div className="text-xs text-white/70 mt-1 whitespace-pre-line">{n.message}</div>}
                  </div>
                  <div className="flex items-center gap-1">
                    {!n.read && (
                      <Button size="sm" variant="ghost" className="text-white/70" onClick={() => markRead(n.id)}>
                        읽음
                      </Button>
                    )}
                  </div>
                </div>
                {/* 초대 알림이면 수락/거절 버튼 */}
                {isInvite && onInviteAction && (
                  <div className="mt-2 flex gap-2">
                    <Button size="sm" className="glass-button" onClick={() => onInviteAction(n.id, true)}>
                      수락
                    </Button>
                    <Button size="sm" variant="outline" className="glass border-white/30 text-white" onClick={() => onInviteAction(n.id, false)}>
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
}


