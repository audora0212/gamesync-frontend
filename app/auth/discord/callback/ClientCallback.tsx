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
  try { console.log('[CB/discord] received', { token: token?.slice(0,16)+'...', userLen: userParam?.length }) } catch {}
  const [didAttemptOpenApp, setDidAttemptOpenApp] = useState(false);
  const oauthTarget = useMemo(() => getCookie("oauth_target") || "web", []);

  useEffect(() => {
    if (token) {
      try { console.log('[CB/discord] setToken') } catch {}
      authService.setToken(token);
      // 쿠키에도 저장되어 서버 사이드에서 랜딩 접근 시 대시보드로 리다이렉트 가능
      // setToken 내부에서 쿠키도 함께 설정되도록 변경됨
      // Store token securely when native
      (async () => { try { if (await isNative()) await secureSet('auth-token', token) } catch {} })()
      let userObj: any = null;
      if (userParam) {
        // 1) 이미 디코드된 문자열일 수 있어 순차적으로 파싱 시도
        try {
          try { console.log('[CB/discord] parse userParam len', userParam.length) } catch {}
          userObj = JSON.parse(userParam);
        } catch {
          try { userObj = JSON.parse(decodeURIComponent(userParam)) } catch {}
        }
      }
      // 2) 파싱 실패 시 /api/users/me로 프로필 조회 (토큰만으로 진행)
      ;(async () => {
        if (!userObj) {
          try {
            const API_BASE = process.env.NEXT_PUBLIC_API_URL || '/api'
            const res = await fetch(`${API_BASE}/users/me`, { headers: authService.getAuthHeaders() })
            if (res.ok) {
              const prof = await res.json()
              userObj = { id: prof?.id ?? prof?.userId, nickname: prof?.nickname ?? prof?.name ?? 'User' }
            }
          } catch {}
        }
        if (userObj && typeof userObj.id === 'number' && typeof userObj.nickname === 'string') {
          authService.setCurrentUser(userObj);
        }
        // 모바일 웹 → 앱 열기 로직 및 라우팅은 아래로 유지
        if (oauthTarget === 'mobile-web' || (await isNative())) {
          try {
            clearCookie('oauth_target');
            const ua = typeof navigator !== 'undefined' ? navigator.userAgent : '';
            const isIOS = /iphone|ipad|ipod/i.test(ua);
            const safeUser = typeof userParam === 'string' ? userParam : ''
            const universalAbs = `https://gamesync.cloud/auth/discord/callback?token=${encodeURIComponent(token)}&user=${encodeURIComponent(safeUser)}`;
            const appSchemeAbs = `gamesync:///auth/discord/callback?token=${encodeURIComponent(token)}&user=${encodeURIComponent(safeUser)}`;
            setDidAttemptOpenApp(true);
            try { window.location.href = appSchemeAbs } catch {}
            setTimeout(() => { try { window.location.href = universalAbs } catch {} }, 600);
            setTimeout(() => {
              const tf = process.env.NEXT_PUBLIC_IOS_TESTFLIGHT_URL as string | undefined;
              if (isIOS && typeof tf === 'string' && tf.length > 0) window.location.href = tf;
            }, 1400);
            toast.success('앱으로 열기를 시도했어요. 설치되어 있지 않다면 안내로 이동합니다.' as string);
            return;
          } catch {}
        }
        try { console.log('[CB/discord] success → dashboard') } catch {}
        toast.success("디스코드 계정으로 로그인했습니다." as string);
        router.replace("/dashboard");
      })()
      try { console.log('[CB/discord] success → dashboard') } catch {}
      toast.success("디스코드 계정으로 로그인했습니다.");
      router.replace("/dashboard");
    } else {
      router.replace("/auth/login");
    }
  }, [token, userParam, router, oauthTarget]);

  const tf = (process as any).env.NEXT_PUBLIC_IOS_TESTFLIGHT_URL as string | undefined
  const deeplink = token && userParam ? `gamesync://auth/discord/callback?token=${encodeURIComponent(token)}&user=${encodeURIComponent(userParam)}` : '#'
  const universal = token && userParam ? `https://gamesync.cloud/auth/discord/callback?token=${encodeURIComponent(token)}&user=${encodeURIComponent(userParam)}` : '#'
  return (
    <div style={{padding:16}}>
      처리 중입니다… {didAttemptOpenApp ? '앱 열기를 시도하는 중입니다.' : ''}
      {oauthTarget === 'mobile-web' && (
        <div style={{marginTop:16, display:'flex', gap:12}}>
          <a href={deeplink} style={{padding:'10px 14px', background:'#0b0e14', color:'#fff', borderRadius:8}}>앱에서 열기</a>
          <a href={universal} style={{padding:'10px 14px', background:'#222', color:'#fff', borderRadius:8}}>유니버설 링크</a>
          {tf && <a href={tf} style={{padding:'10px 14px', background:'#444', color:'#fff', borderRadius:8}}>설치/업데이트</a>}
        </div>
      )}
    </div>
  );
}
