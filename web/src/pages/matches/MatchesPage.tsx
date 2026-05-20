import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { format } from "date-fns";
import { useMutation, useQuery } from "@tanstack/react-query";
import {
  BarChart3,
  CalendarDays,
  Clock3,
  Crown,
  Filter,
  MapPin,
  Pencil,
  PlusCircle,
  RotateCcw,
  Swords,
  Trash2,
  TrendingDown,
  TrendingUp,
  Users,
} from "lucide-react";
import { toast } from "sonner";
import api from "@/lib/api";
import { queryClient } from "@/lib/queryClient";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import type { Expansion, Location, Match, PageResponse, Player } from "@/types/api";

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

const DEFAULT_FILTERS = {
  search: "",
  expansionId: "all",
  playerId: "all",
  locationId: "all",
  playerCount: "all",
  dateFrom: "",
  dateTo: "",
};

const MATCH_PAGE_STEP = 25;
type MatchFilters = typeof DEFAULT_FILTERS;
type ChartRow = { label: string; value: number; display?: string; color?: string };

export function MatchesPage() {
  const { user, isAdmin } = useAuth();
  const [filters, setFilters] = useState<MatchFilters>({ ...DEFAULT_FILTERS });
  const [matchLimit, setMatchLimit] = useState(MATCH_PAGE_STEP);

  const { data: matchPage, isPending: loadingMatches } = useQuery({
    queryKey: ["matches", "history", matchLimit],
    queryFn: () =>
      api
        .get<PageResponse<Match>>(`/matches?size=${matchLimit}&sort=playedAt,desc`)
        .then((r) => r.data),
  });

  const { data: players = [] } = useQuery({
    queryKey: ["players"],
    queryFn: () => api.get<Player[]>("/players").then((r) => r.data),
  });

  const { data: locations = [] } = useQuery({
    queryKey: ["locations"],
    queryFn: () => api.get<Location[]>("/locations").then((r) => r.data),
  });

  const { data: expansions = [] } = useQuery({
    queryKey: ["expansions"],
    queryFn: () => api.get<Expansion[]>("/expansions").then((r) => r.data),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/matches/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["matches"] });
      queryClient.invalidateQueries({ queryKey: ["leaderboard"] });
      toast.success("Match deleted");
    },
    onError: (error: unknown) => {
      const msg = (error as { response?: { data?: { error?: string } } })?.response?.data?.error;
      toast.error(msg ?? "Could not delete match");
    },
  });

  const matches = matchPage?.content ?? [];
  const filteredMatches = useMemo(() => filterMatches(matches, filters), [matches, filters]);
  const summary = useMemo(() => buildSummary(filteredMatches), [filteredMatches]);
  const chartData = useMemo(() => buildChartData(filteredMatches), [filteredMatches]);
  const dateFilterInvalid = Boolean(filters.dateFrom && filters.dateTo && filters.dateFrom > filters.dateTo);
  const totalMatches = matchPage?.totalElements ?? matches.length;
  const hasMoreMatches = matches.length < totalMatches;

  function updateFilter<K extends keyof MatchFilters>(key: K, value: MatchFilters[K]) {
    setFilters((prev) => ({ ...prev, [key]: value }));
  }

  function handleDelete(match: Match) {
    if (!canManageMatch(match, user?.playerId, isAdmin)) {
      toast.error("Only the creator or an admin can delete this match");
      return;
    }

    const playedAt = format(new Date(match.playedAt), "MMM d, yyyy");
    if (confirm(`Delete the match from ${playedAt} at ${match.locationName}?`)) {
      deleteMutation.mutate(match.id);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-primary">Matches</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Browse match history, filter game nights, and compare player trends.
          </p>
        </div>
        <Button asChild>
          <Link to="/matches/new">
            <PlusCircle className="mr-2 h-4 w-4" />
            Log match
          </Link>
        </Button>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <CardTitle className="flex items-center gap-2 text-base">
              <Filter className="h-4 w-4 text-accent" />
              Filters
            </CardTitle>
            <Button variant="outline" size="sm" onClick={() => setFilters({ ...DEFAULT_FILTERS })}>
              <RotateCcw className="mr-1.5 h-4 w-4" />
              Reset filters
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-6">
            <div className="space-y-2 sm:col-span-2 xl:col-span-2">
              <Label>Search</Label>
              <Input
                value={filters.search}
                onChange={(event) => updateFilter("search", event.target.value)}
                placeholder="Player, location, expansion, notes"
              />
            </div>
            <FilterSelect
              label="Expansion"
              value={filters.expansionId}
              onValueChange={(value) => updateFilter("expansionId", value)}
              options={expansions.map((expansion) => ({ value: expansion.id, label: expansion.name }))}
              allLabel="All expansions"
            />
            <FilterSelect
              label="Player"
              value={filters.playerId}
              onValueChange={(value) => updateFilter("playerId", value)}
              options={players.map((player) => ({ value: player.id, label: player.name }))}
              allLabel="All players"
            />
            <FilterSelect
              label="Location"
              value={filters.locationId}
              onValueChange={(value) => updateFilter("locationId", value)}
              options={locations.map((location) => ({ value: location.id, label: location.name }))}
              allLabel="All locations"
            />
            <FilterSelect
              label="Player count"
              value={filters.playerCount}
              onValueChange={(value) => updateFilter("playerCount", value)}
              options={[2, 3, 4, 5, 6].map((count) => ({ value: String(count), label: `${count} players` }))}
              allLabel="All counts"
            />
            <div className="space-y-2 xl:col-start-5">
              <Label>From</Label>
              <Input
                type="date"
                value={filters.dateFrom}
                onChange={(event) => updateFilter("dateFrom", event.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>To</Label>
              <Input
                type="date"
                value={filters.dateTo}
                onChange={(event) => updateFilter("dateTo", event.target.value)}
              />
            </div>
          </div>
          {dateFilterInvalid && (
            <p className="text-sm text-destructive mt-3">The start date must be before the end date.</p>
          )}
        </CardContent>
      </Card>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <SummaryCard icon={Swords} title="Filtered matches" value={filteredMatches.length} subtitle={`${matches.length} of ${totalMatches} loaded`} />
        <SummaryCard icon={Crown} title="Top winner" value={summary.topWinner?.name ?? "-"} subtitle={summary.topWinner ? `${summary.topWinner.wins} wins` : "No wins yet"} />
        <SummaryCard icon={Clock3} title="Average duration" value={summary.averageDuration ? `${summary.averageDuration} min` : "-"} subtitle="Matches with a duration" />
        <SummaryCard icon={MapPin} title="Top location" value={summary.topLocation?.name ?? "-"} subtitle={summary.topLocation ? `${summary.topLocation.matches} matches` : "No matches yet"} />
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <BarChart3 className="h-4 w-4 text-accent" />
            Charts
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loadingMatches ? (
            <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
              {Array.from({ length: 6 }).map((_, index) => (
                <Skeleton key={index} className="h-64 rounded-lg" />
              ))}
            </div>
          ) : (
            <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
              <HorizontalBarChart title="Wins by player" rows={chartData.winsByPlayer} emptyText="No wins match these filters." />
              <HorizontalBarChart title="Win rate by player" rows={chartData.winRateByPlayer} suffix="%" emptyText="No player results match these filters." />
              <HorizontalBarChart title="Matches by location" rows={chartData.matchesByLocation} emptyText="No locations match these filters." />
              <HorizontalBarChart title="Average points" rows={chartData.averagePointsByPlayer} emptyText="No player scores yet." />
              <HorizontalBarChart title="Wins by color" rows={chartData.winsByColor} emptyText="No color wins match these filters." />
              <HorizontalBarChart title="Average duration" rows={chartData.averageDurationByExpansion} suffix=" min" emptyText="No timed matches match these filters." />
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <CalendarDays className="h-4 w-4 text-accent" />
            Match history
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {loadingMatches ? (
            Array.from({ length: 6 }).map((_, index) => (
              <Skeleton key={index} className="h-28 rounded-lg" />
            ))
          ) : filteredMatches.length === 0 ? (
            <>
              <div className="text-center py-12 text-muted-foreground">
                <Swords className="h-8 w-8 mx-auto mb-2 opacity-40" />
                <p className="text-sm">No loaded matches match these filters.</p>
              </div>
              {hasMoreMatches && (
                <Button
                  type="button"
                  variant="outline"
                  className="w-full"
                  onClick={() => setMatchLimit((current) => current + MATCH_PAGE_STEP)}
                >
                  Load more history
                </Button>
              )}
            </>
          ) : (
            <>
              {filteredMatches.map((match) => (
                <HistoryMatchCard
                  key={match.id}
                  match={match}
                  currentUserId={user?.playerId ?? ""}
                  canManage={canManageMatch(match, user?.playerId, isAdmin)}
                  onDelete={() => handleDelete(match)}
                  deleting={deleteMutation.isPending && deleteMutation.variables === match.id}
                />
              ))}
              {hasMoreMatches && (
                <Button
                  type="button"
                  variant="outline"
                  className="w-full"
                  onClick={() => setMatchLimit((current) => current + MATCH_PAGE_STEP)}
                >
                  Load more history
                </Button>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function filterMatches(matches: Match[], filters: MatchFilters) {
  return matches.filter((match) => {
    const search = filters.search.trim().toLowerCase();
    if (search) {
      const haystack = [
        match.locationName,
        match.expansionName,
        match.createdByName,
        match.notes ?? "",
        ...match.players.map((player) => player.playerName),
      ].join(" ").toLowerCase();
      if (!haystack.includes(search)) return false;
    }
    if (filters.expansionId !== "all" && match.expansionId !== filters.expansionId) return false;
    if (filters.locationId !== "all" && match.locationId !== filters.locationId) return false;
    if (filters.playerCount !== "all" && String(match.players.length) !== filters.playerCount) return false;
    if (filters.playerId !== "all" && !match.players.some((player) => player.playerId === filters.playerId)) return false;

    const playedDate = match.playedAt.slice(0, 10);
    if (filters.dateFrom && playedDate < filters.dateFrom) return false;
    if (filters.dateTo && playedDate > filters.dateTo) return false;
    return true;
  });
}

function buildSummary(matches: Match[]) {
  const winnerCounts = new Map<string, { name: string; wins: number }>();
  const locationCounts = new Map<string, { name: string; matches: number }>();
  let durationTotal = 0;
  let durationCount = 0;

  matches.forEach((match) => {
    const winner = match.players.find((player) => player.winner);
    if (winner) {
      const current = winnerCounts.get(winner.playerId) ?? { name: winner.playerName, wins: 0 };
      winnerCounts.set(winner.playerId, { ...current, wins: current.wins + 1 });
    }

    const currentLocation = locationCounts.get(match.locationId) ?? { name: match.locationName, matches: 0 };
    locationCounts.set(match.locationId, { ...currentLocation, matches: currentLocation.matches + 1 });

    if (match.durationMinutes && match.durationMinutes > 0) {
      durationTotal += match.durationMinutes;
      durationCount += 1;
    }
  });

  return {
    topWinner: [...winnerCounts.values()].sort((a, b) => b.wins - a.wins || a.name.localeCompare(b.name))[0],
    topLocation: [...locationCounts.values()].sort((a, b) => b.matches - a.matches || a.name.localeCompare(b.name))[0],
    averageDuration: durationCount ? Math.round(durationTotal / durationCount) : 0,
  };
}

function buildChartData(matches: Match[]) {
  const playerStats = new Map<string, { name: string; games: number; wins: number; points: number }>();
  const locationCounts = new Map<string, { label: string; value: number }>();
  const colorWins = new Map<string, { label: string; value: number; color: string }>();
  const expansionDurations = new Map<string, { label: string; total: number; count: number }>();

  matches.forEach((match) => {
    const location = locationCounts.get(match.locationId) ?? { label: match.locationName, value: 0 };
    locationCounts.set(match.locationId, { ...location, value: location.value + 1 });

    if (match.durationMinutes && match.durationMinutes > 0) {
      const expansion = expansionDurations.get(match.expansionId) ?? {
        label: match.expansionName,
        total: 0,
        count: 0,
      };
      expansionDurations.set(match.expansionId, {
        ...expansion,
        total: expansion.total + match.durationMinutes,
        count: expansion.count + 1,
      });
    }

    match.players.forEach((player) => {
      const current = playerStats.get(player.playerId) ?? {
        name: player.playerName,
        games: 0,
        wins: 0,
        points: 0,
      };
      playerStats.set(player.playerId, {
        ...current,
        games: current.games + 1,
        wins: current.wins + (player.winner ? 1 : 0),
        points: current.points + player.points,
      });

      if (player.winner) {
        const colorKey = player.color.toLowerCase();
        const color = colorWins.get(colorKey) ?? {
          label: formatColorName(player.color),
          value: 0,
          color: CATAN_COLOR_HEX[colorKey] ?? "#94a3b8",
        };
        colorWins.set(colorKey, { ...color, value: color.value + 1 });
      }
    });
  });

  const players = [...playerStats.values()];

  return {
    winsByPlayer: players
      .map((player) => ({ label: player.name, value: player.wins }))
      .filter((row) => row.value > 0)
      .sort(sortRows)
      .slice(0, 8),
    winRateByPlayer: players
      .filter((player) => player.games > 0)
      .map((player) => ({
        label: player.name,
        value: Math.round((player.wins / player.games) * 100),
        display: `${Math.round((player.wins / player.games) * 100)}% (${player.wins}/${player.games})`,
      }))
      .sort(sortRows)
      .slice(0, 8),
    matchesByLocation: [...locationCounts.values()].sort(sortRows).slice(0, 8),
    averagePointsByPlayer: players
      .filter((player) => player.games > 0)
      .map((player) => ({
        label: player.name,
        value: Number((player.points / player.games).toFixed(1)),
        display: (player.points / player.games).toFixed(1),
      }))
      .sort(sortRows)
      .slice(0, 8),
    winsByColor: [...colorWins.values()].sort(sortRows).slice(0, 8),
    averageDurationByExpansion: [...expansionDurations.values()]
      .map((expansion) => ({
        label: expansion.label,
        value: Math.round(expansion.total / expansion.count),
        display: `${Math.round(expansion.total / expansion.count)} min`,
      }))
      .sort(sortRows)
      .slice(0, 8),
  };
}

function sortRows(a: { label: string; value: number }, b: { label: string; value: number }) {
  return b.value - a.value || a.label.localeCompare(b.label);
}

function formatColorName(color: string) {
  const trimmed = color.trim();
  return trimmed ? trimmed.charAt(0).toUpperCase() + trimmed.slice(1).toLowerCase() : "Unknown";
}

function FilterSelect({
  label,
  value,
  onValueChange,
  options,
  allLabel,
}: {
  label: string;
  value: string;
  onValueChange: (value: string) => void;
  options: Array<{ value: string; label: string }>;
  allLabel: string;
}) {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <Select value={value} onValueChange={onValueChange}>
        <SelectTrigger>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">{allLabel}</SelectItem>
          {options.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

function HorizontalBarChart({
  title,
  rows,
  suffix = "",
  emptyText,
}: {
  title: string;
  rows: ChartRow[];
  suffix?: string;
  emptyText: string;
}) {
  const max = Math.max(...rows.map((row) => row.value), 1);

  return (
    <div className="rounded-lg border bg-background p-4">
      <div className="mb-4 flex items-center justify-between gap-3">
        <h3 className="text-sm font-semibold">{title}</h3>
        <Badge variant="secondary" className="text-xs">{rows.length}</Badge>
      </div>

      {rows.length === 0 ? (
        <div className="flex min-h-40 items-center justify-center rounded-md bg-muted/50 px-4 text-center text-sm text-muted-foreground">
          {emptyText}
        </div>
      ) : (
        <div className="space-y-3">
          {rows.map((row) => (
            <div key={row.label} className="space-y-1">
              <div className="flex items-center justify-between gap-3 text-xs">
                <span className="truncate font-medium">{row.label}</span>
                <span className="shrink-0 text-muted-foreground">{row.display ?? `${row.value}${suffix}`}</span>
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
      )}
    </div>
  );
}

function SummaryCard({
  icon: Icon,
  title,
  value,
  subtitle,
}: {
  icon: typeof Swords;
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

function HistoryMatchCard({
  match,
  currentUserId,
  canManage,
  onDelete,
  deleting,
}: {
  match: Match;
  currentUserId: string;
  canManage: boolean;
  onDelete: () => void;
  deleting: boolean;
}) {
  const winner = match.players.find((player) => player.winner);
  const currentUserEntry = match.players.find((player) => player.playerId === currentUserId);

  return (
    <div className="rounded-lg border bg-card p-4 space-y-3">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <Link to={`/matches/${match.id}`} className="font-semibold hover:underline">
              {winner ? `${winner.playerName} won` : "No winner recorded"}
            </Link>
            {currentUserEntry && (
              <Badge variant={currentUserEntry.winner ? "default" : "secondary"} className="text-xs">
                {currentUserEntry.winner ? "You won" : "You played"}
              </Badge>
            )}
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            <Link to={`/matches/${match.id}`} className="hover:underline">
              {format(new Date(match.playedAt), "MMM d, yyyy h:mm a")} - {match.locationName} - {match.expansionName}
            </Link>
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            Logged by {match.createdByName}
            {match.durationMinutes ? ` - ${match.durationMinutes} min` : ""}
            {match.deckLayout ? ` - ${match.deckLayout} board` : ""}
          </p>
        </div>

        <div className="flex items-center gap-2">
          {winner && (
            <Badge variant="outline" className="shrink-0">
              {winner.points} pts
            </Badge>
          )}
          {canManage && (
            <>
              <Button type="button" variant="ghost" size="icon" className="h-8 w-8" asChild>
                <Link to={`/matches/${match.id}/edit`} aria-label="Edit match">
                  <Pencil className="h-4 w-4" />
                </Link>
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-destructive hover:text-destructive"
                onClick={onDelete}
                disabled={deleting}
                aria-label="Delete match"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </>
          )}
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {match.players.map((player) => (
          <PlayerChip key={player.id} player={player} isCurrentUser={player.playerId === currentUserId} />
        ))}
      </div>

      {match.notes && (
        <p className="rounded-md bg-muted px-3 py-2 text-sm text-muted-foreground">{match.notes}</p>
      )}
    </div>
  );
}

function canManageMatch(match: Match, currentUserId: string | undefined, isAdmin: boolean) {
  return isAdmin || match.createdById === currentUserId;
}

function PlayerChip({
  player,
  isCurrentUser,
}: {
  player: Match["players"][number];
  isCurrentUser: boolean;
}) {
  const colorClass = CATAN_COLORS[player.color.toLowerCase()] ?? "bg-gray-400";
  const delta = player.eloDelta;

  return (
    <div
      className={`flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs ${
        isCurrentUser ? "border-accent bg-accent/10 font-semibold" : "border-border bg-background"
      }`}
    >
      <span className={`h-2.5 w-2.5 rounded-full ${colorClass} shrink-0`} />
      <Link to={`/players/${player.playerId}`} className="hover:underline">
        {player.playerName}
      </Link>
      <span className="text-muted-foreground">{player.points}</span>
      {player.winner && <Crown className="h-3 w-3 text-accent" />}
      {player.longestRoad && <Badge variant="secondary" className="h-5 px-1.5 text-[10px]">Road</Badge>}
      {player.largestArmy && <Badge variant="secondary" className="h-5 px-1.5 text-[10px]">Army</Badge>}
      <span
        className={`flex items-center gap-0.5 ${
          delta > 0 ? "text-green-600" : delta < 0 ? "text-destructive" : "text-muted-foreground"
        }`}
      >
        {delta > 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
        {delta > 0 ? "+" : ""}
        {delta}
      </span>
    </div>
  );
}
