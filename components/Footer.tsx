"use client"

import React from "react"
import Link from "next/link"
import { Mail, Heart } from "lucide-react"

export function Footer() {
  return (
    <footer className="relative w-full mt-auto bg-background/80 backdrop-blur-xl border-t border-neon-cyan/20">
      {/* 네온 디바이더 */}
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-neon-cyan/50 to-transparent" />

      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col items-center space-y-4">
          {/* 로고 & 저작권 */}
          <div className="flex items-center space-x-2">
            <span className="font-display font-bold text-lg text-neon-cyan drop-shadow-[0_0_10px_rgba(5,242,219,0.5)]">
              GameSync
            </span>
          </div>

          <p className="text-sm text-muted-foreground">
            © {new Date().getFullYear()} GameSync. All rights reserved.
          </p>

          {/* 연락처 */}
          <div className="flex items-center space-x-2 text-sm">
            <Mail className="h-4 w-4 text-neon-magenta" />
            <span className="text-muted-foreground">오류 문의:</span>
            <a
              href="mailto:gy255318@gmail.com"
              className="text-neon-magenta hover:text-neon-pink hover:drop-shadow-[0_0_10px_rgba(242,5,203,0.6)] transition-all"
            >
              gy255318@gmail.com
            </a>
          </div>

          {/* Thanks */}
          <div className="flex items-center space-x-1 text-xs text-muted-foreground/60">
            <span>Made with</span>
            <Heart className="h-3 w-3 text-neon-red fill-neon-red animate-pulse" />
            <span>Thanks to H.C. J.G.</span>
          </div>

          {/* 네비게이션 링크 */}
          <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-0 sm:space-x-4 pt-2">
            <Link
              href="/privacy"
              className="text-sm text-muted-foreground hover:text-neon-cyan transition-colors"
            >
              개인정보 처리방침
            </Link>
            <span className="hidden sm:inline text-muted-foreground/30">|</span>
            <Link
              href="/privacy/choices"
              className="text-sm text-muted-foreground hover:text-neon-cyan transition-colors"
            >
              개인정보 선택 사항
            </Link>
            <span className="hidden sm:inline text-muted-foreground/30">|</span>
            <Link
              href="/terms"
              className="text-sm text-muted-foreground hover:text-neon-cyan transition-colors"
            >
              이용약관
            </Link>
            <span className="hidden sm:inline text-muted-foreground/30">|</span>
            <Link
              href="/support"
              className="text-sm text-muted-foreground hover:text-neon-cyan transition-colors"
            >
              고객지원
            </Link>
          </div>
        </div>
      </div>

      {/* 하단 글로우 효과 */}
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-96 h-32 bg-neon-cyan/5 blur-3xl pointer-events-none" />
    </footer>
  )
}
