import { useMemo } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { format } from "date-fns";
import {
  ArrowLeft,
  Award,
  Crown,
  Flame,
  LineChart,
  Medal,
  Route,
  Shield,
  Sparkles,
  Swords,
  Target,
  Trophy,
  Users,
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import api from "@/lib/api";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import type {
  Match,
  PageResponse,
  Player,
  PlayerAchievement,
  PlayerStats,
  RatingHistoryEntry,
} from "@/types/api";

const CATAN_COLOR_HEX: Record<string, string> = {
  red: "#ef4444",
  blue: "#3b82f6",
  white: "#f3f4f6",
  orange: "#f97316",
  green: "#16a34a",
  brown: "#92400e",
  yellow: "#facc15",
  purple: "#9333ea",
};

type ChartRow = { label: string; value: number; display?: string; color?: string };
type HeadToHeadRow = {
  opponentId: string;
  opponentName: string;
  matches: number;
  wins: number;
  losses: number;
  neutralResults: number;
  pointsFor: number;
  pointsAgainst: number;
};

export function PlayerProfilePage() {
  const { playerId = "" } = useParams();
  const navigate = useNavigate();

  const { data: player, isPending: loadingPlayer } = useQuery({
    queryKey: ["players", playerId],
    queryFn: () => api.get<Player>(`/players/${playerId}`).then((r) => r.data),
    enabled: Boolean(playerId),
  });

  const { data: stats, isPending: loadingStats } = useQuery({
    queryKey: ["players", playerId, "stats"],
    queryFn: () => api.get<PlayerStats>(`/players/${playerId}/stats`).then((r) => r.data),
    enabled: Boolean(playerId),
  });

  const { data: ratings = [], isPending: loadingRatings } = useQuery({
    queryKey: ["players", playerId, "ratings"],
    queryFn: () => api.get<RatingHistoryEntry[]>(`/players/${playerId}/ratings`).then((r) => r.data),
    enabled: Boolean(playerId),
  });

  const { data: achievements = [], isPending: loadingAchievements } = useQuery({
    queryKey: ["players", playerId, "achievements"],
    queryFn: () => api.get<PlayerAchievement[]>(`/players/${playerId}/achievements`).then((r) => r.data),
    enabled: Boolean(playerId),
  });

  const { data: matchPage } = useQuery({
    queryKey: ["matches", "history"],
    queryFn: () => api.get<PageResponse<Match>>("/matches?size=100&sort=playedAt,desc").then((r) => r.data),
  });

  const playerMatches = useMemo(
    () => (matchPage?.content ?? []).filter((match) => match.players.some((entry) => entry.playerId === playerId)),
    [matchPage?.content, playerId]
  );

  const colorRows = useMemo(() => buildColorRows(stats), [stats]);
  const headToHeadRows = useMemo(() => buildHeadToHeadRows(playerMatches, playerId), [playerMatches, playerId]);
  const playerName = stats?.playerName ?? player?.name ?? "Player";
  const initials = getInitials(playerName);

  function goBack() {
    if (window.history.length > 1) {
      navigate(-1);
    } else {
      navigate("/matches");
    }
  }

  if (loadingPlayer || loadingStats) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-32 rounded-xl" />
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 8 }).map((_, index) => <Skeleton key={index} className="h-28 rounded-xl" />)}
        </div>
      </div>
    );
  }

  if (!stats || !player) {
    return (
      <Card>
        <CardContent className="py-12 text-center text-muted-foreground">
          <Users className="mx-auto mb-2 h-8 w-8 opacity-40" />
          <p className="text-sm">Player not found.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <Button variant="outline" size="sm" onClick={goBack}>
          <ArrowLeft className="mr-1.5 h-4 w-4" />
          Back
        </Button>
      </div>

      <Card className="overflow-hidden">
        <CardContent className="p-6">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-4">
              <Avatar className="h-16 w-16 border">
                {player.avatarUrl && <AvatarImage src={player.avatarUrl} alt={player.name} />}
                <AvatarFallback className="bg-accent text-accent-foreground text-lg font-bold">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="text-2xl font-bold text-primary">{playerName}</h1>
                  <Badge variant={player.role === "ADMIN" ? "accent" : "secondary"}>
                    {player.role === "ADMIN" ? "Admin" : "Player"}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground mt-1">{player.email}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Joined {format(new Date(player.createdAt), "MMM d, yyyy")}
                </p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3 sm:min-w-64">
              <MiniMetric label="Current ELO" value={stats.currentElo} />
              <MiniMetric label="Peak ELO" value={stats.peakElo} />
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard icon={Swords} title="Matches" value={stats.totalMatches} subtitle={`${stats.totalWins} wins`} />
        <StatCard icon={Trophy} title="Win rate" value={formatWinRate(stats.winRate)} subtitle={`${stats.totalWins}/${stats.totalMatches || 0}`} />
        <StatCard icon={Target} title="Avg points" value={stats.avgPoints.toFixed(1)} subtitle={`High ${stats.highestPointsSingleGame}`} />
        <StatCard icon={Flame} title="Current streak" value={stats.currentWinStreak} subtitle={`Best ${stats.longestWinStreak}`} />
        <StatCard icon={Route} title="Longest Road" value={stats.longestRoadCount} subtitle="Times claimed" />
        <StatCard icon={Shield} title="Largest Army" value={stats.largestArmyCount} subtitle="Times claimed" />
        <StatCard icon={Sparkles} title="Favorite color" value={formatColorName(stats.favoriteColor ?? "") || "-"} subtitle="Most played" />
        <StatCard icon={Award} title="Achievements" value={achievements.length} subtitle="Unlocked" />
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <LineChart className="h-4 w-4 text-accent" />
              ELO over time
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loadingRatings ? (
              <Skeleton className="h-64 rounded-lg" />
            ) : (
              <EloLineChart ratings={ratings} currentElo={stats.currentElo} />
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Sparkles className="h-4 w-4 text-accent" />
              Color performance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <HorizontalBarChart rows={colorRows} emptyText="No color data yet." />
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Users className="h-4 w-4 text-accent" />
              Matchups
            </CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3 sm:grid-cols-2">
            <MatchupCard title="Rival" matchup={stats.rival} />
            <MatchupCard title="Nemesis" matchup={stats.nemesis} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Medal className="h-4 w-4 text-accent" />
              Achievements
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loadingAchievements ? (
              <Skeleton className="h-40 rounded-lg" />
            ) : achievements.length === 0 ? (
              <EmptyPanel text="No achievements unlocked yet." />
            ) : (
              <div className="space-y-3">
                {achievements.slice(0, 5).map((achievement) => (
                  <div key={achievement.id} className="rounded-lg border bg-background p-3">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-medium">{achievement.name}</p>
                        <p className="text-sm text-muted-foreground mt-1">{achievement.description}</p>
                      </div>
                      <Badge variant="outline" className="shrink-0">{achievement.category}</Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mt-2">
                      {format(new Date(achievement.unlockedAt), "MMM d, yyyy")}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Users className="h-4 w-4 text-accent" />
            Head-to-head
          </CardTitle>
        </CardHeader>
        <CardContent>
          {headToHeadRows.length === 0 ? (
            <EmptyPanel text="No head-to-head records yet." />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[760px] text-sm">
                <thead>
                  <tr className="border-b text-left text-muted-foreground">
                    <th className="py-2 pr-3 font-medium">Opponent</th>
                    <th className="py-2 pr-3 font-medium">Matches</th>
                    <th className="py-2 pr-3 font-medium">Record</th>
                    <th className="py-2 pr-3 font-medium">Win rate</th>
                    <th className="py-2 pr-3 font-medium">Avg points</th>
                    <th className="py-2 pr-3 font-medium">Opponent avg</th>
                  </tr>
                </thead>
                <tbody>
                  {headToHeadRows.map((row) => {
                    const decided = row.wins + row.losses;
                    const winRate = decided ? Math.round((row.wins / decided) * 100) : 0;
                    return (
                      <tr key={row.opponentId} className="border-b last:border-0">
                        <td className="py-3 pr-3">
                          <Link to={`/players/${row.opponentId}`} className="font-medium text-primary hover:underline">
                            {row.opponentName}
                          </Link>
                        </td>
                        <td className="py-3 pr-3">{row.matches}</td>
                        <td className="py-3 pr-3">
                          {row.wins}-{row.losses}
                          {row.neutralResults > 0 && <span className="text-muted-foreground"> ({row.neutralResults} neutral)</span>}
                        </td>
                        <td className="py-3 pr-3">{decided ? `${winRate}%` : "-"}</td>
                        <td className="py-3 pr-3">{(row.pointsFor / row.matches).toFixed(1)}</td>
                        <td className="py-3 pr-3">{(row.pointsAgainst / row.matches).toFixed(1)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Crown className="h-4 w-4 text-accent" />
            Recent matches
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {playerMatches.length === 0 ? (
            <EmptyPanel text="No recent matches found in the loaded history." />
          ) : (
            playerMatches.slice(0, 8).map((match) => (
              <RecentMatchCard key={match.id} match={match} playerId={playerId} />
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function buildColorRows(stats?: PlayerStats): ChartRow[] {
  if (!stats) return [];

  return Object.entries(stats.matchesByColor)
    .map(([color, matches]) => {
      const wins = stats.winsByColor[color] ?? 0;
      return {
        label: formatColorName(color),
        value: Number(matches),
        display: `${matches} matches - ${wins} wins`,
        color: CATAN_COLOR_HEX[color.toLowerCase()] ?? "#94a3b8",
      };
    })
    .filter((row) => row.value > 0)
    .sort((a, b) => b.value - a.value || a.label.localeCompare(b.label));
}

function buildHeadToHeadRows(matches: Match[], playerId: string): HeadToHeadRow[] {
  const rows = new Map<string, HeadToHeadRow>();

  matches.forEach((match) => {
    const playerEntry = match.players.find((player) => player.playerId === playerId);
    if (!playerEntry) return;

    match.players.forEach((opponent) => {
      if (opponent.playerId === playerId) return;

      const current = rows.get(opponent.playerId) ?? {
        opponentId: opponent.playerId,
        opponentName: opponent.playerName,
        matches: 0,
        wins: 0,
        losses: 0,
        neutralResults: 0,
        pointsFor: 0,
        pointsAgainst: 0,
      };

      rows.set(opponent.playerId, {
        ...current,
        opponentName: opponent.playerName,
        matches: current.matches + 1,
        wins: current.wins + (playerEntry.winner ? 1 : 0),
        losses: current.losses + (!playerEntry.winner && opponent.winner ? 1 : 0),
        neutralResults: current.neutralResults + (!playerEntry.winner && !opponent.winner ? 1 : 0),
        pointsFor: current.pointsFor + playerEntry.points,
        pointsAgainst: current.pointsAgainst + opponent.points,
      });
    });
  });

  return [...rows.values()].sort((a, b) =>
    b.matches - a.matches ||
    b.wins - a.wins ||
    a.opponentName.localeCompare(b.opponentName)
  );
}

function EloLineChart({
  ratings,
  currentElo,
}: {
  ratings: RatingHistoryEntry[];
  currentElo: number;
}) {
  if (ratings.length === 0) {
    return <EmptyPanel text={`No rating history yet. Current ELO: ${currentElo}.`} />;
  }

  const points = ratings.map((rating) => ({
    label: format(new Date(rating.recordedAt), "MMM d"),
    value: rating.eloAfter,
    delta: rating.delta,
  }));
  const values = points.map((point) => point.value);
  const min = Math.min(...values, 1000);
  const max = Math.max(...values, 1000);
  const range = Math.max(max - min, 1);

  return (
    <div className="space-y-4">
      <div className="flex h-52 items-end gap-2 rounded-lg border bg-muted/30 p-4">
        {points.map((point, index) => {
          const height = 18 + ((point.value - min) / range) * 82;
          return (
            <div key={`${point.label}-${index}`} className="flex min-w-0 flex-1 flex-col items-center gap-2">
              <div className="flex h-40 w-full items-end">
                <div
                  className="w-full rounded-t-md bg-accent"
                  style={{ height: `${height}%` }}
                  title={`${point.label}: ${point.value} ELO (${point.delta >= 0 ? "+" : ""}${point.delta})`}
                />
              </div>
              <span className="max-w-14 truncate text-[10px] text-muted-foreground">{point.label}</span>
            </div>
          );
        })}
      </div>
      <div className="grid gap-3 sm:grid-cols-3">
        <MiniMetric label="Start" value={ratings[0].eloBefore} />
        <MiniMetric label="Peak" value={max} />
        <MiniMetric label="Current" value={currentElo} />
      </div>
    </div>
  );
}

function HorizontalBarChart({
  rows,
  emptyText,
}: {
  rows: ChartRow[];
  emptyText: string;
}) {
  const max = Math.max(...rows.map((row) => row.value), 1);

  if (rows.length === 0) return <EmptyPanel text={emptyText} />;

  return (
    <div className="space-y-3">
      {rows.map((row) => (
        <div key={row.label} className="space-y-1">
          <div className="flex items-center justify-between gap-3 text-xs">
            <span className="font-medium">{row.label}</span>
            <span className="text-muted-foreground">{row.display ?? row.value}</span>
          </div>
          <div className="h-2.5 overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-accent"
              style={{
                width: `${Math.max((row.value / max) * 100, 4)}%`,
                backgroundColor: row.color,
              }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

function RecentMatchCard({ match, playerId }: { match: Match; playerId: string }) {
  const entry = match.players.find((player) => player.playerId === playerId);
  const winner = match.players.find((player) => player.winner);

  return (
    <div className="rounded-lg border bg-background p-3">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="font-medium">
            {entry?.winner ? "Win" : "Loss"} - {format(new Date(match.playedAt), "MMM d, yyyy")}
          </p>
          <p className="text-sm text-muted-foreground mt-1">
            {match.locationName} - {match.expansionName} - winner: {winner?.playerName ?? "-"}
          </p>
        </div>
        {entry && (
          <div className="flex flex-wrap gap-2">
            <Badge variant="outline">{entry.points} pts</Badge>
            <Badge variant={entry.eloDelta >= 0 ? "default" : "secondary"}>
              {entry.eloDelta >= 0 ? "+" : ""}{entry.eloDelta} ELO
            </Badge>
          </div>
        )}
      </div>
    </div>
  );
}

function MatchupCard({
  title,
  matchup,
}: {
  title: string;
  matchup: PlayerStats["rival"];
}) {
  if (!matchup) return <EmptyPanel text={`No ${title.toLowerCase()} yet.`} />;

  const total = matchup.wins + matchup.losses;
  const winRate = total ? Math.round((matchup.wins / total) * 100) : 0;

  return (
    <div className="rounded-lg border bg-background p-3">
      <p className="text-sm text-muted-foreground">{title}</p>
      <Link to={`/players/${matchup.opponentId}`} className="mt-1 block font-semibold text-primary hover:underline">
        {matchup.opponentName}
      </Link>
      <p className="text-sm text-muted-foreground mt-1">
        {matchup.wins}-{matchup.losses} - {winRate}% win rate
      </p>
    </div>
  );
}

function StatCard({
  icon: Icon,
  title,
  value,
  subtitle,
}: {
  icon: typeof Trophy;
  title: string;
  value: string | number;
  subtitle: string;
}) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-sm text-muted-foreground">{title}</p>
            <p className="text-2xl font-semibold mt-1">{value}</p>
            <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>
          </div>
          <div className="rounded-md bg-accent/15 p-2 text-accent">
            <Icon className="h-4 w-4" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function MiniMetric({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-lg border bg-background p-3">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-lg font-semibold mt-1">{value}</p>
    </div>
  );
}

function EmptyPanel({ text }: { text: string }) {
  return (
    <div className="flex min-h-32 items-center justify-center rounded-lg bg-muted/50 px-4 text-center text-sm text-muted-foreground">
      {text}
    </div>
  );
}

function formatColorName(color: string) {
  const trimmed = color.trim();
  return trimmed ? trimmed.charAt(0).toUpperCase() + trimmed.slice(1).toLowerCase() : "";
}

function formatWinRate(value: number) {
  return `${Math.round(value * 100)}%`;
}

function getInitials(name: string) {
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}
