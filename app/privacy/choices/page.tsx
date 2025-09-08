"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { authService } from "@/lib/auth-service";
import { isNative } from "@/lib/native";

export default function PrivacyChoicesPage() {
  const supportEmail = process.env.NEXT_PUBLIC_SUPPORT_EMAIL || "support@example.com";
  const [lang, setLang] = useState<'ko'|'en'>('ko');
  const [isNativeApp, setIsNativeApp] = useState(false)
  const goStart = () => {
    try { if (authService.isAuthenticated()) window.location.href='/dashboard'; else window.location.href='/'; } catch { window.location.href='/' }
  }
  useEffect(() => { (async()=>{ try{ setIsNativeApp(await isNative()) } catch{ setIsNativeApp(false) } })() }, [])
  return (
    <div className="mx-auto max-w-3xl px-6 py-12">
      {/* 상단: 언어 토글 + 시작하러가기 */}
      <div className="mb-3 flex items-center justify-between">
        <div className="flex gap-2">
          <Button variant={lang==='ko'?'default':'outline'} size="sm" onClick={()=>setLang('ko')}>한국어</Button>
          <Button variant={lang==='en'?'default':'outline'} size="sm" onClick={()=>setLang('en')}>English</Button>
        </div>
        {!isNativeApp && (
          <Button variant="secondary" className="glass" onClick={goStart}>시작하러가기</Button>
        )}
      </div>
      {/* 모바일 뒤로가기 (우측 정렬, 화살표 제거) */}
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
      {lang==='ko' ? (
        <>
          <h1 className="text-3xl font-semibold">개인정보 선택 설정</h1>
          <p className="mt-3 text-sm text-muted-foreground">아래에서 개인정보 처리와 관련된 선택 사항을 확인하세요. 일부 항목은 앱 내 설정 또는 문의를 통해 처리됩니다.</p>
        </>
      ) : (
        <>
          <h1 className="text-3xl font-semibold">Privacy Choices</h1>
          <p className="mt-3 text-sm text-muted-foreground">Review your privacy-related choices below. Some items are handled in-app or via support.</p>
        </>
      )}

      <section className="mt-8 space-y-3">
        <h2 className="text-xl font-medium">{lang==='ko' ? '1. 푸시 알림 수신 설정' : '1. Push Notification Preferences'}</h2>
        <p className="text-sm text-muted-foreground">{lang==='ko' ? '알림은 예약 시간/파티 모집 등 핵심 기능 제공을 위해 사용됩니다. 앱의 프로필 또는 설정 화면에서 카테고리별 수신 여부를 변경할 수 있습니다. 기기 알림 권한은 OS 설정에서 변경 가능합니다.' : 'Notifications are used for reminders and party recruitment. Change categories in the app settings. OS notification permissions can be changed in system settings.'}</p>
      </section>

      <section className="mt-8 space-y-3">
        <h2 className="text-xl font-medium">{lang==='ko' ? '2. 계정 정보 수정/삭제' : '2. Edit/Delete Account Info'}</h2>
        <p className="text-sm text-muted-foreground">{lang==='ko' ? '닉네임 등 프로필 정보는 앱 내 프로필/설정 화면에서 변경할 수 있습니다. 계정 삭제(회원 탈퇴)를 원하시면 앱 내 메뉴 또는 아래 이메일로 요청하실 수 있습니다.' : 'You can change profile info in the app. To delete your account, use the in-app menu or contact us via email below.'}</p>
      </section>

      <section className="mt-8 space-y-3">
        <h2 className="text-xl font-medium">{lang==='ko' ? '3. 데이터 접근·정정·삭제 요청' : '3. Data Access/Correction/Deletion'}</h2>
        <p className="text-sm text-muted-foreground">{lang==='ko' ? '본인 확인 후 보유 중인 개인정보의 열람, 정정, 삭제, 처리정지 및 동의 철회를 요청하실 수 있습니다. 아래 이메일로 요청해 주세요.' : 'You may request access, correction, deletion, restriction, or withdrawal of consent after verification. Contact us via email below.'}</p>
        <div className="rounded-md border p-4 text-sm text-muted-foreground">
          {lang==='ko' ? '이메일' : 'Email'}: <a className="underline" href={`mailto:${supportEmail}`}>{supportEmail}</a>
        </div>
      </section>

      <section className="mt-8 space-y-3">
        <h2 className="text-xl font-medium">{lang==='ko' ? '4. 이메일 수신 동의/철회' : '4. Email Consent/Opt-out'}</h2>
        <p className="text-sm text-muted-foreground">{lang==='ko' ? '마케팅/공지 메일을 발송하는 경우, 각 메일 하단의 수신 거부 링크 또는 위 이메일을 통해 철회할 수 있습니다. (현재 마케팅 메일은 발송하지 않습니다.)' : 'If we send marketing/announcement emails, you can opt out via the link in the email footer or by contacting us. (We currently do not send marketing emails.)'}</p>
      </section>

      <p className="mt-10 text-xs text-muted-foreground">최종 업데이트: 2025-01-01</p>
    </div>
  );
}


