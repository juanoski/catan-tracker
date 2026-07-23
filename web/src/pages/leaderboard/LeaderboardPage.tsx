import { useEffect, useMemo, useState, type KeyboardEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ChevronDown, Medal, Search, Trophy, Users, X } from "lucide-react";
import api from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { LeaderboardEntry } from "@/types/api";

type SortKey = "elo" | "wins" | "matches" | "winRate" | "name";
type ActiveControlChip = { key: "search" | "sort"; label: string; value: string };

const DEFAULT_SORT: SortKey = "elo";
const CONTROLS_OPEN_KEY = "catan.leaderboard.controlsOpen";
const RANKINGS_OPEN_KEY = "catan.leaderboard.rankingsOpen";

export function LeaderboardPage() {
  const { user } = useAuth();
  const [search, setSearch] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>(DEFAULT_SORT);
  const [controlsOpen, setControlsOpen] = useState(() => readStoredBoolean(CONTROLS_OPEN_KEY, false));
  const [rankingsOpen, setRankingsOpen] = useState(() => readStoredBoolean(RANKINGS_OPEN_KEY, true));

  const { data: leaderboardData = [], isPending, isError } = useQuery({
    queryKey: ["leaderboard"],
    queryFn: () => api.get<LeaderboardEntry[]>("/leaderboard").then((r) => r.data),
  });
  const leaderboard = Array.isArray(leaderboardData) ? leaderboardData : [];
  const visibleLeaderboard = useMemo(
    () => sortLeaderboard(filterLeaderboard(leaderboard, search), sortKey),
    [leaderboard, search, sortKey]
  );
  const activeControlChips = useMemo(() => buildActiveControlChips(search, sortKey), [search, sortKey]);
  const activeControlCount = activeControlChips.length;

  useEffect(() => {
    writeStoredBoolean(CONTROLS_OPEN_KEY, controlsOpen);
  }, [controlsOpen]);

  useEffect(() => {
    writeStoredBoolean(RANKINGS_OPEN_KEY, rankingsOpen);
  }, [rankingsOpen]);

  function resetControls() {
    setSearch("");
    setSortKey(DEFAULT_SORT);
  }

  function clearControl(key: ActiveControlChip["key"]) {
    if (key === "search") setSearch("");
    if (key === "sort") setSortKey(DEFAULT_SORT);
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-primary">Leaderboard</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Compare ELO, match volume, wins, losses, and win rate.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-2 sm:gap-3 xl:grid-cols-3">
        <Summary title="Players" value={leaderboard.length} icon={Users} loading={isPending} />
        <Summary title="Top ELO" value={leaderboard[0]?.eloRating ?? "-"} icon={Trophy} loading={isPending} />
        <Summary title="Most wins" value={getMostWins(leaderboard)?.wins ?? "-"} icon={Medal} loading={isPending} className="col-span-2 xl:col-span-1" />
      </div>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <button
              type="button"
              onClick={() => setControlsOpen((open) => !open)}
              className="flex min-h-10 items-center justify-between gap-3 rounded-md text-left sm:pointer-events-none sm:min-h-0"
              aria-expanded={controlsOpen}
            >
              <span className="flex items-center gap-2">
                <Search className="h-4 w-4 text-accent" />
                <span className="text-base font-semibold leading-none tracking-tight">Controls</span>
                {activeControlCount > 0 && (
                  <Badge variant="secondary" className="text-xs">
                    {activeControlCount} active
                  </Badge>
                )}
              </span>
              <ChevronDown
                className={`h-4 w-4 text-muted-foreground transition-transform sm:hidden ${
                  controlsOpen ? "rotate-180" : ""
                }`}
              />
            </button>
            <Button variant="outline" size="sm" onClick={resetControls} disabled={activeControlCount === 0}>
              Reset controls
            </Button>
          </div>
        </CardHeader>
        {activeControlChips.length > 0 && (
          <div className="flex flex-wrap gap-2 px-6 pb-4">
            {activeControlChips.map((chip) => (
              <button
                key={chip.key}
                type="button"
                onClick={() => clearControl(chip.key)}
                className="inline-flex min-h-8 max-w-full items-center gap-1.5 rounded-full border bg-background px-3 py-1 text-xs font-medium text-muted-foreground hover:bg-muted hover:text-foreground"
                aria-label={`Clear ${chip.label}`}
              >
                <span className="truncate">
                  {chip.label}: {chip.value}
                </span>
                <X className="h-3 w-3 shrink-0" />
              </button>
            ))}
          </div>
        )}
        <CardContent className={controlsOpen ? "block" : "hidden sm:block"}>
          <div className="grid gap-4 sm:grid-cols-[minmax(0,1fr)_12rem]">
            <div className="space-y-2">
              <Label>Search</Label>
              <Input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Find a player"
              />
            </div>
            <div className="space-y-2">
              <Label>Sort</Label>
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
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <button
            type="button"
            onClick={() => setRankingsOpen((open) => !open)}
            className="flex min-h-10 items-center justify-between gap-3 rounded-md text-left sm:pointer-events-none sm:min-h-0"
            aria-expanded={rankingsOpen}
          >
            <span className="flex items-center gap-2">
              <Trophy className="h-4 w-4 text-accent" />
              <span className="text-base font-semibold leading-none tracking-tight">Rankings</span>
              <Badge variant="secondary" className="shrink-0 text-xs">
                {visibleLeaderboard.length} shown
              </Badge>
            </span>
            <ChevronDown
              className={`h-4 w-4 text-muted-foreground transition-transform sm:hidden ${
                rankingsOpen ? "rotate-180" : ""
              }`}
            />
          </button>
        </CardHeader>
        <CardContent className={`${rankingsOpen ? "block" : "hidden sm:block"} space-y-3`}>
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
          ) : visibleLeaderboard.length === 0 ? (
            <>
              <div className="py-12 text-center text-sm text-muted-foreground">No players match your search.</div>
              <Button type="button" variant="outline" className="w-full" onClick={resetControls}>
                Clear controls
              </Button>
            </>
          ) : (
            <>
              <div className="space-y-3 md:hidden">
                {visibleLeaderboard.map((entry, index) => (
                  <LeaderboardCard
                    key={entry.playerId}
                    entry={entry}
                    displayRank={sortKey === "elo" ? entry.rank : index + 1}
                    isMe={entry.playerId === user?.playerId}
                  />
                ))}
              </div>

              <div className="hidden overflow-x-auto md:block">
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
                  {visibleLeaderboard.map((entry, index) => {
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
            </>
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
  className,
}: {
  title: string;
  value: string | number;
  icon: typeof Trophy;
  loading: boolean;
  className?: string;
}) {
  if (loading) return <Skeleton className={`h-24 rounded-xl ${className ?? ""}`} />;

  return (
    <Card className={className}>
      <CardContent className="p-3 sm:p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-xs text-muted-foreground sm:text-sm">{title}</p>
            <p className="mt-1 truncate text-lg font-semibold sm:text-2xl" title={String(value)}>
              {value}
            </p>
          </div>
          <div className="shrink-0 rounded-md bg-accent/15 p-1.5 text-accent sm:p-2">
            <Icon className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function LeaderboardCard({
  entry,
  displayRank,
  isMe,
}: {
  entry: LeaderboardEntry;
  displayRank: number;
  isMe: boolean;
}) {
  const navigate = useNavigate();
  const losses = entry.matchesPlayed - entry.wins;
  const winRate = entry.matchesPlayed ? Math.round((entry.wins / entry.matchesPlayed) * 100) : 0;
  const detailPath = `/players/${entry.playerId}`;

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
      aria-label={`View ${entry.playerName} profile`}
      className={`rounded-lg border bg-card p-3 shadow-sm transition-colors hover:bg-muted/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ${
        isMe ? "border-accent bg-accent/10" : ""
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-accent/15 text-sm font-semibold text-accent">
            #{displayRank}
          </div>
          <Avatar className="h-10 w-10 shrink-0">
            <AvatarFallback className="text-xs bg-secondary">{getInitials(entry.playerName)}</AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <Link
              to={detailPath}
              onClick={(event) => event.stopPropagation()}
              className="block truncate font-semibold text-primary hover:underline"
            >
              {entry.playerName}
            </Link>
            <div className="mt-1 flex flex-wrap items-center gap-1.5">
              {isMe && <Badge variant="outline" className="text-xs">you</Badge>}
              <Badge variant="secondary" className="text-xs">{entry.matchesPlayed} matches</Badge>
            </div>
          </div>
        </div>
        <div className="shrink-0 text-right">
          <p className="text-lg font-semibold">{entry.eloRating}</p>
          <p className="text-xs text-muted-foreground">ELO</p>
        </div>
      </div>

      <div className="mt-3 grid grid-cols-3 gap-2 text-center text-xs">
        <MiniStat label="Wins" value={entry.wins} />
        <MiniStat label="Losses" value={losses} />
        <MiniStat label="Win rate" value={`${winRate}%`} />
      </div>
    </div>
  );
}

function MiniStat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-md bg-muted/60 px-2 py-2">
      <p className="font-semibold">{value}</p>
      <p className="mt-0.5 text-muted-foreground">{label}</p>
    </div>
  );
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

function filterLeaderboard(entries: LeaderboardEntry[], search: string) {
  const normalizedSearch = search.trim().toLowerCase();
  if (!normalizedSearch) return entries;
  return entries.filter((entry) => entry.playerName.toLowerCase().includes(normalizedSearch));
}

function buildActiveControlChips(search: string, sortKey: SortKey): ActiveControlChip[] {
  const chips: ActiveControlChip[] = [];
  if (search.trim()) chips.push({ key: "search", label: "Search", value: search.trim() });
  if (sortKey !== DEFAULT_SORT) chips.push({ key: "sort", label: "Sort", value: getSortLabel(sortKey) });
  return chips;
}

function getSortLabel(sortKey: SortKey) {
  if (sortKey === "wins") return "Wins";
  if (sortKey === "matches") return "Matches";
  if (sortKey === "winRate") return "Win rate";
  if (sortKey === "name") return "Name";
  return "ELO";
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
