import { authService } from "./auth-service";
import { fetchWithAuth } from "./fetch-with-auth";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "/api"

export interface MemberInfo {
  id: number;
  nickname: string;
  username: string;
}

export interface Server {
  id: number;
  name: string;
  ownerId: number
  owner: string; // 백엔드에서 nickname으로 받는중
  members: MemberInfo[];
  inviteCode: string;
  admins: MemberInfo[];
  resetTime: string;
  description?: string | null;
  maxMembers?: number | null;
  resetPaused?: boolean;
}

export interface AggregatedStatsResponse {
  range: "weekly"
  start: string
  end: string
  topGame: string | null
  topHour: number
  topHourCount: number
  topGames: Array<{ name: string; count: number }>
  hourCounts: Array<{ hour: number; count: number }>
  collecting: boolean
}

export async function getAggregatedStats(serverId: number, range: "weekly" = "weekly"): Promise<AggregatedStatsResponse> {
  const API_BASE = process.env.NEXT_PUBLIC_API_URL || "/api"
  const res = await fetchWithAuth(`${API_BASE}/servers/${serverId}/stats?range=${range}`)
  if (!res.ok) throw new Error("Failed to fetch aggregated stats")
  return res.json()
}

// ---- Today & Weekly (new) ----
export interface TodayStatsResponse {
  topGame: string | null
  avgMinuteOfDay: number
  peakHour: number
  peakHourCount: number
  hourlyCounts: Array<{ hour: number; count: number }>
}

export interface WeeklyTopUser {
  userId: number
  nickname: string | null
  count: number
}

export interface WeeklyDayAvg {
  dow: number // 1=Mon..7=Sun
  avgMinuteOfDay: number
  sampleCount: number
}

export interface WeeklyDayGamesItem { name: string; count: number }
export interface WeeklyDayGames { dow: number; items: WeeklyDayGamesItem[] }

export interface WeeklyStatsResponse {
  topUsers: WeeklyTopUser[]
  dowAvg: WeeklyDayAvg[]
  dowGames: WeeklyDayGames[]
}

export async function getTodayStats(serverId: number): Promise<TodayStatsResponse> {
  const res = await fetchWithAuth(`${API_BASE}/servers/${serverId}/stats/today`)
  if (!res.ok) throw new Error("Failed to fetch today stats")
  return res.json()
}

export async function getWeeklyStats(serverId: number): Promise<WeeklyStatsResponse> {
  const res = await fetchWithAuth(`${API_BASE}/servers/${serverId}/stats/weekly`)
  if (!res.ok) throw new Error("Failed to fetch weekly stats")
  return res.json()
}

interface SearchParams {
  page: number;
  size: number;
  q?: string;
}

