// app/(auth)/auth/discord/callback/ClientCallback.tsx
"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { authService } from "@/lib/auth-service";
import { toast } from "sonner";
import { secureSet, isNative } from "@/lib/native";

export default function ClientCallback() {
  const router = useRouter();
  const params = useSearchParams();
  const token = params.get("token");
  const userParam = params.get("user");

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
      toast.success("디스코드 계정으로 로그인했습니다.");
      router.replace("/dashboard");
    } else {
      router.replace("/auth/login");
    }
  }, [token, userParam, router]);

  return <div>처리 중입니다…</div>;
}
