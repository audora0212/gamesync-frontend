"use client"

import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
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
  const [discordLinked, setDiscordLinked] = useState<boolean | null>(null);
  // 푸시 알림 설정 상태
  const [pushAll, setPushAll] = useState<boolean>(true)
  const [pushInvite, setPushInvite] = useState<boolean>(true)
  const [pushFriendReq, setPushFriendReq] = useState<boolean>(true)
  const [pushFriendSchedule, setPushFriendSchedule] = useState<boolean>(true)
  const [pushParty, setPushParty] = useState<boolean>(true)
  // 패널 표시는 친구 스케줄 FCM과 동일 토글로 통합

  useEffect(() => {
    if (!open) return;
    (async () => {
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/users/me`, {
          headers: { ...authService.getAuthHeaders() },
        });
        if (res.ok) {
          const data = await res.json();
          setDiscordLinked(Boolean(data.discordLinked));
        }
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
          <DialogTitle className="text-white">닉네임 변경</DialogTitle>
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
          <div className="pt-2 border-t border-white/10">
            {discordLinked ? (
              <div className="w-full text-center text-xs text-emerald-300/90 py-2">디스코드에 연동되었습니다</div>
            ) : (
              <>
                <Button
                  type="button"
                  variant="outline"
                  className="w-full glass border-white/30 text-white flex items-center justify-center gap-2"
                  onClick={() => {
                    window.location.href = `${process.env.NEXT_PUBLIC_API_URL!.replace(/\/api$/, "")}/oauth2/authorization/discord`;
                  }}
                >
                  <Link2 className="w-4 h-4" /> 디스코드로 연동하기
                </Button>
                <div className="text-[11px] text-white/50 mt-1">이미 다른 계정에 연동되어 있다면, 연동된 계정이라는 안내가 표시됩니다.</div>
              </>
            )}
          </div>
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
              }}>
                <span className="knob" />
              </button>
            </div>

            <div className="flex items-center justify-between text-white/70 text-xs">
              <span>친구 추가 FCM 알림</span>
              <button type="button" className={`toggle ${pushFriendReq ? 'on' : ''}`} onClick={() => setPushFriendReq(!pushFriendReq)}>
                <span className="knob" />
              </button>
            </div>

            <div className="flex items-center justify-between text-white/70 text-xs">
              <span>서버 초대 FCM 알림</span>
              <button type="button" className={`toggle ${pushInvite ? 'on' : ''}`} onClick={() => setPushInvite(!pushInvite)}>
                <span className="knob" />
              </button>
            </div>

            <div className="flex items-center justify-between text-white/70 text-xs">
              <span>친구 스케줄 등록 알림 (FCM + 패널)</span>
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

            <div className="text-[10px] text-white/50">
              친구 추가/서버 초대는 벨 패널에 항상 표시됩니다. 친구 스케줄 등록은 옵션에 따라 패널 표시/비표시를 선택할 수 있습니다.
            </div>
          </div>
        </div>
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline">취소</Button>
          </DialogClose>
          <Button onClick={save} disabled={loading}>
            {loading ? '저장 중...' : '저장'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
