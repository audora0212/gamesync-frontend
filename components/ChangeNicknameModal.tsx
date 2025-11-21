"use client"

import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { authService } from "@/lib/auth-service";
import { Settings as SettingsIcon, Link2 } from "lucide-react";

export function SettingModal() {
  const [open, setOpen] = useState(false);
  const [nickname, setNickname] = useState(authService.getCurrentUser() || "");
  const [loading, setLoading] = useState(false);
  // const [discordLinked, setDiscordLinked] = useState<boolean | null>(null);
  // 푸시 알림 설정 상태
  const [pushAll, setPushAll] = useState<boolean>(true)
  const [pushInvite, setPushInvite] = useState<boolean>(true)
  const [pushFriendReq, setPushFriendReq] = useState<boolean>(true)
  const [pushFriendSchedule, setPushFriendSchedule] = useState<boolean>(true)
  const [pushParty, setPushParty] = useState<boolean>(true)
  const [pushMyTT, setPushMyTT] = useState<boolean>(true)
  const [myTTMinutes, setMyTTMinutes] = useState<number>(10)
  // 패널 표시는 친구 스케줄 FCM과 동일 토글로 통합

  useEffect(() => {
    if (!open) return;
    (async () => {
      try {
        // 기존: 디스코드 연동 여부 조회 제거
        // 푸시 설정 불러오기
        try {
          const ps = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/users/me/push-settings`, {
            headers: { ...authService.getAuthHeaders() },
          })
          if (ps.ok) {
            const s = await ps.json()
            setPushAll(s.pushAllEnabled ?? true)
            setPushInvite(s.pushInviteEnabled ?? true)
            setPushFriendReq(s.pushFriendRequestEnabled ?? true)
            setPushFriendSchedule(s.pushFriendScheduleEnabled ?? true)
            setPushParty(s.pushPartyEnabled ?? true)
            setPushMyTT(s.pushMyTimetableReminderEnabled ?? true)
            setMyTTMinutes(s.myTimetableReminderMinutes ?? 10)
            // 통합 반영: 서버는 panel 값을 push와 동일로 돌려줌
          }
        } catch {}
      } catch {
        // ignore
      }
    })();
  }, [open]);

  const save = async () => {
    setLoading(true);
    try {
      // 푸시 설정 저장 (전체 스위치 적용 요구사항에 따라 하위도 함께 전달)
      await fetch(`${process.env.NEXT_PUBLIC_API_URL}/users/me/push-settings`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...authService.getAuthHeaders(),
        },
        body: JSON.stringify({
          pushAllEnabled: pushAll,
          pushInviteEnabled: pushInvite,
          pushFriendRequestEnabled: pushFriendReq,
          pushFriendScheduleEnabled: pushFriendSchedule,
          panelFriendScheduleEnabled: pushFriendSchedule,
          pushPartyEnabled: pushParty,
          pushMyTimetableReminderEnabled: pushMyTT,
          myTimetableReminderMinutes: myTTMinutes,
        }),
      })
      toast.success('설정이 저장되었습니다')
    } catch {
      toast.error('설정 저장에 실패했습니다')
    } finally {
      setLoading(false);
    }
  };

  const changeNickname = async () => {
    setLoading(true)
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/users/me/nickname`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...authService.getAuthHeaders(),
        },
        body: JSON.stringify({ nickname }),
      })
      if (!res.ok) {
        const bodyText = await res.text();
        let msg = '닉네임 변경에 실패했습니다';
        try {
          const err = JSON.parse(bodyText);
          msg = err?.message || err?.error || msg;
        } catch {
          if (bodyText) msg = bodyText;
        }
        throw new Error(msg);
      }
      const data = await res.json();
      authService.setCurrentUser({ id: authService.getCurrentUserId()!, nickname: data.nickname });
      toast.success('닉네임이 변경되었습니다');
    } catch (e: any) {
      const msg = typeof e?.message === 'string' ? e.message : '닉네임 변경에 실패했습니다';
      toast.error(msg);
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="text-white hover:bg-white/20"
        >
          <SettingsIcon className="h-5 w-5 text-white" />
        </Button>
      </DialogTrigger>
      <DialogContent className="glass border-white/20 max-w-sm">
        <DialogHeader>
          <DialogTitle className="text-white">설정</DialogTitle>
        </DialogHeader>
        <div className="p-4 space-y-3">
          <div className="flex items-center gap-2">
            <Input
              value={nickname}
              onChange={e => setNickname(e.target.value)}
              className="glass border-white/30 text-white"
            />
            <Button type="button" variant="secondary" className="glass border-white/30 text-white whitespace-nowrap" onClick={changeNickname} disabled={loading}>
              {loading ? '변경 중...' : '변경하기'}
            </Button>
          </div>
          <div className="text-xs text-white/60">닉네임은 24시간에 한 번만 변경할 수 있습니다.</div>
          {/* 디스코드 연동 섹션 제거 */}
          {/* 푸시 알림 설정 */}
          <div className="pt-3 border-t border-white/10 space-y-3">
            <div className="text-white text-sm">푸시 알림 설정</div>

            {/* 공통 토글 컴포넌트 스타일 */}
            <style>{`.toggle{position:relative;width:44px;height:24px;background:rgba(255,255,255,.15);border:1px solid rgba(255,255,255,.25);border-radius:9999px;transition:.2s}.toggle.on{background:linear-gradient(90deg,rgba(99,102,241,.6),rgba(59,130,246,.6))}.knob{position:absolute;top:2px;left:2px;width:20px;height:20px;background:#fff;border-radius:9999px;transition:.2s}.toggle.on .knob{left:22px}`}</style>

            <div className="flex items-center justify-between text-white/80 text-xs">
              <span>전체 푸시 알림</span>
              <button type="button" className={`toggle ${pushAll ? 'on' : ''}`} onClick={() => {
                const v = !pushAll
                setPushAll(v)
                setPushInvite(v)
                setPushFriendReq(v)
                setPushFriendSchedule(v)
                setPushParty(v)
                setPushMyTT(v)
              }}>
                <span className="knob" />
              </button>
            </div>

            <div className="flex items-center justify-between text-white/70 text-xs">
              <span>친구 추가 알림</span>
              <button type="button" className={`toggle ${pushFriendReq ? 'on' : ''}`} onClick={() => setPushFriendReq(!pushFriendReq)}>
                <span className="knob" />
              </button>
            </div>

            <div className="flex items-center justify-between text-white/70 text-xs">
              <span>서버 초대 알림</span>
              <button type="button" className={`toggle ${pushInvite ? 'on' : ''}`} onClick={() => setPushInvite(!pushInvite)}>
                <span className="knob" />
              </button>
            </div>

            <div className="flex items-center justify-between text-white/70 text-xs">
              <span>친구 스케줄 등록 알림</span>
              <button type="button" className={`toggle ${pushFriendSchedule ? 'on' : ''}`} onClick={() => setPushFriendSchedule(!pushFriendSchedule)}>
                <span className="knob" />
              </button>
            </div>

            <div className="flex items-center justify-between text-white/70 text-xs">
              <span>파티 모집 알림</span>
              <button type="button" className={`toggle ${pushParty ? 'on' : ''}`} onClick={() => setPushParty(!pushParty)}>
                <span className="knob" />
              </button>
            </div>

            <div className="flex items-center justify-between text-white/70 text-xs">
              <span>내 합류시간 알림</span>
              <button type="button" className={`toggle ${pushMyTT ? 'on' : ''}`} onClick={() => setPushMyTT(!pushMyTT)}>
                <span className="knob" />
              </button>
            </div>

            <div className="grid grid-cols-[auto_minmax(0,0.7fr)_auto] items-center text-white/70 text-xs gap-2">
              <span>합류시간 전 알림</span>
              <div className="justify-self-end mr-1">
                <Input
                  type="number"
                  min={0}
                  max={120}
                  value={myTTMinutes}
                  onChange={(e) => setMyTTMinutes(Number(e.target.value))}
                  disabled={!pushMyTT}
                  className="glass border-white/30 text-white h-6 w-14 text-center text-base sm:text-xs px-0 disabled:opacity-50 disabled:cursor-not-allowed"
                />
              </div>
              <span className="text-white/50">분</span>
            </div>

            <div className="text-[10px] text-white/50">
              친구 추가/서버 초대는 벨 패널에 항상 표시됩니다. 친구 스케줄 등록은 옵션에 따라 패널 표시/비표시를 선택할 수 있습니다.
            </div>
          </div>
          {/* 회원 탈퇴 섹션 */}
          <div className="pt-3 border-t border-white/10">
            <div className="text-white text-sm mb-2">계정</div>
            <ConfirmDeleteAccount />
          </div>
        </div>
        <div className="flex justify-end space-x-2 pt-4">
          <DialogClose asChild>
            <Button variant="outline" className="glass border-white/30 text-white">취소</Button>
          </DialogClose>
          <Button onClick={save} disabled={loading} className="glass-button">
            {loading ? '저장 중...' : '저장'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function ConfirmDeleteAccount() {
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [busy, setBusy] = useState(false)

  const doDelete = async () => {
    setBusy(true)
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/users/me`, {
        method: 'DELETE',
        headers: { ...authService.getAuthHeaders() }
      })
      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || '탈퇴에 실패했습니다')
      }
      toast.success('탈퇴가 완료되었습니다')
      await authService.logout()
      window.location.href = '/auth/login'
    } catch (e: any) {
      toast.error(e?.message || '탈퇴에 실패했습니다')
    } finally {
      setBusy(false)
      setConfirmOpen(false)
    }
  }

  return (
    <>
      <Button
        variant="destructive"
        className="w-full glass-button"
        onClick={() => setConfirmOpen(true)}
        disabled={busy}
      >
        {busy ? '처리 중...' : '회원 탈퇴'}
      </Button>
      {confirmOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60" onClick={()=>setConfirmOpen(false)}>
          <div className="bg-zinc-900 text-white max-w-sm w-full mx-4 rounded-lg border border-white/20" onClick={(e)=>e.stopPropagation()}>
            <div className="p-4 border-b border-white/10 text-lg font-semibold">정말 탈퇴하시겠어요?</div>
            <div className="p-4 text-sm text-white/80">
              탈퇴 시 참여 중인 모든 서버에서 제외되고, 등록한 파티/스케줄과 모든 기록이 삭제됩니다. 이 작업은 되돌릴 수 없습니다.
            </div>
            <div className="p-4 flex justify-end gap-2">
              <Button variant="outline" className="glass border-white/30 text-white" onClick={()=>setConfirmOpen(false)} disabled={busy}>취소</Button>
              <Button className="glass-button bg-red-500/20 hover:bg-red-500/30 text-red-300" onClick={doDelete} disabled={busy}>탈퇴하기</Button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
