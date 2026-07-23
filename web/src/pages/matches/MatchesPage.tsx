import { useEffect, useMemo, useState, type KeyboardEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { format } from "date-fns";
import { useMutation, useQuery } from "@tanstack/react-query";
import {
  BarChart3,
  CalendarDays,
  ChevronDown,
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
  X,
} from "lucide-react";
import { toast } from "sonner";
import api from "@/lib/api";
import { queryClient } from "@/lib/queryClient";
import { useAuth } from "@/context/AuthContext";
import { EmptyState, ErrorState } from "@/components/common/AppState";
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
const FILTERS_OPEN_KEY = "catan.matches.filtersOpen";
const CHARTS_OPEN_KEY = "catan.matches.chartsOpen";
const HISTORY_OPEN_KEY = "catan.matches.historyOpen";
type MatchFilters = typeof DEFAULT_FILTERS;
type ChartRow = { label: string; value: number; display?: string; color?: string };
type ActiveFilterChip = { key: keyof MatchFilters; label: string; value: string };

export function MatchesPage() {
  const { user, isAdmin } = useAuth();
  const [filters, setFilters] = useState<MatchFilters>({ ...DEFAULT_FILTERS });
  const [matchLimit, setMatchLimit] = useState(MATCH_PAGE_STEP);
  const [filtersOpen, setFiltersOpen] = useState(() => readStoredBoolean(FILTERS_OPEN_KEY, false));
  const [chartsOpen, setChartsOpen] = useState(() => readStoredBoolean(CHARTS_OPEN_KEY, false));
  const [historyOpen, setHistoryOpen] = useState(() => readStoredBoolean(HISTORY_OPEN_KEY, true));

  const { data: matchPage, isPending: loadingMatches, isError: matchesError, refetch: refetchMatches } = useQuery({
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
  const activeFilterCount = countActiveFilters(filters);
  const remainingMatches = Math.max(totalMatches - matches.length, 0);
  const nextMatchLoadCount = Math.min(MATCH_PAGE_STEP, remainingMatches);
  const activeFilterChips = useMemo(
    () => buildActiveFilterChips(filters, players, locations, expansions),
    [filters, players, locations, expansions]
  );

  useEffect(() => {
    writeStoredBoolean(FILTERS_OPEN_KEY, filtersOpen);
  }, [filtersOpen]);

  useEffect(() => {
    writeStoredBoolean(CHARTS_OPEN_KEY, chartsOpen);
  }, [chartsOpen]);

  useEffect(() => {
    writeStoredBoolean(HISTORY_OPEN_KEY, historyOpen);
  }, [historyOpen]);

  function updateFilter<K extends keyof MatchFilters>(key: K, value: MatchFilters[K]) {
    setFilters((prev) => ({ ...prev, [key]: value }));
  }

  function clearFilter(key: keyof MatchFilters) {
    setFilters((prev) => ({ ...prev, [key]: DEFAULT_FILTERS[key] }));
  }

  function applyDateRange(dateFrom: string, dateTo: string) {
    setFilters((prev) => ({ ...prev, dateFrom, dateTo }));
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
            <button
              type="button"
              onClick={() => setFiltersOpen((open) => !open)}
              className="flex min-h-10 items-center justify-between gap-3 rounded-md text-left sm:pointer-events-none sm:min-h-0"
              aria-expanded={filtersOpen}
            >
              <span className="flex items-center gap-2">
                <Filter className="h-4 w-4 text-accent" />
                <span className="text-base font-semibold leading-none tracking-tight">Filters</span>
                {activeFilterCount > 0 && (
                  <Badge variant="secondary" className="text-xs">
                    {activeFilterCount} active
                  </Badge>
                )}
              </span>
              <ChevronDown
                className={`h-4 w-4 text-muted-foreground transition-transform sm:hidden ${
                  filtersOpen ? "rotate-180" : ""
                }`}
              />
            </button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setFilters({ ...DEFAULT_FILTERS })}
              disabled={activeFilterCount === 0}
            >
              <RotateCcw className="mr-1.5 h-4 w-4" />
              Reset filters
            </Button>
          </div>
        </CardHeader>
        {activeFilterChips.length > 0 && (
          <div className="flex flex-wrap gap-2 px-6 pb-4">
            {activeFilterChips.map((chip) => (
              <button
                key={chip.key}
                type="button"
                onClick={() => clearFilter(chip.key)}
                className="inline-flex min-h-8 max-w-full items-center gap-1.5 rounded-full border bg-background px-3 py-1 text-xs font-medium text-muted-foreground hover:bg-muted hover:text-foreground"
                aria-label={`Clear ${chip.label} filter`}
              >
                <span className="truncate">
                  {chip.label}: {chip.value}
                </span>
                <X className="h-3 w-3 shrink-0" />
              </button>
            ))}
          </div>
        )}
        <CardContent className={filtersOpen ? "block" : "hidden sm:block"}>
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
          <QuickDateFilters onRangeSelect={applyDateRange} />
          {dateFilterInvalid && (
            <p className="text-sm text-destructive mt-3">The start date must be before the end date.</p>
          )}
        </CardContent>
      </Card>

      <div className="grid grid-cols-2 gap-2 sm:gap-3 xl:grid-cols-4">
        <SummaryCard icon={Swords} title="Filtered matches" value={filteredMatches.length} subtitle={`${matches.length} of ${totalMatches} loaded`} />
        <SummaryCard icon={Crown} title="Top winner" value={summary.topWinner?.name ?? "-"} subtitle={summary.topWinner ? `${summary.topWinner.wins} wins` : "No wins yet"} />
        <SummaryCard icon={Clock3} title="Average duration" value={summary.averageDuration ? `${summary.averageDuration} min` : "-"} subtitle="Matches with a duration" />
        <SummaryCard icon={MapPin} title="Top location" value={summary.topLocation?.name ?? "-"} subtitle={summary.topLocation ? `${summary.topLocation.matches} matches` : "No matches yet"} />
      </div>

      <Card>
        <CardHeader className="pb-3">
          <button
            type="button"
            onClick={() => setChartsOpen((open) => !open)}
            className="flex min-h-10 items-center justify-between gap-3 rounded-md text-left sm:pointer-events-none sm:min-h-0"
            aria-expanded={chartsOpen}
          >
            <span className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-accent" />
              <span className="text-base font-semibold leading-none tracking-tight">Charts</span>
            </span>
            <ChevronDown
              className={`h-4 w-4 text-muted-foreground transition-transform sm:hidden ${
                chartsOpen ? "rotate-180" : ""
              }`}
            />
          </button>
        </CardHeader>
        <CardContent className={chartsOpen ? "block" : "hidden sm:block"}>
          {loadingMatches ? (
            <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
              {Array.from({ length: 6 }).map((_, index) => (
                <Skeleton key={index} className="h-64 rounded-lg" />
              ))}
            </div>
          ) : matchesError ? (
            <ErrorState
              title="Could not load charts"
              description="Charts depend on match history, which is unavailable right now."
              action={<Button type="button" variant="outline" onClick={() => refetchMatches()}>Try again</Button>}
            />
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
          <button
            type="button"
            onClick={() => setHistoryOpen((open) => !open)}
            className="flex min-h-10 items-center justify-between gap-3 rounded-md text-left sm:pointer-events-none sm:min-h-0"
            aria-expanded={historyOpen}
          >
            <span className="flex items-center gap-2">
              <CalendarDays className="h-4 w-4 text-accent" />
              <span className="text-base font-semibold leading-none tracking-tight">Match history</span>
              <Badge variant="secondary" className="shrink-0 text-xs">
                {filteredMatches.length} shown
              </Badge>
            </span>
            <ChevronDown
              className={`h-4 w-4 text-muted-foreground transition-transform sm:hidden ${
                historyOpen ? "rotate-180" : ""
              }`}
            />
          </button>
        </CardHeader>
        <CardContent className={`${historyOpen ? "block" : "hidden sm:block"} space-y-3`}>
          {loadingMatches ? (
            Array.from({ length: 6 }).map((_, index) => (
              <Skeleton key={index} className="h-28 rounded-lg" />
            ))
          ) : matchesError ? (
            <ErrorState
              title="Could not load match history"
              description="The match list could not be fetched from the server."
              action={<Button type="button" variant="outline" onClick={() => refetchMatches()}>Try again</Button>}
            />
          ) : filteredMatches.length === 0 ? (
            <>
              <EmptyState
                icon={Swords}
                title={activeFilterCount > 0 ? "No matches match these filters" : "No matches logged yet"}
                description={activeFilterCount > 0 ? "Try clearing a filter or loading more history." : "Log the first match to start the history."}
                action={
                  activeFilterCount === 0 ? (
                    <Button asChild>
                      <Link to="/matches/new">
                        <PlusCircle className="mr-2 h-4 w-4" />
                        Log match
                      </Link>
                    </Button>
                  ) : undefined
                }
              />
              {activeFilterCount > 0 && (
                <Button
                  type="button"
                  variant="outline"
                  className="w-full"
                  onClick={() => setFilters({ ...DEFAULT_FILTERS })}
                >
                  Clear filters
                </Button>
              )}
              {hasMoreMatches && (
                <LoadMoreButton
                  loadCount={nextMatchLoadCount}
                  remainingCount={remainingMatches}
                  onClick={() => setMatchLimit((current) => current + MATCH_PAGE_STEP)}
                />
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
                <LoadMoreButton
                  loadCount={nextMatchLoadCount}
                  remainingCount={remainingMatches}
                  onClick={() => setMatchLimit((current) => current + MATCH_PAGE_STEP)}
                />
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

function countActiveFilters(filters: MatchFilters) {
  return Object.entries(filters).filter(([key, value]) => value !== DEFAULT_FILTERS[key as keyof MatchFilters]).length;
}

function buildActiveFilterChips(
  filters: MatchFilters,
  players: Player[],
  locations: Location[],
  expansions: Expansion[]
): ActiveFilterChip[] {
  const chips: ActiveFilterChip[] = [];

  if (filters.search.trim()) {
    chips.push({ key: "search", label: "Search", value: filters.search.trim() });
  }
  if (filters.expansionId !== "all") {
    chips.push({
      key: "expansionId",
      label: "Expansion",
      value: expansions.find((expansion) => expansion.id === filters.expansionId)?.name ?? "Selected expansion",
    });
  }
  if (filters.playerId !== "all") {
    chips.push({
      key: "playerId",
      label: "Player",
      value: players.find((player) => player.id === filters.playerId)?.name ?? "Selected player",
    });
  }
  if (filters.locationId !== "all") {
    chips.push({
      key: "locationId",
      label: "Location",
      value: locations.find((location) => location.id === filters.locationId)?.name ?? "Selected location",
    });
  }
  if (filters.playerCount !== "all") {
    chips.push({ key: "playerCount", label: "Count", value: `${filters.playerCount} players` });
  }
  if (filters.dateFrom) {
    chips.push({ key: "dateFrom", label: "From", value: formatDateFilter(filters.dateFrom) });
  }
  if (filters.dateTo) {
    chips.push({ key: "dateTo", label: "To", value: formatDateFilter(filters.dateTo) });
  }

  return chips;
}

function formatDateFilter(value: string) {
  const date = new Date(`${value}T00:00:00`);
  return Number.isNaN(date.getTime()) ? value : format(date, "MMM d, yyyy");
}

function formatDateInput(date: Date) {
  return format(date, "yyyy-MM-dd");
}

function QuickDateFilters({
  onRangeSelect,
}: {
  onRangeSelect: (dateFrom: string, dateTo: string) => void;
}) {
  function applyLastDays(days: number) {
    const end = new Date();
    const start = new Date();
    start.setDate(end.getDate() - days + 1);
    onRangeSelect(formatDateInput(start), formatDateInput(end));
  }

  function applyThisYear() {
    const now = new Date();
    onRangeSelect(`${now.getFullYear()}-01-01`, formatDateInput(now));
  }

  return (
    <div className="mt-4 space-y-2">
      <Label>Quick dates</Label>
      <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap">
        <Button type="button" variant="outline" size="sm" onClick={() => applyLastDays(7)}>
          Last 7
        </Button>
        <Button type="button" variant="outline" size="sm" onClick={() => applyLastDays(30)}>
          Last 30
        </Button>
        <Button type="button" variant="outline" size="sm" onClick={applyThisYear}>
          This year
        </Button>
        <Button type="button" variant="ghost" size="sm" onClick={() => onRangeSelect("", "")}>
          All dates
        </Button>
      </div>
    </div>
  );
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
      <CardContent className="p-3 sm:p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-xs text-muted-foreground sm:text-sm">{title}</p>
            <p className="mt-1 truncate text-lg font-semibold sm:text-2xl" title={String(value)}>
              {value}
            </p>
            <p className="mt-0.5 text-[11px] leading-tight text-muted-foreground sm:mt-1 sm:text-xs">{subtitle}</p>
          </div>
          <div className="shrink-0 rounded-md bg-accent/15 p-1.5 text-accent sm:p-2">
            <Icon className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function LoadMoreButton({
  loadCount,
  remainingCount,
  onClick,
}: {
  loadCount: number;
  remainingCount: number;
  onClick: () => void;
}) {
  return (
    <Button type="button" variant="outline" className="w-full" onClick={onClick}>
      Load {loadCount} more
      <span className="ml-2 text-xs text-muted-foreground">({remainingCount} remaining)</span>
    </Button>
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
  const navigate = useNavigate();
  const winner = match.players.find((player) => player.winner);
  const currentUserEntry = match.players.find((player) => player.playerId === currentUserId);
  const sortedPlayers = [...match.players].sort(sortMatchPlayersByResult);
  const detailPath = `/matches/${match.id}`;

  function openDetail() {
    navigate(detailPath);
  }

  function handleKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      openDetail();
    }
  }

  return (
    <div
      role="link"
      tabIndex={0}
      onClick={openDetail}
      onKeyDown={handleKeyDown}
      aria-label={`View match ${winner ? `won by ${winner.playerName}` : "details"}`}
      className="rounded-lg border bg-card p-3 space-y-3 shadow-sm transition-colors hover:bg-muted/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 sm:p-4"
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <Link to={detailPath} className="text-base font-semibold hover:underline" onClick={(event) => event.stopPropagation()}>
              {winner ? `${winner.playerName} won` : "No winner recorded"}
            </Link>
            {winner && (
              <Badge variant="outline" className="shrink-0">
                {winner.points} pts
              </Badge>
            )}
            {currentUserEntry && (
              <Badge variant={currentUserEntry.winner ? "default" : "secondary"} className="text-xs">
                {currentUserEntry.winner ? "You won" : "You played"}
              </Badge>
            )}
          </div>
          <div className="mt-2 grid gap-1 text-xs text-muted-foreground sm:flex sm:flex-wrap sm:items-center sm:gap-x-3 sm:gap-y-1">
            <span className="inline-flex items-center gap-1">
              <CalendarDays className="h-3.5 w-3.5" />
              {format(new Date(match.playedAt), "MMM d, yyyy h:mm a")}
            </span>
            <span className="inline-flex min-w-0 items-center gap-1">
              <MapPin className="h-3.5 w-3.5 shrink-0" />
              <span className="truncate">{match.locationName}</span>
            </span>
            <span className="inline-flex items-center gap-1">
              <Users className="h-3.5 w-3.5" />
              {match.players.length} players
            </span>
            {match.durationMinutes && (
              <span className="inline-flex items-center gap-1">
                <Clock3 className="h-3.5 w-3.5" />
                {match.durationMinutes} min
              </span>
            )}
          </div>
          <div className="mt-2 flex flex-wrap items-center gap-1.5">
            <Badge variant="secondary" className="text-xs">{match.expansionName}</Badge>
            {match.deckLayout && <Badge variant="outline" className="text-xs">{match.deckLayout} board</Badge>}
            <span className="text-xs text-muted-foreground">Logged by {match.createdByName}</span>
          </div>
        </div>

        <div className="flex items-center gap-1 sm:shrink-0" onClick={(event) => event.stopPropagation()}>
          <Button type="button" variant="outline" size="sm" className="h-8 px-2" asChild>
            <Link to={detailPath}>View</Link>
          </Button>
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

      <div className="flex flex-wrap gap-2" onClick={(event) => event.stopPropagation()}>
        {sortedPlayers.map((player) => (
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

function sortMatchPlayersByResult(a: Match["players"][number], b: Match["players"][number]) {
  if (a.winner !== b.winner) return a.winner ? -1 : 1;
  return b.points - a.points || a.playerName.localeCompare(b.playerName);
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
      className={`flex max-w-full items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs ${
        isCurrentUser ? "border-accent bg-accent/10 font-semibold" : "border-border bg-background"
      }`}
    >
      <span className={`h-2.5 w-2.5 rounded-full ${colorClass} shrink-0`} />
      <Link to={`/players/${player.playerId}`} className="max-w-[8.5rem] truncate hover:underline sm:max-w-none">
        {player.playerName}
      </Link>
      <span className="font-semibold text-foreground">{player.points}</span>
      {player.winner && <Crown className="h-3 w-3 text-accent" />}
      {player.longestRoad && <Badge variant="secondary" className="h-5 px-1.5 text-[10px]">Road</Badge>}
      {player.largestArmy && <Badge variant="secondary" className="h-5 px-1.5 text-[10px]">Army</Badge>}
      <span
        className={`flex items-center gap-0.5 ${
          delta > 0 ? "text-green-600" : delta < 0 ? "text-destructive" : "text-muted-foreground"
        }`}
      >
        {delta > 0 ? <TrendingUp className="h-3 w-3" /> : delta < 0 ? <TrendingDown className="h-3 w-3" /> : null}
        {delta > 0 ? "+" : ""}
        {delta}
      </span>
    </div>
  );
}
