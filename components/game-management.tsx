"use client"

import { useState, useEffect } from "react"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { toast } from "sonner"
import { gameService } from "@/lib/game-service"
import { Plus, Trash2 } from "lucide-react"
import Image from "next/image"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog"

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

  // Deletion modal state
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [deletingGameId, setDeletingGameId] = useState<number | null>(null)
  const [deletingGameName, setDeletingGameName] = useState<string>("")
  const [scheduledUsers, setScheduledUsers] = useState<string[]>([])

  useEffect(() => {
    loadGames()
  }, [serverId])

  const loadGames = async () => {
    setIsLoading(true)
    try {
      const [defaultData, customData] = await Promise.all([
        gameService.getDefaultGames(),
        gameService.getCustomGames(serverId),
      ])
      setDefaultGames(defaultData.defaultGames)
      setCustomGames(customData.customGames)
    } catch {
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
      const newGame = await gameService.addCustomGame(serverId, {
        name: newGameName,
      })
      setCustomGames((prev) => [...prev, newGame])
      setNewGameName("")
      toast.success("게임 추가 완료", {
        description: `${newGame.name}이 추가되었습니다.`,
      })
    } catch {
      toast.error("게임 추가 실패", {
        description: "게임 추가 중 오류가 발생했습니다.",
      })
    }
  }

  const requestDeleteCustomGame = async (gameId: number, gameName: string) => {
    try {
      const data = await gameService.getScheduledUsers(serverId, gameId)
      const users = data.users.map((u) => u.username)

      if (users.length > 0) {
        // 예약된 사용자가 있을 때만 모달 표시
        setScheduledUsers(users)
        setDeletingGameId(gameId)
        setDeletingGameName(gameName)
        setShowDeleteModal(true)
      } else {
        // 예약된 사용자가 없으면 바로 삭제
        await gameService.deleteCustomGame(serverId, gameId)
        setCustomGames((prev) => prev.filter((g) => g.id !== gameId))
        toast.success("게임 삭제 완료", {
          description: `${gameName}이 삭제되었습니다.`,
        })
      }
    } catch {
      toast.error("예약자 조회 실패", {
        description: "예약된 사용자를 불러오는데 실패했습니다.",
      })
    }
  }

  const confirmDelete = async () => {
    if (deletingGameId == null) return
    try {
      await gameService.deleteCustomGame(serverId, deletingGameId)
      setCustomGames((prev) =>
        prev.filter((g) => g.id !== deletingGameId)
      )
      toast.success("게임 삭제 완료", {
        description: `${deletingGameName}과 예약 기록이 삭제되었습니다.`,
      })
    } catch {
      toast.error("게임 삭제 실패", {
        description: "게임 삭제 중 오류가 발생했습니다.",
      })
    } finally {
      setShowDeleteModal(false)
      setDeletingGameId(null)
      setDeletingGameName("")
      setScheduledUsers([])
    }
  }

  if (isLoading) {
    return (
      <Card className="card-cyber border-purple-500/30 h-full">
        <CardHeader>
          <CardTitle className="neon-text-purple flex items-center">
            <Image src="/logo_round.png" alt="게임" width={20} height={20} className="mr-2 h-5 w-5" /> 게임 관리
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-muted-foreground">로딩 중...</div>
        </CardContent>
      </Card>
    )
  }

  return (
    <>
      <Card className="card-cyber border-purple-500/30 h-full flex flex-col">
        <CardHeader>
          <CardTitle className="neon-text-purple flex items-center">
            <Image src="/logo_round.png" alt="게임" width={20} height={20} className="mr-2 h-5 w-5" /> 게임 관리
          </CardTitle>
          <CardDescription className="text-white/70">
            기본 게임과 커스텀 게임을 관리하세요
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6 flex-grow">
          <h3 className="text-purple-400 font-medium mb-3">커스텀 게임</h3>
          <form
            onSubmit={handleAddCustomGame}
            className="flex gap-2 mb-3"
          >
            <Input
              value={newGameName}
              onChange={(e) => setNewGameName(e.target.value)}
              placeholder="게임 이름"
              className="input-cyber text-sm"
              inputMode="text"
              style={{ fontSize: 16 }}
            />
            <Button
              type="submit"
              size="sm"
              className="btn-cyber-purple"
            >
              <Plus className="h-4 w-4" />
            </Button>
          </form>
          <div className="space-y-2 max-h-48 overflow-y-auto overflow-x-hidden">
            {customGames.map((game) => (
              <div
                key={game.id}
                className="flex items-center justify-between p-2 bg-purple-500/10 rounded-xl border border-purple-500/20 hover:bg-purple-500/20 transition-colors"
              >
                <span className="text-white text-sm truncate w-40">
                  {game.name}
                </span>
                <Button
                  onClick={() =>
                    requestDeleteCustomGame(game.id, game.name)
                  }
                  size="sm"
                  variant="ghost"
                  className="text-pink-400 truncate hover:text-pink-300 hover:bg-pink-500/20"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* 삭제 확인 모달 */}
      <Dialog
        open={showDeleteModal}
        onOpenChange={setShowDeleteModal}
      >
        <DialogContent className="card-cyber border-pink-500/30 max-w-md">
          <DialogHeader>
            <DialogTitle className="neon-text-accent">
              {deletingGameName} 삭제 확인
            </DialogTitle>
          </DialogHeader>
          <div className="p-4 text-white">
            <p>다음 사용자가 예약한 기록이 있습니다:</p>
            <ul className="list-disc list-inside mt-2 space-y-1 text-pink-400">
              {scheduledUsers.map((user) => (
                <li key={user}>{user}</li>
              ))}
            </ul>
            <p className="mt-4 text-white/80">정말로 삭제하시겠습니까?</p>
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button className="btn-cyber-outline text-sm px-4 py-2">
                취소
              </Button>
            </DialogClose>
            <Button
              onClick={confirmDelete}
              className="btn-cyber-pink text-sm px-4 py-2"
            >
              예, 삭제합니다
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
