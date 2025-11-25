// components/Footer.tsx
"use client"

import React from "react"
import Link from "next/link"

export function Footer() {
  return (
    <footer className="w-full py-6 text-center text-sm glass border-t border-cyan-500/30 mt-auto">
      <div className="divider-glow mb-4" />
      <div className="text-muted-foreground">© {new Date().getFullYear()} <span className="neon-text-primary font-semibold">GameSync</span>. All rights reserved.</div>
      <div className="text-muted-foreground mt-1">
        오류 문의: <a href="mailto:gy255318@gmail.com" className="neon-text-accent hover:drop-shadow-[0_0_10px_rgba(255,0,100,0.8)] transition-all">gy255318@gmail.com</a>
      </div>
      <div className="text-muted-foreground/70 mt-1">Thanks to. H.C. J.G.</div>
      <div className="pt-3">
        <Link className="text-muted-foreground hover:neon-text-primary transition-all" href="/privacy">개인정보 처리방침</Link>
        <span className="mx-2 text-muted-foreground/50">·</span>
        <Link className="text-muted-foreground hover:neon-text-primary transition-all" href="/privacy/choices">개인정보 선택 사항</Link>
      </div>
    </footer>
  )
}
