import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { format } from "date-fns";
import { PlusCircle, Trophy, TrendingUp, TrendingDown, Minus, Swords, Crown } from "lucide-react";
import api from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import type { LeaderboardEntry, Match, PageResponse } from "@/types/api";

const CATAN_COLORS: Record<string, string> = {
  red: "bg-red-500",
  blue: "bg-blue-500",
  white: "bg-gray-100 border border-gray-300",
  orange: "bg-orange-500",
  green: "bg-green-600",
  brown: "bg-amber-800",
  yellow: "bg-yellow-400",
  purple: "bg-purple-600",
};

export function DashboardPage() {
  const { user } = useAuth();

  const { data: leaderboard, isPending: loadingLeaderboard } = useQuery({
    queryKey: ["leaderboard"],
    queryFn: () => api.get<LeaderboardEntry[]>("/leaderboard").then((r) => r.data),
  });

  const { data: matchPage, isPending: loadingMatches } = useQuery({
    queryKey: ["matches", "recent"],
    queryFn: () =>
      api.get<PageResponse<Match>>("/matches?size=10&sort=playedAt,desc").then((r) => r.data),
  });

  const myEntry = leaderboard?.find((e) => e.playerId === user?.playerId);
  const recentMatches = matchPage?.content ?? [];

  return (
    <div className="space-y-6">
      {/* Hero */}
      <div className="rounded-xl bg-primary text-primary-foreground p-6 hex-pattern shadow-md">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <p className="text-primary-foreground/70 text-sm font-medium">Welcome back,</p>
            <h1 className="text-2xl font-bold">{user?.name}</h1>
            <div className="flex items-center gap-3 mt-2 flex-wrap">
              {myEntry ? (
                <>
                  <Badge variant="accent" className="text-sm px-3 py-1 font-bold">
                    {myEntry.eloRating} ELO
                  </Badge>
                  <span className="text-primary-foreground/80 text-sm">
                    #{myEntry.rank} ranked · {myEntry.wins}W / {myEntry.matchesPlayed - myEntry.wins}L
                  </span>
                </>
              ) : (
                <span className="text-primary-foreground/60 text-sm">No matches yet — start logging!</span>
              )}
            </div>
          </div>
          <Button asChild size="lg" className="bg-accent text-accent-foreground hover:bg-accent/90 shadow-sm self-start sm:self-auto">
            <Link to="/matches/new">
              <PlusCircle className="mr-2 h-5 w-5" />
              Log a match
            </Link>
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Leaderboard */}
        <Card className="lg:col-span-2">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Trophy className="h-4 w-4 text-accent" />
              Leaderboard
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-1 p-3 pt-0">
            {loadingLeaderboard
              ? Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="flex items-center gap-3 p-2">
                    <Skeleton className="h-8 w-8 rounded-full" />
                    <div className="flex-1 space-y-1">
                      <Skeleton className="h-3 w-24" />
                      <Skeleton className="h-3 w-16" />
                    </div>
                  </div>
                ))
              : leaderboard?.slice(0, 8).map((entry) => (
                  <LeaderboardRow
                    key={entry.playerId}
                    entry={entry}
                    isMe={entry.playerId === user?.playerId}
                  />
                ))}
          </CardContent>
        </Card>

        {/* Recent matches */}
        <Card className="lg:col-span-3">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Swords className="h-4 w-4 text-accent" />
              Recent Matches
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 p-3 pt-0">
            {loadingMatches
              ? Array.from({ length: 4 }).map((_, i) => (
                  <Skeleton key={i} className="h-20 w-full rounded-lg" />
                ))
              : recentMatches.length === 0
              ? (
                <div className="text-center py-10 text-muted-foreground">
                  <Swords className="h-8 w-8 mx-auto mb-2 opacity-40" />
                  <p className="text-sm">No matches logged yet.</p>
                  <Button asChild variant="link" size="sm" className="mt-1">
                    <Link to="/matches/new">Log the first one!</Link>
                  </Button>
                </div>
              )
              : recentMatches.map((match) => (
                  <MatchCard key={match.id} match={match} currentUserId={user?.playerId ?? ""} />
                ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function LeaderboardRow({ entry, isMe }: { entry: LeaderboardEntry; isMe: boolean }) {
  const initials = entry.playerName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  const winRate = entry.matchesPlayed > 0
    ? Math.round((entry.wins / entry.matchesPlayed) * 100)
    : 0;

  return (
    <div
      className={`flex items-center gap-3 rounded-lg px-2 py-1.5 transition-colors ${
        isMe ? "bg-accent/20 border border-accent/30" : "hover:bg-muted/50"
      }`}
    >
      <span className="w-5 text-center text-xs font-bold text-muted-foreground">
        {entry.rank === 1 ? "🥇" : entry.rank === 2 ? "🥈" : entry.rank === 3 ? "🥉" : entry.rank}
      </span>
      <Avatar className="h-7 w-7">
        <AvatarFallback className="text-xs bg-secondary">{initials}</AvatarFallback>
      </Avatar>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">{entry.playerName}{isMe && " (you)"}</p>
        <p className="text-xs text-muted-foreground">{entry.matchesPlayed}G · {winRate}% WR</p>
      </div>
      <Badge variant="outline" className="text-xs font-bold shrink-0">
        {entry.eloRating}
      </Badge>
    </div>
  );
}

function MatchCard({ match, currentUserId }: { match: Match; currentUserId: string }) {
  const winner = match.players.find((p) => p.winner);
  const myEntry = match.players.find((p) => p.playerId === currentUserId);
  const didIWin = myEntry?.winner ?? false;

  return (
    <div className="rounded-lg border bg-card p-3 space-y-2">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-xs text-muted-foreground">
            {format(new Date(match.playedAt), "MMM d, yyyy")} · {match.locationName} ·{" "}
            {match.expansionName}
          </p>
          {winner && (
            <p className="text-sm font-medium flex items-center gap-1 mt-0.5">
              <Crown className="h-3.5 w-3.5 text-accent" />
              {winner.playerName} won with {winner.points} pts
            </p>
          )}
        </div>
        {myEntry && (
          <Badge
            variant={didIWin ? "default" : "secondary"}
            className="shrink-0 text-xs"
          >
            {didIWin ? "Won" : "Lost"}
          </Badge>
        )}
      </div>

      {/* Players row */}
      <div className="flex flex-wrap gap-1.5">
        {match.players.map((p) => (
          <PlayerChip key={p.id} player={p} isMe={p.playerId === currentUserId} />
        ))}
      </div>
    </div>
  );
}

function PlayerChip({
  player,
  isMe,
}: {
  player: Match["players"][number];
  isMe: boolean;
}) {
  const colorClass = CATAN_COLORS[player.color.toLowerCase()] ?? "bg-gray-400";
  const delta = player.eloDelta;

  return (
    <div
      className={`flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs border ${
        isMe ? "border-accent bg-accent/10 font-semibold" : "border-border bg-background"
      }`}
    >
      <span className={`h-2 w-2 rounded-full ${colorClass} shrink-0`} />
      <span className="truncate max-w-[80px]">{player.playerName}</span>
      <span
        className={`flex items-center gap-0.5 ${
          delta > 0 ? "text-green-600" : delta < 0 ? "text-destructive" : "text-muted-foreground"
        }`}
      >
        {delta > 0 ? (
          <TrendingUp className="h-3 w-3" />
        ) : delta < 0 ? (
          <TrendingDown className="h-3 w-3" />
        ) : (
          <Minus className="h-3 w-3" />
        )}
        {Math.abs(delta)}
      </span>
    </div>
  );
}
