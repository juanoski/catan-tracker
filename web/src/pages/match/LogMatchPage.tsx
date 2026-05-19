import { useEffect } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useNavigate, useParams } from "react-router-dom";
import { useQuery, useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { Loader2, PlusCircle, Trash2, Crown } from "lucide-react";
import { format } from "date-fns";
import api from "@/lib/api";
import { queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import type { Expansion, Location, Player, Match, PageResponse } from "@/types/api";

const CATAN_COLORS = [
  { value: "red", label: "Red", hex: "#ef4444" },
  { value: "blue", label: "Blue", hex: "#3b82f6" },
  { value: "white", label: "White", hex: "#f3f4f6" },
  { value: "orange", label: "Orange", hex: "#f97316" },
  { value: "green", label: "Green", hex: "#16a34a" },
  { value: "brown", label: "Brown", hex: "#92400e" },
];
const CATAN_COLOR_VALUES = CATAN_COLORS.map((color) => color.value);
const MAX_MATCH_DURATION_MINUTES = 720;

const playerSchema = z.object({
  playerId: z.string().min(1, "Select a player"),
  color: z.string().min(1, "Select a color"),
  points: z.coerce.number().int("Points must be a whole number").min(0, "Points cannot be negative").max(20, "Points cannot be more than 20"),
  winner: z.boolean(),
  longestRoad: z.boolean(),
  largestArmy: z.boolean(),
});

const schema = z
  .object({
    locationId: z.string().min(1, "Select a location"),
    expansionId: z.string().min(1, "Select an expansion"),
    playedAt: z.string().min(1, "Select date and time"),
    durationMinutes: z.preprocess(
      (value) => value === "" || value === null ? undefined : value,
      z.coerce
        .number()
        .int("Duration must be a whole number")
        .min(1, "Duration must be at least 1 minute")
        .max(MAX_MATCH_DURATION_MINUTES, "Duration cannot be more than 12 hours")
        .optional()
    ),
    deckLayout: z.enum(["single", "double"]),
    notes: z.string().max(1000, "Notes must be 1000 characters or fewer").optional(),
    players: z.array(playerSchema).min(2, "Add at least 2 players").max(6, "A match can have up to 6 players"),
  })
  .superRefine((data, ctx) => {
    const playedAt = data.playedAt ? new Date(data.playedAt) : null;
    if (playedAt && playedAt.getTime() > Date.now() + 5 * 60 * 1000) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["playedAt"],
        message: "Match date cannot be in the future",
      });
    }

    if (data.deckLayout === "single" && data.players.length > 4) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["deckLayout"],
        message: "Single board matches can have up to 4 players",
      });
    }

    if (data.deckLayout === "double" && data.players.length < 5) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["deckLayout"],
        message: "Double board matches require at least 5 players",
      });
    }

    const playerIds = data.players.map((player) => player.playerId).filter(Boolean);
    if (playerIds.length !== new Set(playerIds).size) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["players"],
        message: "Each player can only appear once",
      });
    }

    const colors = data.players.map((player) => player.color).filter(Boolean);
    if (colors.some((color) => !CATAN_COLOR_VALUES.includes(color))) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["players"],
        message: "Choose a valid Catan color for every player",
      });
    }
    if (colors.length !== new Set(colors).size) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["players"],
        message: "Each player must use a different color",
      });
    }

    const winners = data.players.filter((player) => player.winner);
    if (winners.length !== 1) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["players"],
        message: "Mark exactly one winner",
      });
    } else {
      const highestPoints = Math.max(...data.players.map((player) => player.points));
      if (winners[0].points < highestPoints) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["players"],
          message: "The winner must have the highest point total",
        });
      }
    }

    if (data.players.filter((player) => player.longestRoad).length > 1) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["players"],
        message: "Only one player can have Longest Road",
      });
    }

    if (data.players.filter((player) => player.largestArmy).length > 1) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["players"],
        message: "Only one player can have Largest Army",
      });
    }

    if (data.players.some((player) => player.longestRoad && player.points < 2)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["players"],
        message: "Longest Road requires at least 2 points",
      });
    }

    if (data.players.some((player) => player.largestArmy && player.points < 2)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["players"],
        message: "Largest Army requires at least 2 points",
      });
    }
  });

type FormValues = z.infer<typeof schema>;

