import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Medal, Trophy, Users } from "lucide-react";
import api from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { LeaderboardEntry } from "@/types/api";

type SortKey = "elo" | "wins" | "matches" | "winRate" | "name";

export function LeaderboardPage() {
  const { user } = useAuth();
  const [sortKey, setSortKey] = useState<SortKey>("elo");

  const { data: leaderboardData = [], isPending, isError } = useQuery({
    queryKey: ["leaderboard"],
    queryFn: () => api.get<LeaderboardEntry[]>("/leaderboard").then((r) => r.data),
  });
  const leaderboard = Array.isArray(leaderboardData) ? leaderboardData : [];
  const sortedLeaderboard = useMemo(() => sortLeaderboard(leaderboard, sortKey), [leaderboard, sortKey]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-primary">Leaderboard</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Compare ELO, match volume, wins, losses, and win rate.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <Summary title="Players" value={leaderboard.length} icon={Users} loading={isPending} />
        <Summary title="Top ELO" value={leaderboard[0]?.eloRating ?? "-"} icon={Trophy} loading={isPending} />
        <Summary title="Most wins" value={getMostWins(leaderboard)?.wins ?? "-"} icon={Medal} loading={isPending} />
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <CardTitle className="flex items-center gap-2 text-base">
              <Trophy className="h-4 w-4 text-accent" />
              Rankings
            </CardTitle>
            <div className="w-full sm:w-48">
              <Select value={sortKey} onValueChange={(value) => setSortKey(value as SortKey)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="elo">Sort by ELO</SelectItem>
                  <SelectItem value="wins">Sort by wins</SelectItem>
                  <SelectItem value="matches">Sort by matches</SelectItem>
                  <SelectItem value="winRate">Sort by win rate</SelectItem>
                  <SelectItem value="name">Sort by name</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isPending ? (
            <div className="space-y-3">
              {Array.from({ length: 8 }).map((_, index) => (
                <Skeleton key={index} className="h-14 rounded-lg" />
              ))}
            </div>
          ) : isError ? (
            <div className="py-12 text-center text-sm text-destructive">Could not load the leaderboard.</div>
          ) : leaderboard.length === 0 ? (
            <div className="py-12 text-center text-sm text-muted-foreground">No ranked players yet. Log a match to start the table.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[720px] text-sm">
                <thead>
                  <tr className="border-b text-left text-muted-foreground">
                    <th className="py-2 pr-3 font-medium">Rank</th>
                    <th className="py-2 pr-3 font-medium">Player</th>
                    <th className="py-2 pr-3 font-medium">ELO</th>
                    <th className="py-2 pr-3 font-medium">Matches</th>
                    <th className="py-2 pr-3 font-medium">Wins</th>
                    <th className="py-2 pr-3 font-medium">Losses</th>
                    <th className="py-2 pr-3 font-medium">Win rate</th>
                  </tr>
                </thead>
                <tbody>
                  {sortedLeaderboard.map((entry, index) => {
                    const losses = entry.matchesPlayed - entry.wins;
                    const winRate = entry.matchesPlayed ? Math.round((entry.wins / entry.matchesPlayed) * 100) : 0;
                    const isMe = entry.playerId === user?.playerId;

                    return (
                      <tr key={entry.playerId} className={isMe ? "border-b bg-accent/10 last:border-0" : "border-b last:border-0"}>
                        <td className="py-3 pr-3 font-semibold">#{sortKey === "elo" ? entry.rank : index + 1}</td>
                        <td className="py-3 pr-3">
                          <div className="flex items-center gap-2">
                            <Avatar className="h-8 w-8">
                              <AvatarFallback className="text-xs bg-secondary">{getInitials(entry.playerName)}</AvatarFallback>
                            </Avatar>
                            <div>
                              <Link to={`/players/${entry.playerId}`} className="font-medium text-primary hover:underline">
                                {entry.playerName}
                              </Link>
                              {isMe && <Badge variant="outline" className="ml-2 text-xs">you</Badge>}
                            </div>
                          </div>
                        </td>
                        <td className="py-3 pr-3 font-semibold">{entry.eloRating}</td>
                        <td className="py-3 pr-3">{entry.matchesPlayed}</td>
                        <td className="py-3 pr-3">{entry.wins}</td>
                        <td className="py-3 pr-3">{losses}</td>
                        <td className="py-3 pr-3">{winRate}%</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function Summary({
  title,
  value,
  icon: Icon,
  loading,
}: {
  title: string;
  value: string | number;
  icon: typeof Trophy;
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

function getMostWins(entries: LeaderboardEntry[]) {
  return [...entries].sort((a, b) => b.wins - a.wins || a.playerName.localeCompare(b.playerName))[0];
}

function sortLeaderboard(entries: LeaderboardEntry[], sortKey: SortKey) {
  return [...entries].sort((a, b) => {
    if (sortKey === "wins") return b.wins - a.wins || b.eloRating - a.eloRating;
    if (sortKey === "matches") return b.matchesPlayed - a.matchesPlayed || b.eloRating - a.eloRating;
    if (sortKey === "winRate") {
      const aRate = a.matchesPlayed ? a.wins / a.matchesPlayed : 0;
      const bRate = b.matchesPlayed ? b.wins / b.matchesPlayed : 0;
      return bRate - aRate || b.eloRating - a.eloRating;
    }
    if (sortKey === "name") return a.playerName.localeCompare(b.playerName);
    return a.rank - b.rank;
  });
}

function getInitials(name: string) {
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}
