// app/(auth)/auth/discord/callback/ClientCallback.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { authService } from "@/lib/auth-service";
import { toast } from "sonner";
import { secureSet, isNative } from "@/lib/native";

function getCookie(name: string): string | null {
  if (typeof document === "undefined") return null;
  const parts = document.cookie.split("; ");
  for (const p of parts) {
    const [k, v] = p.split("=");
    if (k === name) return decodeURIComponent(v || "");
  }
  return null;
}

function clearCookie(name: string) {
  try {
    const attrs: string[] = ["path=/", "samesite=lax", "max-age=0"];
    if (typeof window !== "undefined" && window.location.protocol === "https:") attrs.push("secure");
    document.cookie = `${name}=; ${attrs.join("; ")}`;
  } catch {}
}

export default function ClientCallback() {
  const router = useRouter();
  const params = useSearchParams();
  const token = params.get("token");
  const userParam = params.get("user");
  const [didAttemptOpenApp, setDidAttemptOpenApp] = useState(false);
  const oauthTarget = useMemo(() => getCookie("oauth_target") || "web", []);

  useEffect(() => {
    if (token && userParam) {
      authService.setToken(token);
      // 쿠키에도 저장되어 서버 사이드에서 랜딩 접근 시 대시보드로 리다이렉트 가능
      // setToken 내부에서 쿠키도 함께 설정되도록 변경됨
      // Store token securely when native
      (async () => { try { if (await isNative()) await secureSet('auth-token', token) } catch {} })()
      let userObj;
      try {
        userObj = JSON.parse(decodeURIComponent(userParam));
      } catch {
        router.replace("/auth/login");
        return;
      }
      authService.setCurrentUser(userObj);
      // 모바일 웹 → 앱 열기 시도, 실패 시 안내/폴백
      if (oauthTarget === 'mobile-web') {
        try {
          clearCookie('oauth_target');
          const ua = typeof navigator !== 'undefined' ? navigator.userAgent : '';
          const isIOS = /iphone|ipad|ipod/i.test(ua);
          const isAndroid = /android/i.test(ua);
          // 우선 유니버설 링크 시도 (앱 설치시 앱으로 이동, 미설치시 현재 페이지 유지)
          const universal = `/auth/discord/callback?token=${encodeURIComponent(token)}&user=${encodeURIComponent(userParam)}`;
          // iOS는 사용자 제스처 없이 커스텀 스킴 이동이 제한적일 수 있어서 버튼 안내를 병행
          // 즉시 한 번 시도 (일부 브라우저에서 무시될 수 있음)
          setDidAttemptOpenApp(true);
          window.location.href = universal;
          // 1.2초 후 테스트플라이트/안내로 폴백
          setTimeout(() => {
            const tf = process.env.NEXT_PUBLIC_IOS_TESTFLIGHT_URL;
            if (isIOS && tf) window.location.href = tf;
          }, 1200);
          toast.success('앱으로 열기를 시도했어요. 설치되어 있지 않다면 안내로 이동합니다.');
          return;
        } catch {}
      }
      toast.success("디스코드 계정으로 로그인했습니다.");
      router.replace("/dashboard");
    } else {
      router.replace("/auth/login");
    }
  }, [token, userParam, router, oauthTarget]);

  return <div>처리 중입니다… {didAttemptOpenApp ? '앱 열기를 시도하는 중입니다.' : ''}</div>;
}
