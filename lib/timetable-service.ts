import { authService } from "./auth-service"
import { fetchWithAuth } from "./fetch-with-auth"

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "/api"

interface TimetableEntry {
  id: number
  user: string
  slot: string
  gameId: number
  gameName: string
  custom: boolean
}

interface TimetableEntryRequest {
  serverId: number
  slot: string
  defaultGameId?: number
  customGameId?: number
}

interface TimetableStats {
  topGame: string
  avgSlot: string
  peakSlot: string
  peakCount: number
}

class TimetableService {
  async getTimetable(serverId: number, game?: string, sortByGame?: boolean): Promise<TimetableEntry[]> {
    const params = new URLSearchParams()
    if (game) params.append("game", game)
    if (sortByGame) params.append("sortByGame", "true")

    const response = await fetchWithAuth(`${API_BASE}/servers/${serverId}/timetable?${params}`)

    if (!response.ok) {
      throw new Error("Failed to fetch timetable")
    }

    return response.json()
  }

  async addEntry(data: TimetableEntryRequest): Promise<TimetableEntry> {
    const response = await fetchWithAuth(`${API_BASE}/servers/${data.serverId}/timetable`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    })

    if (!response.ok) {
      throw new Error("Failed to add timetable entry")
    }

    return response.json()
  }

  async getStats(serverId: number): Promise<TimetableStats> {
    const response = await fetchWithAuth(`${API_BASE}/servers/${serverId}/timetable/stats`)

    if (!response.ok) {
      throw new Error("Failed to fetch stats")
    }

    return response.json()
  }

  async deleteMyEntry(serverId: number): Promise<void> {
    const response = await fetchWithAuth(`${API_BASE}/servers/${serverId}/timetable`, {
      method: "DELETE",
    })
    if (!response.ok) {
      throw new Error("Failed to delete timetable entry")
    }
  }
}

export const timetableService = new TimetableService()
