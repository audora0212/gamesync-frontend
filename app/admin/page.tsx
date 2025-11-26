'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { authService } from '@/lib/auth-service'
import { Navbar } from '@/components/navbar'
import { Shield, FileText, Server, Clock, Users, Bell, Settings } from 'lucide-react'

type AuditLog = { id: number; serverId: number|null; userId: number|null; action: string; details?: string|null; occurredAt: string }
type AuditLogView = AuditLog & { userNickname?: string|null }
type Server = { id: number; name: string; ownerId: number|null; ownerNickname?: string|null; resetTime?: string; members: number }
type Timetable = { id: number; serverId: number|null; serverName?: string|null; userId: number|null; userNickname?: string|null; slot: string; gameName?: string|null }
type Party = { id: number; serverId: number|null; serverName?: string|null; creatorId: number|null; creatorNickname?: string|null; slot: string; capacity: number; gameName?: string|null; participants: number }

const API = process.env.NEXT_PUBLIC_API_URL || '/api'

export default function AdminPage() {
  const router = useRouter()
  const [authorized, setAuthorized] = useState<boolean | null>(null)
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<'audit'|'servers'|'timetables'|'parties'|'notices'>('audit')
  const [audit, setAudit] = useState<AuditLogView[]>([])
  const [auditOpen, setAuditOpen] = useState<Record<number, boolean>>({})
  const [auditFilter, setAuditFilter] = useState<{ category: 'all'|'server'|'timetable'|'party'; serverId?: number|string; action?: string }>({ category: 'all' })
  const [servers, setServers] = useState<Server[]>([])
  const [timetables, setTimetables] = useState<Timetable[]>([])
  const [parties, setParties] = useState<Party[]>([])
  const [notices, setNotices] = useState<{id:number; title:string; createdAt:string}[]>([])
  const [newNotice, setNewNotice] = useState<{title:string; content:string}>({ title: '', content: '' })
  const [editNotice, setEditNotice] = useState<{id:number; title:string; content:string}|null>(null)
  // 간단한 수정 모달 상태 (Hooks는 모든 early return보다 위에 있어야 함)
  const [editing, setEditing] = useState<{ type: 'server'|'timetable'|'party'; data: any }|null>(null)
  const openEdit = (type: 'server'|'timetable'|'party', data: any) => setEditing({ type, data })
  const closeEdit = () => setEditing(null)
  const saveEdit = async () => {
    if (!editing) return
    const { type, data } = editing
    const path = type === 'server' ? '/admin/servers' : type === 'timetable' ? '/admin/timetables' : '/admin/parties'
    const res = await fetch(`${API}${path}`, { method: 'PUT', headers: { 'Content-Type': 'application/json', ...authService.getAuthHeaders() }, body: JSON.stringify(data) })
    if (res.ok) {
      if (type==='server') setServers(prev => prev.map(s => s.id===data.id ? { ...s, ...data } : s))
      if (type==='timetable') setTimetables(prev => prev.map(t => t.id===data.id ? { ...t, ...data } : t))
      if (type==='party') setParties(prev => prev.map(p => p.id===data.id ? { ...p, ...data } : p))
      closeEdit()
    }
  }

  useEffect(() => {
    ;(async () => {
      try {
        const me = await fetch(`${API}/users/me`, { headers: authService.getAuthHeaders() })
        if (!me.ok) throw new Error('me-fail')
        const isAdmin = me.headers.get('X-Admin') === 'true'
        if (!isAdmin) {
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
          fetch(`${API}/notices`, { headers: authService.getAuthHeaders() }).then(r=>r.ok?r.json():[]).then(setNotices),
        ])
      } catch {
        setAuthorized(false)
      } finally {
        setLoading(false)
      }
    })()
  }, [])

  // 감사 로그 필터 적용 fetch
  const reloadAudit = async (filter = auditFilter) => {
    const params = new URLSearchParams()
    if (filter.category && filter.category !== 'all') params.set('category', filter.category)
    if (filter.serverId) params.set('serverId', String(filter.serverId))
    if (filter.action) params.set('action', filter.action)
    const res = await fetch(`${API}/admin/audit-logs?${params.toString()}`, { headers: authService.getAuthHeaders() })
    if (res.ok) setAudit(await res.json())
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <div className="fixed inset-0 overflow-hidden pointer-events-none">
          <div className="absolute inset-0 bg-[linear-gradient(rgba(5,242,219,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(5,242,219,0.03)_1px,transparent_1px)] bg-[size:50px_50px]" />
        </div>
        <Navbar />
        <div className="flex-1 flex items-center justify-center">
          <div className="flex items-center gap-3 text-muted-foreground">
            <div className="w-5 h-5 border-2 border-neon-red border-t-transparent rounded-full animate-spin" />
            로딩 중...
          </div>
        </div>
      </div>
    )
  }

  if (authorized === false) {
    // 권한 없음 → 대시보드로
    if (typeof window !== 'undefined') {
      try { console.warn('권한 없음: 관리자만 접근 가능합니다.') } catch {}
      router.replace('/dashboard')
    }
    return null
  }

  const del = async (path: string) => {
    await fetch(`${API}${path}`, { method: 'DELETE', headers: authService.getAuthHeaders() })
  }


  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* 배경 효과 */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute inset-0 bg-[linear-gradient(rgba(5,242,219,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(5,242,219,0.03)_1px,transparent_1px)] bg-[size:50px_50px]" />
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-neon-red/10 rounded-full blur-[150px]" />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-neon-magenta/10 rounded-full blur-[150px]" />
      </div>

      <Navbar />

      <main className="flex-1 z-10">
        <div className="container mx-auto px-4 py-8 space-y-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="flex items-center gap-3"
          >
            <div className="p-2.5 rounded-xl bg-neon-red/20 shadow-[0_0_15px_rgba(255,51,102,0.2)]">
              <Shield className="w-6 h-6 text-neon-red" />
            </div>
            <h1 className="text-2xl font-bold text-neon-red drop-shadow-[0_0_10px_rgba(255,51,102,0.5)] font-display">관리자 페이지</h1>
          </motion.div>

          <motion.div
            className="flex flex-wrap gap-2"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            <Button variant={tab==='audit'?'default':'outline'} onClick={()=>setTab('audit')}>
              <FileText className="w-4 h-4 mr-2" />감사 로그
            </Button>
            <Button variant={tab==='servers'?'secondary':'outline'} onClick={()=>setTab('servers')}>
              <Server className="w-4 h-4 mr-2" />서버 목록
            </Button>
            <Button variant={tab==='timetables'?'default':'outline'} onClick={()=>setTab('timetables')}>
              <Clock className="w-4 h-4 mr-2" />현재 등록된 스케줄
            </Button>
            <Button variant={tab==='parties'?'secondary':'outline'} onClick={()=>setTab('parties')}>
              <Users className="w-4 h-4 mr-2" />파티 목록
            </Button>
            <Button variant={tab==='notices'?'default':'outline'} onClick={()=>setTab('notices')}>
              <Bell className="w-4 h-4 mr-2" />공지
            </Button>
          </motion.div>

          {tab==='audit' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <Card>
              <CardHeader>
                <CardTitle className="text-neon-cyan drop-shadow-[0_0_10px_rgba(5,242,219,0.5)]">감사 로그 (최근 {audit.length}건)</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="mb-3 flex flex-wrap gap-2 text-sm">
                  <select className="bg-white/5 border border-white/20 rounded-lg px-2 py-1 text-sm text-white focus:outline-none focus:border-neon-cyan/50"
                    value={auditFilter.category}
                    onChange={e=>{ const v = e.target.value as 'all'|'server'|'timetable'|'party'; const f = { ...auditFilter, category: v }; setAuditFilter(f); reloadAudit(f) }}>
                    <option value="all">전체</option>
                    <option value="server">서버 참가/관리</option>
                    <option value="timetable">타임테이블</option>
                    <option value="party">파티</option>
                  </select>
                  <Input className="w-24 px-2 py-1 text-sm h-auto" placeholder="serverId"
                    value={auditFilter.serverId ?? ''}
                    onChange={e=>{ const f = { ...auditFilter, serverId: e.target.value }; setAuditFilter(f) }}
                    onBlur={()=>reloadAudit()}
                  />
                  <Input className="w-32 px-2 py-1 text-sm h-auto" placeholder="action (정확히)"
                    value={auditFilter.action ?? ''}
                    onChange={e=>{ const f = { ...auditFilter, action: e.target.value }; setAuditFilter(f) }}
                    onBlur={()=>reloadAudit()}
                  />
                  <Button size="sm" onClick={()=>reloadAudit()}>적용</Button>
                </div>
                <div className="max-h-[320px] overflow-auto text-white/80 text-sm divide-y divide-white/10">
                  {audit.slice().reverse().map(l => {
                    const open = !!auditOpen[l.id]
                    const usr = l.userId ? `유저#${l.userId}${l.userNickname?`(${l.userNickname})`:''}` : '유저-'
                    const srv = l.serverId ? `서버#${l.serverId}` : '서버-'
                    const line = `${l.action} · ${srv} · ${usr} · ${l.details ?? ''}`
                    return (
                      <div key={l.id} className="py-2">
                        <button className="w-full text-left" onClick={()=>setAuditOpen(v=>({ ...v, [l.id]: !open }))}>
                          <div className="font-mono text-xs text-white/60">#{l.id} {l.occurredAt}</div>
                          <div className={open?"whitespace-pre-wrap break-all":"truncate"}>{line}</div>
                        </button>
                        {open && (
                          <div className="mt-1 text-xs text-white/60">(클릭하여 접기)</div>
                        )}
                      </div>
                    )
                  })}
                  {audit.length === 0 && <div className="py-2 text-neon-cyan/60">기록 없음</div>}
                </div>
              </CardContent>
            </Card>
          </motion.div>
          )}

          {tab==='notices' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <Card>
              <CardHeader><CardTitle className="text-neon-yellow drop-shadow-[0_0_10px_rgba(255,215,0,0.5)]">공지 관리</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Input className="w-full" placeholder="제목" value={newNotice.title} onChange={e=>setNewNotice(v=>({...v, title:e.target.value}))} />
                  <textarea className="w-full bg-white/5 border border-white/20 rounded-lg px-3 py-2 text-sm min-h-[120px] text-white placeholder:text-muted-foreground focus:outline-none focus:border-neon-cyan/50" placeholder="내용" value={newNotice.content} onChange={e=>setNewNotice(v=>({...v, content:e.target.value}))} />
                  <div className="flex gap-2">
                    <Button onClick={async ()=>{
                      const res = await fetch(`${API}/admin/notices`, { method:'POST', headers: { 'Content-Type':'application/json', ...authService.getAuthHeaders() }, body: JSON.stringify(newNotice) })
                      if(res.ok){ setNewNotice({title:'', content:''}); const list = await fetch(`${API}/notices`, { headers: authService.getAuthHeaders() }).then(r=>r.json()); setNotices(list) }
                    }}>등록</Button>
                  </div>
                </div>

                <div className="divide-y divide-neon-cyan/20">
                  {notices.map(n => (
                    <div key={n.id} className="py-2 flex items-center justify-between text-white/80 text-sm">
                      <div className="truncate text-neon-cyan">{n.title}</div>
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline" onClick={async ()=>{
                          try {
                            const d = await fetch(`${API}/notices/${n.id}`, { headers: authService.getAuthHeaders() }).then(r=>r.json())
                            setEditNotice({ id: n.id, title: d.title, content: d.content || '' })
                          } catch {
                            setEditNotice({ id: n.id, title: n.title, content: '' })
                          }
                        }}>수정</Button>
                        <Button size="sm" variant="destructive" onClick={async ()=>{
                          await fetch(`${API}/admin/notices/${n.id}`, { method:'DELETE', headers: authService.getAuthHeaders() });
                          setNotices(prev=>prev.filter(x=>x.id!==n.id))
                        }}>삭제</Button>
                      </div>
                    </div>
                  ))}
                  {notices.length===0 && <div className="py-2 text-neon-cyan/60">등록된 공지가 없습니다</div>}
                </div>
              </CardContent>
            </Card>
          </motion.div>
          )}

          {/* 공지 수정 모달 */}
          {editNotice && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={()=>setEditNotice(null)}>
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-card/95 backdrop-blur-xl border border-white/10 rounded-xl text-white max-w-lg w-full mx-4 shadow-[0_0_30px_rgba(5,242,219,0.1)]" onClick={(e)=>e.stopPropagation()}>
                <div className="p-4 border-b border-neon-cyan/20 text-lg font-semibold text-neon-cyan drop-shadow-[0_0_10px_rgba(5,242,219,0.5)]">공지 수정</div>
                <div className="p-4 space-y-3">
                  <Input className="w-full" value={editNotice.title} onChange={e=>setEditNotice(v=>v?{...v, title:e.target.value}:v)} />
                  <textarea className="w-full bg-white/5 border border-white/20 rounded-lg px-3 py-2 text-sm min-h-[160px] text-white focus:outline-none focus:border-neon-cyan/50" value={editNotice.content} onChange={e=>setEditNotice(v=>v?{...v, content:e.target.value}:v)} />
                </div>
                <div className="p-4 flex justify-end gap-2">
                  <Button variant="outline" onClick={()=>setEditNotice(null)}>취소</Button>
                  <Button onClick={async ()=>{
                    if(!editNotice) return
                    const ok = await fetch(`${API}/admin/notices/${editNotice.id}`, { method:'PUT', headers:{ 'Content-Type':'application/json', ...authService.getAuthHeaders() }, body: JSON.stringify({ title: editNotice.title, content: editNotice.content }) })
                    if (ok.ok) {
                      setEditNotice(null)
                      const list = await fetch(`${API}/notices`, { headers: authService.getAuthHeaders() }).then(r=>r.json()); setNotices(list)
                    }
                  }}>저장</Button>
                </div>
              </motion.div>
            </div>
          )}

          {tab==='servers' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="grid grid-cols-1 md:grid-cols-2 gap-6"
          >
            <Card className="border-neon-magenta/30">
              <CardHeader><CardTitle className="text-neon-magenta drop-shadow-[0_0_10px_rgba(217,4,142,0.5)]">서버 목록 ({servers.length})</CardTitle></CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {servers.map(s => (
                    <ServerRow key={s.id} s={s} api={API} del={del} openEdit={openEdit} />
                  ))}
                  {servers.length===0 && <div className="text-neon-magenta/60">없음</div>}
                </div>
              </CardContent>
            </Card>
          </motion.div>
          )}

          {tab==='timetables' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <Card className="border-neon-cyan/30">
              <CardHeader><CardTitle className="text-neon-cyan drop-shadow-[0_0_10px_rgba(5,242,219,0.5)]">스케줄 목록 ({timetables.length})</CardTitle></CardHeader>
              <CardContent>
                <div className="max-h-[360px] overflow-auto space-y-2">
                  {timetables.map(t => (
                    <div key={t.id} className="flex items-center justify-between text-white/80 text-sm bg-neon-cyan/10 rounded-xl px-3 py-2 border border-neon-cyan/20">
                      <div className="truncate">{`${t.userNickname ?? ('유저#'+(t.userId ?? '-'))} 님이 ${t.serverName ?? ('서버#'+(t.serverId ?? '-'))}에 ${t.gameName ?? '게임'} 예약 등록 (${t.slot})`}</div>
                      <div className="flex gap-2">
                        <Button size="sm" variant="destructive" onClick={async ()=>{ await del(`/admin/timetables/${t.id}`); setTimetables(prev=>prev.filter(x=>x.id!==t.id)) }}>삭제</Button>
                        <Button size="sm" onClick={()=>openEdit('timetable', t)}>수정</Button>
                      </div>
                    </div>
                  ))}
                  {timetables.length===0 && <div className="text-neon-cyan/60">없음</div>}
                </div>
              </CardContent>
            </Card>
          </motion.div>
          )}

          {tab==='parties' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <Card className="border-neon-pink/30">
              <CardHeader><CardTitle className="text-neon-pink drop-shadow-[0_0_10px_rgba(242,5,203,0.5)]">파티 목록 ({parties.length})</CardTitle></CardHeader>
              <CardContent>
                <div className="max-h-[360px] overflow-auto space-y-2">
                  {parties.map(p => (
                    <div key={p.id} className="flex items-center justify-between text-white/80 text-sm bg-neon-pink/10 rounded-xl px-3 py-2 border border-neon-pink/20">
                      <div className="truncate">{`${p.creatorNickname ?? ('유저#'+(p.creatorId ?? '-'))} 님이 ${p.serverName ?? ('서버#'+(p.serverId ?? '-'))}에서 ${p.gameName ?? '게임'} 파티 모집 (${p.slot}) · 정원 ${p.capacity}명 · 참가 ${p.participants}명`}</div>
                      <div className="flex gap-2">
                        <Button size="sm" variant="destructive" onClick={async ()=>{ await del(`/admin/parties/${p.id}`); setParties(prev=>prev.filter(x=>x.id!==p.id)) }}>삭제</Button>
                        <Button size="sm" variant="secondary" onClick={()=>openEdit('party', p)}>수정</Button>
                      </div>
                    </div>
                  ))}
                  {parties.length===0 && <div className="text-neon-pink/60">없음</div>}
                </div>
              </CardContent>
            </Card>
          </motion.div>
          )}
        </div>
      </main>
    </div>
  )
}