class ServerService {
  async createServer(data: { name: string; resetTime: string }): Promise<Server> {
    const res = await fetchWithAuth(`${API_BASE}/servers`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error("Failed to create server");
    return res.json();
  }

  async getServers(): Promise<Server[]> {
    const res = await fetchWithAuth(`${API_BASE}/servers`);
    if (!res.ok) throw new Error("Failed to fetch servers");
    return res.json();
  }

  async getServer(id: number): Promise<Server> {
    const res = await fetchWithAuth(`${API_BASE}/servers/${id}`);
    if (!res.ok) throw new Error("Failed to fetch server");
    return res.json();
  }

  async getMyServers(): Promise<Server[]> {
    const res = await fetchWithAuth(`${API_BASE}/servers/mine`);
    if (!res.ok) throw new Error("Failed to fetch my servers");
    return res.json();
  }

  async getMyFavorites(): Promise<Server[]> {
    const res = await fetchWithAuth(`${API_BASE}/servers/favorites/mine`)
    if (!res.ok) throw new Error("Failed to fetch favorite servers")
    return res.json()
  }

  async favoriteServer(id: number): Promise<void> {
    const res = await fetchWithAuth(`${API_BASE}/servers/${id}/favorite`, { method: "POST" })
    if (!res.ok) throw new Error("Failed to favorite server")
  }

  async unfavoriteServer(id: number): Promise<void> {
    const res = await fetchWithAuth(`${API_BASE}/servers/${id}/favorite`, { method: "DELETE" })
    if (!res.ok) throw new Error("Failed to unfavorite server")
  }

  async joinByCode(code: string): Promise<Server> {
    const res = await fetchWithAuth(`${API_BASE}/servers/join?code=${code}`, {
      method: "POST",
    })
    if (!res.ok) throw new Error("Invalid code")
    return res.json()
  }

  async lookupByCode(code: string): Promise<Server> {
    const res = await fetchWithAuth(`${API_BASE}/servers/lookup?code=${code}`)
    if (!res.ok) throw new Error(res.status === 400 ? "INVALID_CODE" : "LOOKUP_FAILED")
    return res.json()
  }

  async searchServers(params: SearchParams): Promise<Server[]> {
    const qs = new URLSearchParams();
    qs.append("page", params.page.toString());
    qs.append("size", params.size.toString());
    if (params.q) qs.append("q", params.q);
    const res = await fetchWithAuth(`${API_BASE}/servers/search?${qs}`);
    if (!res.ok) throw new Error("Failed to search servers");
    return res.json();
  }

  async joinServer(id: number): Promise<Server> {
    const res = await fetchWithAuth(`${API_BASE}/servers/${id}/join`, {
      method: "POST",
    });
    if (!res.ok) throw new Error("Failed to join server");
    return res.json();
  }

  async kickMember(serverId: number, userId: number): Promise<void> {
    const res = await fetchWithAuth(`${API_BASE}/servers/${serverId}/kick`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId }),
    });
    if (!res.ok) throw new Error("Failed to kick member");
  }

  async renameServer(serverId: number, name: string): Promise<Server> {
    const res = await fetchWithAuth(`${API_BASE}/servers/${serverId}/name`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name }),
    });
    if (!res.ok) throw new Error("Failed to rename server");
    return res.json();
  }

  async updateResetTime(serverId: number, resetTime: string): Promise<Server> {
    const res = await fetchWithAuth(`${API_BASE}/servers/${serverId}/reset-time`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ resetTime }),
    });
    if (!res.ok) throw new Error("Failed to update reset time");
    return res.json();
  }

  async updateAdmin(serverId: number, userId: number, grant: boolean): Promise<Server> {
    const res = await fetchWithAuth(`${API_BASE}/servers/${serverId}/admins`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, grant }),
    });
    if (!res.ok) throw new Error("Failed to update admin");
    return res.json();
  }

  async deleteServer(id: number): Promise<void> {
    const res = await fetchWithAuth(`${API_BASE}/servers/${id}`, { method: "DELETE" });
    if (!res.ok) throw new Error("Failed to delete server");
  }

  async leaveServer(id: number): Promise<void> {
    const res = await fetchWithAuth(`${API_BASE}/servers/${id}/leave`, { method: "POST" });
    if (!res.ok) throw new Error("Failed to leave server");
  }

  async inviteUser(serverId: number, receiverUserId: number): Promise<void> {
    const res = await fetchWithAuth(`${API_BASE}/servers/invites`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ serverId, receiverUserId }),
    })
    if (!res.ok) throw new Error("Failed to send invite")
  }

  async listMyInvites(): Promise<Array<{ id: number; serverId: number; serverName: string }>> {
    const res = await fetchWithAuth(`${API_BASE}/servers/invites/me`)
    if (!res.ok) throw new Error("Failed to fetch my invites")
    return res.json()
  }

  async updateDescription(serverId: number, description: string): Promise<Server> {
    const res = await fetchWithAuth(`${API_BASE}/servers/${serverId}/description`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ description }),
    })
    if (!res.ok) throw new Error("Failed to update description")
    return res.json()
  }

  async updateMaxMembers(serverId: number, maxMembers: number | null): Promise<Server> {
    const res = await fetchWithAuth(`${API_BASE}/servers/${serverId}/max-members`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ maxMembers }),
    })
    if (!res.ok) throw new Error("Failed to update max members")
    return res.json()
  }

  async toggleResetPaused(serverId: number, paused: boolean): Promise<Server> {
    const res = await fetchWithAuth(`${API_BASE}/servers/${serverId}/reset-paused`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ paused }),
    })
    if (!res.ok) throw new Error("Failed to toggle reset pause")
    return res.json()
  }
}

export const serverService = new ServerService();
