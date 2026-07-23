import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useQuery, useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { ChevronDown, Crown, Percent, PlusCircle, Pencil, Trash2, MapPin, Loader2, Search, Swords, Trophy, X } from "lucide-react";
import api from "@/lib/api";
import { queryClient } from "@/lib/queryClient";
import { useAuth } from "@/context/AuthContext";
import { EmptyState, ErrorState } from "@/components/common/AppState";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { Location, Match, PageResponse, Player } from "@/types/api";

const schema = z.object({
  ownerId: z.string().min(1, "Select an owner"),
  name: z.string().min(2, "Name must be at least 2 characters").max(100),
  address: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;
type LocationStats = {
  locationId: string;
  locationName: string;
  matches: number;
  topWinner?: { playerId: string; playerName: string; wins: number };
  bestWinRate?: { playerId: string; playerName: string; wins: number; matches: number; winRate: number };
};
type OwnerFilter = "all" | "mine";
type LocationSort = "matches" | "name";
type ActiveControlChip = { key: "search" | "owner" | "sort"; label: string; value: string };

const DEFAULT_OWNER_FILTER: OwnerFilter = "all";
const DEFAULT_LOCATION_SORT: LocationSort = "matches";
const CONTROLS_OPEN_KEY = "catan.locations.controlsOpen";
const STATS_OPEN_KEY = "catan.locations.statsOpen";
const LIST_OPEN_KEY = "catan.locations.listOpen";

export function LocationsPage() {
  const { user } = useAuth();
  const [editTarget, setEditTarget] = useState<Location | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [ownerFilter, setOwnerFilter] = useState<OwnerFilter>(DEFAULT_OWNER_FILTER);
  const [sortKey, setSortKey] = useState<LocationSort>(DEFAULT_LOCATION_SORT);
  const [controlsOpen, setControlsOpen] = useState(() => readStoredBoolean(CONTROLS_OPEN_KEY, false));
  const [statsOpen, setStatsOpen] = useState(() => readStoredBoolean(STATS_OPEN_KEY, false));
  const [listOpen, setListOpen] = useState(() => readStoredBoolean(LIST_OPEN_KEY, true));

  const { data: locations, isPending, isError: locationsError, refetch: refetchLocations } = useQuery({
    queryKey: ["locations"],
    queryFn: () => api.get<Location[]>("/locations").then((r) => r.data),
  });

  const { data: players = [] } = useQuery({
    queryKey: ["players"],
    queryFn: () => api.get<Player[]>("/players").then((r) => r.data),
  });

  const { data: matchPage, isPending: loadingMatches, isError: matchesError, refetch: refetchMatches } = useQuery({
    queryKey: ["matches", "location-stats"],
    queryFn: () => api.get<PageResponse<Match>>("/matches?size=500&sort=playedAt,desc").then((r) => r.data),
  });

  const locationStats = useMemo(
    () => buildLocationStats(locations ?? [], matchPage?.content ?? []),
    [locations, matchPage?.content]
  );
  const visibleLocations = useMemo(
    () => sortLocations(filterLocations(locations ?? [], search, ownerFilter, user?.playerId), sortKey, locationStats),
    [locations, search, ownerFilter, user?.playerId, sortKey, locationStats]
  );
  const visibleLocationIds = useMemo(() => new Set(visibleLocations.map((location) => location.id)), [visibleLocations]);
  const visibleLocationStats = useMemo(
    () => sortLocationStats(locationStats.filter((location) => visibleLocationIds.has(location.locationId)), sortKey),
    [locationStats, visibleLocationIds, sortKey]
  );
  const activeControlChips = useMemo(() => buildActiveControlChips(search, ownerFilter, sortKey), [search, ownerFilter, sortKey]);
  const activeControlCount = activeControlChips.length;
  const busiestLocation = locationStats[0];
  const bestWinRate = [...locationStats]
    .flatMap((location) => location.bestWinRate ? [{ ...location.bestWinRate, locationName: location.locationName }] : [])
    .sort((a, b) => b.winRate - a.winRate || b.wins - a.wins || a.playerName.localeCompare(b.playerName))[0];

  useEffect(() => {
    writeStoredBoolean(CONTROLS_OPEN_KEY, controlsOpen);
  }, [controlsOpen]);

  useEffect(() => {
    writeStoredBoolean(STATS_OPEN_KEY, statsOpen);
  }, [statsOpen]);

  useEffect(() => {
    writeStoredBoolean(LIST_OPEN_KEY, listOpen);
  }, [listOpen]);

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/locations/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["locations"] });
      toast.success("Location deleted");
    },
    onError: () => toast.error("Could not delete location"),
  });

  function handleEdit(location: Location) {
    setEditTarget(location);
  }

  function handleDeleteConfirm(location: Location) {
    if (confirm(`Delete "${location.name}"?`)) {
      deleteMutation.mutate(location.id);
    }
  }

  function resetControls() {
    setSearch("");
    setOwnerFilter(DEFAULT_OWNER_FILTER);
    setSortKey(DEFAULT_LOCATION_SORT);
  }

  function clearControl(key: ActiveControlChip["key"]) {
    if (key === "search") setSearch("");
    if (key === "owner") setOwnerFilter(DEFAULT_OWNER_FILTER);
    if (key === "sort") setSortKey(DEFAULT_LOCATION_SORT);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-primary">Locations</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Manage the places where matches are played.
          </p>
        </div>
        <Button onClick={() => setCreateOpen(true)}>
          <PlusCircle className="mr-2 h-4 w-4" />
          Add location
        </Button>
      </div>

      <div className="grid grid-cols-2 gap-2 sm:gap-3 xl:grid-cols-3">
        <SummaryCard
          icon={Swords}
          title="Tracked games"
          value={locationStats.reduce((total, location) => total + location.matches, 0)}
          subtitle={`${locationStats.filter((location) => location.matches > 0).length} active locations`}
          loading={loadingMatches || isPending}
        />
        <SummaryCard
          icon={MapPin}
          title="Most games"
          value={busiestLocation?.locationName ?? "-"}
          subtitle={busiestLocation ? `${busiestLocation.matches} matches` : "No matches yet"}
          loading={loadingMatches || isPending}
        />
        <SummaryCard
          icon={Percent}
          title="Best location rate"
          value={bestWinRate?.playerName ?? "-"}
          subtitle={bestWinRate ? `${Math.round(bestWinRate.winRate)}% at ${bestWinRate.locationName}` : "No wins yet"}
          loading={loadingMatches || isPending}
          className="col-span-2 xl:col-span-1"
        />
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
          <div className="grid gap-4 sm:grid-cols-[minmax(0,1fr)_11rem_11rem]">
            <div className="space-y-2">
              <Label>Search</Label>
              <Input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Find a location or owner"
              />
            </div>
            <div className="space-y-2">
              <Label>Owner</Label>
              <Select value={ownerFilter} onValueChange={(value) => setOwnerFilter(value as OwnerFilter)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All owners</SelectItem>
                  <SelectItem value="mine">My locations</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Sort</Label>
              <Select value={sortKey} onValueChange={(value) => setSortKey(value as LocationSort)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="matches">Most matches</SelectItem>
                  <SelectItem value="name">Name</SelectItem>
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
            onClick={() => setStatsOpen((open) => !open)}
            className="flex min-h-10 items-center justify-between gap-3 rounded-md text-left sm:pointer-events-none sm:min-h-0"
            aria-expanded={statsOpen}
          >
            <span className="flex items-center gap-2">
              <Trophy className="h-4 w-4 text-accent" />
              <span className="text-base font-semibold leading-none tracking-tight">Location stats</span>
              <Badge variant="secondary" className="shrink-0 text-xs">
                {visibleLocationStats.filter((location) => location.matches > 0).length} shown
              </Badge>
            </span>
            <ChevronDown
              className={`h-4 w-4 text-muted-foreground transition-transform sm:hidden ${
                statsOpen ? "rotate-180" : ""
              }`}
            />
          </button>
        </CardHeader>
        <CardContent className={statsOpen ? "block" : "hidden sm:block"}>
          {loadingMatches || isPending ? (
            <div className="grid gap-3 lg:grid-cols-2">
              {Array.from({ length: 4 }).map((_, index) => <Skeleton key={index} className="h-32 rounded-lg" />)}
            </div>
          ) : locationsError || matchesError ? (
            <ErrorState
              title="Could not load location stats"
              description="Location stats depend on locations and match history."
              action={
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    refetchLocations();
                    refetchMatches();
                  }}
                >
                  Try again
                </Button>
              }
            />
          ) : visibleLocationStats.every((location) => location.matches === 0) ? (
            <EmptyState
              icon={Trophy}
              title={activeControlCount > 0 ? "No matching location stats yet" : "No location stats yet"}
              description={activeControlCount > 0 ? "Try clearing a control to see more locations." : "Log matches with locations to fill this in."}
              className="min-h-32"
            />
          ) : (
            <div className="grid gap-3 lg:grid-cols-2">
              {visibleLocationStats
                .filter((location) => location.matches > 0)
                .map((stats) => (
                  <LocationStatsCard key={stats.locationId} stats={stats} />
                ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <button
            type="button"
            onClick={() => setListOpen((open) => !open)}
            className="flex min-h-10 items-center justify-between gap-3 rounded-md text-left sm:pointer-events-none sm:min-h-0"
            aria-expanded={listOpen}
          >
            <span className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-accent" />
              <span className="text-base font-semibold leading-none tracking-tight">Location list</span>
              <Badge variant="secondary" className="shrink-0 text-xs">
                {visibleLocations.length} shown
              </Badge>
            </span>
            <ChevronDown
              className={`h-4 w-4 text-muted-foreground transition-transform sm:hidden ${
                listOpen ? "rotate-180" : ""
              }`}
            />
          </button>
        </CardHeader>
        <CardContent className={listOpen ? "block" : "hidden sm:block"}>
          {isPending ? (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-24 rounded-lg" />
              ))}
            </div>
          ) : locationsError ? (
            <ErrorState
              title="Could not load locations"
              description="The location list could not be fetched from the server."
              action={<Button type="button" variant="outline" onClick={() => refetchLocations()}>Try again</Button>}
            />
          ) : locations?.length === 0 ? (
            <EmptyLocations onCreate={() => setCreateOpen(true)} />
          ) : visibleLocations.length === 0 ? (
            <div className="space-y-3">
              <EmptyState
                icon={MapPin}
                title="No locations match these controls"
                description="Try another search or owner filter."
              />
              <Button type="button" variant="outline" className="w-full" onClick={resetControls}>
                Clear controls
              </Button>
            </div>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {visibleLocations.map((location) => {
                const isOwner = location.ownerId === user?.playerId;
                const stats = locationStats.find((row) => row.locationId === location.id);
                return (
                  <LocationCard
                    key={location.id}
                    location={location}
                    stats={stats}
                    isOwner={isOwner}
                    onEdit={() => handleEdit(location)}
                    onDelete={() => handleDeleteConfirm(location)}
                    deleting={deleteMutation.isPending}
                  />
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      <LocationDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        title="Add location"
        players={players}
        defaultOwnerId={user?.playerId ?? ""}
        onSaved={() => setCreateOpen(false)}
      />

      <LocationDialog
        open={!!editTarget}
        onOpenChange={(open) => { if (!open) setEditTarget(null); }}
        title="Edit location"
        location={editTarget ?? undefined}
        players={players}
        defaultOwnerId={user?.playerId ?? ""}
        onSaved={() => setEditTarget(null)}
      />
    </div>
  );
}

function SummaryCard({
  icon: Icon,
  title,
  value,
  subtitle,
  loading,
  className,
}: {
  icon: typeof Swords;
  title: string;
  value: string | number;
  subtitle: string;
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
            <p className="mt-1 truncate text-lg font-semibold sm:text-2xl" title={String(value)}>{value}</p>
            <p className="mt-0.5 truncate text-[11px] leading-tight text-muted-foreground sm:mt-1 sm:text-xs">{subtitle}</p>
          </div>
          <div className="shrink-0 rounded-md bg-accent/15 p-1.5 text-accent sm:p-2">
            <Icon className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function EmptyLocations({ onCreate }: { onCreate: () => void }) {
  return (
    <EmptyState
      icon={MapPin}
      title="No locations yet"
      description="Add a place before logging matches there."
      action={
        <Button onClick={onCreate}>
          <PlusCircle className="mr-2 h-4 w-4" />
          Add location
        </Button>
      }
    />
  );
}

function LocationCard({
  location,
  stats,
  isOwner,
  onEdit,
  onDelete,
  deleting,
}: {
  location: Location;
  stats?: LocationStats;
  isOwner: boolean;
  onEdit: () => void;
  onDelete: () => void;
  deleting: boolean;
}) {
  return (
    <Card className="group">
      <CardContent className="p-4 flex flex-col gap-3">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-accent shrink-0" />
              <p className="font-semibold truncate">{location.name}</p>
            </div>
            {location.address && (
              <p className="text-sm text-muted-foreground truncate pl-6">
                {location.address}
              </p>
            )}
          </div>
          {isOwner && (
            <div className="flex gap-1 shrink-0 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={onEdit}
                aria-label={`Edit ${location.name}`}
              >
                <Pencil className="h-3.5 w-3.5" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-destructive hover:text-destructive"
                onClick={onDelete}
                disabled={deleting}
                aria-label={`Delete ${location.name}`}
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </div>
          )}
        </div>
        <div className="grid grid-cols-2 gap-2 text-xs">
          <MiniStat label="Matches" value={stats?.matches ?? 0} />
          <MiniStat label="Top winner" value={stats?.topWinner?.playerName ?? "-"} />
        </div>
        <div className="flex items-center justify-between gap-2">
          <span className="truncate text-xs text-muted-foreground">
            Added by {location.ownerName}
          </span>
          {isOwner && (
            <Badge variant="outline" className="text-xs">
              yours
            </Badge>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function MiniStat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-md bg-muted/60 px-2 py-2">
      <p className="truncate font-semibold" title={String(value)}>{value}</p>
      <p className="mt-0.5 text-muted-foreground">{label}</p>
    </div>
  );
}

function LocationStatsCard({ stats }: { stats: LocationStats }) {
  return (
    <Card className="bg-background">
      <CardContent className="space-y-4 p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4 shrink-0 text-accent" />
              <h2 className="truncate font-semibold">{stats.locationName}</h2>
            </div>
            <p className="mt-1 text-sm text-muted-foreground">{stats.matches} matches played here</p>
          </div>
          <Badge variant="outline" className="shrink-0">{stats.matches}</Badge>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <div className="rounded-md border bg-card p-3">
            <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Crown className="h-3.5 w-3.5 text-accent" />
              Most common winner
            </p>
            {stats.topWinner ? (
              <p className="mt-1 text-sm font-semibold">
                {stats.topWinner.playerName}
                <span className="ml-1 font-normal text-muted-foreground">({stats.topWinner.wins} wins)</span>
              </p>
            ) : (
              <p className="mt-1 text-sm text-muted-foreground">No wins yet</p>
            )}
          </div>

          <div className="rounded-md border bg-card p-3">
            <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Percent className="h-3.5 w-3.5 text-accent" />
              Highest win rate
            </p>
            {stats.bestWinRate ? (
              <p className="mt-1 text-sm font-semibold">
                {stats.bestWinRate.playerName}
                <span className="ml-1 font-normal text-muted-foreground">
                  ({Math.round(stats.bestWinRate.winRate)}%, {stats.bestWinRate.wins}/{stats.bestWinRate.matches})
                </span>
              </p>
            ) : (
              <p className="mt-1 text-sm text-muted-foreground">No wins yet</p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function buildLocationStats(locations: Location[], matches: Match[]): LocationStats[] {
  const rows = new Map<string, {
    locationId: string;
    locationName: string;
    matches: number;
    playerRows: Map<string, { playerId: string; playerName: string; matches: number; wins: number }>;
  }>();

  locations.forEach((location) => {
    rows.set(location.id, {
      locationId: location.id,
      locationName: location.name,
      matches: 0,
      playerRows: new Map(),
    });
  });

  matches.forEach((match) => {
    const location = rows.get(match.locationId) ?? {
      locationId: match.locationId,
      locationName: match.locationName,
      matches: 0,
      playerRows: new Map<string, { playerId: string; playerName: string; matches: number; wins: number }>(),
    };

    location.matches += 1;
    match.players.forEach((player) => {
      const current = location.playerRows.get(player.playerId) ?? {
        playerId: player.playerId,
        playerName: player.playerName,
        matches: 0,
        wins: 0,
      };
      location.playerRows.set(player.playerId, {
        ...current,
        playerName: player.playerName,
        matches: current.matches + 1,
        wins: current.wins + (player.winner ? 1 : 0),
      });
    });

    rows.set(match.locationId, location);
  });

  return [...rows.values()]
    .map((location) => {
      const playerRows = [...location.playerRows.values()];
      const topWinner = playerRows
        .filter((player) => player.wins > 0)
        .sort((a, b) => b.wins - a.wins || a.playerName.localeCompare(b.playerName))[0];
      const bestWinRate = playerRows
        .filter((player) => player.wins > 0)
        .map((player) => ({ ...player, winRate: (player.wins / player.matches) * 100 }))
        .sort((a, b) => b.winRate - a.winRate || b.wins - a.wins || b.matches - a.matches || a.playerName.localeCompare(b.playerName))[0];

      return {
        locationId: location.locationId,
        locationName: location.locationName,
        matches: location.matches,
        topWinner,
        bestWinRate,
      };
    })
    .sort((a, b) => b.matches - a.matches || a.locationName.localeCompare(b.locationName));
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

function filterLocations(locations: Location[], search: string, ownerFilter: OwnerFilter, currentUserId?: string) {
  const normalizedSearch = search.trim().toLowerCase();
  return locations.filter((location) => {
    if (ownerFilter === "mine" && location.ownerId !== currentUserId) return false;
    if (!normalizedSearch) return true;
    return [location.name, location.address ?? "", location.ownerName]
      .join(" ")
      .toLowerCase()
      .includes(normalizedSearch);
  });
}

function sortLocations(locations: Location[], sortKey: LocationSort, stats: LocationStats[]) {
  const matchesByLocation = new Map(stats.map((location) => [location.locationId, location.matches]));
  return [...locations].sort((a, b) => {
    if (sortKey === "name") return a.name.localeCompare(b.name);
    return (matchesByLocation.get(b.id) ?? 0) - (matchesByLocation.get(a.id) ?? 0) || a.name.localeCompare(b.name);
  });
}

function sortLocationStats(stats: LocationStats[], sortKey: LocationSort) {
  return [...stats].sort((a, b) => {
    if (sortKey === "name") return a.locationName.localeCompare(b.locationName);
    return b.matches - a.matches || a.locationName.localeCompare(b.locationName);
  });
}

function buildActiveControlChips(search: string, ownerFilter: OwnerFilter, sortKey: LocationSort): ActiveControlChip[] {
  const chips: ActiveControlChip[] = [];
  if (search.trim()) chips.push({ key: "search", label: "Search", value: search.trim() });
  if (ownerFilter !== DEFAULT_OWNER_FILTER) chips.push({ key: "owner", label: "Owner", value: "My locations" });
  if (sortKey !== DEFAULT_LOCATION_SORT) chips.push({ key: "sort", label: "Sort", value: "Name" });
  return chips;
}

function LocationDialog({
  open,
  onOpenChange,
  title,
  location,
  players,
  defaultOwnerId,
  onSaved,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  location?: Location;
  players: Player[];
  defaultOwnerId: string;
  onSaved: () => void;
}) {
  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    values: {
      ownerId: location?.ownerId ?? defaultOwnerId,
      name: location?.name ?? "",
      address: location?.address ?? "",
    },
  });

  const mutation = useMutation({
    mutationFn: (data: FormValues) =>
      location
        ? api.patch(`/locations/${location.id}`, data)
        : api.post("/locations", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["locations"] });
      toast.success(location ? "Location updated" : "Location added");
      form.reset();
      onSaved();
    },
    onError: () => toast.error("Could not save location"),
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit((v) => mutation.mutate(v))} className="space-y-4">
            <FormField
              control={form.control}
              name="ownerId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Owner</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a player" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {players.map((player) => (
                        <SelectItem key={player.id} value={player.id}>
                          {player.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. Pablo's place" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="address"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    Address{" "}
                    <span className="text-muted-foreground font-normal">(optional)</span>
                  </FormLabel>
                  <FormControl>
                    <Input placeholder="Street address" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={mutation.isPending}>
                {mutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {location ? "Save changes" : "Add location"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
