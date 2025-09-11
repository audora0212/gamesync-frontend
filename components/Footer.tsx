// components/Footer.tsx
"use client"

import React from "react"
import Link from "next/link"

export function Footer() {
  return (
    <footer className="w-full py-6 text-center text-gray-400 text-sm bg-gradient-to-t from-black/30 to-transparent mt-auto">
      <div>© {new Date().getFullYear()} GameSync. All rights reserved.</div>
      <div>
        오류 문의: <a href="mailto:gy255318@gmail.com" className="hover:text-blue-300">gy255318@gmail.com</a>
      </div>
      <div>Thanks to. H.C. J.G.</div>
      <div className="pt-2">
        <Link className="underline" href="/privacy">개인정보 처리방침</Link>
        <span className="mx-2">·</span>
        <Link className="underline" href="/privacy/choices">개인정보 선택 사항</Link>
      </div>
    </footer>
  )
}
