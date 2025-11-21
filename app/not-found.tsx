"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center px-6 py-12 text-center">
      <div>
        <h1 className="text-5xl font-bold text-white">404</h1>
        <p className="mt-3 text-white/70">요청하신 페이지를 찾을 수 없습니다.</p>
        <div className="mt-6 flex items-center justify-center gap-3">
          <Link href="/">
            <Button className="glass-button">홈으로</Button>
          </Link>
          <Link href="/dashboard">
            <Button variant="outline" className="glass border-white/30 text-white">대시보드</Button>
          </Link>
        </div>
      </div>
    </div>
  );
}





