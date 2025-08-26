const API_BASE = process.env.NEXT_PUBLIC_API_URL || "/api"

import { authService } from "./auth-service"
import { fetchWithAuth } from "./fetch-with-auth"

export interface NotificationItem {
  id: number
  type: "INVITE" | "TIMETABLE" | "GENERIC" | "PARTY"
  title: string
  message: string | null
  read: boolean
  createdAt: string
}

export interface NotificationListResponse {
  notifications: NotificationItem[]
  unreadCount: number
}

class NotificationService {
  async getNotifications(): Promise<NotificationListResponse> {
    const res = await fetchWithAuth(`${API_BASE}/notifications`)
    if (!res.ok) throw new Error("Failed to fetch notifications")
    return res.json()
  }

  async registerPushToken(token: string, platform: string = "web"): Promise<void> {
    const res = await fetchWithAuth(`${API_BASE}/push-tokens`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token, platform }),
    })
    if (!res.ok) throw new Error("Failed to register push token")
  }

  async unregisterPushToken(token: string): Promise<void> {
    const url = new URL(`${API_BASE}/push-tokens`)
    url.searchParams.set("token", token)
    const res = await fetchWithAuth(url.toString(), {
      method: "DELETE"
    })
    if (!res.ok) throw new Error("Failed to unregister push token")
  }

  async markAsRead(id: number): Promise<void> {
    const res = await fetchWithAuth(`${API_BASE}/notifications/${id}/read`, {
      method: "POST"
    })
    if (!res.ok) throw new Error("Failed to mark as read")
  }

  async clearAll(): Promise<void> {
    const res = await fetchWithAuth(`${API_BASE}/notifications`, {
      method: "DELETE"
    })
    if (!res.ok) throw new Error("Failed to clear notifications")
  }
}

export const notificationService = new NotificationService()


