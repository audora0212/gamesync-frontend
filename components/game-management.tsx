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
import { Plus, Trash2, Gamepad2 } from "lucide-react"
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
      <Card>
        <CardHeader>
          <CardTitle className="text-neon-magenta drop-shadow-[0_0_10px_rgba(217,4,142,0.5)] flex items-center">
            <Image src="/logo_round.png" alt="게임" width={20} height={20} className="mr-2 h-5 w-5" /> 게임 관리
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-3 text-muted-foreground">
            <div className="w-5 h-5 border-2 border-neon-magenta border-t-transparent rounded-full animate-spin" />
            로딩 중...
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="text-neon-magenta drop-shadow-[0_0_10px_rgba(217,4,142,0.5)] flex items-center">
            <Image src="/logo_round.png" alt="게임" width={20} height={20} className="mr-2 h-5 w-5" /> 게임 관리
          </CardTitle>
          <CardDescription>
            기본 게임과 커스텀 게임을 관리하세요
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <h3 className="text-neon-magenta font-medium text-sm mb-3">커스텀 게임</h3>
          <form
            onSubmit={handleAddCustomGame}
            className="flex gap-2 mb-3"
          >
            <Input
              value={newGameName}
              onChange={(e) => setNewGameName(e.target.value)}
              placeholder="게임 이름"
              inputMode="text"
              style={{ fontSize: 16 }}
            />
            <Button
              type="submit"
              size="icon"
            >
              <Plus className="h-4 w-4" />
            </Button>
          </form>
          <div className="space-y-2 max-h-48 overflow-y-auto overflow-x-hidden">
            {customGames.map((game) => (
              <div
                key={game.id}
                className="flex items-center justify-between p-3 bg-neon-magenta/5 rounded-xl border border-neon-magenta/20 hover:bg-neon-magenta/10 transition-colors"
              >
                <span className="text-foreground text-sm truncate min-w-0 flex-1 mr-2" title={game.name}>
                  {game.name}
                </span>
                <Button
                  onClick={() =>
                    requestDeleteCustomGame(game.id, game.name)
                  }
                  size="icon"
                  variant="ghost"
                  className="text-neon-red hover:text-neon-red hover:bg-neon-red/20"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
            {customGames.length === 0 && (
              <div className="text-center py-4 text-muted-foreground text-sm">
                커스텀 게임이 없습니다
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* 삭제 확인 모달 */}
      <Dialog
        open={showDeleteModal}
        onOpenChange={setShowDeleteModal}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2.5 rounded-xl bg-neon-red/20 shadow-[0_0_15px_rgba(255,51,102,0.2)]">
                <Gamepad2 className="w-5 h-5 text-neon-red" />
              </div>
              <DialogTitle className="text-neon-red drop-shadow-[0_0_10px_rgba(255,51,102,0.5)] font-display">
                {deletingGameName} 삭제 확인
              </DialogTitle>
            </div>
          </DialogHeader>
          <div className="py-2 text-foreground/80">
            <p className="text-sm">다음 사용자가 예약한 기록이 있습니다:</p>
            <ul className="list-disc list-inside mt-2 space-y-1 text-neon-pink text-sm">
              {scheduledUsers.map((user) => (
                <li key={user}>{user}</li>
              ))}
            </ul>
            <p className="mt-4 text-foreground/80 text-sm">정말로 삭제하시겠습니까?</p>
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">
                취소
              </Button>
            </DialogClose>
            <Button
              onClick={confirmDelete}
              variant="destructive"
            >
              예, 삭제합니다
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
