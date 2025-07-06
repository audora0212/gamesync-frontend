// components/Footer.tsx
"use client"

import React from "react"

export function Footer() {
  return (
    <footer className="w-full py-4 text-center text-gray-400 text-sm bg-gradient-to-t from-black/30 to-transparent mt-auto">
      <div>© {new Date().getFullYear()} GameSync. All rights reserved.</div>
      <div>
        오류 문의:{" "}
        <a
          href="mailto:bugs@gamesync.example.com"
          className="hover:text-blue-300"
        >
          gy255318@gmail.com
        </a>
      </div>
      <div>Thanks to. SS, YC</div>
    </footer>
  )
}
