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
import { Settings as SettingsIcon, Bell, User, Trash2 } from "lucide-react";

export function SettingModal() {
  const [open, setOpen] = useState(false);
  const [nickname, setNickname] = useState(authService.getCurrentUser() || "");
  const [loading, setLoading] = useState(false);
  // 푸시 알림 설정 상태
  const [pushAll, setPushAll] = useState<boolean>(true)
  const [pushInvite, setPushInvite] = useState<boolean>(true)
  const [pushFriendReq, setPushFriendReq] = useState<boolean>(true)
  const [pushFriendSchedule, setPushFriendSchedule] = useState<boolean>(true)
  const [pushParty, setPushParty] = useState<boolean>(true)
  const [pushMyTT, setPushMyTT] = useState<boolean>(true)
  const [myTTMinutes, setMyTTMinutes] = useState<number>(10)

  useEffect(() => {
    if (!open) return;
    (async () => {
      try {
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
          }
        } catch {}
      } catch {}
    })();
  }, [open]);

  const save = async () => {
    setLoading(true);
    try {
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
          className="text-muted-foreground hover:text-neon-cyan hover:bg-neon-cyan/10 hover:shadow-[0_0_15px_rgba(5,242,219,0.3)] transition-all"
        >
          <SettingsIcon className="h-5 w-5" />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-sm max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2.5 rounded-xl bg-neon-cyan/20 shadow-[0_0_15px_rgba(5,242,219,0.2)]">
              <SettingsIcon className="w-5 h-5 text-neon-cyan" />
            </div>
            <DialogTitle className="text-neon-cyan drop-shadow-[0_0_10px_rgba(5,242,219,0.5)] text-lg font-display">
              설정
            </DialogTitle>
          </div>
        </DialogHeader>

        <div className="space-y-5">
          {/* 닉네임 변경 */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-neon-magenta text-sm font-medium">
              <User className="w-4 h-4" />
              닉네임 변경
            </div>
            <div className="flex items-center gap-2">
              <Input
                value={nickname}
                onChange={e => setNickname(e.target.value)}
                className="flex-1"
              />
              <Button
                type="button"
                variant="secondary"
                onClick={changeNickname}
                disabled={loading}
              >
                {loading ? '변경 중...' : '변경'}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">닉네임은 24시간에 한 번만 변경할 수 있습니다.</p>
          </div>

          {/* 푸시 알림 설정 */}
          <div className="space-y-4 pt-4 border-t border-white/10">
            <div className="flex items-center gap-2 text-neon-pink text-sm font-medium">
              <Bell className="w-4 h-4" />
              푸시 알림 설정
            </div>

            <ToggleItem
              label="전체 푸시 알림"
              checked={pushAll}
              onChange={(v) => {
                setPushAll(v)
                setPushInvite(v)
                setPushFriendReq(v)
                setPushFriendSchedule(v)
                setPushParty(v)
                setPushMyTT(v)
              }}
              color="cyan"
            />
            <ToggleItem label="친구 추가 알림" checked={pushFriendReq} onChange={setPushFriendReq} />
            <ToggleItem label="서버 초대 알림" checked={pushInvite} onChange={setPushInvite} />
            <ToggleItem label="친구 스케줄 등록 알림" checked={pushFriendSchedule} onChange={setPushFriendSchedule} />
            <ToggleItem label="파티 모집 알림" checked={pushParty} onChange={setPushParty} />
            <ToggleItem label="내 합류시간 알림" checked={pushMyTT} onChange={setPushMyTT} />

            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">합류시간 전 알림</span>
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  min={0}
                  max={120}
                  value={myTTMinutes}
                  onChange={(e) => setMyTTMinutes(Number(e.target.value))}
                  disabled={!pushMyTT}
                  className="w-16 h-8 text-center text-sm"
                />
                <span className="text-muted-foreground text-xs">분</span>
              </div>
            </div>

            <p className="text-[10px] text-muted-foreground/60">
              친구 추가/서버 초대는 벨 패널에 항상 표시됩니다. 친구 스케줄 등록은 옵션에 따라 패널 표시/비표시를 선택할 수 있습니다.
            </p>
          </div>

          {/* 회원 탈퇴 섹션 */}
          <div className="pt-4 border-t border-white/10">
            <div className="flex items-center gap-2 text-neon-red text-sm font-medium mb-3">
              <Trash2 className="w-4 h-4" />
              계정
            </div>
            <ConfirmDeleteAccount />
          </div>
        </div>

        <div className="flex justify-end space-x-2 pt-4">
          <DialogClose asChild>
            <Button variant="outline">취소</Button>
          </DialogClose>
          <Button onClick={save} disabled={loading}>
            {loading ? '저장 중...' : '저장'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function ToggleItem({
  label,
  checked,
  onChange,
  color = 'default'
}: {
  label: string;
  checked: boolean;
  onChange: (value: boolean) => void;
  color?: 'default' | 'cyan';
}) {
  return (
    <div className="flex items-center justify-between">
      <span className={`text-sm ${color === 'cyan' ? 'text-foreground' : 'text-muted-foreground'}`}>
        {label}
      </span>
      <button
        type="button"
        className={`relative w-11 h-6 rounded-full transition-all ${
          checked
            ? 'bg-neon-cyan/60 shadow-[0_0_10px_rgba(5,242,219,0.4)]'
            : 'bg-white/10'
        }`}
        onClick={() => onChange(!checked)}
      >
        <span
          className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${
            checked ? 'left-6' : 'left-1'
          }`}
        />
      </button>
    </div>
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
        className="w-full"
        onClick={() => setConfirmOpen(true)}
        disabled={busy}
      >
        {busy ? '처리 중...' : '회원 탈퇴'}
      </Button>
      {confirmOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm" onClick={()=>setConfirmOpen(false)}>
          <div
            className="bg-card/95 backdrop-blur-xl border border-neon-red/30 max-w-sm w-full mx-4 rounded-xl overflow-hidden shadow-[0_0_30px_rgba(255,51,102,0.2)]"
            onClick={(e)=>e.stopPropagation()}
          >
            <div className="p-4 border-b border-white/10">
              <h3 className="text-lg font-display font-semibold text-neon-red">정말 탈퇴하시겠어요?</h3>
            </div>
            <div className="p-4 text-sm text-foreground/80">
              탈퇴 시 참여 중인 모든 서버에서 제외되고, 등록한 파티/스케줄과 모든 기록이 삭제됩니다. 이 작업은 되돌릴 수 없습니다.
            </div>
            <div className="p-4 border-t border-white/10 flex justify-end gap-2">
              <Button variant="outline" onClick={()=>setConfirmOpen(false)} disabled={busy}>
                취소
              </Button>
              <Button variant="destructive" onClick={doDelete} disabled={busy}>
                탈퇴하기
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
