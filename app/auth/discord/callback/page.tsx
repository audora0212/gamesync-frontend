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
      // 토큰 저장
      authService.setToken(token);

      // 사용자 정보 파싱 (JSON 문자열 또는 단순 닉네임)
      let userObj;
      try {
        userObj = JSON.parse(userParam);
      } catch {
        userObj = { id: 0, nickname: userParam };
      }

      authService.setCurrentUser(userObj);
      // 로그인 후 대시보드로 이동
      router.replace("/dashboard");
    } else {
      // 파라미터 누락 시 로그인 화면으로
      router.replace("/auth/login");
    }
  }, [token, userParam, router]);

  return <div>처리 중입니다…</div>;
}
