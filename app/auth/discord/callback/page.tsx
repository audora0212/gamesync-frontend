// app/(auth)/auth/discord/callback/page.tsx
"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { authService } from "@/lib/auth-service";

export default function DiscordCallbackPage() {
  const router = useRouter();
  const params = useSearchParams();
  const token = params.get("token");
  const userParam = params.get("user");

  useEffect(() => {
    if (token && userParam) {
      // 1) 토큰 저장
      authService.setToken(token);

      // 2) userParam은 인코딩된 JSON이므로 디코딩 & 파싱
      let userObj;
      try {
        userObj = JSON.parse(decodeURIComponent(userParam));
      } catch (err) {
        console.error("Failed to parse userParam:", err);
        // 파싱 실패 시 로그인 화면으로
        router.replace("/auth/login");
        return;
      }

      // 3) ID와 닉네임 저장
      authService.setCurrentUser(userObj);

      // 4) 대시보드로 이동
      router.replace("/dashboard");
    } else {
      // 파라미터 누락 시 로그인 화면으로
      router.replace("/auth/login");
    }
  }, [token, userParam, router]);

  return <div>처리 중입니다…</div>;
}
