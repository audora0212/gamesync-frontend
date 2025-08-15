const API_BASE = process.env.NEXT_PUBLIC_API_URL || "/api"

import { fetchWithAuth } from "./fetch-with-auth"

export interface SimpleUser {
  id: number
  username: string
  nickname: string
}

export interface FriendListResponse {
  friends: SimpleUser[]
}

export interface PendingRequest {
  requestId: number
  user: SimpleUser
}

export interface PendingListResponse {
  requests: PendingRequest[]
}

export interface FriendCodeResponse {
  code: string
}

class FriendService {
  async getFriends(): Promise<FriendListResponse> {
    const res = await fetchWithAuth(`${API_BASE}/friends`)
    if (!res.ok) throw new Error("Failed to fetch friends")
    return res.json()
  }

  async getPendingReceived(): Promise<PendingListResponse> {
    const res = await fetchWithAuth(`${API_BASE}/friends/requests/received`)
    if (!res.ok) throw new Error("Failed to fetch received requests")
    return res.json()
  }

  async getPendingSent(): Promise<PendingListResponse> {
    const res = await fetchWithAuth(`${API_BASE}/friends/requests/sent`)
    if (!res.ok) throw new Error("Failed to fetch sent requests")
    return res.json()
  }

  async sendRequestByUserId(userId: number): Promise<void> {
    const res = await fetchWithAuth(`${API_BASE}/friends/requests`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ receiverId: userId }),
    })
    if (!res.ok) throw new Error("Failed to send request")
  }

  async sendRequestByCode(friendCode: string): Promise<void> {
    const res = await fetchWithAuth(`${API_BASE}/friends/requests`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ friendCode }),
    })
    if (!res.ok) throw new Error("Failed to send request")
  }

  async respond(requestId: number, accept: boolean): Promise<void> {
    const res = await fetchWithAuth(`${API_BASE}/friends/requests/${requestId}/respond`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ accept }),
    })
    if (!res.ok) throw new Error("Failed to respond request")
  }

  async getMyFriendCode(): Promise<FriendCodeResponse> {
    const res = await fetchWithAuth(`${API_BASE}/users/me/friend-code`)
    if (!res.ok) throw new Error("Failed to fetch friend code")
    return res.json()
  }

  async deleteFriend(friendUserId: number): Promise<void> {
    const res = await fetchWithAuth(`${API_BASE}/friends/${friendUserId}`, {
      method: "DELETE",
    })
    if (!res.ok) throw new Error("Failed to delete friend")
  }
}

export const friendService = new FriendService()


