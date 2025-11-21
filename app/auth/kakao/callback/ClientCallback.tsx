"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { authService } from "@/lib/auth-service";
import { toast } from "sonner";
import { isNative, closeBrowser } from "@/lib/native";

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
  const [isProcessing, setIsProcessing] = useState(false); // 중복 처리 방지
  const oauthTarget = useMemo(() => getCookie("oauth_target") || "web", []);
  const [isNativeEnv, setIsNativeEnv] = useState(false);
  const isDebug = (() => {
    try {
      if (typeof window === 'undefined') return false
      const usp = new URLSearchParams(window.location.search)
      return usp.get('debug') === '1'
    } catch { return false }
  })()

  useEffect(() => { (async () => { try { setIsNativeEnv(await isNative()) } catch {} })() }, [])
  // 네이티브 앱 환경에서는 oauth_target 쿠키가 남아 메시지가 보이지 않도록 초기화
  useEffect(() => { (async () => { try { if (await isNative()) clearCookie('oauth_target') } catch {} })() }, [])

  useEffect(() => {
    // 이미 처리 중이면 무시
    if (isProcessing) return;
    
    // 토큰이 없으면 즉시 로그인 페이지로
    if (!token) {
      router.replace("/auth/login");
      return;
    }
    
    setIsProcessing(true); // 중복 실행 방지
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
        const ua = typeof navigator !== 'undefined' ? navigator.userAgent : ''
        const isIOS = /iphone|ipad|ipod/i.test(ua)
        if (isIOS) {
          try {
            if (await isNative()) {
              // Capacitor Browser 플러그인으로 브라우저 닫기
              await closeBrowser();
              try { console.log('[CB/kakao] native webview → dashboard') } catch {}
              toast.success("카카오 계정으로 로그인했습니다.");
              router.replace("/dashboard");
              setDidAttemptOpenApp(false);
              return;
            }

            clearCookie('oauth_target');
            const universalAbs = `https://gamesync.cloud/auth/kakao/callback?token=${encodeURIComponent(token)}&user=${encodeURIComponent(userParam || '')}`;
            const appSchemeAbs = `gamesync:///auth/kakao/callback?token=${encodeURIComponent(token)}&user=${encodeURIComponent(userParam || '')}`;
            setDidAttemptOpenApp(true);
            if (isDebug) { try { (window as any).console?.log?.('[CB/kakao] try deep link & universal') } catch {} }
            await closeBrowser();
            try { window.location.href = appSchemeAbs } catch {}
            setTimeout(() => { try { window.location.replace(universalAbs) } catch {} }, 600);
            setTimeout(async () => { await closeBrowser(); }, 900);
            return;
          } catch {}
        }
        try { console.log('[CB/kakao] success → dashboard') } catch {}
        toast.success("카카오 계정으로 로그인했습니다.");
        router.replace("/dashboard");
    })()
  }, [token, userParam, router, oauthTarget]);

  const tf = (process as any).env.NEXT_PUBLIC_IOS_TESTFLIGHT_URL as string | undefined
  const deeplink = token && userParam ? `gamesync://auth/kakao/callback?token=${encodeURIComponent(token)}&user=${encodeURIComponent(userParam)}` : '#'
  const universal = token && userParam ? `https://gamesync.cloud/auth/kakao/callback?token=${encodeURIComponent(token)}&user=${encodeURIComponent(userParam)}` : '#'
  return (
    <div style={{padding:16}}>
      처리 중입니다… {didAttemptOpenApp ? '앱 열기를 시도하는 중입니다.' : ''}
      {oauthTarget === 'mobile-web' && !isNativeEnv && (
        <div style={{marginTop:16, display:'flex', gap:12}}>
          <a href={deeplink} style={{padding:'10px 14px', background:'#0b0e14', color:'#fff', borderRadius:8}}>앱에서 열기</a>
          <a href={universal} style={{padding:'10px 14px', background:'#222', color:'#fff', borderRadius:8}}>유니버설 링크</a>
          {tf && <a href={tf} style={{padding:'10px 14px', background:'#444', color:'#fff', borderRadius:8}}>설치/업데이트</a>}
        </div>
      )}
    </div>
  );
}


