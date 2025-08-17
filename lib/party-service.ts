import { authService } from "./auth-service"

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "/api"

export interface PartyResponse {
  id: number
  serverId: number
  creator: string
  slot: string
  gameId: number
  gameName: string
  custom: boolean
  capacity: number
  participants: number
  full: boolean
  participantNames: string[]
}

export interface PartyCreateRequest {
  serverId: number
  slot: string
  defaultGameId?: number
  customGameId?: number
  capacity: number
}

class PartyService {
  async list(serverId: number): Promise<PartyResponse[]> {
    const res = await fetch(`${API_BASE}/servers/${serverId}/parties`, {
      headers: authService.getAuthHeaders(),
    })
    if (!res.ok) throw new Error("Failed to fetch parties")
    return res.json()
  }

  async create(data: PartyCreateRequest): Promise<PartyResponse> {
    const res = await fetch(`${API_BASE}/servers/${data.serverId}/parties`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...authService.getAuthHeaders(),
      },
      body: JSON.stringify(data),
    })
    if (!res.ok) throw new Error("Failed to create party")
    return res.json()
  }

  async join(serverId: number, partyId: number): Promise<PartyResponse> {
    const res = await fetch(`${API_BASE}/servers/${serverId}/parties/${partyId}/join`, {
      method: "POST",
      headers: authService.getAuthHeaders(),
    })
    if (!res.ok) throw new Error("Failed to join party")
    return res.json()
  }
}

export const partyService = new PartyService()


