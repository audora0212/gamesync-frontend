"use client"

import React, { useState, useEffect, useRef } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import { serverService } from "@/lib/server-service"

interface Server {
  id: number
  name: string
  owner: string
  members: string[]
  resetTime: string
}

interface Props {
  open: boolean
  onClose: () => void
  onJoinSuccess: () => void
}

export function SearchServerModal({ open, onClose, onJoinSuccess }: Props) {
  const [list, setList] = useState<Server[]>([])
  const [page, setPage] = useState(0)
  const [query, setQuery] = useState("")
  const containerRef = useRef<HTMLDivElement>(null)

  const load = async (reset = false) => {
    try {
      const data = await serverService.searchServers({ page, size: 10, q: query || undefined })
      setList(prev => (reset ? data : [...prev, ...data]))
    } catch {
      toast.error("검색 실패", { description: "서버 검색 중 오류가 발생했습니다." })
    }
  }

  useEffect(() => {
    if (open) {
      setPage(0)
      load(true)
    }
  }, [open, query])

  useEffect(() => {
    if (page > 0) load()
  }, [page])

  const onScroll = () => {
    const el = containerRef.current
    if (el && el.scrollTop + el.clientHeight >= el.scrollHeight - 10) {
      setPage(prev => prev + 1)
    }
  }

  const handleJoin = async (id: number) => {
    try {
      await serverService.joinServer(id)
      toast.success("참가 완료", { description: "서버 참가에 성공했습니다." })
      onJoinSuccess()
      onClose()
    } catch {
      toast.error("참가 실패", { description: "서버 참가에 실패했습니다." })
    }
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="glass border-white/20">
        <DialogHeader>
          <DialogTitle className="text-white">서버 찾기</DialogTitle>
        </DialogHeader>
        <div className="p-4">
          <Input
            placeholder="서버 이름으로 검색"
            value={query}
            onChange={e => setQuery(e.target.value)}
            className="glass border-white/30 text-white mb-4"
          />
          <div ref={containerRef} onScroll={onScroll} className="max-h-64 overflow-y-auto space-y-2">
            {list.map(s => (
              <div key={s.id} className="flex items-center justify-between p-2 glass rounded-lg">
                <span className="text-white">{s.name}</span>
                <Button size="sm" onClick={() => handleJoin(s.id)} className="glass-button">
                  참가
                </Button>
              </div>
            ))}
            {list.length === 0 && <div className="text-center text-white/60">검색 결과가 없습니다.</div>}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
