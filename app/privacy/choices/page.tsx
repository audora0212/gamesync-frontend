import { Button } from "@/components/ui/button";

export default function PrivacyChoicesPage() {
  const supportEmail = process.env.NEXT_PUBLIC_SUPPORT_EMAIL || "support@example.com";
  return (
    <div className="mx-auto max-w-3xl px-6 py-12">
      {/* 모바일 뒤로가기 */}
      <div className="mb-4 md:hidden">
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
          ← 뒤로가기
        </Button>
      </div>
      <h1 className="text-3xl font-semibold">개인정보 선택 설정</h1>
      <p className="mt-3 text-sm text-muted-foreground">
        아래에서 개인정보 처리와 관련된 선택 사항을 확인하세요. 일부 항목은 앱 내 설정 또는 문의를 통해 처리됩니다.
      </p>

      <section className="mt-8 space-y-3">
        <h2 className="text-xl font-medium">1. 푸시 알림 수신 설정</h2>
        <p className="text-sm text-muted-foreground">
          알림은 예약 시간/파티 모집 등 핵심 기능 제공을 위해 사용됩니다. 앱의 프로필 또는 설정 화면에서 카테고리별 수신 여부를 변경할 수 있습니다. 기기 알림 권한은 OS 설정에서 변경 가능합니다.
        </p>
      </section>

      <section className="mt-8 space-y-3">
        <h2 className="text-xl font-medium">2. 계정 정보 수정/삭제</h2>
        <p className="text-sm text-muted-foreground">
          닉네임 등 프로필 정보는 앱 내 프로필/설정 화면에서 변경할 수 있습니다. 계정 삭제(회원 탈퇴)를 원하시면 앱 내 메뉴 또는 아래 이메일로 요청하실 수 있습니다.
        </p>
      </section>

      <section className="mt-8 space-y-3">
        <h2 className="text-xl font-medium">3. 데이터 접근·정정·삭제 요청</h2>
        <p className="text-sm text-muted-foreground">
          본인 확인 후 보유 중인 개인정보의 열람, 정정, 삭제, 처리정지 및 동의 철회를 요청하실 수 있습니다. 아래 이메일로 요청해 주세요.
        </p>
        <div className="rounded-md border p-4 text-sm text-muted-foreground">
          이메일: <a className="underline" href={`mailto:${supportEmail}`}>{supportEmail}</a>
        </div>
      </section>

      <section className="mt-8 space-y-3">
        <h2 className="text-xl font-medium">4. 이메일 수신 동의/철회</h2>
        <p className="text-sm text-muted-foreground">
          마케팅/공지 메일을 발송하는 경우, 각 메일 하단의 수신 거부 링크 또는 위 이메일을 통해 철회할 수 있습니다. (현재 마케팅 메일은 발송하지 않습니다.)
        </p>
      </section>

      <p className="mt-10 text-xs text-muted-foreground">최종 업데이트: 2025-01-01</p>
    </div>
  );
}


