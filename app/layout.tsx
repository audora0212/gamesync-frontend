// app/layout.tsx
import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { AuthProvider } from "@/components/auth-provider"
import { Toaster } from "sonner"
import { Footer } from "@/components/Footer"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "GameSync",
  description: "GameSync platform for scheduling games",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ko" className="min-h-screen dark">
      <head>
        <link rel="icon" href="/logo_round.png" />
        <link rel="manifest" href="/manifest.json" />
        {/* iOS safe-area 및 테마 컬러 설정 */}
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover" />
        <meta name="theme-color" content="#0b0e14" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
      </head>
      <body
        suppressHydrationWarning={true}
        className={`${inter.className} flex flex-col min-h-screen bg-background text-foreground antialiased selection:bg-primary/20 selection:text-foreground`}
      >
        {/* 상단 노치(safe-area) 필러: 페이지 배경색과 완전히 동일한 불투명 레이어 */}
        <div aria-hidden className="fixed top-0 left-0 right-0 h-[env(safe-area-inset-top)] bg-background z-[999] pointer-events-none" />
        <AuthProvider>
          {children}
          <Toaster
            theme="dark"
            position="top-right"
            toastOptions={{
              style: {
                background: "rgba(255, 255, 255, 0.1)",
                backdropFilter: "blur(12px)",
                border: "1px solid rgba(255, 255, 255, 0.2)",
                color: "white",
              },
            }}
          />
          <Footer />
        </AuthProvider>
      </body>
    </html>
  )
}
