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
  Gamepad2, Bell, Search, TrendingUp, Sparkles, X
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
      <div className="min-h-screen bg-background">
        {/* 배경 효과 */}
        <div className="fixed inset-0 overflow-hidden pointer-events-none">
          <div className="absolute inset-0 bg-[linear-gradient(rgba(5,242,219,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(5,242,219,0.03)_1px,transparent_1px)] bg-[size:50px_50px]" />
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-neon-cyan/10 rounded-full blur-[150px]" />
          <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-neon-magenta/10 rounded-full blur-[150px]" />
        </div>
        <Navbar />
        <div className="container mx-auto px-4 py-12">
          <div className="flex flex-col items-center justify-center h-64 gap-4">
            <div className="w-10 h-10 border-2 border-neon-cyan border-t-transparent rounded-full animate-spin shadow-[0_0_15px_rgba(5,242,219,0.5)]" />
            <p className="text-neon-cyan/80 text-sm font-medium">불러오는 중...</p>
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
    <div className="min-h-screen bg-background flex flex-col">
      {/* 배경 효과 */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute inset-0 bg-[linear-gradient(rgba(5,242,219,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(5,242,219,0.03)_1px,transparent_1px)] bg-[size:50px_50px]" />
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-neon-cyan/10 rounded-full blur-[150px]" />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-neon-magenta/10 rounded-full blur-[150px]" />
        <div className="absolute top-1/2 right-0 w-64 h-64 bg-neon-pink/5 rounded-full blur-[100px]" />
      </div>

      <Navbar />

      <main className="relative flex-1 container mx-auto px-4 py-6 max-w-7xl z-10">
        {/* Welcome Section */}
        <motion.section
          className="mb-8"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-display font-bold text-white mb-1">
                안녕하세요, <span className="text-neon-cyan drop-shadow-[0_0_10px_rgba(5,242,219,0.5)]">{authUser}</span>님
              </h1>
              <p className="text-muted-foreground text-sm sm:text-base">
                오늘도 함께 게임할 준비 되셨나요?
              </p>
            </div>

            {/* Quick Actions */}
            <div className="flex gap-2">
              <Button
                onClick={() => setShowJoinModal(true)}
                variant="outline"
              >
                <Search className="w-4 h-4 mr-2" />
                참가
              </Button>
              <Button
                onClick={() => setShowCreateModal(true)}
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
              className="bg-neon-magenta/10 backdrop-blur-sm border border-neon-magenta/30 rounded-xl p-4 cursor-pointer hover:border-neon-magenta/50 hover:shadow-[0_0_20px_rgba(217,4,142,0.2)] transition-all"
              onClick={() => setOpenNotice(notices[0])}
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-neon-magenta/20 flex items-center justify-center">
                  <Bell className="w-4 h-4 text-neon-magenta" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-neon-magenta text-sm font-medium truncate">{notices[0].title}</p>
                  <p className="text-neon-magenta/60 text-xs">{new Date(notices[0].createdAt).toLocaleDateString()}</p>
                </div>
                <ChevronRight className="w-4 h-4 text-neon-magenta" />
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
          <StatsCard
            icon={Gamepad2}
            value={servers.length}
            label="참여 서버"
            color="cyan"
          />
          <StatsCard
            icon={Star}
            value={favoriteServers.length}
            label="즐겨찾기"
            color="yellow"
          />
          <StatsCard
            icon={Users}
            value={servers.reduce((acc, s) => acc + s.members.length, 0)}
            label="총 멤버"
            color="green"
          />
          <StatsCard
            icon={TrendingUp}
            value={Object.keys(friendSummaries).length}
            label="친구 활동"
            color="magenta"
          />
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
              <Star className="w-4 h-4 text-neon-yellow fill-neon-yellow" />
              <h2 className="text-lg font-display font-semibold text-white">즐겨찾기</h2>
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
            <Gamepad2 className="w-4 h-4 text-neon-cyan" />
            <h2 className="text-lg font-display font-semibold text-white">내 서버</h2>
            <span className="text-muted-foreground text-sm">({servers.length})</span>
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4" onClick={()=>setOpenNotice(null)}>
          <motion.div
            className="bg-card/95 backdrop-blur-xl border border-neon-magenta/30 rounded-2xl max-w-lg w-full overflow-hidden shadow-[0_0_40px_rgba(217,4,142,0.2)]"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.2 }}
            onClick={(e)=>e.stopPropagation()}
          >
            <div className="p-5 border-b border-white/10 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-display font-semibold text-white">{openNotice.title}</h3>
                <p className="text-muted-foreground text-xs mt-1">{new Date(openNotice.createdAt).toLocaleString()}</p>
              </div>
              <button
                onClick={() => setOpenNotice(null)}
                className="p-2 rounded-lg hover:bg-white/5 transition-colors"
              >
                <X className="w-5 h-5 text-muted-foreground" />
              </button>
            </div>
            <div className="p-5 max-h-[60vh] overflow-auto">
              {noticeLoading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="w-6 h-6 border-2 border-neon-cyan border-t-transparent rounded-full animate-spin" />
                </div>
              ) : (
                <pre className="text-foreground/80 text-sm whitespace-pre-wrap font-sans leading-relaxed">{noticeContent}</pre>
              )}
            </div>
            <div className="p-4 border-t border-white/10 flex justify-end">
              <Button variant="outline" onClick={()=>setOpenNotice(null)}>닫기</Button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}

