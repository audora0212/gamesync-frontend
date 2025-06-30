"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { toast } from "sonner"
import { authService } from "@/lib/auth-service"
import { Loader2, GamepadIcon } from "lucide-react"
import { useEffect } from "react"

export default function LoginPage() {
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

    useEffect(() => {
    if (authService.isAuthenticated()) {
      router.replace("/dashboard")
    }
  }, [router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      await authService.login({ username, password })
      toast.success("로그인 성공", {
        description: "환영합니다!",
      })
      router.push("/dashboard")
    } catch (error) {
      toast.error("로그인 실패", {
        description: "아이디 또는 비밀번호를 확인해주세요.",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 glass rounded-2xl mb-4">
            <GamepadIcon className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">GameSlots</h1>
          <p className="text-white/70">게임 스케줄링 플랫폼에 로그인하세요</p>
        </div>

        <Card className="glass border-white/20">
          <CardHeader>
            <CardTitle className="text-white">로그인</CardTitle>
            <CardDescription className="text-white/70">계정 정보를 입력해주세요</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="username" className="text-white">
                  사용자명
                </Label>
                <Input
                  id="username"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="glass border-white/30 text-white placeholder:text-white/50"
                  placeholder="사용자명을 입력하세요"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password" className="text-white">
                  비밀번호
                </Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="glass border-white/30 text-white placeholder:text-white/50"
                  placeholder="비밀번호를 입력하세요"
                  required
                />
              </div>
              <Button type="submit" className="w-full glass-button" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    로그인 중...
                  </>
                ) : (
                  "로그인"
                )}
              </Button>
            </form>
            <div className="mt-6 text-center">
              <p className="text-white/70">
                계정이 없으신가요?{" "}
                <Link href="/auth/signup" className="text-blue-300 hover:text-blue-200 underline">
                  회원가입
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
