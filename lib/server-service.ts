// lib/server-service.ts
import { authService } from "./auth-service"
import { fetchWithAuth } from "./fetch-with-auth"

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080/api"

export interface MemberInfo {
  id: number
  username: string
}

export interface Server {
  id: number
  name: string
  owner: string
  members: MemberInfo[]
  admins: MemberInfo[]
  resetTime: string
}

interface SearchParams {
  page: number
  size: number
  q?: string
}

class ServerService {
  async createServer(data: { name: string; resetTime: string }): Promise<Server> {
    const res = await fetch(`${API_BASE}/servers`, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...authService.getAuthHeaders() },
      body: JSON.stringify(data),
    })
    if (!res.ok) throw new Error("Failed to create server")
    return res.json()
  }

  async getServers(): Promise<Server[]> {
    const res = await fetch(`${API_BASE}/servers`, { headers: authService.getAuthHeaders() })
    if (!res.ok) throw new Error("Failed to fetch servers")
    return res.json()
  }

  async getServer(id: number): Promise<Server> {
    const res = await fetch(`${API_BASE}/servers/${id}`, { headers: authService.getAuthHeaders() })
    if (!res.ok) throw new Error("Failed to fetch server")
    return res.json()
  }

  async getMyServers(): Promise<Server[]> {
    const res = await fetchWithAuth(`${API_BASE}/servers/mine`)
    if (!res.ok) throw new Error("Failed to fetch my servers")
    return res.json()
  }

  async searchServers(params: SearchParams): Promise<Server[]> {
    const qs = new URLSearchParams()
    qs.append("page", params.page.toString())
    qs.append("size", params.size.toString())
    if (params.q) qs.append("q", params.q)
    const res = await fetch(`${API_BASE}/servers/search?${qs}`, { headers: authService.getAuthHeaders() })
    if (!res.ok) throw new Error("Failed to search servers")
    return res.json()
  }

  async joinServer(id: number): Promise<Server> {
    const res = await fetch(`${API_BASE}/servers/${id}/join`, {
      method: "POST",
      headers: authService.getAuthHeaders(),
    })
    if (!res.ok) throw new Error("Failed to join server")
    return res.json()
  }

  async kickMember(serverId: number, userId: number, username: string): Promise<void> {
    const res = await fetch(`${API_BASE}/servers/${serverId}/kick`, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...authService.getAuthHeaders() },
      body: JSON.stringify({ userId, username }),
    })
    if (!res.ok) throw new Error("Failed to kick member")
  }

  async renameServer(serverId: number, name: string): Promise<Server> {
    const res = await fetch(`${API_BASE}/servers/${serverId}/name`, {
      method: "PUT",
      headers: { "Content-Type": "application/json", ...authService.getAuthHeaders() },
      body: JSON.stringify({ name }),
    })
    if (!res.ok) throw new Error("Failed to rename server")
    return res.json()
  }

  async updateResetTime(serverId: number, resetTime: string): Promise<Server> {
    const res = await fetch(`${API_BASE}/servers/${serverId}/reset-time`, {
      method: "PUT",
      headers: { "Content-Type": "application/json", ...authService.getAuthHeaders() },
      body: JSON.stringify({ resetTime }),
    })
    if (!res.ok) throw new Error("Failed to update reset time")
    return res.json()
  }

  async updateAdmin(
    serverId: number,
    userId: number,
    username: string,
    grant: boolean
  ): Promise<Server> {
    const res = await fetch(`${API_BASE}/servers/${serverId}/admins`, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...authService.getAuthHeaders() },
      body: JSON.stringify({ userId, username, grant }),
    })
    if (!res.ok) throw new Error("Failed to update admin")
    return res.json()
  }
}

export const serverService = new ServerService()
