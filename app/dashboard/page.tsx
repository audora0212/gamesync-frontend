'use client';

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
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
import { Plus, Users, Clock, Flame, Star, Bug } from "lucide-react";
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
    // 인증이 완료되고 user가 있을 때만 API 호출
    if (!authLoading && authUser) {
      loadServersAndFavorites();
      // 공지 목록 병렬 로드
      noticeService.list().then(setNotices).catch(()=>setNotices([]))
    } else if (!authLoading && !authUser) {
      // 인증이 없으면 로딩 상태를 false로 설정
      setIsLoading(false);
    }
    
    // cleanup: 컴포넌트 unmount 시 진행 중인 API 호출 취소
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [authLoading, authUser]);

  // 공지 상세 로딩
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

  const loadServers = async () => {
    // AuthProvider 상태 확인
    if (!authUser) return;
    
    setIsLoading(true);
    try {
      const data = await serverService.getMyServers();
      setServers(data);
      await buildFriendSummaries(data);
    } catch (error: any) {
      // 취소된 요청은 무시
      if (error?.name !== 'AbortError') {
        toast.error("서버 로드 실패", {
          description: "내 서버 정보를 불러오는데 실패했습니다.",
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  const loadServersAndFavorites = async () => {
    // AuthProvider 상태 확인
    if (!authUser) return;
    
    // 이전 요청 취소
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    
    // 새 AbortController 생성
    abortControllerRef.current = new AbortController();
    
    setIsLoading(true);
    try {
      const [data, favs] = await Promise.all([
        serverService.getMyServers(),
        serverService.getMyFavorites(),
      ]);
      
      // 취소되지 않았다면 상태 업데이트
      if (!abortControllerRef.current.signal.aborted) {
        setServers(data);
        setFavoriteIds(new Set(favs.map((s) => s.id)));
        await buildFriendSummaries(data);
      }
    } catch (error: any) {
      // 취소된 요청은 무시
      if (error?.name !== 'AbortError') {
        toast.error("서버 로드 실패", {
          description: "내 서버 정보를 불러오는데 실패했습니다.",
        });
      }
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

  // AuthProvider가 로딩 중이거나 user가 없으면 로딩 표시
  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen grid-bg">
        <Navbar />
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center h-64">
            <div className="text-white">로딩 중...</div>
          </div>
        </div>
      </div>
    );
  }
  
  // 인증되지 않은 상태
  if (!authUser) {
    return null; // useProtectedRoute가 리다이렉트 처리
  }

  const currentUserId = authService.getCurrentUserId();
  const favoriteServers = servers.filter((s) => favoriteIds.has(s.id));
  const otherServers = servers.filter((s) => !favoriteIds.has(s.id));

  // 디버그 버튼 제거: 페이지는 /debug/native 로 직접 접근 가능

  return (
    <div className="min-h-screen grid-bg">
      <Navbar />
      <motion.div
        className="container mx-auto px-4 py-8"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        {/* 공지 섹션 */}
        {notices.length > 0 && (
          <div className="mb-8">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-muted-foreground text-sm">공지</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {notices.slice(0,6).map(n => (
                <Card key={n.id} className="card-cyber hover-lift">
                  <CardHeader>
                    <CardTitle className="neon-text-purple text-base truncate">{n.title}</CardTitle>
                    <CardDescription className="text-muted-foreground">{new Date(n.createdAt).toLocaleString()}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Button size="sm" className="btn-cyber-outline" onClick={()=>setOpenNotice(n)}>자세히</Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}
        {/* 헤더: 모바일에서 세로, 데스크탑에서 가로 */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8 space-y-4 sm:space-y-0">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 border border-white/20 text-white/80 mb-3">
              <Flame className="w-4 h-4 text-orange-300" />
              <span className="text-xs">내 서버 허브</span>
            </div>
            <h1 className="text-3xl font-bold neon-text-primary mb-1">대시보드</h1>
            <p className="text-muted-foreground">내가 참여한 서버를 한눈에 모아보세요</p>
          </div>
          <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
            <Button
              onClick={() => setShowJoinModal(true)}
              className="w-full sm:w-auto btn-cyber-outline h-12 px-6"
            >
              초대 코드로 참가
            </Button>
            {/* 디버그 버튼 제거 (링크 직접 접근 허용) */}
            <Button
              onClick={() => setShowCreateModal(true)}
              className="w-full sm:w-auto btn-cyber h-12 px-6"
            >
              <Plus className="mr-2 h-4 w-4" />서버 생성
            </Button>
          </div>
        </div>

        {/* 즐겨찾기 서버 */}
        {favoriteServers.length > 0 && (
          <div className="mb-10">
            <div className="flex items-center gap-2 mb-3">
              <Star className="w-4 h-4 text-yellow-300 drop-shadow-[0_0_6px_rgba(255,215,0,0.8)]" />
              <span className="text-muted-foreground text-sm">즐겨찾기</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {favoriteServers.map((server) => {
                const isOwner = server.ownerId === currentUserId;
                const isFav = favoriteIds.has(server.id);
                return (
                  <Card
                    key={server.id}
                    className="card-cyber hover-lift"
                  >
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <CardTitle className="neon-text-primary">{server.name}</CardTitle>
                        <Badge className="badge-cyber">
                          {isOwner ? "소유자" : "멤버"}
                        </Badge>
                      </div>
                      <CardDescription className="text-muted-foreground">서버장: {server.owner}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <div className="flex items-center text-muted-foreground">
                          <Users className="mr-2 h-4 w-4" />
                          <span>{server.members.length}명 참여</span>
                        </div>
                        <div className="flex items-center justify-between text-muted-foreground">
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
                            className="btn-cyber h-15 px-8"
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
          </div>
        )}

        {/* 모든 서버 */}
        <div className="flex items-center gap-2 mb-3">
          <span className="text-muted-foreground text-sm">모든 서버</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {servers.map((server) => {
            const isOwner = server.ownerId === currentUserId;
            const isFav = favoriteIds.has(server.id);
            return (
              <Card
                key={server.id}
                className="card-cyber hover-lift"
              >
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="neon-text-primary">{server.name}</CardTitle>
                    <Badge className="badge-cyber">
                      {isOwner ? "소유자" : "멤버"}
                    </Badge>
                  </div>
                  <CardDescription className="text-muted-foreground">서버장: {server.owner}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center text-muted-foreground">
                      <Users className="mr-2 h-4 w-4" />
                      <span>{server.members.length}명 참여</span>
                    </div>
                    <div className="flex items-center justify-between text-muted-foreground">
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
                        className="btn-cyber h-15 px-8"
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
            <div className="card-cyber max-w-md mx-auto p-8">
              <h3 className="text-xl font-semibold neon-text-primary mb-2">
                서버가 없습니다
              </h3>
              <p className="text-muted-foreground mb-6">
                초대 코드를 입력하거나 새 서버를 생성하세요.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center">
                <Button
                  onClick={() => setShowJoinModal(true)}
                  className="w-full sm:w-auto btn-cyber-outline h-12 px-6"
                >
                  초대 코드로 참가
                </Button>
                <Button
                  onClick={() => setShowCreateModal(true)}
                  className="w-full sm:w-auto btn-cyber h-12 px-6"
                >
                  서버 생성
                </Button>
              </div>
            </div>
          </div>
        )}
      </motion.div>

      {/* Footer는 전역 레이아웃에서 렌더링 */}

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

      {/* 공지 모달 */}
      {openNotice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60" onClick={()=>setOpenNotice(null)}>
          <motion.div
            className="card-cyber max-w-lg w-full mx-4"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.2 }}
            onClick={(e)=>e.stopPropagation()}
          >
            <div className="p-4 border-b border-cyan-500/30">
              <div className="text-lg font-semibold truncate text-white">{openNotice.title}</div>
              <div className="text-xs text-white/70">{new Date(openNotice.createdAt).toLocaleString()}</div>
            </div>
            <div className="p-4 text-sm text-white/80 max-h-[60vh] overflow-auto">
              {noticeLoading ? (
                <div className="text-white/70">불러오는 중...</div>
              ) : (
                <pre className="whitespace-pre-wrap font-sans">{noticeContent}</pre>
              )}
            </div>
            <div className="p-4 flex justify-end">
              <Button className="btn-cyber-outline" onClick={()=>setOpenNotice(null)}>닫기</Button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
