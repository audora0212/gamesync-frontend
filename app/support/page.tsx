"use client";

import { useMemo, useState, useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { isNative } from "@/lib/native";

const SUPPORT_EMAIL = process.env.NEXT_PUBLIC_SUPPORT_EMAIL || "support@example.com";

export default function SupportPage() {
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [isNativeApp, setIsNativeApp] = useState<boolean>(false);

  useEffect(() => {
    (async () => {
      try { setIsNativeApp(await isNative()); } catch { setIsNativeApp(false); }
    })();
  }, []);

  const mailtoHref = useMemo(() => {
    const body = `${message}\n\n—\n앱: GameSync\n발생 버전: (선택 입력)\nOS/기기: (선택 입력)`;
    const params = new URLSearchParams({
      subject,
      body,
    }).toString();
    return `mailto:${SUPPORT_EMAIL}?${params}`;
  }, [subject, message]);

  return (
    <div className="mx-auto max-w-2xl px-6 py-12">
      {/* 모바일 뒤로가기 (우측 정렬) */}
      <div className="mb-4 md:hidden flex justify-end">
        <Button
          variant="outline"
          className="glass border-white/30 text-white hover:bg-black/10 hover:text-white"
          onClick={() => {
            try {
              if (typeof window !== "undefined" && window.history.length > 1) history.back();
              else location.href = "/";
            } catch {
              location.href = "/";
            }
          }}
        >
          뒤로가기
        </Button>
      </div>
      <div className="mb-8">
        <h1 className="text-3xl font-semibold">지원 센터</h1>
        <p className="mt-2 text-muted-foreground">
          문제 신고, 기능 문의, 피드백은 아래 폼을 사용하거나 이메일로 연락주세요.
        </p>
      </div>

      <div className="rounded-lg border p-6">
        <div className="mb-4 grid gap-2">
          <Label htmlFor="subject">제목</Label>
          <Input
            id="subject"
            placeholder="예: 로그인 중 오류가 발생합니다"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            className={isNativeApp ? "text-base" : "text-sm"}
            style={isNativeApp ? { fontSize: 16 } : undefined}
          />
        </div>

        <div className="mb-6 grid gap-2">
          <Label htmlFor="message">내용</Label>
          <textarea
            id="message"
            className={`min-h-[160px] w-full rounded-md border bg-background p-3 focus:outline-none ${isNativeApp ? "text-base" : "text-sm"}`}
            style={isNativeApp ? { fontSize: 16 } : undefined}
            placeholder={`설명을 최대한 자세히 작성해주세요.\n- 어떤 화면/동작에서 문제가 발생했나요?\n- 언제부터 발생했나요?\n- 재현 방법이 있나요?`}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
          />
        </div>

        <div className="flex items-center gap-3">
          <Button asChild>
            <a href={mailtoHref}>이메일로 보내기</a>
          </Button>
          <span className="text-sm text-muted-foreground">
            수신: {SUPPORT_EMAIL}
          </span>
        </div>
      </div>

      <div className="mt-10 grid gap-4">
        <div>
          <h2 className="text-xl font-medium">FAQ / 정책</h2>
          <ul className="mt-2 list-disc pl-5 text-sm text-muted-foreground">
            <li>
              계정/로그인 문제 해결: 앱 재설치, 네트워크 점검 후 다시 시도해주세요.
            </li>
            <li>
              푸시 알림 미수신: 시스템 설정과 앱 권한에서 알림 허용 상태를 확인해주세요.
            </li>
            <li>
              개인정보 처리방침: <Link className="underline" href="/privacy">/privacy</Link>
            </li>
            <li>
              서비스 이용약관: <Link className="underline" href="/terms">/terms</Link>
            </li>
          </ul>
        </div>

        <div className="text-sm text-muted-foreground">
          영업일 기준으로 가능한 한 빠르게 답변드리겠습니다.
        </div>
      </div>
    </div>
  );
}