export function LogMatchPage() {
  const navigate = useNavigate();
  const { matchId } = useParams();
  const isEditing = Boolean(matchId);

  const { data: locations } = useQuery({
    queryKey: ["locations"],
    queryFn: () => api.get<Location[]>("/locations").then((r) => r.data),
  });

  const { data: expansions } = useQuery({
    queryKey: ["expansions"],
    queryFn: () => api.get<Expansion[]>("/expansions").then((r) => r.data),
  });

  const { data: players } = useQuery({
    queryKey: ["players"],
    queryFn: () => api.get<Player[]>("/players").then((r) => r.data),
  });

  const { data: recentMatchPage } = useQuery({
    queryKey: ["matches", "recent"],
    queryFn: () => api.get<PageResponse<Match>>("/matches?size=10&sort=playedAt,desc").then((r) => r.data),
  });

  const { data: editingMatch } = useQuery({
    queryKey: ["matches", matchId],
    queryFn: () => api.get<Match>(`/matches/${matchId}`).then((r) => r.data),
    enabled: isEditing,
  });

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      locationId: "",
      expansionId: "",
      playedAt: format(new Date(), "yyyy-MM-dd'T'HH:mm"),
      deckLayout: "single",
      notes: "",
      players: [
        { playerId: "", color: "red", points: 0, winner: false, longestRoad: false, largestArmy: false },
        { playerId: "", color: "blue", points: 0, winner: false, longestRoad: false, largestArmy: false },
      ],
    },
  });

  const { fields, append, remove } = useFieldArray({ control: form.control, name: "players" });

  useEffect(() => {
    if (!editingMatch) return;
    form.reset({
      locationId: editingMatch.locationId,
      expansionId: editingMatch.expansionId,
      playedAt: format(new Date(editingMatch.playedAt), "yyyy-MM-dd'T'HH:mm"),
      durationMinutes: editingMatch.durationMinutes ?? undefined,
      deckLayout: editingMatch.deckLayout === "double" ? "double" : "single",
      notes: editingMatch.notes ?? "",
      players: editingMatch.players.map((player) => ({
        playerId: player.playerId,
        color: player.color,
        points: player.points,
        winner: player.winner,
        longestRoad: player.longestRoad,
        largestArmy: player.largestArmy,
      })),
    });
  }, [editingMatch, form]);

  const mutation = useMutation({
    mutationFn: (data: FormValues) =>
      api[isEditing ? "patch" : "post"]<Match>(isEditing ? `/matches/${matchId}` : "/matches", {
        ...data,
        playedAt: new Date(data.playedAt).toISOString().replace("Z", ""),
        durationMinutes: data.durationMinutes || undefined,
        notes: data.notes || undefined,
      }).then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["matches"] });
      queryClient.invalidateQueries({ queryKey: ["leaderboard"] });
      toast.success(isEditing ? "Match updated. ELO recalculated." : "Match logged. ELO updated.");
      navigate(isEditing && matchId ? `/matches/${matchId}` : "/");
    },
    onError: (error: unknown) => {
      const msg = (error as { response?: { data?: { error?: string } } })?.response?.data?.error;
      toast.error(msg ?? (isEditing ? "Could not update match" : "Could not log match"));
    },
  });

  function setWinner(index: number) {
    fields.forEach((_, i) => form.setValue(`players.${i}.winner`, i === index));
  }

  function setExclusive(field: "longestRoad" | "largestArmy", index: number, value: boolean) {
    if (value) {
      fields.forEach((_, i) => form.setValue(`players.${i}.${field}`, i === index));
    } else {
      form.setValue(`players.${index}.${field}`, false);
    }
  }

  const watchedPlayers = form.watch("players");
  const selectedPlayerIds = watchedPlayers.map((player) => player.playerId).filter(Boolean);
  const recentPlayers = getRecentPlayers(recentMatchPage?.content ?? [], players ?? []);

  function addPlayer(playerId: string, preferredColor?: string) {
    if (selectedPlayerIds.includes(playerId)) {
      toast.error("That player is already in this match");
      return;
    }
    if (fields.length >= 6) {
      toast.error("A match can have up to 6 players");
      return;
    }

    const takenColors = watchedPlayers.map((player) => player.color);
    const color = preferredColor && !takenColors.includes(preferredColor)
      ? preferredColor
      : CATAN_COLORS.find((item) => !takenColors.includes(item.value))?.value ?? CATAN_COLORS[fields.length % CATAN_COLORS.length].value;

    append({
      playerId,
      color,
      points: 0,
      winner: false,
      longestRoad: false,
      largestArmy: false,
    });
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-primary">{isEditing ? "Edit match" : "Log match"}</h1>
        <p className="text-muted-foreground text-sm mt-1">
          {isEditing ? "Update the result and recalculate ELO." : "Record the result and update everyone's ELO."}
        </p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit((v) => mutation.mutate(v))} className="space-y-6">
          {/* Match Info */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Match info</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="locationId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Location</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Where was it played?" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {locations?.map((l) => (
                            <SelectItem key={l.id} value={l.id}>{l.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="expansionId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Expansion</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Which expansion?" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {expansions?.map((e) => (
                            <SelectItem key={e.id} value={e.id}>{e.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="playedAt"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Date & time</FormLabel>
                      <FormControl>
                        <Input type="datetime-local" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="durationMinutes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Duration <span className="text-muted-foreground font-normal">(minutes, optional)</span></FormLabel>
                      <FormControl>
                        <Input type="number" min={1} max={MAX_MATCH_DURATION_MINUTES} placeholder="e.g. 90" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="deckLayout"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Board layout</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="single">Single board (2-4 players)</SelectItem>
                          <SelectItem value="double">Double board (5-6 players)</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Notes <span className="text-muted-foreground font-normal">(optional)</span></FormLabel>
                    <FormControl>
                      <Textarea placeholder="Add a quick note about this game" rows={2} maxLength={1000} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          {/* Players */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">Players</CardTitle>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    append({
                      playerId: "",
                      color: CATAN_COLORS[fields.length % CATAN_COLORS.length].value,
                      points: 0,
                      winner: false,
                      longestRoad: false,
                      largestArmy: false,
                    })
                  }
                  disabled={fields.length >= 6}
                >
                  <PlusCircle className="mr-1.5 h-4 w-4" />
                  Add player
                </Button>
              </div>
              {form.formState.errors.players?.root && (
                <p className="text-sm text-destructive">{form.formState.errors.players.root.message}</p>
              )}
              {recentPlayers.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-2">
                  {recentPlayers.slice(0, 8).map((player) => (
                    <Button
                      key={player.playerId}
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => addPlayer(player.playerId, player.color)}
                      disabled={selectedPlayerIds.includes(player.playerId) || fields.length >= 6}
                    >
                      <PlusCircle className="mr-1.5 h-3.5 w-3.5" />
                      {player.playerName}
                    </Button>
                  ))}
                </div>
              )}
              {selectedPlayerIds.length !== new Set(selectedPlayerIds).size && (
                <p className="mt-2 text-sm text-destructive">Each player can only appear once.</p>
              )}
            </CardHeader>
            <CardContent className="space-y-3">
              {fields.map((field, index) => (
                <PlayerRow
                  key={field.id}
                  index={index}
                  form={form}
                  players={players ?? []}
                  onRemove={() => remove(index)}
                  canRemove={fields.length > 2}
                  isWinner={watchedPlayers[index]?.winner ?? false}
                  onSetWinner={() => setWinner(index)}
                  onSetExclusive={(f, v) => setExclusive(f, index, v)}
                  takenColors={watchedPlayers
                    .filter((_, i) => i !== index)
                    .map((p) => p.color)}
                  takenPlayers={watchedPlayers
                    .filter((_, i) => i !== index)
                    .map((p) => p.playerId)}
                />
              ))}
            </CardContent>
          </Card>

          <Button
            type="submit"
            className="w-full"
            size="lg"
            disabled={mutation.isPending}
          >
            {mutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isEditing ? "Save changes and recalculate ELO" : "Save match and update ELO"}
          </Button>
        </form>
      </Form>
    </div>
  );
}

function PlayerRow({
  index,
  form,
  players,
  onRemove,
  canRemove,
  isWinner,
  onSetWinner,
  onSetExclusive,
  takenColors,
  takenPlayers,
}: {
  index: number;
  form: ReturnType<typeof useForm<FormValues>>;
  players: Player[];
  onRemove: () => void;
  canRemove: boolean;
  isWinner: boolean;
  onSetWinner: () => void;
  onSetExclusive: (field: "longestRoad" | "largestArmy", value: boolean) => void;
  takenColors: string[];
  takenPlayers: string[];
}) {
  return (
    <div
      className={`rounded-lg border p-3 space-y-3 transition-colors ${
        isWinner ? "border-accent bg-accent/10" : "bg-background"
      }`}
    >
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-muted-foreground">Player {index + 1}</span>
        <div className="flex items-center gap-2">
          {isWinner && (
            <Badge variant="accent" className="text-xs gap-1">
              <Crown className="h-3 w-3" /> Winner
            </Badge>
          )}
          {canRemove && (
            <Button type="button" variant="ghost" size="icon" className="h-7 w-7" onClick={onRemove}>
              <Trash2 className="h-3.5 w-3.5 text-muted-foreground" />
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {/* Player select */}
        <FormField
          control={form.control}
          name={`players.${index}.playerId`}
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-xs">Player</FormLabel>
              <Select onValueChange={field.onChange} value={field.value}>
                <FormControl>
                  <SelectTrigger className="h-9 text-sm">
                    <SelectValue placeholder="Select player" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {players.map((p) => (
                    <SelectItem
                      key={p.id}
                      value={p.id}
                      disabled={takenPlayers.includes(p.id)}
                    >
                      {p.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Color select */}
        <FormField
          control={form.control}
          name={`players.${index}.color`}
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-xs">Color</FormLabel>
              <Select onValueChange={field.onChange} value={field.value}>
                <FormControl>
                  <SelectTrigger className="h-9 text-sm">
                    <SelectValue />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {CATAN_COLORS.map((c) => (
                    <SelectItem key={c.value} value={c.value} disabled={takenColors.includes(c.value)}>
                      <span className="flex items-center gap-2">
                        <span
                          className="h-3 w-3 rounded-full border border-border inline-block"
                          style={{ backgroundColor: c.hex }}
                        />
                        {c.label}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      <div className="flex items-center gap-4 flex-wrap">
        {/* Points */}
        <FormField
          control={form.control}
          name={`players.${index}.points`}
          render={({ field }) => (
            <FormItem className="flex-1 min-w-[80px]">
              <FormLabel className="text-xs">Points</FormLabel>
              <FormControl>
                <Input type="number" min={0} max={20} step={1} className="h-9 text-sm" {...field} />
              </FormControl>
            </FormItem>
          )}
        />

        {/* Checkboxes */}
        <div className="flex items-center gap-4 pt-5 flex-wrap">
          <button
            type="button"
            onClick={onSetWinner}
            className={`flex items-center gap-1.5 text-sm rounded-md px-2 py-1 transition-colors ${
              isWinner
                ? "bg-accent text-accent-foreground font-medium"
                : "hover:bg-muted text-muted-foreground"
            }`}
          >
            <Crown className="h-3.5 w-3.5" />
            Winner
          </button>

          <FormField
            control={form.control}
            name={`players.${index}.longestRoad`}
            render={({ field }) => (
              <FormItem className="flex items-center gap-1.5 space-y-0">
                <FormControl>
                  <Checkbox
                    checked={field.value}
                    onCheckedChange={(checked) => onSetExclusive("longestRoad", !!checked)}
                  />
                </FormControl>
                <FormLabel className="text-xs font-normal cursor-pointer">Longest Road</FormLabel>
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name={`players.${index}.largestArmy`}
            render={({ field }) => (
              <FormItem className="flex items-center gap-1.5 space-y-0">
                <FormControl>
                  <Checkbox
                    checked={field.value}
                    onCheckedChange={(checked) => onSetExclusive("largestArmy", !!checked)}
                  />
                </FormControl>
                <FormLabel className="text-xs font-normal cursor-pointer">Largest Army</FormLabel>
              </FormItem>
            )}
          />
        </div>
      </div>
    </div>
  );
}

function getRecentPlayers(matches: Match[], players: Player[]) {
  const knownPlayers = new Set(players.map((player) => player.id));
  const seen = new Set<string>();
  const recent: Array<{ playerId: string; playerName: string; color: string }> = [];

  matches.forEach((match) => {
    match.players.forEach((player) => {
      if (!knownPlayers.has(player.playerId) || seen.has(player.playerId)) return;
      seen.add(player.playerId);
      recent.push({
        playerId: player.playerId,
        playerName: player.playerName,
        color: player.color.toLowerCase(),
      });
    });
  });

  return recent;
}
