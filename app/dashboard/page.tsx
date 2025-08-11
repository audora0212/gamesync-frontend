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
import { authService } from "@/lib/auth-service";
import { CreateServerModal } from "@/components/create-server-modal";
import { JoinByCodeModal } from "@/components/join-by-code-modal";
import { Navbar } from "@/components/navbar";
import { Plus, Users, Clock, Flame, Star } from "lucide-react";
import { useProtectedRoute } from "@/app/hooks/useProtectedRoute";

export default function DashboardPage() {
  useProtectedRoute();

  const [servers, setServers] = useState<IServer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showJoinModal, setShowJoinModal] = useState(false);
  const router = useRouter();

  useEffect(() => {
    loadServers();
  }, []);

  const loadServers = async () => {
    setIsLoading(true);
    try {
      const data = await serverService.getMyServers();
      setServers(data);
    } catch {
      toast.error("서버 로드 실패", {
        description: "내 서버 정보를 불러오는데 실패했습니다.",
      });
    } finally {
      setIsLoading(false);
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
  const featuredServers = servers.slice(0, 3);
  const otherServers = servers.slice(3);

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

        {/* 추천 서버 (상위 1~3개) */}
        {featuredServers.length > 0 && (
          <div className="mb-10">
            <div className="flex items-center gap-2 mb-3">
              <Star className="w-4 h-4 text-yellow-300" />
              <span className="text-white/80 text-sm">추천 서버</span>
            </div>
            <div className="flex gap-4 overflow-x-auto pb-2">
              {featuredServers.map((server) => {
                const isOwner = server.ownerId === currentUserId;
                return (
                  <div key={server.id} className="min-w-[280px] md:min-w-[320px]">
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
                          <div className="flex items-center">
                            <Clock className="mr-2 h-4 w-4" />
                            <span>{server.resetTime}</span>
                          </div>
                        </div>
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
          {(otherServers.length > 0 ? otherServers : servers).map((server) => {
            const isOwner = server.ownerId === currentUserId;
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
                      <div className="flex items-center">
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
        onJoinSuccess={loadServers}
      />
    </div>
  );
}
