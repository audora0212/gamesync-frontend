const API_BASE = process.env.NEXT_PUBLIC_API_URL || "/api"
import { authService } from "@/lib/auth-service"

export interface NoticeSummary { id: number; title: string; createdAt: string; updatedAt: string }
export interface NoticeDetail extends NoticeSummary { content: string; author: string }

class NoticeService {
  async list(): Promise<NoticeSummary[]> {
    const res = await fetch(`${API_BASE}/notices`, { cache: 'no-store', headers: authService.getAuthHeaders() })
    if (!res.ok) throw new Error('Failed to load notices')
    return res.json()
  }
  async detail(id: number): Promise<NoticeDetail> {
    const res = await fetch(`${API_BASE}/notices/${id}`, { cache: 'no-store', headers: authService.getAuthHeaders() })
    if (!res.ok) throw new Error('Failed to load notice detail')
    return res.json()
  }
}

export const noticeService = new NoticeService()


