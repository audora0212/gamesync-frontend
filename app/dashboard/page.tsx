'use client';

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { serverService, Server as IServer } from "@/lib/server-service";
import { friendService } from "@/lib/friend-service";
import { timetableService } from "@/lib/timetable-service";
import { authService } from "@/lib/auth-service";
import { CreateServerModal } from "@/components/create-server-modal";
import { JoinByCodeModal } from "@/components/join-by-code-modal";
import { Navbar } from "@/components/navbar";
import {
  Plus, Users, Clock, Star, ChevronRight,
  Gamepad2, Bell, Search, TrendingUp, Sparkles
} from "lucide-react";
import { noticeService, type NoticeSummary } from "@/lib/notice-service";
import { useProtectedRoute } from "@/app/hooks/useProtectedRoute";
import { useAuth } from "@/components/auth-provider";

export default function DashboardPage() {
  useProtectedRoute();
  const { user: authUser, isLoading: authLoading } = useAuth();

  const [servers, setServers] = useState<IServer[]>([]);
  const [favoriteIds, setFavoriteIds] = useState<Set<number>>(new Set());
  const [isLoading, setIsLoading] = useState(true);
  const [friendSummaries, setFriendSummaries] = useState<Record<number, { friend: string; others: number }>>({});
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [notices, setNotices] = useState<NoticeSummary[]>([]);
  const [openNotice, setOpenNotice] = useState<NoticeSummary|null>(null);
  const [noticeContent, setNoticeContent] = useState<string>("");
  const [noticeLoading, setNoticeLoading] = useState<boolean>(false);
  const router = useRouter();
  const abortControllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    if (!authLoading && authUser) {
      loadServersAndFavorites();
      noticeService.list().then(setNotices).catch(()=>setNotices([]))
    } else if (!authLoading && !authUser) {
      setIsLoading(false);
    }

    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [authLoading, authUser]);

  useEffect(() => {
    if (!openNotice) {
      setNoticeContent("");
      return;
    }
    (async () => {
      try {
        setNoticeLoading(true)
        const d = await noticeService.detail(openNotice.id)
        setNoticeContent(d.content || "")
      } catch {
        setNoticeContent("내용을 불러오지 못했습니다.")
      } finally {
        setNoticeLoading(false)
      }
    })()
  }, [openNotice])

  const loadServersAndFavorites = async () => {
    if (!authUser) return;

    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    abortControllerRef.current = new AbortController();

    setIsLoading(true);
    try {
      const [data, favs] = await Promise.all([
        serverService.getMyServers(),
        serverService.getMyFavorites(),
      ]);

      if (!abortControllerRef.current.signal.aborted) {
        setServers(data);
        setFavoriteIds(new Set(favs.map((s) => s.id)));
        await buildFriendSummaries(data);
      }
    } catch (error: any) {
      if (error?.name !== 'AbortError') {
        toast.error("서버 로드 실패");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const buildFriendSummaries = async (serversList: IServer[]) => {
    try {
      const friends = await friendService.getFriends();
      const friendNickSet = new Set((friends.friends || []).map((f) => f.nickname));

      const entriesPerServer = await Promise.all(
        serversList.map(async (s) => {
          try {
            const entries = await timetableService.getTimetable(s.id);
            return { id: s.id, entries } as { id: number; entries: Array<{ user: string }> };
          } catch {
            return { id: s.id, entries: [] } as { id: number; entries: Array<{ user: string }> };
          }
        })
      );

      const result: Record<number, { friend: string; others: number }> = {};
      for (const { id, entries } of entriesPerServer) {
        const uniqueFriends = new Set<string>();
        for (const e of entries) {
          if (e && typeof e.user === "string" && friendNickSet.has(e.user)) {
            uniqueFriends.add(e.user);
          }
        }
        if (uniqueFriends.size > 0) {
          const first = Array.from(uniqueFriends)[0];
          result[id] = { friend: first, others: Math.max(0, uniqueFriends.size - 1) };
        }
      }
      setFriendSummaries(result);
    } catch {
      setFriendSummaries({});
    }
  };

  const toggleFavorite = async (srv: IServer, e: React.MouseEvent) => {
    e.stopPropagation();
    const isFav = favoriteIds.has(srv.id);
    try {
      if (isFav) {
        await serverService.unfavoriteServer(srv.id);
        setFavoriteIds((prev) => {
          const next = new Set(prev);
          next.delete(srv.id);
          return next;
        });
        toast.success("즐겨찾기 해제");
      } else {
        await serverService.favoriteServer(srv.id);
        setFavoriteIds((prev) => new Set(prev).add(srv.id));
        toast.success("즐겨찾기 등록");
      }
    } catch {
      toast.error("즐겨찾기 변경 실패");
    }
  };

  const handleServerCreated = (newServer: IServer) => {
    setServers((prev) => [...prev, newServer]);
    setShowCreateModal(false);
    toast.success("서버 생성 완료", {
      description: `${newServer.name} 서버가 생성되었습니다.`,
    });
  };

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
        <Navbar />
        <div className="container mx-auto px-4 py-12">
          <div className="flex flex-col items-center justify-center h-64 gap-4">
            <div className="w-8 h-8 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin" />
            <p className="text-slate-400 text-sm">불러오는 중...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!authUser) {
    return null;
  }

  const currentUserId = authService.getCurrentUserId();
  const favoriteServers = servers.filter((s) => favoriteIds.has(s.id));

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      <Navbar />

      <main className="container mx-auto px-4 py-6 max-w-7xl">
        {/* Welcome Section */}
        <motion.section
          className="mb-8"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-white mb-1">
                안녕하세요, <span className="text-cyan-400">{authUser}</span>님
              </h1>
              <p className="text-slate-400 text-sm sm:text-base">
                오늘도 함께 게임할 준비 되셨나요?
              </p>
            </div>

            {/* Quick Actions */}
            <div className="flex gap-2">
              <Button
                onClick={() => setShowJoinModal(true)}
                variant="outline"
                className="border-slate-700 bg-slate-800/50 text-slate-300 hover:bg-slate-700 hover:text-white"
              >
                <Search className="w-4 h-4 mr-2" />
                참가
              </Button>
              <Button
                onClick={() => setShowCreateModal(true)}
                className="bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white shadow-lg shadow-cyan-500/20"
              >
                <Plus className="w-4 h-4 mr-2" />
                새 서버
              </Button>
            </div>
          </div>
        </motion.section>

        {/* Notice Banner */}
        {notices.length > 0 && (
          <motion.section
            className="mb-6"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.1 }}
          >
            <div
              className="bg-gradient-to-r from-violet-600/20 to-purple-600/20 border border-violet-500/30 rounded-xl p-4 cursor-pointer hover:border-violet-500/50 transition-colors"
              onClick={() => setOpenNotice(notices[0])}
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-violet-500/20 flex items-center justify-center">
                  <Bell className="w-4 h-4 text-violet-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-violet-300 text-sm font-medium truncate">{notices[0].title}</p>
                  <p className="text-violet-400/60 text-xs">{new Date(notices[0].createdAt).toLocaleDateString()}</p>
                </div>
                <ChevronRight className="w-4 h-4 text-violet-400" />
              </div>
            </div>
          </motion.section>
        )}

        {/* Stats Overview */}
        <motion.section
          className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.15 }}
        >
          <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-cyan-500/10 flex items-center justify-center">
                <Gamepad2 className="w-5 h-5 text-cyan-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">{servers.length}</p>
                <p className="text-slate-400 text-xs">참여 서버</p>
              </div>
            </div>
          </div>
          <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-yellow-500/10 flex items-center justify-center">
                <Star className="w-5 h-5 text-yellow-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">{favoriteServers.length}</p>
                <p className="text-slate-400 text-xs">즐겨찾기</p>
              </div>
            </div>
          </div>
          <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                <Users className="w-5 h-5 text-emerald-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">
                  {servers.reduce((acc, s) => acc + s.members.length, 0)}
                </p>
                <p className="text-slate-400 text-xs">총 멤버</p>
              </div>
            </div>
          </div>
          <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-purple-500/10 flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-purple-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">
                  {Object.keys(friendSummaries).length}
                </p>
                <p className="text-slate-400 text-xs">친구 활동</p>
              </div>
            </div>
          </div>
        </motion.section>

        {/* Favorite Servers */}
        {favoriteServers.length > 0 && (
          <motion.section
            className="mb-8"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.2 }}
          >
            <div className="flex items-center gap-2 mb-4">
              <Star className="w-4 h-4 text-yellow-400" />
              <h2 className="text-lg font-semibold text-white">즐겨찾기</h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {favoriteServers.map((server) => (
                <ServerCard
                  key={server.id}
                  server={server}
                  isFavorite={true}
                  isOwner={server.ownerId === currentUserId}
                  friendSummary={friendSummaries[server.id]}
                  onToggleFavorite={toggleFavorite}
                  onClick={() => router.push(`/server/${server.id}`)}
                />
              ))}
            </div>
          </motion.section>
        )}

        {/* All Servers */}
        <motion.section
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.25 }}
        >
          <div className="flex items-center gap-2 mb-4">
            <Gamepad2 className="w-4 h-4 text-cyan-400" />
            <h2 className="text-lg font-semibold text-white">내 서버</h2>
            <span className="text-slate-500 text-sm">({servers.length})</span>
          </div>

          {servers.length === 0 ? (
            <EmptyState
              onCreateClick={() => setShowCreateModal(true)}
              onJoinClick={() => setShowJoinModal(true)}
            />
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {servers.map((server) => (
                <ServerCard
                  key={server.id}
                  server={server}
                  isFavorite={favoriteIds.has(server.id)}
                  isOwner={server.ownerId === currentUserId}
                  friendSummary={friendSummaries[server.id]}
                  onToggleFavorite={toggleFavorite}
                  onClick={() => router.push(`/server/${server.id}`)}
                />
              ))}
            </div>
          )}
        </motion.section>
      </main>

      {/* Modals */}
      <CreateServerModal
        open={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onServerCreated={handleServerCreated}
      />
      <JoinByCodeModal
        open={showJoinModal}
        onClose={() => setShowJoinModal(false)}
        onJoinSuccess={loadServersAndFavorites}
      />

      {/* Notice Detail Modal */}
      {openNotice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4" onClick={()=>setOpenNotice(null)}>
          <motion.div
            className="bg-slate-900 border border-slate-700 rounded-2xl max-w-lg w-full overflow-hidden"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.2 }}
            onClick={(e)=>e.stopPropagation()}
          >
            <div className="p-5 border-b border-slate-700">
              <h3 className="text-lg font-semibold text-white">{openNotice.title}</h3>
              <p className="text-slate-400 text-xs mt-1">{new Date(openNotice.createdAt).toLocaleString()}</p>
            </div>
            <div className="p-5 max-h-[60vh] overflow-auto">
              {noticeLoading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="w-6 h-6 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin" />
                </div>
              ) : (
                <pre className="text-slate-300 text-sm whitespace-pre-wrap font-sans leading-relaxed">{noticeContent}</pre>
              )}
            </div>
            <div className="p-4 border-t border-slate-700 flex justify-end">
              <Button variant="outline" className="border-slate-600" onClick={()=>setOpenNotice(null)}>닫기</Button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}

