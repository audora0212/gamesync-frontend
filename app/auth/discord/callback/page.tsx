// app/(auth)/auth/discord/callback/page.tsx
"use client";
import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { authService } from "@/lib/auth-service";

export default function DiscordCallbackPage() {
  const router = useRouter();
  const params = useSearchParams();
  const token  = params.get("token");
  const user   = params.get("user");

  useEffect(() => {
    if (token && user) {
      authService.setToken(token);
      authService.setCurrentUser(user);
      router.replace("/dashboard");
    } else {
      router.replace("/auth/login");
    }
  }, [token, user, router]);

  return <div>처리 중입니다…</div>;
}
