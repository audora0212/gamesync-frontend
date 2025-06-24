import { authService } from "./auth-service"

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080/api"

interface CreateServerRequest {
  name: string
  resetTime: string
}

interface Server {
  id: number
  name: string
  owner: string
  members: string[]
  admins: string[]
  resetTime: string
}

class ServerService {
  async createServer(data: CreateServerRequest): Promise<Server> {
    const response = await fetch(`${API_BASE}/servers`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...authService.getAuthHeaders(),
      },
      body: JSON.stringify(data),
    })

    if (!response.ok) {
      throw new Error("Failed to create server")
    }

    return response.json()
  }

  async getServers(): Promise<Server[]> {
    const response = await fetch(`${API_BASE}/servers`, {
      headers: authService.getAuthHeaders(),
    })

    if (!response.ok) {
      throw new Error("Failed to fetch servers")
    }

    return response.json()
  }

  async getServer(id: number): Promise<Server> {
    const response = await fetch(`${API_BASE}/servers/${id}`, {
      headers: authService.getAuthHeaders(),
    })

    if (!response.ok) {
      throw new Error("Failed to fetch server")
    }

    return response.json()
  }

  async joinServer(id: number): Promise<Server> {
    const response = await fetch(`${API_BASE}/servers/${id}/join`, {
      method: "POST",
      headers: authService.getAuthHeaders(),
    })

    if (!response.ok) {
      throw new Error("Failed to join server")
    }

    return response.json()
  }

  async updateResetTime(id: number, resetTime: string): Promise<Server> {
    const response = await fetch(`${API_BASE}/servers/${id}/reset-time`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        ...authService.getAuthHeaders(),
      },
      body: JSON.stringify({ resetTime }),
    })

    if (!response.ok) {
      throw new Error("Failed to update reset time")
    }

    return response.json()
  }

  async renameServer(id: number, name: string): Promise<Server> {
    const response = await fetch(`${API_BASE}/servers/${id}/name`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        ...authService.getAuthHeaders(),
      },
      body: JSON.stringify({ name }),
    })

    if (!response.ok) {
      throw new Error("Failed to rename server")
    }

    return response.json()
  }

  async deleteServer(id: number): Promise<void> {
    const response = await fetch(`${API_BASE}/servers/${id}`, {
      method: "DELETE",
      headers: authService.getAuthHeaders(),
    })

    if (!response.ok) {
      throw new Error("Failed to delete server")
    }
  }
}

export const serverService = new ServerService()
