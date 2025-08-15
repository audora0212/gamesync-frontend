'use client';

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { serverService, Server as IServer } from "@/lib/server-service";
import { friendService } from "@/lib/friend-service";
import { timetableService } from "@/lib/timetable-service";
import { authService } from "@/lib/auth-service";
import { CreateServerModal } from "@/components/create-server-modal";
import { JoinByCodeModal } from "@/components/join-by-code-modal";
import { Navbar } from "@/components/navbar";
import { Plus, Users, Clock, Flame, Star } from "lucide-react";
import { useProtectedRoute } from "@/app/hooks/useProtectedRoute";

export default function DashboardPage() {
  useProtectedRoute();

  const [servers, setServers] = useState<IServer[]>([]);
  const [favoriteIds, setFavoriteIds] = useState<Set<number>>(new Set());
  const [isLoading, setIsLoading] = useState(true);
  const [friendSummaries, setFriendSummaries] = useState<Record<number, { friend: string; others: number }>>({});
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showJoinModal, setShowJoinModal] = useState(false);
  const router = useRouter();

  useEffect(() => {
    loadServersAndFavorites();
  }, []);

  const loadServers = async () => {
    setIsLoading(true);
    try {
      const data = await serverService.getMyServers();
      setServers(data);
      await buildFriendSummaries(data);
    } catch {
      toast.error("서버 로드 실패", {
        description: "내 서버 정보를 불러오는데 실패했습니다.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const loadServersAndFavorites = async () => {
    setIsLoading(true);
    try {
      const [data, favs] = await Promise.all([
        serverService.getMyServers(),
        serverService.getMyFavorites(),
      ]);
      setServers(data);
      setFavoriteIds(new Set(favs.map((s) => s.id)));
      await buildFriendSummaries(data);
    } catch {
      toast.error("서버 로드 실패", {
        description: "내 서버 정보를 불러오는데 실패했습니다.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // 각 서버에 내 친구가 스케줄을 등록했는지 요약 계산
  const buildFriendSummaries = async (serversList: IServer[]) => {
    try {
      // 친구 닉네임 집합 구성
      const friends = await friendService.getFriends();
      const friendNickSet = new Set((friends.friends || []).map((f) => f.nickname));

      // 서버별 타임테이블 병렬 조회
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
      // 요약 실패는 무시 (UI에만 추가 정보)
      setFriendSummaries({});
    }
  };

  const toggleFavorite = async (srv: IServer) => {
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

  if (isLoading) {
    return (
      <div className="min-h-screen">
        <Navbar />
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center h-64">
            <div className="text-white">로딩 중...</div>
          </div>
        </div>
      </div>
    );
  }

  const currentUserId = authService.getCurrentUserId();
  const favoriteServers = servers.filter((s) => favoriteIds.has(s.id));
  const otherServers = servers.filter((s) => !favoriteIds.has(s.id));

  return (
    <div className="min-h-screen">
      <Navbar />
      <div className="container mx-auto px-4 py-8">
        {/* 헤더: 모바일에서 세로, 데스크탑에서 가로 */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8 space-y-4 sm:space-y-0">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 border border-white/20 text-white/80 mb-3">
              <Flame className="w-4 h-4 text-orange-300" />
              <span className="text-xs">내 서버 허브</span>
            </div>
            <h1 className="text-3xl font-bold text-white mb-1">대시보드</h1>
            <p className="text-white/70">내가 참여한 서버를 한눈에 모아보세요</p>
          </div>
          <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
            <Button
              onClick={() => setShowJoinModal(true)}
              className="w-full sm:w-auto glass-button hover:bg-white/20 h-12 px-6"
            >
              초대 코드로 참가
            </Button>
            <Button
              onClick={() => setShowCreateModal(true)}
              className="w-full sm:w-auto glass-button hover:bg-white/20 h-12 px-6"
            >
              <Plus className="mr-2 h-4 w-4" />서버 생성
            </Button>
          </div>
        </div>

        {/* 즐겨찾기 서버 */}
        {favoriteServers.length > 0 && (
          <div className="mb-10">
            <div className="flex items-center gap-2 mb-3">
              <Star className="w-4 h-4 text-yellow-300" />
              <span className="text-white/80 text-sm">즐겨찾기</span>
            </div>
            <div className="flex gap-4 overflow-x-auto pb-2">
              {favoriteServers.map((server) => {
                const isOwner = server.ownerId === currentUserId;
                const isFav = favoriteIds.has(server.id);
                return (
                  <div key={server.id} className="min-w-[320px] md:min-w-[360px]">
                    <Card className="relative glass border-white/20 bg-gradient-to-br from-white/10 to-white/5 hover:from-white/20 hover:to-white/10 transition-all duration-300 shadow-xl">
                      <CardHeader className="pb-2">
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-white text-xl">{server.name}</CardTitle>
                          <Badge variant="secondary" className="glass text-yellow-300">
                            {isOwner ? "소유자" : "멤버"}
                          </Badge>
                        </div>
                        <CardDescription className="text-white/70">서버장: {server.owner}</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="flex items-center justify-between text-white/80">
                          <div className="flex items-center">
                            <Users className="mr-2 h-4 w-4" />
                            <span>{server.members.length}명</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Star
                              onClick={() => toggleFavorite(server)}
                              className="mr-2 h-4 w-4 cursor-pointer"
                              style={{ color: isFav ? "#FACC15" : "#9CA3AF" }}
                              fill={isFav ? "currentColor" : "none"}
                            />
                            <Clock className="mr-2 h-4 w-4" />
                            <span>{server.resetTime}</span>
                          </div>
                        </div>
                        {/* 친구 스케줄 요약 (아주 작은 텍스트) */}
                        {friendSummaries[server.id] && (
                          <div className="text-white/60 text-[10px] mt-2">
                            {friendSummaries[server.id].others > 0
                              ? `${friendSummaries[server.id].friend}님 외에 ${friendSummaries[server.id].others}명이 스케줄을 등록했어요`
                              : `${friendSummaries[server.id].friend}님이 스케줄을 등록했어요`}
                          </div>
                        )}
                        <div className="mt-4">
                          <Button
                            onClick={() => router.push(`/server/${server.id}`)}
                            className="w-full glass-button hover:bg-white/20"
                          >
                            입장
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* 모든 서버 */}
        <div className="flex items-center gap-2 mb-3">
          <span className="text-white/80 text-sm">모든 서버</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {servers.map((server) => {
            const isOwner = server.ownerId === currentUserId;
            const isFav = favoriteIds.has(server.id);
            return (
              <Card
                key={server.id}
                className="glass bg-white/10 border-white/20 hover:bg-white/20 hover:shadow-lg hover:shadow-white/10 transition-all duration-300"
              >
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-white">{server.name}</CardTitle>
                    <Badge variant="secondary" className="glass text-yellow-300">
                      {isOwner ? "소유자" : "멤버"}
                    </Badge>
                  </div>
                  <CardDescription className="text-white/70">서버장: {server.owner}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center text-white/80">
                      <Users className="mr-2 h-4 w-4" />
                      <span>{server.members.length}명 참여</span>
                    </div>
                    <div className="flex items-center justify-between text-white/80">
                      <div className="flex items-center gap-2">
                        <Star
                          onClick={() => toggleFavorite(server)}
                          className="mr-2 h-4 w-4 cursor-pointer"
                          style={{ color: isFav ? "#FACC15" : "#9CA3AF" }}
                          fill={isFav ? "currentColor" : "none"}
                        />
                        <Clock className="mr-2 h-4 w-4" />
                        <span>초기화: {server.resetTime}</span>
                      </div>
                      <Button
                        onClick={() => router.push(`/server/${server.id}`)}
                        className="glass-button hover:bg-white/20 h-15 px-8"
                        size="sm"
                      >
                        입장
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* 서버가 없을 때 */}
        {servers.length === 0 && (
          <div className="text-center py-12">
            <div className="glass max-w-md mx-auto p-8">
              <h3 className="text-xl font-semibold text-white mb-2">
                서버가 없습니다
              </h3>
              <p className="text-white/70 mb-6">
                초대 코드를 입력하거나 새 서버를 생성하세요.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center">
                <Button
                  onClick={() => setShowJoinModal(true)}
                  className="w-full sm:w-auto glass-button hover:bg-white/20 h-12 px-6"
                >
                  초대 코드로 참가
                </Button>
                <Button
                  onClick={() => setShowCreateModal(true)}
                  className="w-full sm:w-auto glass-button hover:bg-white/20 h-12 px-6"
                >
                  서버 생성
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 모달 컴포넌트 */}
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
    </div>
  );
}
