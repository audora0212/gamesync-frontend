"use client";

import { useMemo, useState, useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { isNative } from "@/lib/native";
import { authService } from "@/lib/auth-service";

const SUPPORT_EMAIL = process.env.NEXT_PUBLIC_SUPPORT_EMAIL || "support@example.com";

export default function SupportPage() {
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [isNativeApp, setIsNativeApp] = useState<boolean>(false);
  const [lang, setLang] = useState<'ko'|'en'>('ko');

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

  const goStart = () => {
    try { if (authService.isAuthenticated()) window.location.href='/dashboard'; else window.location.href='/'; } catch { window.location.href='/' }
  }

  return (
    <div className="min-h-screen grid-bg">
      <div className="mx-auto max-w-2xl px-6 py-12">
      {/* 상단: 언어 토글 + 시작하러가기 */}
      <div className="mb-3 flex items-center justify-between">
        <div className="flex gap-2">
          <Button className={lang==='ko'?'btn-cyber text-sm':'btn-cyber-outline text-sm'} size="sm" onClick={()=>setLang('ko')}>한국어</Button>
          <Button className={lang==='en'?'btn-cyber text-sm':'btn-cyber-outline text-sm'} size="sm" onClick={()=>setLang('en')}>English</Button>
        </div>
        {!isNativeApp && (
          <Button className="btn-cyber-emerald text-sm" onClick={goStart}>시작하러가기</Button>
        )}
      </div>
      {/* 모바일 뒤로가기 (우측 정렬) */}
      <div className="mb-4 md:hidden flex justify-end">
        <Button
          variant="outline"
          className="btn-cyber-outline text-sm"
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
        <h1 className="text-3xl font-semibold neon-text-accent">{lang==='ko' ? '지원 센터' : 'Support Center'}</h1>
        <p className="mt-2 text-muted-foreground">
          {lang==='ko' ? '문제 신고, 기능 문의, 피드백은 아래 폼을 사용하거나 이메일로 연락주세요.' : 'Report issues, ask questions, or send feedback using the form below or via email.'}
        </p>
      </div>

      <div className="card-cyber border-pink-500/30 rounded-xl p-6">
        <div className="mb-4 grid gap-2">
          <Label htmlFor="subject" className="text-pink-400">{lang==='ko' ? '제목' : 'Subject'}</Label>
          <Input
            id="subject"
            placeholder={lang==='ko' ? '예: 로그인 중 오류가 발생합니다' : 'e.g., Error occurs during login'}
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            className={`input-cyber ${isNativeApp ? "text-base" : "text-sm"}`}
            style={isNativeApp ? { fontSize: 16 } : undefined}
          />
        </div>

        <div className="mb-6 grid gap-2">
          <Label htmlFor="message" className="text-pink-400">{lang==='ko' ? '내용' : 'Message'}</Label>
          <textarea
            id="message"
            className={`min-h-[160px] w-full rounded-xl bg-white/5 border border-white/20 text-white p-3 focus:outline-none focus:border-pink-500/50 ${isNativeApp ? "text-base" : "text-sm"}`}
            style={isNativeApp ? { fontSize: 16 } : undefined}
            placeholder={lang==='ko' ? `설명을 최대한 자세히 작성해주세요.\n- 어떤 화면/동작에서 문제가 발생했나요?\n- 언제부터 발생했나요?\n- 재현 방법이 있나요?` : `Please describe the issue in detail.\n- Which screen/action?\n- Since when?\n- Steps to reproduce?`}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
          />
        </div>

        <div className="flex items-center gap-3">
          <Button asChild className="btn-cyber-pink">
            <a href={mailtoHref}>{lang==='ko' ? '이메일로 보내기' : 'Send via Email'}</a>
          </Button>
          <span className="text-sm text-muted-foreground">
            {lang==='ko' ? '수신' : 'Recipient'}: {SUPPORT_EMAIL}
          </span>
        </div>
      </div>

      <div className="mt-10 grid gap-4">
        <div>
          <h2 className="text-xl font-medium text-cyan-400">{lang==='ko' ? 'FAQ / 정책' : 'FAQ / Policies'}</h2>
          <ul className="mt-2 list-disc pl-5 text-sm text-muted-foreground">
            <li>
              {lang==='ko' ? '계정/로그인 문제 해결: 앱 재설치, 네트워크 점검 후 다시 시도해주세요.' : 'Account/Login issues: Reinstall the app, check your network, then try again.'}
            </li>
            <li>
              {lang==='ko' ? '푸시 알림 미수신: 시스템 설정과 앱 권한에서 알림 허용 상태를 확인해주세요.' : 'No push notifications: Check system settings and app notification permissions.'}
            </li>
            <li>
              {lang==='ko' ? '개인정보 처리방침' : 'Privacy Policy'}: <Link className="underline text-cyan-400 hover:text-cyan-300" href="/privacy">/privacy</Link>
            </li>
            <li>
              {lang==='ko' ? '서비스 이용약관' : 'Terms of Service'}: <Link className="underline text-cyan-400 hover:text-cyan-300" href="/terms">/terms</Link>
            </li>
          </ul>
        </div>

        <div className="text-sm text-muted-foreground">
          {lang==='ko' ? '영업일 기준으로 가능한 한 빠르게 답변드리겠습니다.' : 'We will respond as quickly as possible during business days.'}
        </div>
      </div>
      </div>
    </div>
  );
}


