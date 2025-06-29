import { authService } from "./auth-service"
import { fetchWithAuth } from "./fetch-with-auth"

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080/api"

interface Server {
  id: number
  name: string
  owner: string
  members: string[]
  admins: string[]
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
}

export const serverService = new ServerService()
