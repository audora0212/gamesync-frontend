import { authService } from "./auth-service"
import { fetchWithAuth } from "./fetch-with-auth"

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "/api"

interface Game {
  id: number
  name: string
}

interface DefaultGameListResponse {
  defaultGames: Game[]
}

interface CustomGameListResponse {
  customGames: Game[]
}

interface CustomGameRequest {
  name: string
}

interface ScheduledUserListResponse {
  users: { username: string }[]
}

class GameService {
  async getDefaultGames(): Promise<DefaultGameListResponse> {
    const response = await fetchWithAuth(`${API_BASE}/games/default`)
    if (!response.ok) throw new Error("Failed to fetch default games")
    return response.json()
  }

  async getCustomGames(serverId: number): Promise<CustomGameListResponse> {
    const response = await fetchWithAuth(`${API_BASE}/servers/${serverId}/custom-games`)
    if (!response.ok) throw new Error("Failed to fetch custom games")
    return response.json()
  }

  async addCustomGame(serverId: number, data: CustomGameRequest): Promise<Game> {
    const response = await fetchWithAuth(`${API_BASE}/servers/${serverId}/custom-games`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    })
    if (!response.ok) throw new Error("Failed to add custom game")
    return response.json()
  }

  async getScheduledUsers(serverId: number, gameId: number): Promise<ScheduledUserListResponse> {
    const response = await fetchWithAuth(
      `${API_BASE}/servers/${serverId}/custom-games/${gameId}/scheduled-users`,
      {}
    )
    if (!response.ok) throw new Error("Failed to fetch scheduled users")
    return response.json()
  }

  async deleteCustomGame(serverId: number, gameId: number): Promise<void> {
    const response = await fetchWithAuth(
      `${API_BASE}/servers/${serverId}/custom-games/${gameId}`,
      {
        method: "DELETE",
      }
    )
    if (!response.ok) throw new Error("Failed to delete custom game")
  }
}

export const gameService = new GameService()