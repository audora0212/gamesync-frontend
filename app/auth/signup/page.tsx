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

export default function SignupPage() {
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (password !== confirmPassword) {
      toast.error("비밀번호 불일치", {
        description: "비밀번호가 일치하지 않습니다.",
      })
      return
    }

    setIsLoading(true)

    try {
      await authService.signup({ username, password })
      toast.success("회원가입 성공", {
        description: "계정이 생성되었습니다. 로그인해주세요.",
      })
      router.push("/auth/login")
    } catch (error) {
      toast.error("회원가입 실패", {
        description: "이미 사용 중인 아이디이거나 오류가 발생했습니다.",
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
          <h1 className="text-3xl font-bold text-white mb-2">Game Scheduler</h1>
          <p className="text-white/70">새 계정을 만들어보세요</p>
        </div>

        <Card className="glass border-white/20">
          <CardHeader>
            <CardTitle className="text-white">회원가입</CardTitle>
            <CardDescription className="text-white/70">새 계정 정보를 입력해주세요</CardDescription>
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
              <div className="space-y-2">
                <Label htmlFor="confirmPassword" className="text-white">
                  비밀번호 확인
                </Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="glass border-white/30 text-white placeholder:text-white/50"
                  placeholder="비밀번호를 다시 입력하세요"
                  required
                />
              </div>
              <Button type="submit" className="w-full glass-button" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    가입 중...
                  </>
                ) : (
                  "회원가입"
                )}
              </Button>
            </form>
            <div className="mt-6 text-center">
              <p className="text-white/70">
                이미 계정이 있으신가요?{" "}
                <Link href="/auth/login" className="text-blue-300 hover:text-blue-200 underline">
                  로그인
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
