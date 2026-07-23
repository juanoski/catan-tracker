import { Link } from "react-router-dom";
import { format } from "date-fns";
import { useQueries, useQuery } from "@tanstack/react-query";
import { Award, ChevronDown, Filter, Medal, Search, Trophy, Users } from "lucide-react";
import api from "@/lib/api";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState, ErrorState } from "@/components/common/AppState";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import type { Achievement, Player, PlayerAchievement } from "@/types/api";

type UnlockRow = PlayerAchievement & { playerId: string; playerName: string };
type UnlockStatus = "all" | "unlocked" | "locked";

const SUMMARY_OPEN_KEY = "catan.achievements.summaryOpen";
const LIST_OPEN_KEY = "catan.achievements.listOpen";
const CATEGORY_KEY = "catan.achievements.category";
const STATUS_KEY = "catan.achievements.status";

export function AchievementsPage() {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState(() => readStoredString(CATEGORY_KEY, "all"));
  const [status, setStatus] = useState<UnlockStatus>(() => readStoredStatus(STATUS_KEY));
  const [summaryOpen, setSummaryOpen] = useState(() => readStoredBoolean(SUMMARY_OPEN_KEY, true));
  const [listOpen, setListOpen] = useState(() => readStoredBoolean(LIST_OPEN_KEY, true));

  const { data: achievements = [], isPending: loadingAchievements, isError: achievementsError, refetch: refetchAchievements } = useQuery({
    queryKey: ["achievements"],
    queryFn: () => api.get<Achievement[]>("/achievements").then((r) => r.data),
  });

  const { data: players = [], isPending: loadingPlayers, isError: playersError, refetch: refetchPlayers } = useQuery({
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
  const unlocksError = unlockQueries.some((query) => query.isError);
  const unlocks = useMemo(() => {
    const rows: UnlockRow[] = [];
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

  const categories = useMemo(
    () => [...new Set(achievements.map((achievement) => achievement.category))].sort((a, b) => a.localeCompare(b)),
    [achievements]
  );

  const filteredAchievements = useMemo(() => {
    return achievements.filter((achievement) => {
      const unlockedBy = unlocksByAchievement.get(achievement.id) ?? [];
      const matchesSearch = `${achievement.name} ${achievement.description} ${achievement.category}`
        .toLowerCase()
        .includes(search.trim().toLowerCase());
      const matchesCategory = category === "all" || achievement.category === category;
      const matchesStatus =
        status === "all" ||
        (status === "unlocked" && unlockedBy.length > 0) ||
        (status === "locked" && unlockedBy.length === 0);
      return matchesSearch && matchesCategory && matchesStatus;
    });
  }, [achievements, category, search, status, unlocksByAchievement]);

  const totalUnlocks = unlocks.length;
  const unlockedAchievementCount = [...unlocksByAchievement.keys()].length;
  const topPlayer = getTopAchievementPlayer(unlocks);
  const hasActiveFilters = Boolean(search.trim()) || category !== "all" || status !== "all";

  useEffect(() => {
    writeStoredString(CATEGORY_KEY, category);
  }, [category]);

  useEffect(() => {
    writeStoredString(STATUS_KEY, status);
  }, [status]);

  useEffect(() => {
    writeStoredBoolean(SUMMARY_OPEN_KEY, summaryOpen);
  }, [summaryOpen]);

  useEffect(() => {
    writeStoredBoolean(LIST_OPEN_KEY, listOpen);
  }, [listOpen]);

  function clearFilters() {
    setSearch("");
    setCategory("all");
    setStatus("all");
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-primary">Achievements</h1>
        <p className="text-muted-foreground text-sm mt-1">
          See every achievement and who has unlocked it.
        </p>
      </div>

      <CollapsibleSection
        icon={Award}
        title="Summary"
        open={summaryOpen}
        onToggle={() => setSummaryOpen((open) => !open)}
      >
        <div className="grid grid-cols-2 gap-2 sm:gap-3 lg:grid-cols-3">
          <SummaryCard icon={Award} title="Achievements" value={achievements.length} loading={loadingAchievements} />
          <SummaryCard icon={Trophy} title="Unlocked types" value={unlockedAchievementCount} loading={loadingAchievements || loadingUnlocks} />
          <SummaryCard icon={Medal} title="Top collector" value={topPlayer?.playerName ?? "-"} loading={loadingPlayers || loadingUnlocks} wide />
        </div>
      </CollapsibleSection>

      <CollapsibleSection
        icon={Search}
        title="Achievement list"
        badge={`${filteredAchievements.length} shown`}
        open={listOpen}
        onToggle={() => setListOpen((open) => !open)}
      >
          <div className="space-y-3">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
              <Input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search achievements"
                className="h-11 sm:max-w-xs"
              />
              {hasActiveFilters && (
                <Button type="button" variant="outline" className="h-11 sm:w-auto" onClick={clearFilters}>
                  Clear
                </Button>
              )}
            </div>

            <div className="flex items-center gap-2 overflow-x-auto pb-1">
              <Filter className="h-4 w-4 shrink-0 text-muted-foreground" />
              {(["all", "unlocked", "locked"] as UnlockStatus[]).map((option) => (
                <Button
                  key={option}
                  type="button"
                  variant={status === option ? "default" : "outline"}
                  size="sm"
                  className="shrink-0 capitalize"
                  onClick={() => setStatus(option)}
                >
                  {option}
                </Button>
              ))}
            </div>

            <div className="flex gap-2 overflow-x-auto pb-1">
              <Button
                type="button"
                variant={category === "all" ? "default" : "outline"}
                size="sm"
                className="shrink-0"
                onClick={() => setCategory("all")}
              >
                All categories
              </Button>
              {categories.map((item) => (
                <Button
                  key={item}
                  type="button"
                  variant={category === item ? "default" : "outline"}
                  size="sm"
                  className="shrink-0"
                  onClick={() => setCategory(item)}
                >
                  {item}
                </Button>
              ))}
            </div>
          </div>

          {loadingAchievements ? (
            <div className="grid gap-4 lg:grid-cols-2">
              {Array.from({ length: 6 }).map((_, index) => <Skeleton key={index} className="h-36 rounded-lg" />)}
            </div>
          ) : achievementsError || playersError || unlocksError ? (
            <ErrorState
              title="Could not load achievements"
              description="Achievement data or unlock progress could not be fetched right now."
              action={
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    refetchAchievements();
                    refetchPlayers();
                    unlockQueries.forEach((query) => query.refetch());
                  }}
                >
                  Try again
                </Button>
              }
            />
          ) : filteredAchievements.length === 0 ? (
            <EmptyState
              icon={Award}
              title={achievements.length === 0 ? "No achievements configured" : "No achievements match your filters"}
              description={
                achievements.length === 0
                  ? "Achievements will appear here once they exist in the system."
                  : "Try another search, category, or unlock status."
              }
            />
          ) : (
            <div className="grid gap-4 lg:grid-cols-2">
              {filteredAchievements.map((achievement) => {
                const unlockedBy = unlocksByAchievement.get(achievement.id) ?? [];
                return (
                  <AchievementCard
                    key={achievement.id}
                    achievement={achievement}
                    playersCount={players.length}
                    unlockedBy={unlockedBy}
                  />
                );
              })}
            </div>
          )}
          {!loadingUnlocks && totalUnlocks === 0 && achievements.length > 0 && (
            <EmptyState
              icon={Trophy}
              title="No achievements unlocked yet"
              description="They will appear here after matches are logged."
              className="mt-4 min-h-32"
            />
          )}
      </CollapsibleSection>
    </div>
  );
}

function SummaryCard({
  icon: Icon,
  title,
  value,
  loading,
  wide,
}: {
  icon: typeof Award;
  title: string;
  value: string | number;
  loading: boolean;
  wide?: boolean;
}) {
  if (loading) return <Skeleton className="h-24 rounded-xl" />;

  return (
    <Card className={wide ? "col-span-2 lg:col-span-1" : ""}>
      <CardContent className="p-3 sm:p-4">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="truncate text-xs text-muted-foreground sm:text-sm">{title}</p>
            <p className="mt-1 truncate text-lg font-semibold sm:text-2xl" title={String(value)}>{value}</p>
          </div>
          <div className="shrink-0 rounded-md bg-accent/15 p-1.5 text-accent sm:p-2">
            <Icon className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function AchievementCard({
  achievement,
  playersCount,
  unlockedBy,
}: {
  achievement: Achievement;
  playersCount: number;
  unlockedBy: UnlockRow[];
}) {
  const sortedUnlocks = [...unlockedBy].sort(
    (a, b) => new Date(a.unlockedAt).getTime() - new Date(b.unlockedAt).getTime()
  );

  return (
    <Card className="bg-background">
      <CardContent className="space-y-4 p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="font-semibold leading-snug">{achievement.name}</h2>
              <Badge variant="outline">{achievement.category}</Badge>
            </div>
            <p className="mt-1 text-sm text-muted-foreground">{achievement.description}</p>
          </div>
          <Badge variant={unlockedBy.length ? "default" : "secondary"} className="shrink-0">
            {unlockedBy.length}/{playersCount}
          </Badge>
        </div>

        {unlockedBy.length === 0 ? (
          <div className="rounded-md bg-muted/60 px-3 py-2 text-sm text-muted-foreground">
            No one has unlocked this yet.
          </div>
        ) : (
          <div className="flex flex-wrap gap-2">
            {sortedUnlocks.map((unlock) => (
              <Link
                key={unlock.id}
                to={`/players/${unlock.playerId}`}
                className="min-h-8 rounded-full border bg-card px-3 py-1.5 text-sm hover:bg-muted"
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
}

function CollapsibleSection({
  icon: Icon,
  title,
  badge,
  open,
  onToggle,
  children,
}: {
  icon: typeof Award;
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

function readStoredString(key: string, fallback = "") {
  if (typeof window === "undefined") return fallback;
  return window.localStorage.getItem(key) ?? fallback;
}

function writeStoredString(key: string, value: string) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(key, value);
}

function readStoredStatus(key: string): UnlockStatus {
  const value = readStoredString(key, "all");
  return value === "unlocked" || value === "locked" ? value : "all";
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

function getTopAchievementPlayer(unlocks: UnlockRow[]) {
  const counts = new Map<string, { playerName: string; count: number }>();
  unlocks.forEach((unlock) => {
    const current = counts.get(unlock.playerId) ?? { playerName: unlock.playerName, count: 0 };
    counts.set(unlock.playerId, { ...current, count: current.count + 1 });
  });
  const top = [...counts.values()].sort((a, b) => b.count - a.count || a.playerName.localeCompare(b.playerName))[0];
  return top;
}