// Stats Card Component
function StatsCard({
  icon: Icon,
  value,
  label,
  color
}: {
  icon: any;
  value: number;
  label: string;
  color: 'cyan' | 'yellow' | 'green' | 'magenta';
}) {
  const colorClasses = {
    cyan: {
      bg: 'bg-neon-cyan/10',
      icon: 'text-neon-cyan',
      glow: 'shadow-[0_0_15px_rgba(5,242,219,0.2)]'
    },
    yellow: {
      bg: 'bg-neon-yellow/10',
      icon: 'text-neon-yellow',
      glow: 'shadow-[0_0_15px_rgba(255,215,0,0.2)]'
    },
    green: {
      bg: 'bg-neon-green/10',
      icon: 'text-neon-green',
      glow: 'shadow-[0_0_15px_rgba(0,255,136,0.2)]'
    },
    magenta: {
      bg: 'bg-neon-magenta/10',
      icon: 'text-neon-magenta',
      glow: 'shadow-[0_0_15px_rgba(217,4,142,0.2)]'
    }
  };

  const classes = colorClasses[color];

  return (
    <div className={`bg-card/50 backdrop-blur-sm border border-white/10 rounded-xl p-4 hover:border-white/20 transition-all ${classes.glow}`}>
      <div className="flex items-center gap-3">
        <div className={`w-10 h-10 rounded-lg ${classes.bg} flex items-center justify-center`}>
          <Icon className={`w-5 h-5 ${classes.icon}`} />
        </div>
        <div>
          <p className="text-2xl font-display font-bold text-white">{value}</p>
          <p className="text-muted-foreground text-xs">{label}</p>
        </div>
      </div>
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
      className="group cursor-pointer hover:border-neon-cyan/40 hover:shadow-[0_0_25px_rgba(5,242,219,0.15)]"
      onClick={onClick}
    >
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1 min-w-0">
            <h3 className="font-display font-semibold text-white truncate group-hover:text-neon-cyan transition-colors">
              {server.name}
            </h3>
            <p className="text-muted-foreground text-xs mt-0.5">서버장: {server.owner}</p>
          </div>
          <div className="flex items-center gap-2 ml-2">
            <button
              onClick={(e) => onToggleFavorite(server, e)}
              className="p-1.5 rounded-lg hover:bg-white/5 transition-colors"
            >
              <Star
                className={`w-4 h-4 transition-colors ${isFavorite ? 'text-neon-yellow fill-neon-yellow drop-shadow-[0_0_8px_rgba(255,215,0,0.5)]' : 'text-muted-foreground'}`}
              />
            </button>
          </div>
        </div>

        <div className="flex items-center gap-3 text-sm">
          <div className="flex items-center gap-1.5 text-muted-foreground">
            <Users className="w-3.5 h-3.5" />
            <span>{server.members.length}명</span>
          </div>
          <div className="flex items-center gap-1.5 text-muted-foreground">
            <Clock className="w-3.5 h-3.5" />
            <span>{server.resetTime}</span>
          </div>
          {isOwner && (
            <Badge variant="cyan" className="text-xs">
              소유자
            </Badge>
          )}
        </div>

        {friendSummary && (
          <div className="mt-3 pt-3 border-t border-white/10">
            <div className="flex items-center gap-2 text-xs">
              <Sparkles className="w-3.5 h-3.5 text-neon-green" />
              <span className="text-neon-green">
                {friendSummary.friend}
                {friendSummary.others > 0 && ` 외 ${friendSummary.others}명`}이 스케줄 등록
              </span>
            </div>
          </div>
        )}

        <div className="mt-3 flex justify-end">
          <div className="flex items-center gap-1 text-neon-cyan text-xs font-medium group-hover:translate-x-1 transition-transform">
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
    <div className="bg-card/30 backdrop-blur-sm border border-dashed border-white/20 rounded-2xl p-8 sm:p-12 text-center">
      <div className="w-16 h-16 rounded-2xl bg-neon-cyan/10 flex items-center justify-center mx-auto mb-4">
        <Gamepad2 className="w-8 h-8 text-neon-cyan/50" />
      </div>
      <h3 className="text-lg font-display font-semibold text-white mb-2">서버가 없습니다</h3>
      <p className="text-muted-foreground text-sm mb-6 max-w-sm mx-auto">
        새로운 서버를 만들거나 초대 코드로 친구의 서버에 참가해보세요
      </p>
      <div className="flex flex-col sm:flex-row gap-3 justify-center">
        <Button
          onClick={onJoinClick}
          variant="outline"
        >
          <Search className="w-4 h-4 mr-2" />
          초대 코드로 참가
        </Button>
        <Button onClick={onCreateClick}>
          <Plus className="w-4 h-4 mr-2" />
          새 서버 만들기
        </Button>
      </div>
    </div>
  );
}