function ServerRow({ s, api, del, openEdit }: { s: any; api: string; del: (p:string)=>Promise<void>; openEdit: (t:any, d:any)=>void }) {
  const [open, setOpen] = useState(false)
  const [joins, setJoins] = useState<AuditLogView[]>([])
  const [loading, setLoading] = useState(false)
  const toggle = async () => {
    if (!open) {
      setLoading(true)
      try {
        const res = await fetch(`${api}/admin/servers/${s.id}/join-logs`, { headers: authService.getAuthHeaders() })
        if (res.ok) setJoins(await res.json())
      } finally {
        setLoading(false)
      }
    }
    setOpen(v=>!v)
  }
  return (
    <div className="text-white/80 text-sm bg-neon-magenta/10 rounded-xl border border-neon-magenta/20">
      <div className="flex items-center justify-between px-3 py-2">
        <button className="text-left flex-1" onClick={toggle}>
          <div className="truncate"><span className="text-neon-magenta font-medium">{s.name}</span> 서버 · 인원 <span className="text-neon-cyan">{s.members}</span>명 · 서버장 <span className="text-neon-pink">{s.ownerNickname ?? s.ownerId ?? '-' }</span> · 초기화 <span className="text-neon-green">{s.resetTime ?? '-'}</span></div>
        </button>
        <div className="flex gap-2">
          <Button size="sm" variant="destructive" onClick={async ()=>{ await del(`/admin/servers/${s.id}`) }}>삭제</Button>
          <Button size="sm" variant="secondary" onClick={()=>openEdit('server', s)}>수정</Button>
        </div>
      </div>
      {open && (
        <div className="px-3 pb-2">
          <div className="text-neon-magenta/80 text-xs mb-1">참가 기록</div>
          {loading ? (
            <div className="text-neon-magenta/60 text-xs py-2 flex items-center gap-2">
              <div className="w-3 h-3 border border-neon-magenta border-t-transparent rounded-full animate-spin" />
              불러오는 중...
            </div>
          ) : (
            <div className="max-h-40 overflow-auto divide-y divide-neon-magenta/20">
              {joins.length===0 && <div className="py-2 text-neon-magenta/60 text-xs">기록 없음</div>}
              {joins.slice().reverse().map(j => {
                const who = j.userId ? `유저#${j.userId}${j.userNickname?`(${j.userNickname})`:''}` : '유저-'
                return (
                  <div key={j.id} className="py-1">
                    <div className="font-mono text-[11px] text-neon-magenta/60">#{j.id} {j.occurredAt}</div>
                    <div className="text-white/80">{`JOIN_SERVER · ${who} · ${j.details ?? ''}`}</div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

