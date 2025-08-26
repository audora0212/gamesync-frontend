"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { authService } from "@/lib/auth-service";
import { toast } from "sonner";
import { isNative } from "@/lib/native";

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
  try { console.log('[CB/kakao] received', { token: token?.slice(0,16)+'...', userLen: userParam?.length }) } catch {}
  const [didAttemptOpenApp, setDidAttemptOpenApp] = useState(false);
  const oauthTarget = useMemo(() => getCookie("oauth_target") || "web", []);
  const [isNativeEnv, setIsNativeEnv] = useState(false);

  useEffect(() => { (async () => { try { setIsNativeEnv(await isNative()) } catch {} })() }, [])

  useEffect(() => {
    if (token) {
      try { console.log('[CB/kakao] setToken') } catch {}
      authService.setToken(token);
      let userObj: any = null;
      if (userParam) {
        try {
          try { console.log('[CB/kakao] parse userParam len', userParam.length) } catch {}
          userObj = JSON.parse(userParam);
        } catch {
          try { userObj = JSON.parse(decodeURIComponent(userParam)) } catch {}
        }
      }
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
        if (isNativeEnv) {
          try {
            clearCookie('oauth_target');
            const ua = typeof navigator !== 'undefined' ? navigator.userAgent : '';
            const isIOS = /iphone|ipad|ipod/i.test(ua);
            const universalAbs = `https://gamesync.cloud/auth/kakao/callback?token=${encodeURIComponent(token)}&user=${encodeURIComponent(userParam || '')}`;
            const appSchemeAbs = `gamesync:///auth/kakao/callback?token=${encodeURIComponent(token)}&user=${encodeURIComponent(userParam || '')}`;
            setDidAttemptOpenApp(true);
            try { (window as any)?.Capacitor?.Browser?.close?.() } catch {}
            try { window.location.href = appSchemeAbs } catch {}
            setTimeout(() => { try { window.location.href = universalAbs } catch {} }, 600);
            return;
          } catch {}
        }
        try { console.log('[CB/kakao] success → dashboard') } catch {}
        toast.success("카카오 계정으로 로그인했습니다.");
        router.replace("/dashboard");
      })()
      if (oauthTarget === 'mobile-web') {
        try {
          clearCookie('oauth_target');
          const ua = typeof navigator !== 'undefined' ? navigator.userAgent : '';
          const isIOS = /iphone|ipad|ipod/i.test(ua);
          const safeUser = typeof userParam === 'string' ? userParam : ''
          const universalAbs = `https://gamesync.cloud/auth/kakao/callback?token=${encodeURIComponent(token)}&user=${encodeURIComponent(safeUser)}`;
          const appSchemeAbs = `gamesync:///auth/kakao/callback?token=${encodeURIComponent(token)}&user=${encodeURIComponent(safeUser)}`;
          setDidAttemptOpenApp(true);
          try { window.location.href = appSchemeAbs } catch {}
          setTimeout(() => { try { window.location.href = universalAbs } catch {} }, 600);
          setTimeout(() => {
            const tf = process.env.NEXT_PUBLIC_IOS_TESTFLIGHT_URL;
            if (isIOS && tf) window.location.href = tf;
          }, 1400);
          toast.success('앱으로 열기를 시도했어요. 설치되어 있지 않다면 안내로 이동합니다.');
          return;
        } catch {}
      }
      try { console.log('[CB/kakao] success → dashboard') } catch {}
      toast.success("카카오 계정으로 로그인했습니다.");
      router.replace("/dashboard");
    } else {
      router.replace("/auth/login");
    }
  }, [token, userParam, router, oauthTarget]);

  const tf = (process as any).env.NEXT_PUBLIC_IOS_TESTFLIGHT_URL as string | undefined
  const deeplink = token && userParam ? `gamesync://auth/kakao/callback?token=${encodeURIComponent(token)}&user=${encodeURIComponent(userParam)}` : '#'
  const universal = token && userParam ? `https://gamesync.cloud/auth/kakao/callback?token=${encodeURIComponent(token)}&user=${encodeURIComponent(userParam)}` : '#'
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


