"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { authService } from "@/lib/auth-service";
import { isNative } from "@/lib/native";

export default function TermsPage() {
  const router = useRouter();
  const [lang, setLang] = useState<'ko'|'en'>('ko')
  const [isNativeApp, setIsNativeApp] = useState(false)
  const goStart = () => {
    try { if (authService.isAuthenticated()) router.push('/dashboard'); else router.push('/'); } catch { router.push('/') }
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
      {/* 모바일 뒤로가기 (우측 정렬) */}
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
          <h1 className="text-3xl font-semibold">이용약관</h1>
          <p className="mt-3 text-sm text-muted-foreground">본 약관은 GameSync 서비스(이하 &quot;서비스&quot;)의 이용과 관련하여 회사와 이용자 간의 권리, 의무 및 책임사항, 기타 필요한 사항을 규정합니다.</p>
        </>
      ) : (
        <>
          <h1 className="text-3xl font-semibold">Terms of Service</h1>
          <p className="mt-3 text-sm text-muted-foreground">These Terms govern the use of GameSync (the &quot;Service&quot;), describing rights, obligations, and responsibilities between us and users.</p>
        </>
      )}

      <section className="mt-8 space-y-3">
        <h2 className="text-xl font-medium">{lang==='ko' ? '1. 목적' : '1. Purpose'}</h2>
        <p className="text-sm text-muted-foreground">{lang==='ko' ? '이 약관은 서비스 이용과 관련된 기본 사항을 규정함을 목적으로 합니다.' : 'These Terms set forth the basic matters related to using the Service.'}</p>
      </section>

      <section className="mt-8 space-y-3">
        <h2 className="text-xl font-medium">{lang==='ko' ? '2. 용어의 정의' : '2. Definitions'}</h2>
        <p className="text-sm text-muted-foreground">{lang==='ko' ? '서비스, 이용자, 계정, 콘텐츠 등 기본 용어의 정의는 관련 법령과 일반 관례를 따릅니다.' : 'Basic terms such as Service, User, Account, and Content follow common legal definitions and practice.'}</p>
      </section>

      <section className="mt-8 space-y-3">
        <h2 className="text-xl font-medium">{lang==='ko' ? '3. 약관의 게시와 개정' : '3. Posting and Amendments'}</h2>
        <p className="text-sm text-muted-foreground">{lang==='ko' ? '회사는 본 약관을 서비스 화면에 게시하며, 관련 법령을 준수하여 개정할 수 있습니다.' : 'We post these Terms in the Service and may amend them in accordance with applicable laws.'}</p>
      </section>

      <section className="mt-8 space-y-3">
        <h2 className="text-xl font-medium">{lang==='ko' ? '4. 서비스의 제공' : '4. Provision of the Service'}</h2>
        <p className="text-sm text-muted-foreground">{lang==='ko' ? '회사는 서비스의 제공과 관련하여 합리적인 범위 내에서 변경, 중단할 수 있으며 사전 고지합니다.' : 'We may change or suspend the Service within reasonable scope and announce it in advance.'}</p>
      </section>

      <section className="mt-8 space-y-3">
        <h2 className="text-xl font-medium">{lang==='ko' ? '5. 이용자의 의무' : '5. User Obligations'}</h2>
        <p className="text-sm text-muted-foreground">{lang==='ko' ? '이용자는 관련 법령, 본 약관, 서비스 내 안내에 따라 서비스를 이용해야 합니다.' : 'Users must use the Service in accordance with laws, these Terms, and in-app guidance.'}</p>
      </section>

      <section className="mt-8 space-y-3">
        <h2 className="text-xl font-medium">{lang==='ko' ? '6. 권리의 귀속' : '6. Ownership of Rights'}</h2>
        <p className="text-sm text-muted-foreground">{lang==='ko' ? '서비스 및 관련 소프트웨어에 대한 지식재산권은 회사에 귀속됩니다.' : 'Intellectual property rights in the Service and related software belong to the Company.'}</p>
      </section>

      <section className="mt-8 space-y-3">
        <h2 className="text-xl font-medium">{lang==='ko' ? '7. 책임 제한' : '7. Limitation of Liability'}</h2>
        <p className="text-sm text-muted-foreground">{lang==='ko' ? '회사는 천재지변 등 불가항력으로 인한 서비스 장애에 대해 책임을 지지 않습니다.' : 'We are not liable for service failures caused by force majeure such as natural disasters.'}</p>
      </section>

      <section className="mt-8 space-y-3">
        <h2 className="text-xl font-medium">{lang==='ko' ? '8. 분쟁의 해결' : '8. Dispute Resolution'}</h2>
        <p className="text-sm text-muted-foreground">{lang==='ko' ? '본 약관과 관련된 분쟁은 관계 법령과 상관례에 따라 해결합니다.' : 'Disputes related to these Terms are resolved under applicable law and common practice.'}</p>
      </section>

      <p className="mt-10 text-xs text-muted-foreground">{lang==='ko' ? '시행일: 2025-09-06' : 'Effective date: 2025-09-06'}</p>
    </div>
  );
}


