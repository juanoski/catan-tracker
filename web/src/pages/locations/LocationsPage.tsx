import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useQuery, useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { Crown, Percent, PlusCircle, Pencil, Trash2, MapPin, Loader2, Swords, Trophy } from "lucide-react";
import api from "@/lib/api";
import { queryClient } from "@/lib/queryClient";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
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

export function LocationsPage() {
  const { user } = useAuth();
  const [editTarget, setEditTarget] = useState<Location | null>(null);
  const [createOpen, setCreateOpen] = useState(false);

  const { data: locations, isPending } = useQuery({
    queryKey: ["locations"],
    queryFn: () => api.get<Location[]>("/locations").then((r) => r.data),
  });

  const { data: players = [] } = useQuery({
    queryKey: ["players"],
    queryFn: () => api.get<Player[]>("/players").then((r) => r.data),
  });

  const { data: matchPage, isPending: loadingMatches } = useQuery({
    queryKey: ["matches", "location-stats"],
    queryFn: () => api.get<PageResponse<Match>>("/matches?size=500&sort=playedAt,desc").then((r) => r.data),
  });

  const locationStats = useMemo(
    () => buildLocationStats(locations ?? [], matchPage?.content ?? []),
    [locations, matchPage?.content]
  );
  const busiestLocation = locationStats[0];
  const bestWinRate = [...locationStats]
    .flatMap((location) => location.bestWinRate ? [{ ...location.bestWinRate, locationName: location.locationName }] : [])
    .sort((a, b) => b.winRate - a.winRate || b.wins - a.wins || a.playerName.localeCompare(b.playerName))[0];

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

      <div className="grid gap-3 sm:grid-cols-3">
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
        />
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Trophy className="h-4 w-4 text-accent" />
            Location stats
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loadingMatches || isPending ? (
            <div className="grid gap-3 lg:grid-cols-2">
              {Array.from({ length: 4 }).map((_, index) => <Skeleton key={index} className="h-32 rounded-lg" />)}
            </div>
          ) : locationStats.every((location) => location.matches === 0) ? (
            <div className="flex min-h-32 items-center justify-center rounded-lg bg-muted/50 px-4 text-center text-sm text-muted-foreground">
              No location stats yet. Log matches with locations to fill this in.
            </div>
          ) : (
            <div className="grid gap-3 lg:grid-cols-2">
              {locationStats
                .filter((location) => location.matches > 0)
                .map((stats) => (
                  <LocationStatsCard key={stats.locationId} stats={stats} />
                ))}
            </div>
          )}
        </CardContent>
      </Card>

      {isPending ? (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-24 rounded-lg" />
          ))}
        </div>
      ) : locations?.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <MapPin className="h-10 w-10 mx-auto mb-3 opacity-30" />
          <p className="font-medium">No locations yet</p>
          <p className="text-sm mt-1">Add a place before logging matches there.</p>
          <Button className="mt-4" onClick={() => setCreateOpen(true)}>
            <PlusCircle className="mr-2 h-4 w-4" />
            Add location
          </Button>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {locations?.map((location) => {
            const isOwner = location.ownerId === user?.playerId;
            return (
              <Card key={location.id} className="group">
                <CardContent className="p-4 flex flex-col gap-2">
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
                      <div className="flex gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7"
                          onClick={() => handleEdit(location)}
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-destructive hover:text-destructive"
                          onClick={() => handleDeleteConfirm(location)}
                          disabled={deleteMutation.isPending}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    )}
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">
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
          })}
        </div>
      )}

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
}: {
  icon: typeof Swords;
  title: string;
  value: string | number;
  subtitle: string;
  loading: boolean;
}) {
  if (loading) return <Skeleton className="h-24 rounded-xl" />;

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-sm text-muted-foreground">{title}</p>
            <p className="mt-1 truncate text-2xl font-semibold">{value}</p>
            <p className="mt-1 truncate text-xs text-muted-foreground">{subtitle}</p>
          </div>
          <div className="rounded-md bg-accent/15 p-2 text-accent">
            <Icon className="h-4 w-4" />
          </div>
        </div>
      </CardContent>
    </Card>
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