// Server Card Component
function ServerCard({
  server,
  isFavorite,
  isOwner,
  friendSummary,
  onToggleFavorite,
  onClick
}: {
  server: IServer;
  isFavorite: boolean;
  isOwner: boolean;
  friendSummary?: { friend: string; others: number };
  onToggleFavorite: (server: IServer, e: React.MouseEvent) => void;
  onClick: () => void;
}) {
  return (
    <Card
      className="bg-slate-800/50 border-slate-700/50 hover:border-slate-600 hover:bg-slate-800/70 transition-all cursor-pointer group"
      onClick={onClick}
    >
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-white truncate group-hover:text-cyan-400 transition-colors">
              {server.name}
            </h3>
            <p className="text-slate-400 text-xs mt-0.5">서버장: {server.owner}</p>
          </div>
          <div className="flex items-center gap-2 ml-2">
            <button
              onClick={(e) => onToggleFavorite(server, e)}
              className="p-1.5 rounded-lg hover:bg-slate-700/50 transition-colors"
            >
              <Star
                className={`w-4 h-4 ${isFavorite ? 'text-yellow-400 fill-yellow-400' : 'text-slate-500'}`}
              />
            </button>
          </div>
        </div>

        <div className="flex items-center gap-3 text-sm">
          <div className="flex items-center gap-1.5 text-slate-400">
            <Users className="w-3.5 h-3.5" />
            <span>{server.members.length}명</span>
          </div>
          <div className="flex items-center gap-1.5 text-slate-400">
            <Clock className="w-3.5 h-3.5" />
            <span>{server.resetTime}</span>
          </div>
          {isOwner && (
            <Badge variant="outline" className="text-xs border-cyan-500/50 text-cyan-400 bg-cyan-500/10">
              소유자
            </Badge>
          )}
        </div>

        {friendSummary && (
          <div className="mt-3 pt-3 border-t border-slate-700/50">
            <div className="flex items-center gap-2 text-xs">
              <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
              <span className="text-emerald-400">
                {friendSummary.friend}
                {friendSummary.others > 0 && ` 외 ${friendSummary.others}명`}이 스케줄 등록
              </span>
            </div>
          </div>
        )}

        <div className="mt-3 flex justify-end">
          <div className="flex items-center gap-1 text-cyan-400 text-xs font-medium group-hover:translate-x-1 transition-transform">
            입장하기
            <ChevronRight className="w-3.5 h-3.5" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Empty State Component
function EmptyState({
  onCreateClick,
  onJoinClick
}: {
  onCreateClick: () => void;
  onJoinClick: () => void;
}) {
  return (
    <div className="bg-slate-800/30 border border-slate-700/50 border-dashed rounded-2xl p-8 sm:p-12 text-center">
      <div className="w-16 h-16 rounded-2xl bg-slate-700/50 flex items-center justify-center mx-auto mb-4">
        <Gamepad2 className="w-8 h-8 text-slate-500" />
      </div>
      <h3 className="text-lg font-semibold text-white mb-2">서버가 없습니다</h3>
      <p className="text-slate-400 text-sm mb-6 max-w-sm mx-auto">
        새로운 서버를 만들거나 초대 코드로 친구의 서버에 참가해보세요
      </p>
      <div className="flex flex-col sm:flex-row gap-3 justify-center">
        <Button
          onClick={onJoinClick}
          variant="outline"
          className="border-slate-600 text-slate-300 hover:bg-slate-700"
        >
          <Search className="w-4 h-4 mr-2" />
          초대 코드로 참가
        </Button>
        <Button
          onClick={onCreateClick}
          className="bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white"
        >
          <Plus className="w-4 h-4 mr-2" />
          새 서버 만들기
        </Button>
      </div>
    </div>
  );
}
