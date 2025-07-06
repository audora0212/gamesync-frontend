"use client"

import { useState } from "react";
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
import { Settings as SettingsIcon } from "lucide-react";

export function ChangeNicknameModal() {
  const [open, setOpen] = useState(false);
  const [nickname, setNickname] = useState(authService.getCurrentUser() || "");
  const [loading, setLoading] = useState(false);

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
      if (!res.ok) throw new Error();
      // 로컬 저장
      authService.setCurrentUser({ id: authService.getCurrentUserId()!, nickname });
      toast.success('닉네임이 변경되었습니다');
      setOpen(false);
    } catch {
      toast.error('닉네임 변경에 실패했습니다');
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
        <div className="p-4">
          <Input
            value={nickname}
            onChange={e => setNickname(e.target.value)}
            className="glass border-white/30 text-white"
          />
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
