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
        <link rel="icon" href="/favicon.ico" />
      </head>
      <body
        suppressHydrationWarning={true}
        className={`${inter.className} flex flex-col min-h-screen bg-background text-foreground antialiased`}
      >
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
