import { useEffect, useMemo, useState, type ReactNode } from "react";
import { Link } from "react-router-dom";
import { format } from "date-fns";
import { useQuery } from "@tanstack/react-query";
import { ArrowRightLeft, ChevronDown, Crown, Scale, Swords, Target, Trophy, Users } from "lucide-react";
import api from "@/lib/api";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState, ErrorState } from "@/components/common/AppState";
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

const PLAYER_A_KEY = "catan.compare.playerA";
const PLAYER_B_KEY = "catan.compare.playerB";
const MATCHUP_OPEN_KEY = "catan.compare.matchupOpen";
const METRICS_OPEN_KEY = "catan.compare.metricsOpen";
const H2H_OPEN_KEY = "catan.compare.headToHeadOpen";
const HISTORY_OPEN_KEY = "catan.compare.historyOpen";

export function PlayerComparePage() {
  const [playerAId, setPlayerAId] = useState(() => readStoredString(PLAYER_A_KEY));
  const [playerBId, setPlayerBId] = useState(() => readStoredString(PLAYER_B_KEY));
  const [matchupOpen, setMatchupOpen] = useState(() => readStoredBoolean(MATCHUP_OPEN_KEY, true));
  const [metricsOpen, setMetricsOpen] = useState(() => readStoredBoolean(METRICS_OPEN_KEY, true));
  const [h2hOpen, setH2hOpen] = useState(() => readStoredBoolean(H2H_OPEN_KEY, true));
  const [historyOpen, setHistoryOpen] = useState(() => readStoredBoolean(HISTORY_OPEN_KEY, true));

  const { data: players = [], isPending: loadingPlayers, isError: playersError, refetch: refetchPlayers } = useQuery({
    queryKey: ["players"],
    queryFn: () => api.get<Player[]>("/players").then((r) => r.data),
  });

  const { data: matchPage, isPending: loadingMatches, isError: matchesError, refetch: refetchMatches } = useQuery({
    queryKey: ["matches", "compare"],
    queryFn: () => api.get<PageResponse<Match>>("/matches?size=500&sort=playedAt,desc").then((r) => r.data),
  });

  const { data: playerAStats, isPending: loadingAStats, isError: playerAStatsError, refetch: refetchPlayerAStats } = useQuery({
    queryKey: ["players", playerAId, "stats"],
    queryFn: () => api.get<PlayerStats>(`/players/${playerAId}/stats`).then((r) => r.data),
    enabled: Boolean(playerAId),
  });

  const { data: playerBStats, isPending: loadingBStats, isError: playerBStatsError, refetch: refetchPlayerBStats } = useQuery({
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
  const comparisonError = matchesError || playerAStatsError || playerBStatsError;

  useEffect(() => {
    writeStoredString(PLAYER_A_KEY, playerAId);
  }, [playerAId]);

  useEffect(() => {
    writeStoredString(PLAYER_B_KEY, playerBId);
  }, [playerBId]);

  useEffect(() => {
    writeStoredBoolean(MATCHUP_OPEN_KEY, matchupOpen);
  }, [matchupOpen]);

  useEffect(() => {
    writeStoredBoolean(METRICS_OPEN_KEY, metricsOpen);
  }, [metricsOpen]);

  useEffect(() => {
    writeStoredBoolean(H2H_OPEN_KEY, h2hOpen);
  }, [h2hOpen]);

  useEffect(() => {
    writeStoredBoolean(HISTORY_OPEN_KEY, historyOpen);
  }, [historyOpen]);

  function updatePlayerA(value: string) {
    setPlayerAId(value);
    if (value === playerBId) setPlayerBId("");
  }

  function updatePlayerB(value: string) {
    setPlayerBId(value);
    if (value === playerAId) setPlayerAId("");
  }

  function swapPlayers() {
    setPlayerAId(playerBId);
    setPlayerBId(playerAId);
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-primary">Compare players</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Pick two players to compare ELO, wins, win rate, average points, and head-to-head results.
        </p>
      </div>

      <CollapsibleSection
        icon={Scale}
        title="Player matchup"
        open={matchupOpen}
        onToggle={() => setMatchupOpen((open) => !open)}
      >
        <div className="grid gap-3 md:grid-cols-[1fr_auto_1fr] md:items-end">
          <PlayerSelect
            label="Player one"
            value={playerAId}
            onValueChange={updatePlayerA}
            players={players}
            disabledPlayerId={playerBId}
            loading={loadingPlayers}
          />
          <Button
            type="button"
            variant="outline"
            className="h-10 w-full md:w-10 md:px-0"
            onClick={swapPlayers}
            disabled={!playerAId && !playerBId}
            title="Swap players"
          >
            <ArrowRightLeft className="h-4 w-4" />
            <span className="ml-2 md:sr-only">Swap</span>
          </Button>
          <PlayerSelect
            label="Player two"
            value={playerBId}
            onValueChange={updatePlayerB}
            players={players}
            disabledPlayerId={playerAId}
            loading={loadingPlayers}
          />
        </div>
      </CollapsibleSection>

      {!ready ? (
        playersError ? (
          <ErrorState
            title="Could not load players"
            description="The player picker could not be populated."
            action={<Button type="button" variant="outline" onClick={() => refetchPlayers()}>Try again</Button>}
          />
        ) : (
          <EmptyState
            icon={Scale}
            title="Choose two players"
            description="Pick two different players to compare ELO, wins, win rate, points, and shared matches."
          />
        )
      ) : loadingComparison ? (
        <div className="space-y-4">
          <Skeleton className="h-36 rounded-xl" />
          <Skeleton className="h-80 rounded-xl" />
        </div>
      ) : comparisonError ? (
        <ErrorState
          title="Could not load comparison"
          description="One or more comparison datasets could not be fetched."
          action={
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                refetchMatches();
                refetchPlayerAStats();
                refetchPlayerBStats();
              }}
            >
              Try again
            </Button>
          }
        />
      ) : (
        <>
          <CollapsibleSection
            icon={Trophy}
            title="Comparison"
            open={metricsOpen}
            onToggle={() => setMetricsOpen((open) => !open)}
          >
            <div className="grid grid-cols-2 gap-2 sm:gap-3 xl:grid-cols-4">
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
          </CollapsibleSection>

          <CollapsibleSection
            icon={Users}
            title="Head-to-head"
            open={h2hOpen}
            onToggle={() => setH2hOpen((open) => !open)}
          >
              <div className="grid grid-cols-2 gap-2 sm:gap-3 lg:grid-cols-4">
                <MiniMetric label="Shared matches" value={h2h.matches} />
                <MiniMetric label={`${selectedA?.name ?? "Player one"} wins`} value={h2h.playerAWins} />
                <MiniMetric label={`${selectedB?.name ?? "Player two"} wins`} value={h2h.playerBWins} />
                <MiniMetric label="No direct winner" value={h2h.neutralResults} />
              </div>

              <div className="mt-3 grid grid-cols-2 gap-2 sm:gap-3">
                <MiniMetric label={`${selectedA?.name ?? "Player one"} avg points`} value={average(h2h.playerAPoints, h2h.matches)} />
                <MiniMetric label={`${selectedB?.name ?? "Player two"} avg points`} value={average(h2h.playerBPoints, h2h.matches)} />
              </div>
          </CollapsibleSection>

          <CollapsibleSection
            icon={Swords}
            title="Shared matches"
            badge={`${h2h.recentMatches.length} loaded`}
            open={historyOpen}
            onToggle={() => setHistoryOpen((open) => !open)}
          >
              {h2h.recentMatches.length === 0 ? (
                <EmptyState
                  icon={Swords}
                  title="No shared matches yet"
                  description="These players have not appeared together in the loaded match history."
                  className="min-h-32"
                />
              ) : (
                <div className="space-y-3">
                  {h2h.recentMatches.slice(0, 8).map((match) => (
                    <CompareMatchRow key={match.id} match={match} playerAId={playerAId} playerBId={playerBId} />
                  ))}
                </div>
              )}
          </CollapsibleSection>
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
        <SelectTrigger className="h-11">
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
      <CardContent className="p-3 sm:p-4">
        <div className="mb-3 flex items-center justify-between gap-2">
          <p className="truncate text-xs text-muted-foreground sm:text-sm">{label}</p>
          <div className="shrink-0 rounded-md bg-accent/15 p-1.5 text-accent sm:p-2">
            <Icon className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-2 sm:gap-3">
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
      <p className="mt-1 truncate text-lg font-semibold sm:text-2xl" title={String(value)}>{value}</p>
    </div>
  );
}

function MiniMetric({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-lg border bg-background p-3">
      <p className="truncate text-xs text-muted-foreground" title={label}>{label}</p>
      <p className="mt-1 truncate text-lg font-semibold" title={String(value)}>{value}</p>
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
        <div className="min-w-0">
          <p className="truncate font-medium">{format(new Date(match.playedAt), "MMM d, yyyy")} - {match.locationName}</p>
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

function CollapsibleSection({
  icon: Icon,
  title,
  badge,
  open,
  onToggle,
  children,
}: {
  icon: typeof Trophy;
  title: string;
  badge?: string;
  open: boolean;
  onToggle: () => void;
  children: ReactNode;
}) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <button
          type="button"
          onClick={onToggle}
          className="flex min-h-10 w-full items-center justify-between gap-3 rounded-md text-left sm:pointer-events-none sm:min-h-0"
          aria-expanded={open}
        >
          <span className="flex min-w-0 items-center gap-2">
            <Icon className="h-4 w-4 shrink-0 text-accent" />
            <span className="truncate text-base font-semibold leading-none tracking-tight">{title}</span>
            {badge && (
              <Badge variant="secondary" className="shrink-0 text-xs">
                {badge}
              </Badge>
            )}
          </span>
          <ChevronDown
            className={`h-4 w-4 shrink-0 text-muted-foreground transition-transform sm:hidden ${
              open ? "rotate-180" : ""
            }`}
          />
        </button>
      </CardHeader>
      <CardContent className={`${open ? "block" : "hidden sm:block"} min-w-0 space-y-4 overflow-hidden`}>{children}</CardContent>
    </Card>
  );
}

function readStoredString(key: string) {
  if (typeof window === "undefined") return "";
  return window.localStorage.getItem(key) ?? "";
}

function writeStoredString(key: string, value: string) {
  if (typeof window === "undefined") return;
  if (value) {
    window.localStorage.setItem(key, value);
    return;
  }
  window.localStorage.removeItem(key);
}

function readStoredBoolean(key: string, fallback: boolean) {
  if (typeof window === "undefined") return fallback;
  const value = window.localStorage.getItem(key);
  if (value === "true") return true;
  if (value === "false") return false;
  return fallback;
}

function writeStoredBoolean(key: string, value: boolean) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(key, String(value));
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
