const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080/api"

import { authService } from "./auth-service"

export interface NotificationItem {
  id: number
  type: "INVITE" | "TIMETABLE" | "GENERIC"
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
    const res = await fetch(`${API_BASE}/notifications`, {
      headers: authService.getAuthHeaders(),
    })
    if (!res.ok) throw new Error("Failed to fetch notifications")
    return res.json()
  }

  async markAsRead(id: number): Promise<void> {
    const res = await fetch(`${API_BASE}/notifications/${id}/read`, {
      method: "POST",
      headers: authService.getAuthHeaders(),
    })
    if (!res.ok) throw new Error("Failed to mark as read")
  }

  async clearAll(): Promise<void> {
    const res = await fetch(`${API_BASE}/notifications`, {
      method: "DELETE",
      headers: authService.getAuthHeaders(),
    })
    if (!res.ok) throw new Error("Failed to clear notifications")
  }
}

export const notificationService = new NotificationService()


