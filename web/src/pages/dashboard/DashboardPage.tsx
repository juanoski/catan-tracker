import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { format } from "date-fns";
import { Award, CalendarDays, Clock3, Flame, MapPin, PlusCircle, Scale, Trophy, TrendingUp, TrendingDown, Minus, Swords, Crown, User, Users } from "lucide-react";
import api from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { EmptyState, ErrorState } from "@/components/common/AppState";
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

  const { data: leaderboard, isPending: loadingLeaderboard, isError: leaderboardError, refetch: refetchLeaderboard } = useQuery({
    queryKey: ["leaderboard"],
    queryFn: () => api.get<LeaderboardEntry[]>("/leaderboard").then((r) => r.data),
  });

  const { data: matchPage, isPending: loadingMatches, isError: matchesError, refetch: refetchMatches } = useQuery({
    queryKey: ["matches", "recent"],
    queryFn: () =>
      api.get<PageResponse<Match>>("/matches?size=100&sort=playedAt,desc").then((r) => r.data),
  });

  const myEntry = leaderboard?.find((e) => e.playerId === user?.playerId);
  const loadedMatches = matchPage?.content ?? [];
  const lastMatch = loadedMatches[0];
  const recentMatches = loadedMatches.slice(0, 10);
  const pulse = buildLeaguePulse(loadedMatches, leaderboard ?? [], matchPage?.totalElements ?? loadedMatches.length);

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
                  <Link to={`/players/${myEntry.playerId}`} className="rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent">
                    <Badge variant="accent" className="text-sm px-3 py-1 font-bold">
                      {myEntry.eloRating} ELO
                    </Badge>
                  </Link>
                  <Link to={`/players/${myEntry.playerId}`} className="text-primary-foreground/80 text-sm hover:underline">
                    Rank #{myEntry.rank} - {myEntry.wins}W - {myEntry.matchesPlayed - myEntry.wins}L
                  </Link>
                </>
              ) : (
                <span className="text-primary-foreground/60 text-sm">No matches yet. Log one to start your stats.</span>
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

      <QuickActions playerId={user?.playerId} />

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <PulseCard
          icon={Swords}
          title="Total matches"
          value={pulse.totalMatches}
          subtitle={`${loadedMatches.length} loaded`}
          loading={loadingMatches}
        />
        <PulseCard
          icon={Trophy}
          title="Top player"
          value={pulse.topPlayer?.playerName ?? "-"}
          subtitle={pulse.topPlayer ? `${pulse.topPlayer.eloRating} ELO` : "No leaderboard yet"}
          href={pulse.topPlayer ? `/players/${pulse.topPlayer.playerId}` : undefined}
          loading={loadingLeaderboard}
        />
        <PulseCard
          icon={Flame}
          title="Current win streak"
          value={pulse.winStreak?.playerName ?? "-"}
          subtitle={pulse.winStreak ? `${pulse.winStreak.count} wins in a row` : "No current streak"}
          href={pulse.winStreak ? `/players/${pulse.winStreak.playerId}` : undefined}
          loading={loadingMatches}
        />
        <PulseCard
          icon={TrendingDown}
          title="Current loss streak"
          value={pulse.loseStreak?.playerName ?? "-"}
          subtitle={pulse.loseStreak ? `${pulse.loseStreak.count} losses in a row` : "No current streak"}
          href={pulse.loseStreak ? `/players/${pulse.loseStreak.playerId}` : undefined}
          loading={loadingMatches}
        />
        <PulseCard
          icon={TrendingUp}
          title="ELO climber"
          value={pulse.eloClimber?.playerName ?? "-"}
          subtitle={pulse.eloClimber ? `+${pulse.eloClimber.value} recent ELO` : "No gains yet"}
          href={pulse.eloClimber ? `/players/${pulse.eloClimber.playerId}` : undefined}
          loading={loadingMatches}
        />
        <PulseCard
          icon={Users}
          title="Most active"
          value={pulse.mostActive?.playerName ?? "-"}
          subtitle={pulse.mostActive ? `${pulse.mostActive.value} matches` : "No matches yet"}
          href={pulse.mostActive ? `/players/${pulse.mostActive.playerId}` : undefined}
          loading={loadingMatches}
        />
        <PulseCard
          icon={MapPin}
          title="Top location"
          value={pulse.topLocation?.locationName ?? "-"}
          subtitle={pulse.topLocation ? `${pulse.topLocation.value} matches` : "No locations yet"}
          loading={loadingMatches}
        />
        <PulseCard
          icon={Clock3}
          title="Latest winner"
          value={pulse.latestWinner?.playerName ?? "-"}
          subtitle={pulse.latestWinner ? format(new Date(pulse.latestWinner.playedAt), "MMM d, yyyy") : "No matches yet"}
          href={pulse.latestWinner ? `/players/${pulse.latestWinner.playerId}` : undefined}
          loading={loadingMatches}
        />
      </div>

      <LastMatchSummary
        match={lastMatch}
        loading={loadingMatches}
        error={matchesError}
        onRetry={refetchMatches}
        currentUserId={user?.playerId ?? ""}
      />

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
            {loadingLeaderboard ? (
              Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="flex items-center gap-3 p-2">
                    <Skeleton className="h-8 w-8 rounded-full" />
                    <div className="flex-1 space-y-1">
                      <Skeleton className="h-3 w-24" />
                      <Skeleton className="h-3 w-16" />
                    </div>
                  </div>
                ))
            ) : leaderboardError ? (
              <ErrorState
                title="Could not load rankings"
                description="The leaderboard is unavailable right now."
                action={<Button type="button" variant="outline" onClick={() => refetchLeaderboard()}>Try again</Button>}
              />
            ) : leaderboard?.length === 0 ? (
              <EmptyState
                icon={Trophy}
                title="No rankings yet"
                description="Rankings will appear after the first match is logged."
              />
            ) : (
              leaderboard?.slice(0, 8).map((entry) => (
                  <LeaderboardRow
                    key={entry.playerId}
                    entry={entry}
                    isMe={entry.playerId === user?.playerId}
                  />
                ))
            )}
          </CardContent>
        </Card>

        {/* Recent matches */}
        <Card className="lg:col-span-3">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between gap-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <Swords className="h-4 w-4 text-accent" />
                Recent matches
              </CardTitle>
              <Button asChild variant="outline" size="sm">
                <Link to="/matches">Open history</Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-3 p-3 pt-0">
            {loadingMatches ? (
              Array.from({ length: 4 }).map((_, i) => (
                  <Skeleton key={i} className="h-20 w-full rounded-lg" />
                ))
            ) : matchesError ? (
              <ErrorState
                title="Could not load recent matches"
                description="The match feed could not be fetched right now."
                action={<Button type="button" variant="outline" onClick={() => refetchMatches()}>Try again</Button>}
              />
            ) : recentMatches.length === 0 ? (
                <EmptyState
                  icon={Swords}
                  title="No matches logged yet"
                  description="Log the first match to start building stats."
                  action={
                  <Button asChild variant="link" size="sm" className="mt-1">
                    <Link to="/matches/new">Log the first match</Link>
                  </Button>
                  }
                />
            ) : (
              recentMatches.map((match) => (
                  <MatchCard key={match.id} match={match} currentUserId={user?.playerId ?? ""} />
                ))
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function QuickActions({ playerId }: { playerId?: string }) {
  const actions = [
    { to: "/matches/new", label: "Log match", icon: PlusCircle, primary: true },
    { to: "/matches", label: "Matches", icon: Swords },
    { to: "/leaderboard", label: "Leaderboard", icon: Trophy },
    { to: "/compare", label: "Compare", icon: Scale },
    { to: "/achievements", label: "Achievements", icon: Award },
    ...(playerId ? [{ to: `/players/${playerId}`, label: "My profile", icon: User }] : []),
  ];

  return (
    <Card>
      <CardContent className="p-3">
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
          {actions.map((action) => (
            <Link
              key={action.to}
              to={action.to}
              className={`flex min-h-16 items-center gap-3 rounded-lg border px-3 py-2 text-sm font-medium transition-colors ${
                action.primary
                  ? "border-accent bg-accent text-accent-foreground hover:bg-accent/90"
                  : "border-border bg-background hover:bg-muted"
              }`}
            >
              <span className={action.primary ? "rounded-md bg-accent-foreground/15 p-2" : "rounded-md bg-accent/15 p-2 text-accent"}>
                <action.icon className="h-4 w-4" />
              </span>
              <span className="min-w-0 truncate">{action.label}</span>
            </Link>
          ))}
        </div>
      </CardContent>
    </Card>
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
        {entry.rank}
      </span>
      <Avatar className="h-7 w-7">
        <AvatarFallback className="text-xs bg-secondary">{initials}</AvatarFallback>
      </Avatar>
      <div className="flex-1 min-w-0">
        <Link to={`/players/${entry.playerId}`} className="block truncate text-sm font-medium hover:underline">
          {entry.playerName}{isMe && " (you)"}
        </Link>
        <p className="text-xs text-muted-foreground">{entry.matchesPlayed} matches - {winRate}% win rate</p>
      </div>
      <Badge variant="outline" className="text-xs font-bold shrink-0">
        {entry.eloRating}
      </Badge>
    </div>
  );
}

function buildLeaguePulse(matches: Match[], leaderboard: LeaderboardEntry[], totalMatches: number) {
  const sortedAsc = [...matches].sort((a, b) => new Date(a.playedAt).getTime() - new Date(b.playedAt).getTime());
  const playerResults = new Map<string, { playerName: string; results: boolean[] }>();
  const activity = new Map<string, { playerName: string; value: number }>();
  const eloGains = new Map<string, { playerName: string; value: number }>();
  const locationCounts = new Map<string, { locationName: string; value: number }>();

  sortedAsc.forEach((match) => {
    const location = locationCounts.get(match.locationId) ?? { locationName: match.locationName, value: 0 };
    locationCounts.set(match.locationId, { ...location, value: location.value + 1 });

    match.players.forEach((player) => {
      const results = playerResults.get(player.playerId) ?? { playerName: player.playerName, results: [] };
      playerResults.set(player.playerId, {
        playerName: player.playerName,
        results: [...results.results, player.winner],
      });

      const currentActivity = activity.get(player.playerId) ?? { playerName: player.playerName, value: 0 };
      activity.set(player.playerId, { ...currentActivity, value: currentActivity.value + 1 });

      if (player.eloDelta > 0) {
        const currentGain = eloGains.get(player.playerId) ?? { playerName: player.playerName, value: 0 };
        eloGains.set(player.playerId, { ...currentGain, value: currentGain.value + player.eloDelta });
      }
    });
  });

  const streakRows = [...playerResults.entries()].map(([playerId, row]) => ({
    playerId,
    playerName: row.playerName,
    ...getCurrentStreak(row.results),
  }));

  const winStreak = streakRows
    .filter((row) => row.type === "win" && row.count > 0)
    .sort((a, b) => b.count - a.count || a.playerName.localeCompare(b.playerName))[0];

  const loseStreak = streakRows
    .filter((row) => row.type === "loss" && row.count > 0)
    .sort((a, b) => b.count - a.count || a.playerName.localeCompare(b.playerName))[0];

  const latestMatch = matches[0];
  const latestWinner = latestMatch?.players.find((player) => player.winner);

  return {
    totalMatches,
    topPlayer: leaderboard[0],
    winStreak,
    loseStreak,
    eloClimber: mapTopPlayerRow(eloGains),
    mostActive: mapTopPlayerRow(activity),
    topLocation: [...locationCounts.values()].sort((a, b) => b.value - a.value || a.locationName.localeCompare(b.locationName))[0],
    latestWinner: latestWinner
      ? {
          playerId: latestWinner.playerId,
          playerName: latestWinner.playerName,
          playedAt: latestMatch.playedAt,
        }
      : undefined,
  };
}

function getCurrentStreak(results: boolean[]) {
  if (!results.length) return { type: "none" as const, count: 0 };

  const latest = results[results.length - 1];
  let count = 0;
  for (let index = results.length - 1; index >= 0; index -= 1) {
    if (results[index] !== latest) break;
    count += 1;
  }

  return { type: latest ? "win" as const : "loss" as const, count };
}

function mapTopPlayerRow(rows: Map<string, { playerName: string; value: number }>) {
  const top = [...rows.entries()].sort((a, b) => b[1].value - a[1].value || a[1].playerName.localeCompare(b[1].playerName))[0];
  return top ? { playerId: top[0], playerName: top[1].playerName, value: top[1].value } : undefined;
}

function PulseCard({
  icon: Icon,
  title,
  value,
  subtitle,
  href,
  loading,
}: {
  icon: typeof Swords;
  title: string;
  value: string | number;
  subtitle: string;
  href?: string;
  loading: boolean;
}) {
  if (loading) return <Skeleton className="h-28 rounded-xl" />;

  const body = (
    <Card className={href ? "transition-colors hover:bg-muted/40" : undefined}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-sm text-muted-foreground">{title}</p>
            <p className="mt-1 truncate text-2xl font-semibold">{value}</p>
            <p className="mt-1 text-xs text-muted-foreground">{subtitle}</p>
          </div>
          <div className="rounded-md bg-accent/15 p-2 text-accent">
            <Icon className="h-4 w-4" />
          </div>
        </div>
      </CardContent>
    </Card>
  );

  return href ? <Link to={href}>{body}</Link> : body;
}

function LastMatchSummary({
  match,
  loading,
  error,
  onRetry,
  currentUserId,
}: {
  match?: Match;
  loading: boolean;
  error: boolean;
  onRetry: () => void;
  currentUserId: string;
}) {
  if (loading) return <Skeleton className="h-48 rounded-xl" />;

  if (error) {
    return (
      <ErrorState
        title="Could not load the last match"
        description="The dashboard summary could not be fetched right now."
        action={<Button type="button" variant="outline" onClick={onRetry}>Try again</Button>}
      />
    );
  }

  if (!match) {
    return (
      <EmptyState
        icon={Swords}
        title="No last match yet"
        description="Once a match is logged, the latest result will appear here."
        action={
          <Button asChild>
            <Link to="/matches/new">Log the first match</Link>
          </Button>
        }
      />
    );
  }

  const winner = match.players.find((player) => player.winner);
  const sortedPlayers = [...match.players].sort((a, b) => b.points - a.points || a.playerName.localeCompare(b.playerName));

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <CardTitle className="flex items-center gap-2 text-base">
            <CalendarDays className="h-4 w-4 text-accent" />
            Last match
          </CardTitle>
          <Button asChild variant="outline" size="sm">
            <Link to={`/matches/${match.id}`}>Open match</Link>
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-4 lg:grid-cols-[1fr_1.4fr]">
          <div className="rounded-lg border bg-background p-4">
            <p className="text-sm text-muted-foreground">Winner</p>
            {winner ? (
              <Link to={`/players/${winner.playerId}`} className="mt-1 flex items-center gap-2 text-xl font-semibold text-primary hover:underline">
                <Crown className="h-5 w-5 text-accent" />
                {winner.playerName}
              </Link>
            ) : (
              <p className="mt-1 text-xl font-semibold">No winner recorded</p>
            )}
            <div className="mt-4 grid gap-3 sm:grid-cols-3 lg:grid-cols-1 xl:grid-cols-3">
              <MiniFact label="Date" value={format(new Date(match.playedAt), "MMM d, yyyy")} />
              <MiniFact label="Location" value={match.locationName} />
              <MiniFact label="Winning points" value={winner ? `${winner.points} pts` : "-"} />
            </div>
          </div>

          <div className="rounded-lg border bg-background p-4">
            <p className="text-sm text-muted-foreground">Players</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {sortedPlayers.map((player) => (
                <LastMatchPlayerChip
                  key={player.id}
                  player={player}
                  isCurrentUser={player.playerId === currentUserId}
                />
              ))}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function MiniFact({ label, value }: { label: string; value: string | number }) {
  return (
    <div>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-1 truncate text-sm font-medium">{value}</p>
    </div>
  );
}

function LastMatchPlayerChip({
  player,
  isCurrentUser,
}: {
  player: Match["players"][number];
  isCurrentUser: boolean;
}) {
  const colorClass = CATAN_COLORS[player.color.toLowerCase()] ?? "bg-gray-400";

  return (
    <Link
      to={`/players/${player.playerId}`}
      className={`flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm transition-colors hover:bg-muted ${
        isCurrentUser ? "border-accent bg-accent/10 font-semibold" : "border-border bg-card"
      }`}
    >
      <span className={`h-2.5 w-2.5 shrink-0 rounded-full ${colorClass}`} />
      <span>{player.playerName}</span>
      <span className="text-muted-foreground">{player.points} pts</span>
      {player.winner && <Crown className="h-3.5 w-3.5 text-accent" />}
    </Link>
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
            {format(new Date(match.playedAt), "MMM d, yyyy")} - {match.locationName} -{" "}
            {match.expansionName}
          </p>
          {winner && (
            <Link to={`/matches/${match.id}`} className="text-sm font-medium flex items-center gap-1 mt-0.5 hover:underline">
              <Crown className="h-3.5 w-3.5 text-accent" />
              {winner.playerName} won with {winner.points} pts
            </Link>
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
      <Link to={`/players/${player.playerId}`} className="truncate max-w-[80px] hover:underline">
        {player.playerName}
      </Link>
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
