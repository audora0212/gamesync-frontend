"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { authService } from "@/lib/auth-service";
import { fetchWithAuth } from "@/lib/fetch-with-auth";
import { toast } from "sonner";
import { secureSet, isNative, closeBrowser, markLaunchUrlProcessed } from "@/lib/native";

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
  try { console.log('[CB/apple] received', { token: token?.slice(0,16)+'...', userLen: userParam?.length }) } catch {}
  const [didAttemptOpenApp, setDidAttemptOpenApp] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const oauthTarget = useMemo(() => getCookie("oauth_target") || "web", []);
  const [isNativeEnv, setIsNativeEnv] = useState(false);
  const [showRebootHint, setShowRebootHint] = useState(false);

  useEffect(() => { const t = setTimeout(() => setShowRebootHint(true), 8000); return () => clearTimeout(t); }, []);
  useEffect(() => { (async () => { try { setIsNativeEnv(await isNative()) } catch {} })() }, [])
  useEffect(() => { (async () => { try { if (await isNative()) clearCookie('oauth_target') } catch {} })() }, [])

  useEffect(() => {
    const processedKey = 'oauth_apple_processed'
    try {
      const already = typeof window !== 'undefined' ? sessionStorage.getItem(processedKey) === '1' : false
      if (already) {
        ;(async () => { try { if (await isNative()) await closeBrowser() } catch {} })()
        router.replace('/auth/login')
        return
      }
    } catch {}

    if (isProcessing) return;
    if (!token) { router.replace("/auth/login"); return; }
    setIsProcessing(true);
    try { if (typeof window !== 'undefined') sessionStorage.setItem(processedKey, '1') } catch {}
    try { console.log('[CB/apple] setToken') } catch {}
    authService.setToken(token);
    (async () => { try { if (await isNative()) await secureSet('auth-token', token) } catch {} })()
    let userObj: any = null;
    if (userParam) {
      try { userObj = JSON.parse(userParam); } catch { try { userObj = JSON.parse(decodeURIComponent(userParam)) } catch {} }
    }
    ;(async () => {
      if (!userObj) {
        try {
          const API_BASE = process.env.NEXT_PUBLIC_API_URL || '/api'
          const res = await fetchWithAuth(`${API_BASE}/users/me`)
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
            await closeBrowser();
            try { await markLaunchUrlProcessed(`gamesync:///auth/apple/callback`) } catch {}
            try { console.log('[CB/apple] native webview → dashboard') } catch {}
            toast.success("Apple 계정으로 로그인했습니다." as string);
            router.replace("/dashboard");
            setDidAttemptOpenApp(false);
            return;
          }
          clearCookie('oauth_target');
          const safeUser = typeof userParam === 'string' ? userParam : ''
          const universalAbs = `https://gamesync.cloud/auth/apple/callback?token=${encodeURIComponent(token)}&user=${encodeURIComponent(safeUser)}`;
          const appSchemeAbs = `gamesync:///auth/apple/callback?token=${encodeURIComponent(token)}&user=${encodeURIComponent(safeUser)}`;
          setDidAttemptOpenApp(true);
          await closeBrowser();
          try { window.location.href = appSchemeAbs } catch {}
          setTimeout(() => { try { window.location.replace(universalAbs) } catch {} }, 600);
          setTimeout(async () => { await closeBrowser(); }, 900);
          return;
        } catch {}
      }
      try { console.log('[CB/apple] success → dashboard') } catch {}
      toast.success("Apple 계정으로 로그인했습니다." as string);
      router.replace("/dashboard");
    })()
  }, [token, userParam, router, oauthTarget]);

  return (
    <div style={{padding:16}}>
      처리 중입니다… {didAttemptOpenApp ? '앱 열기를 시도하는 중입니다.' : ''}
      {showRebootHint && (
        <div style={{marginTop:12, color:'#bbb', fontSize:13}}>
          오래 걸리면 앱을 완전히 종료 후 다시 열어주세요.
        </div>
      )}
    </div>
  );
}


