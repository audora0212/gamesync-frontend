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

export function ChangeNicknameModal() {
  const [open, setOpen] = useState(false);
  const [nickname, setNickname] = useState(authService.getCurrentUser() || "");
  const [loading, setLoading] = useState(false);
  const [discordLinked, setDiscordLinked] = useState<boolean | null>(null);

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
      } catch {
        // ignore
      }
    })();
  }, [open]);

  const save = async () => {
    setLoading(true);
    try {
      // API 호출
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/users/me/nickname`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            ...authService.getAuthHeaders(),
          },
          body: JSON.stringify({ nickname }),
        }
      );
      if (!res.ok) {
        // 에러 메시지 추출 (JSON 우선)
        try {
          const err = await res.json();
          const msg = err?.message || err?.error || '닉네임 변경에 실패했습니다';
          throw new Error(msg);
        } catch {
          const text = await res.text();
          throw new Error(text || '닉네임 변경에 실패했습니다');
        }
      }
      const data = await res.json();
      // 백엔드가 Profile 객체를 그대로 반환하므로 바로 사용
      authService.setCurrentUser({ id: authService.getCurrentUserId()!, nickname: data.nickname });
      toast.success('닉네임이 변경되었습니다');
      setOpen(false);
    } catch (e: any) {
      const msg = typeof e?.message === 'string' ? e.message : '닉네임 변경에 실패했습니다';
      // 서버에서 남은 시간 안내 메시지를 내려주면 그대로 출력
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

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
          <Input
            value={nickname}
            onChange={e => setNickname(e.target.value)}
            className="glass border-white/30 text-white"
          />
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
