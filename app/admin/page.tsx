'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { authService } from '@/lib/auth-service'
import { Navbar } from '@/components/navbar'

type AuditLog = { id: number; serverId: number|null; userId: number|null; action: string; details?: string|null; occurredAt: string }
type Server = { id: number; name: string }
type Timetable = { id: number; server: any; user: any; slot: string }
type Party = { id: number; server: any; slot: string; capacity: number }

const API = process.env.NEXT_PUBLIC_API_URL || '/api'

export default function AdminPage() {
  const router = useRouter()
  const [authorized, setAuthorized] = useState<boolean | null>(null)
  const [loading, setLoading] = useState(true)
  const [audit, setAudit] = useState<AuditLog[]>([])
  const [servers, setServers] = useState<Server[]>([])
  const [timetables, setTimetables] = useState<Timetable[]>([])
  const [parties, setParties] = useState<Party[]>([])

  useEffect(() => {
    ;(async () => {
      try {
        const me = await fetch(`${API}/users/me`, { headers: authService.getAuthHeaders() })
        if (!me.ok) throw new Error('me-fail')
        const json = await me.json()
        if (!json?.admin) {
          setAuthorized(false)
          setLoading(false)
          return
        }
        setAuthorized(true)
        await Promise.all([
          fetch(`${API}/admin/audit-logs`, { headers: authService.getAuthHeaders() }).then(r=>r.ok?r.json():[]).then(setAudit),
          fetch(`${API}/admin/servers`, { headers: authService.getAuthHeaders() }).then(r=>r.ok?r.json():[]).then(setServers),
          fetch(`${API}/admin/timetables`, { headers: authService.getAuthHeaders() }).then(r=>r.ok?r.json():[]).then(setTimetables),
          fetch(`${API}/admin/parties`, { headers: authService.getAuthHeaders() }).then(r=>r.ok?r.json():[]).then(setParties),
        ])
      } catch {
        setAuthorized(false)
      } finally {
        setLoading(false)
      }
    })()
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen">
        <Navbar />
        <div className="container mx-auto px-4 py-8 text-white/80">로딩 중...</div>
      </div>
    )
  }

  if (authorized === false) {
    // 권한 없음 → 대시보드로
    if (typeof window !== 'undefined') {
      alert('권한이 없습니다.')
      router.replace('/dashboard')
    }
    return null
  }

  const del = async (path: string) => {
    await fetch(`${API}${path}`, { method: 'DELETE', headers: authService.getAuthHeaders() })
  }

  return (
    <div className="min-h-screen">
      <Navbar />
      <div className="container mx-auto px-4 py-8 space-y-6">
        <h1 className="text-2xl font-bold text-white">관리자 페이지</h1>

        <Card className="bg-white/10 border-white/20">
          <CardHeader>
            <CardTitle className="text-white">감사 로그 (최근 {audit.length}건)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="max-h-[320px] overflow-auto text-white/80 text-sm divide-y divide-white/10">
              {audit.slice().reverse().map(l => (
                <div key={l.id} className="py-2 flex items-center justify-between gap-2">
                  <div className="truncate">
                    <div className="font-mono text-xs text-white/60">#{l.id} {l.occurredAt}</div>
                    <div className="truncate">[{l.action}] srv={l.serverId ?? '-'} user={l.userId ?? '-'} {l.details || ''}</div>
                  </div>
                </div>
              ))}
              {audit.length === 0 && <div className="py-2">기록 없음</div>}
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="bg-white/10 border-white/20">
            <CardHeader><CardTitle className="text-white">서버 목록 ({servers.length})</CardTitle></CardHeader>
            <CardContent>
              <div className="space-y-2">
                {servers.map(s => (
                  <div key={s.id} className="flex items-center justify-between text-white/80 text-sm bg-white/5 rounded px-3 py-2">
                    <div className="truncate">#{s.id} {s.name}</div>
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" className="glass border-white/30 text-white" onClick={async ()=>{ await del(`/admin/servers/${s.id}`); setServers(prev=>prev.filter(x=>x.id!==s.id)) }}>삭제</Button>
                    </div>
                  </div>
                ))}
                {servers.length===0 && <div className="text-white/60">없음</div>}
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/10 border-white/20">
            <CardHeader><CardTitle className="text-white">스케줄 목록 ({timetables.length})</CardTitle></CardHeader>
            <CardContent>
              <div className="max-h-[360px] overflow-auto space-y-2">
                {timetables.map(t => (
                  <div key={t.id} className="flex items-center justify-between text-white/80 text-sm bg-white/5 rounded px-3 py-2">
                    <div className="truncate">#{t.id} server={t.server?.id ?? '-'} user={t.user?.id ?? '-'} slot={t.slot}</div>
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" className="glass border-white/30 text-white" onClick={async ()=>{ await del(`/admin/timetables/${t.id}`); setTimetables(prev=>prev.filter(x=>x.id!==t.id)) }}>삭제</Button>
                    </div>
                  </div>
                ))}
                {timetables.length===0 && <div className="text-white/60">없음</div>}
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/10 border-white/20 md:col-span-2">
            <CardHeader><CardTitle className="text-white">파티 목록 ({parties.length})</CardTitle></CardHeader>
            <CardContent>
              <div className="max-h-[360px] overflow-auto space-y-2">
                {parties.map(p => (
                  <div key={p.id} className="flex items-center justify-between text-white/80 text-sm bg-white/5 rounded px-3 py-2">
                    <div className="truncate">#{p.id} server={p.server?.id ?? '-'} slot={p.slot} cap={p.capacity}</div>
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" className="glass border-white/30 text-white" onClick={async ()=>{ await del(`/admin/parties/${p.id}`); setParties(prev=>prev.filter(x=>x.id!==p.id)) }}>삭제</Button>
                    </div>
                  </div>
                ))}
                {parties.length===0 && <div className="text-white/60">없음</div>}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}


