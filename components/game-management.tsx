"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"
import { gameService } from "@/lib/game-service"
import { Plus, Trash2, Gamepad2 } from "lucide-react"

interface Game {
  id: number
  name: string
}

interface GameManagementProps {
  serverId: number
}

export function GameManagement({ serverId }: GameManagementProps) {
  const [defaultGames, setDefaultGames] = useState<Game[]>([])
  const [customGames, setCustomGames] = useState<Game[]>([])
  const [newGameName, setNewGameName] = useState("")
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    loadGames()
  }, [serverId])

  const loadGames = async () => {
    try {
      const [defaultData, customData] = await Promise.all([
        gameService.getDefaultGames(),
        gameService.getCustomGames(serverId),
      ])
      setDefaultGames(defaultData.defaultGames)
      setCustomGames(customData.customGames)
    } catch (error) {
      toast.error("게임 목록 로드 실패", {
        description: "게임 목록을 불러오는데 실패했습니다.",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleAddCustomGame = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newGameName.trim()) return

    try {
      const newGame = await gameService.addCustomGame(serverId, { name: newGameName })
      setCustomGames([...customGames, newGame])
      setNewGameName("")
      toast.success("게임 추가 완료", {
        description: `${newGame.name}이 추가되었습니다.`,
      })
    } catch (error) {
      toast.error("게임 추가 실패", {
        description: "게임 추가 중 오류가 발생했습니다.",
      })
    }
  }

  const handleDeleteCustomGame = async (gameId: number) => {
    try {
      await gameService.deleteCustomGame(serverId, gameId)
      setCustomGames(customGames.filter((game) => game.id !== gameId))
      toast.success("게임 삭제 완료", {
        description: "게임이 삭제되었습니다.",
      })
    } catch (error) {
      toast.error("게임 삭제 실패", {
        description: "게임 삭제 중 오류가 발생했습니다.",
      })
    }
  }

  if (isLoading) {
    return (
      <Card className="glass border-white/20 h-full">
        <CardHeader>
          <CardTitle className="text-black flex items-center">
            <Gamepad2 className="mr-2 h-5 w-5" />
            게임 관리
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-black/70">로딩 중...</div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="glass border-white/20 h-full">
      <CardHeader>
        <CardTitle className="text-black flex items-center">
          <Gamepad2 className="mr-2 h-5 w-5" />
          게임 관리
        </CardTitle>
        <CardDescription className="text-black/70">기본 게임과 커스텀 게임을 관리하세요</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* 기본 게임 */}
        <div>
          <h3 className="text-black font-medium mb-3">기본 게임</h3>
          <div className="space-y-2">
            {defaultGames.map((game) => (
              <div key={game.id} className="flex items-center justify-between p-2 glass rounded-lg">
                <span className="text-black text-sm">{game.name}</span>
                <Badge variant="secondary" className="glass text-black text-xs">
                  기본
                </Badge>
              </div>
            ))}
          </div>
        </div>

        {/* 커스텀 게임 */}
        <div>
          <h3 className="text-black font-medium mb-3">커스텀 게임</h3>
          <form onSubmit={handleAddCustomGame} className="flex gap-2 mb-3">
            <Input
              value={newGameName}
              onChange={(e) => setNewGameName(e.target.value)}
              placeholder="게임 이름"
              className="glass border-white/30 text-black placeholder:text-black/50 text-sm"
            />
            <Button type="submit" size="sm" className="glass-button">
              <Plus className="h-4 w-4" />
            </Button>
          </form>
          <div className="space-y-2">
            {customGames.map((game) => (
              <div key={game.id} className="flex items-center justify-between p-2 glass rounded-lg">
                <span className="text-black text-sm">{game.name}</span>
                <Button
                  onClick={() => handleDeleteCustomGame(game.id)}
                  size="sm"
                  variant="ghost"
                  className="text-red-400 hover:text-red-300 hover:bg-red-500/20"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
