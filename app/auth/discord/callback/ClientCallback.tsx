// app/(auth)/auth/discord/callback/ClientCallback.tsx
"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { authService } from "@/lib/auth-service";

export default function ClientCallback() {
  const router = useRouter();
  const params = useSearchParams();
  const token = params.get("token");
  const userParam = params.get("user");

  useEffect(() => {
    if (token && userParam) {
      authService.setToken(token);
      let userObj;
      try {
        userObj = JSON.parse(decodeURIComponent(userParam));
      } catch {
        router.replace("/auth/login");
        return;
      }
      authService.setCurrentUser(userObj);
      router.replace("/dashboard");
    } else {
      router.replace("/auth/login");
    }
  }, [token, userParam, router]);

  return <div>처리 중입니다…</div>;
}
