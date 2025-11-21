"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { authService } from "@/lib/auth-service";
import { isNative } from "@/lib/native";

export default function PrivacyPage() {
  const supportEmail = process.env.NEXT_PUBLIC_SUPPORT_EMAIL || "support@example.com";
  const router = useRouter();
  const REVIEW_MODE = process.env.NEXT_PUBLIC_REVIEW_MODE === 'true'
  const [lang, setLang] = useState<'ko'|'en'>('ko')
  const [isNativeApp, setIsNativeApp] = useState(false)

  useEffect(() => {
    (async () => {
      try { setIsNativeApp(await isNative()) } catch { setIsNativeApp(false) }
    })()
  }, [])

  const goStart = () => {
    try {
      if (authService.isAuthenticated()) router.push('/dashboard')
      else router.push('/')
    } catch { router.push('/') }
  }
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
              if (typeof window !== "undefined" && window.history.length > 1) router.back();
              else router.push("/");
            } catch {
              router.push("/");
            }
          }}
        >
          뒤로가기
        </Button>
      </div>
      {lang==='ko' ? (
        <>
          <h1 className="text-3xl font-semibold">개인정보 처리방침</h1>
          <p className="mt-3 text-sm text-muted-foreground">
            GameSync(이하 “서비스”)는 이용자의 개인정보를 소중히 다루며, 관련 법령 및 규정을 준수합니다. 본 방침은 서비스가 수집·이용·보관·파기하는 개인정보의 항목과 목적, 이용자의 권리 및 행사 방법을 설명합니다.
          </p>
        </>
      ) : (
        <>
          <h1 className="text-3xl font-semibold">Privacy Policy</h1>
          <p className="mt-3 text-sm text-muted-foreground">
            GameSync (&quot;Service&quot;) respects your privacy and complies with applicable laws. This policy explains what data we collect, how we use/store/delete it, and your rights.
          </p>
        </>
      )}

      <section className="mt-8 space-y-3">
        <h2 className="text-xl font-medium">{lang==='ko' ? '1. 수집하는 개인정보 항목' : '1. Data We Collect'}</h2>
        {lang==='ko' ? (
          <ul className="list-disc pl-5 text-sm text-muted-foreground space-y-1">
            {!REVIEW_MODE && (
              <li>필수: 계정 식별 정보(카카오 또는 디스코드 계정 ID), 닉네임/프로필(제공 시)</li>
            )}
            <li>선택: 이메일 주소(제공 시), 프로필 이미지</li>
            <li>서비스 이용 정보: 서버/파티/일정 등 사용자가 입력한 데이터, 접속/이용 로그</li>
            <li>알림을 위한 토큰: 푸시 알림용 기기 토큰(FCM/APNs)</li>
          </ul>
        ) : (
          <ul className="list-disc pl-5 text-sm text-muted-foreground space-y-1">
            {!REVIEW_MODE && (<li>Required: Account identifiers (e.g., Kakao/Discord ID), nickname/profile (if provided)</li>)}
            <li>Optional: Email address (if provided), profile image</li>
            <li>Usage info: Data you enter (servers/parties/schedules), access logs</li>
            <li>Push tokens for notifications (FCM/APNs)</li>
          </ul>
        )}
      </section>

      <section className="mt-8 space-y-3">
        <h2 className="text-xl font-medium">{lang==='ko' ? '2. 개인정보 수집 방법' : '2. How We Collect'}</h2>
        {lang==='ko' ? (
          <ul className="list-disc pl-5 text-sm text-muted-foreground space-y-1">
            {!REVIEW_MODE && (<li>소셜 로그인(OAuth) 과정에서 제공 동의 시 수집</li>)}
            <li>서비스 이용 및 기능 사용(서버 생성, 파티 모집/참여, 일정 예약 등) 과정에서 수집</li>
            <li>문의/지원 접수 시 사용자가 직접 입력한 정보 수집</li>
          </ul>
        ) : (
          <ul className="list-disc pl-5 text-sm text-muted-foreground space-y-1">
            {!REVIEW_MODE && (<li>Via OAuth sign-in upon your consent</li>)}
            <li>During feature usage (create servers, parties, schedule)</li>
            <li>When you contact support and provide info</li>
          </ul>
        )}
      </section>

      <section className="mt-8 space-y-3">
        <h2 className="text-xl font-medium">{lang==='ko' ? '3. 개인정보의 이용 목적' : '3. Purpose of Use'}</h2>
        {lang==='ko' ? (
          <ul className="list-disc pl-5 text-sm text-muted-foreground space-y-1">
            <li>회원 식별 및 로그인, 부정 이용 방지</li>
            <li>서비스 제공: 서버 운영, 파티 모집/참여, 합류 시간표 등 핵심 기능 제공</li>
            <li>알림 제공: 예약 시간, 파티 모집 등 푸시 알림 발송</li>
            <li>고객 지원 및 공지 전달, 서비스 품질 개선</li>
            <li>법령 준수 및 분쟁 대응</li>
          </ul>
        ) : (
          <ul className="list-disc pl-5 text-sm text-muted-foreground space-y-1">
            <li>User authentication and fraud prevention</li>
            <li>Provide core features (servers, parties, schedules)</li>
            <li>Send notifications (reminders, party recruitment)</li>
            <li>Support, announcements, and service improvement</li>
            <li>Legal compliance and dispute handling</li>
          </ul>
        )}
      </section>

      <section className="mt-8 space-y-3">
        <h2 className="text-xl font-medium">{lang==='ko' ? '4. 처리위탁 및 제3자 제공' : '4. Processors and Third Parties'}</h2>
        {lang==='ko' ? (
          <>
            <p className="text-sm text-muted-foreground">서비스는 안정적인 제공을 위해 다음 업체에 처리를 위탁하거나, 연동 과정에서 정보가 전송될 수 있습니다.</p>
            <ul className="list-disc pl-5 text-sm text-muted-foreground space-y-1">
              {!REVIEW_MODE && (<li>인증: 카카오(카카오계정), 디스코드(Discord, Inc.)</li>)}
              <li>푸시 알림: Firebase Cloud Messaging(Google LLC), Apple Push Notification service(Apple Inc.)</li>
              <li>인프라/호스팅: AWS 또는 사용 중인 클라우드 제공자</li>
            </ul>
            <p className="text-xs text-muted-foreground">각 제공자의 개인정보 처리방침은 해당 업체의 공식 페이지를 참고하시기 바랍니다.</p>
          </>
        ) : (
          <>
            <p className="text-sm text-muted-foreground">To provide stable service, we may work with the following providers.</p>
            <ul className="list-disc pl-5 text-sm text-muted-foreground space-y-1">
              {!REVIEW_MODE && (<li>Auth: Kakao, Discord</li>)}
              <li>Push: Firebase Cloud Messaging (Google), APNs (Apple)</li>
              <li>Infra/Hosting: AWS or our cloud provider</li>
            </ul>
            <p className="text-xs text-muted-foreground">Refer to each provider’s official privacy policy.</p>
          </>
        )}
      </section>

      <section className="mt-8 space-y-3">
        <h2 className="text-xl font-medium">{lang==='ko' ? '5. 보유 및 이용 기간' : '5. Retention Period'}</h2>
        {lang==='ko' ? (
          <ul className="list-disc pl-5 text-sm text-muted-foreground space-y-1">
            <li>회원 탈퇴 시, 관련 법령에 따라 보관이 요구되는 경우를 제외하고 지체 없이 파기합니다.</li>
            <li>접속 기록 등 로그성 정보는 보안 및 분쟁 대응을 위해 최대 1년 보관 후 파기할 수 있습니다.</li>
            <li>법령상 보존 의무가 있는 경우 해당 기간 동안 분리 보관합니다.</li>
          </ul>
        ) : (
          <ul className="list-disc pl-5 text-sm text-muted-foreground space-y-1">
            <li>Upon account deletion, we erase your data unless retention is required by law.</li>
            <li>Log data may be retained up to 1 year for security and dispute resolution.</li>
            <li>Where legally required, data is retained for the mandated period.</li>
          </ul>
        )}
      </section>

      <section className="mt-8 space-y-3">
        <h2 className="text-xl font-medium">{lang==='ko' ? '6. 국외 이전' : '6. International Transfers'}</h2>
        {lang==='ko' ? (
          <p className="text-sm text-muted-foreground">FCM 등 일부 서비스는 국외 서버를 사용합니다. 이에 따라 서비스 이용 과정에서 개인정보가 국외로 이전·보관될 수 있습니다. 이전되는 정보, 국가, 보유 기간 등은 각 제공자의 정책을 따릅니다.</p>
        ) : (
          <p className="text-sm text-muted-foreground">Some services such as FCM use overseas servers. Your data may be transferred/stored abroad per each provider’s policy.</p>
        )}
      </section>

      <section className="mt-8 space-y-3">
        <h2 className="text-xl font-medium">{lang==='ko' ? '7. 이용자의 권리' : '7. Your Rights'}</h2>
        {lang==='ko' ? (
          <ul className="list-disc pl-5 text-sm text-muted-foreground space-y-1">
            <li>본인 확인 후 개인정보 열람·정정·삭제·처리정지·동의철회를 요청하실 수 있습니다.</li>
            <li>앱 내 프로필/설정 또는 아래 연락처를 통해 요청하실 수 있습니다.</li>
          </ul>
        ) : (
          <ul className="list-disc pl-5 text-sm text-muted-foreground space-y-1">
            <li>You can request access, correction, deletion, restriction, and withdrawal of consent.</li>
            <li>Submit requests via in-app profile/settings or through the contact below.</li>
          </ul>
        )}
      </section>



      <section className="mt-8 space-y-3">
        <h2 className="text-xl font-medium">{lang==='ko' ? '8. 개인정보의 안전성 확보조치' : '8. Security Measures'}</h2>
        {lang==='ko' ? (
          <ul className="list-disc pl-5 text-sm text-muted-foreground space-y-1">
            <li>전송 구간 암호화(HTTPS), 접근 통제, 최소 권한 원칙 적용</li>
            <li>민감 정보는 수집하지 않으며, 필요한 경우 법령 기준에 따른 암호화 등 보호조치 적용</li>
          </ul>
        ) : (
          <ul className="list-disc pl-5 text-sm text-muted-foreground space-y-1">
            <li>HTTPS, access control, and least privilege</li>
            <li>No sensitive data collected; apply legal-grade safeguards if needed</li>
          </ul>
        )}
      </section>

      <section className="mt-8 space-y-3">
        <h2 className="text-xl font-medium">{lang==='ko' ? '9. 문의처' : '9. Contact'}</h2>
        {lang==='ko' ? (
          <>
            <p className="text-sm text-muted-foreground">개인정보 관련 문의, 신고 및 권리 행사는 아래로 연락해 주세요.</p>
            <div className="rounded-md border p-4 text-sm text-muted-foreground">이메일: <a className="underline" href={`mailto:${supportEmail}`}>{supportEmail}</a></div>
            <p className="text-xs text-muted-foreground">보다 빠른 응답을 위해 문제 상황, 스크린샷, 재현 절차를 함께 제공해 주세요.</p>
          </>
        ) : (
          <>
            <p className="text-sm text-muted-foreground">For privacy inquiries or rights requests, contact us below.</p>
            <div className="rounded-md border p-4 text-sm text-muted-foreground">Email: <a className="underline" href={`mailto:${supportEmail}`}>{supportEmail}</a></div>
            <p className="text-xs text-muted-foreground">For faster response, include context, screenshots, and repro steps.</p>
          </>
        )}
      </section>

      <section className="mt-8 space-y-3">
        <h2 className="text-xl font-medium">{lang==='ko' ? '10. 본 방침의 변경' : '10. Changes to this Policy'}</h2>
        {lang==='ko' ? (
          <>
            <p className="text-sm text-muted-foreground">법령, 서비스 변경에 따라 방침이 수정될 수 있으며, 변경 사항은 서비스 내 공지 또는 본 페이지를 통해 고지합니다.</p>
            <p className="text-xs text-muted-foreground">시행일: 2025-09-06 · JY.L</p>
          </>
        ) : (
          <>
            <p className="text-sm text-muted-foreground">We may update this policy for legal or service changes; updates will be announced in-app or on this page.</p>
            <p className="text-xs text-muted-foreground">Effective date: 2025-01-01 · JY.L</p>
          </>
        )}
      </section>

      <div className="mt-10 text-sm text-muted-foreground">
        {lang==='ko' ? (
          <>관련 문서: <Link className="underline" href="/terms">이용약관</Link> · <Link className="underline" href="/support">지원 센터</Link></>
        ) : (
          <>Related: <Link className="underline" href="/terms">Terms of Service</Link> · <Link className="underline" href="/support">Support</Link></>
        )}
      </div>
    </div>
  );
}


