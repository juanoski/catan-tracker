import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { format } from "date-fns";
import { useQuery } from "@tanstack/react-query";
import { Crown, Scale, Swords, Target, Trophy, Users } from "lucide-react";
import api from "@/lib/api";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import type { Match, PageResponse, Player, PlayerStats } from "@/types/api";

type HeadToHeadRecord = {
  matches: number;
  playerAWins: number;
  playerBWins: number;
  neutralResults: number;
  playerAPoints: number;
  playerBPoints: number;
  recentMatches: Match[];
};

export function PlayerComparePage() {
  const [playerAId, setPlayerAId] = useState("");
  const [playerBId, setPlayerBId] = useState("");

  const { data: players = [], isPending: loadingPlayers } = useQuery({
    queryKey: ["players"],
    queryFn: () => api.get<Player[]>("/players").then((r) => r.data),
  });

  const { data: matchPage, isPending: loadingMatches } = useQuery({
    queryKey: ["matches", "compare"],
    queryFn: () => api.get<PageResponse<Match>>("/matches?size=500&sort=playedAt,desc").then((r) => r.data),
  });

  const { data: playerAStats, isPending: loadingAStats } = useQuery({
    queryKey: ["players", playerAId, "stats"],
    queryFn: () => api.get<PlayerStats>(`/players/${playerAId}/stats`).then((r) => r.data),
    enabled: Boolean(playerAId),
  });

  const { data: playerBStats, isPending: loadingBStats } = useQuery({
    queryKey: ["players", playerBId, "stats"],
    queryFn: () => api.get<PlayerStats>(`/players/${playerBId}/stats`).then((r) => r.data),
    enabled: Boolean(playerBId),
  });

  const selectedA = players.find((player) => player.id === playerAId);
  const selectedB = players.find((player) => player.id === playerBId);
  const matches = matchPage?.content ?? [];
  const h2h = useMemo(() => buildHeadToHead(matches, playerAId, playerBId), [matches, playerAId, playerBId]);
  const ready = Boolean(playerAId && playerBId && playerAId !== playerBId);
  const loadingComparison = loadingMatches || loadingAStats || loadingBStats;

  function updatePlayerA(value: string) {
    setPlayerAId(value);
    if (value === playerBId) setPlayerBId("");
  }

  function updatePlayerB(value: string) {
    setPlayerBId(value);
    if (value === playerAId) setPlayerAId("");
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-primary">Compare players</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Pick two players to compare ELO, wins, win rate, average points, and head-to-head results.
        </p>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Scale className="h-4 w-4 text-accent" />
            Player matchup
          </CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <PlayerSelect
            label="Player one"
            value={playerAId}
            onValueChange={updatePlayerA}
            players={players}
            disabledPlayerId={playerBId}
            loading={loadingPlayers}
          />
          <PlayerSelect
            label="Player two"
            value={playerBId}
            onValueChange={updatePlayerB}
            players={players}
            disabledPlayerId={playerAId}
            loading={loadingPlayers}
          />
        </CardContent>
      </Card>

      {!ready ? (
        <Card>
          <CardContent className="flex min-h-40 items-center justify-center px-4 text-center text-sm text-muted-foreground">
            Choose two different players to see the comparison.
          </CardContent>
        </Card>
      ) : loadingComparison ? (
        <div className="space-y-4">
          <Skeleton className="h-36 rounded-xl" />
          <Skeleton className="h-80 rounded-xl" />
        </div>
      ) : (
        <>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <MetricCompareCard
              icon={Trophy}
              label="Current ELO"
              left={playerAStats?.currentElo ?? selectedA?.eloRating ?? "-"}
              right={playerBStats?.currentElo ?? selectedB?.eloRating ?? "-"}
              leftPlayer={selectedA}
              rightPlayer={selectedB}
            />
            <MetricCompareCard
              icon={Crown}
              label="Wins"
              left={playerAStats?.totalWins ?? 0}
              right={playerBStats?.totalWins ?? 0}
              leftPlayer={selectedA}
              rightPlayer={selectedB}
            />
            <MetricCompareCard
              icon={Target}
              label="Win rate"
              left={formatWinRate(playerAStats?.winRate ?? 0)}
              right={formatWinRate(playerBStats?.winRate ?? 0)}
              leftPlayer={selectedA}
              rightPlayer={selectedB}
            />
            <MetricCompareCard
              icon={Swords}
              label="Avg points"
              left={(playerAStats?.avgPoints ?? 0).toFixed(1)}
              right={(playerBStats?.avgPoints ?? 0).toFixed(1)}
              leftPlayer={selectedA}
              rightPlayer={selectedB}
            />
          </div>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <Users className="h-4 w-4 text-accent" />
                Head-to-head
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-3 sm:grid-cols-4">
                <MiniMetric label="Shared matches" value={h2h.matches} />
                <MiniMetric label={`${selectedA?.name ?? "Player one"} wins`} value={h2h.playerAWins} />
                <MiniMetric label={`${selectedB?.name ?? "Player two"} wins`} value={h2h.playerBWins} />
                <MiniMetric label="No direct winner" value={h2h.neutralResults} />
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <MiniMetric label={`${selectedA?.name ?? "Player one"} avg points`} value={average(h2h.playerAPoints, h2h.matches)} />
                <MiniMetric label={`${selectedB?.name ?? "Player two"} avg points`} value={average(h2h.playerBPoints, h2h.matches)} />
              </div>

              {h2h.recentMatches.length === 0 ? (
                <div className="flex min-h-32 items-center justify-center rounded-lg bg-muted/50 px-4 text-center text-sm text-muted-foreground">
                  These players have not shared a loaded match yet.
                </div>
              ) : (
                <div className="space-y-3">
                  {h2h.recentMatches.slice(0, 8).map((match) => (
                    <CompareMatchRow key={match.id} match={match} playerAId={playerAId} playerBId={playerBId} />
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}

function PlayerSelect({
  label,
  value,
  onValueChange,
  players,
  disabledPlayerId,
  loading,
}: {
  label: string;
  value: string;
  onValueChange: (value: string) => void;
  players: Player[];
  disabledPlayerId: string;
  loading: boolean;
}) {
  if (loading) return <Skeleton className="h-16 rounded-lg" />;

  return (
    <div className="space-y-2">
      <p className="text-sm font-medium">{label}</p>
      <Select value={value} onValueChange={onValueChange}>
        <SelectTrigger>
          <SelectValue placeholder="Select player" />
        </SelectTrigger>
        <SelectContent>
          {players.map((player) => (
            <SelectItem key={player.id} value={player.id} disabled={player.id === disabledPlayerId}>
              {player.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

function MetricCompareCard({
  icon: Icon,
  label,
  left,
  right,
  leftPlayer,
  rightPlayer,
}: {
  icon: typeof Trophy;
  label: string;
  left: string | number;
  right: string | number;
  leftPlayer?: Player;
  rightPlayer?: Player;
}) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="mb-3 flex items-center justify-between gap-3">
          <p className="text-sm text-muted-foreground">{label}</p>
          <div className="rounded-md bg-accent/15 p-2 text-accent">
            <Icon className="h-4 w-4" />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <PlayerMetric player={leftPlayer} value={left} />
          <PlayerMetric player={rightPlayer} value={right} />
        </div>
      </CardContent>
    </Card>
  );
}

function PlayerMetric({ player, value }: { player?: Player; value: string | number }) {
  return (
    <div className="min-w-0">
      <p className="truncate text-xs text-muted-foreground">{player?.name ?? "-"}</p>
      <p className="mt-1 truncate text-2xl font-semibold">{value}</p>
    </div>
  );
}

function MiniMetric({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-lg border bg-background p-3">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-1 text-lg font-semibold">{value}</p>
    </div>
  );
}

function CompareMatchRow({ match, playerAId, playerBId }: { match: Match; playerAId: string; playerBId: string }) {
  const playerA = match.players.find((player) => player.playerId === playerAId);
  const playerB = match.players.find((player) => player.playerId === playerBId);
  const winner = match.players.find((player) => player.winner);

  return (
    <Link to={`/matches/${match.id}`} className="block rounded-lg border bg-background p-3 transition-colors hover:bg-muted/40">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="font-medium">{format(new Date(match.playedAt), "MMM d, yyyy")} - {match.locationName}</p>
          <p className="mt-1 text-sm text-muted-foreground">Winner: {winner?.playerName ?? "-"}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {playerA && <Badge variant={playerA.winner ? "default" : "outline"}>{playerA.playerName}: {playerA.points}</Badge>}
          {playerB && <Badge variant={playerB.winner ? "default" : "outline"}>{playerB.playerName}: {playerB.points}</Badge>}
        </div>
      </div>
    </Link>
  );
}

function buildHeadToHead(matches: Match[], playerAId: string, playerBId: string): HeadToHeadRecord {
  const shared = matches.filter((match) =>
    match.players.some((player) => player.playerId === playerAId) &&
    match.players.some((player) => player.playerId === playerBId)
  );

  return shared.reduce<HeadToHeadRecord>((record, match) => {
    const playerA = match.players.find((player) => player.playerId === playerAId);
    const playerB = match.players.find((player) => player.playerId === playerBId);
    if (!playerA || !playerB) return record;

    return {
      matches: record.matches + 1,
      playerAWins: record.playerAWins + (playerA.winner ? 1 : 0),
      playerBWins: record.playerBWins + (playerB.winner ? 1 : 0),
      neutralResults: record.neutralResults + (!playerA.winner && !playerB.winner ? 1 : 0),
      playerAPoints: record.playerAPoints + playerA.points,
      playerBPoints: record.playerBPoints + playerB.points,
      recentMatches: [...record.recentMatches, match],
    };
  }, {
    matches: 0,
    playerAWins: 0,
    playerBWins: 0,
    neutralResults: 0,
    playerAPoints: 0,
    playerBPoints: 0,
    recentMatches: [],
  });
}

function average(total: number, count: number) {
  return count ? (total / count).toFixed(1) : "-";
}

function formatWinRate(value: number) {
  return `${Math.round(value * 100)}%`;
}
