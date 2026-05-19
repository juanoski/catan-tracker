import { Link } from "react-router-dom";
import { format } from "date-fns";
import { useQueries, useQuery } from "@tanstack/react-query";
import { Award, Medal, Search, Trophy, Users } from "lucide-react";
import api from "@/lib/api";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { useMemo, useState } from "react";
import type { Achievement, Player, PlayerAchievement } from "@/types/api";

export function AchievementsPage() {
  const [search, setSearch] = useState("");

  const { data: achievements = [], isPending: loadingAchievements } = useQuery({
    queryKey: ["achievements"],
    queryFn: () => api.get<Achievement[]>("/achievements").then((r) => r.data),
  });

  const { data: players = [], isPending: loadingPlayers } = useQuery({
    queryKey: ["players"],
    queryFn: () => api.get<Player[]>("/players").then((r) => r.data),
  });

  const unlockQueries = useQueries({
    queries: players.map((player) => ({
      queryKey: ["players", player.id, "achievements"],
      queryFn: () => api.get<PlayerAchievement[]>(`/players/${player.id}/achievements`).then((r) => r.data),
      enabled: players.length > 0,
    })),
  });

  const loadingUnlocks = unlockQueries.some((query) => query.isPending);
  const unlocks = useMemo(() => {
    const rows: Array<PlayerAchievement & { playerId: string; playerName: string }> = [];
    unlockQueries.forEach((query, index) => {
      const player = players[index];
      if (!player || !query.data) return;
      query.data.forEach((achievement) => rows.push({ ...achievement, playerId: player.id, playerName: player.name }));
    });
    return rows;
  }, [players, unlockQueries]);

  const unlocksByAchievement = useMemo(() => {
    const map = new Map<string, Array<PlayerAchievement & { playerId: string; playerName: string }>>();
    unlocks.forEach((unlock) => {
      const list = map.get(unlock.achievementId) ?? [];
      map.set(unlock.achievementId, [...list, unlock]);
    });
    return map;
  }, [unlocks]);

  const filteredAchievements = achievements.filter((achievement) => {
    const text = `${achievement.name} ${achievement.description} ${achievement.category}`.toLowerCase();
    return text.includes(search.trim().toLowerCase());
  });

  const totalUnlocks = unlocks.length;
  const unlockedAchievementCount = [...unlocksByAchievement.keys()].length;
  const topPlayer = getTopAchievementPlayer(unlocks);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-primary">Achievements</h1>
        <p className="text-muted-foreground text-sm mt-1">
          See every achievement and who has unlocked it.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <SummaryCard icon={Award} title="Achievements" value={achievements.length} loading={loadingAchievements} />
        <SummaryCard icon={Trophy} title="Unlocked types" value={unlockedAchievementCount} loading={loadingAchievements || loadingUnlocks} />
        <SummaryCard icon={Medal} title="Top collector" value={topPlayer?.playerName ?? "-"} loading={loadingPlayers || loadingUnlocks} />
      </div>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <CardTitle className="flex items-center gap-2 text-base">
              <Search className="h-4 w-4 text-accent" />
              Achievement list
            </CardTitle>
            <Input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search achievements"
              className="sm:max-w-xs"
            />
          </div>
        </CardHeader>
        <CardContent>
          {loadingAchievements ? (
            <div className="grid gap-4 lg:grid-cols-2">
              {Array.from({ length: 6 }).map((_, index) => <Skeleton key={index} className="h-36 rounded-lg" />)}
            </div>
          ) : filteredAchievements.length === 0 ? (
            <div className="py-12 text-center text-sm text-muted-foreground">No achievements match your search.</div>
          ) : (
            <div className="grid gap-4 lg:grid-cols-2">
              {filteredAchievements.map((achievement) => {
                const unlockedBy = unlocksByAchievement.get(achievement.id) ?? [];
                return (
                  <Card key={achievement.id} className="bg-background">
                    <CardContent className="p-4 space-y-4">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="flex flex-wrap items-center gap-2">
                            <h2 className="font-semibold">{achievement.name}</h2>
                            <Badge variant="outline">{achievement.category}</Badge>
                          </div>
                          <p className="text-sm text-muted-foreground mt-1">{achievement.description}</p>
                        </div>
                        <Badge variant={unlockedBy.length ? "default" : "secondary"} className="shrink-0">
                          {unlockedBy.length}/{players.length}
                        </Badge>
                      </div>

                      {unlockedBy.length === 0 ? (
                        <div className="rounded-md bg-muted/60 px-3 py-2 text-sm text-muted-foreground">
                          No one has unlocked this yet.
                        </div>
                      ) : (
                        <div className="flex flex-wrap gap-2">
                          {unlockedBy
                            .sort((a, b) => new Date(a.unlockedAt).getTime() - new Date(b.unlockedAt).getTime())
                            .map((unlock) => (
                              <Link
                                key={unlock.id}
                                to={`/players/${unlock.playerId}`}
                                className="rounded-full border bg-card px-3 py-1 text-sm hover:bg-muted"
                                title={`Unlocked ${format(new Date(unlock.unlockedAt), "MMM d, yyyy")}`}
                              >
                                {unlock.playerName}
                              </Link>
                            ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
          {!loadingUnlocks && totalUnlocks === 0 && achievements.length > 0 && (
            <p className="mt-4 text-center text-sm text-muted-foreground">
              No achievements have been unlocked yet. They will appear here after matches are logged.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function SummaryCard({
  icon: Icon,
  title,
  value,
  loading,
}: {
  icon: typeof Award;
  title: string;
  value: string | number;
  loading: boolean;
}) {
  if (loading) return <Skeleton className="h-24 rounded-xl" />;

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-sm text-muted-foreground">{title}</p>
            <p className="mt-1 text-2xl font-semibold">{value}</p>
          </div>
          <div className="rounded-md bg-accent/15 p-2 text-accent">
            <Icon className="h-4 w-4" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function getTopAchievementPlayer(unlocks: Array<PlayerAchievement & { playerId: string; playerName: string }>) {
  const counts = new Map<string, { playerName: string; count: number }>();
  unlocks.forEach((unlock) => {
    const current = counts.get(unlock.playerId) ?? { playerName: unlock.playerName, count: 0 };
    counts.set(unlock.playerId, { ...current, count: current.count + 1 });
  });
  const top = [...counts.values()].sort((a, b) => b.count - a.count || a.playerName.localeCompare(b.playerName))[0];
  return top;
}
