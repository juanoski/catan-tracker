import { useEffect, useMemo, useState, type ReactNode } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { format } from "date-fns";
import { useMutation, useQuery } from "@tanstack/react-query";
import { ArrowLeft, ChevronDown, Clock3, Crown, MapPin, Pencil, Trash2, Trophy, Users } from "lucide-react";
import { toast } from "sonner";
import api from "@/lib/api";
import { queryClient } from "@/lib/queryClient";
import { useAuth } from "@/context/AuthContext";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState, ErrorState } from "@/components/common/AppState";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import type { Match } from "@/types/api";

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

const DETAILS_OPEN_KEY = "catan.matchDetail.detailsOpen";
const PLAYERS_OPEN_KEY = "catan.matchDetail.playersOpen";
const NOTES_OPEN_KEY = "catan.matchDetail.notesOpen";

export function MatchDetailPage() {
  const { matchId = "" } = useParams();
  const navigate = useNavigate();
  const { user, isAdmin } = useAuth();
  const [detailsOpen, setDetailsOpen] = useState(() => readStoredBoolean(DETAILS_OPEN_KEY, true));
  const [playersOpen, setPlayersOpen] = useState(() => readStoredBoolean(PLAYERS_OPEN_KEY, true));
  const [notesOpen, setNotesOpen] = useState(() => readStoredBoolean(NOTES_OPEN_KEY, true));

  const { data: match, isPending, isError, refetch } = useQuery({
    queryKey: ["matches", matchId],
    queryFn: () => api.get<Match>(`/matches/${matchId}`).then((r) => r.data),
    enabled: Boolean(matchId),
  });

  const { data: matchPage } = useQuery({
    queryKey: ["matches", "history"],
    queryFn: () => api.get<{ content: Match[] }>("/matches?size=100&sort=playedAt,desc").then((r) => r.data),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/matches/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["matches"] });
      queryClient.invalidateQueries({ queryKey: ["leaderboard"] });
      toast.success("Match deleted");
      navigate("/matches");
    },
    onError: (error: unknown) => {
      const msg = (error as { response?: { data?: { error?: string } } })?.response?.data?.error;
      toast.error(msg ?? "Could not delete match");
    },
  });

  function goBack() {
    if (window.history.length > 1) navigate(-1);
    else navigate("/matches");
  }

  const sortedPlayers = useMemo(() => (match ? [...match.players].sort(sortMatchPlayers) : []), [match]);

  useEffect(() => {
    writeStoredBoolean(DETAILS_OPEN_KEY, detailsOpen);
  }, [detailsOpen]);

  useEffect(() => {
    writeStoredBoolean(PLAYERS_OPEN_KEY, playersOpen);
  }, [playersOpen]);

  useEffect(() => {
    writeStoredBoolean(NOTES_OPEN_KEY, notesOpen);
  }, [notesOpen]);

  if (isPending) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-32 rounded-xl" />
        <Skeleton className="h-80 rounded-xl" />
      </div>
    );
  }

  if (isError) {
    return (
      <ErrorState
        title="Could not load match"
        description="The match detail could not be fetched from the server."
        action={<Button type="button" variant="outline" onClick={() => refetch()}>Try again</Button>}
      />
    );
  }

  if (!match) {
    return (
      <EmptyState
        icon={Trophy}
        title="Match not found"
        description="This match may have been deleted or the link may be outdated."
        action={
          <Button asChild variant="outline">
            <Link to="/matches">Open match history</Link>
          </Button>
        }
      />
    );
  }

  const winner = match.players.find((player) => player.winner);
  const canManage = isAdmin || match.createdById === user?.playerId;
  const matchIndex = (matchPage?.content ?? []).findIndex((item) => item.id === match.id);
  const previousMatch = matchIndex >= 0 ? matchPage?.content[matchIndex + 1] : undefined;
  const nextMatch = matchIndex > 0 ? matchPage?.content[matchIndex - 1] : undefined;

  return (
    <div className="space-y-6">
      <div className="grid gap-2 sm:flex sm:flex-wrap sm:items-center sm:justify-between">
        <Button variant="outline" size="sm" className="justify-center sm:justify-start" onClick={goBack}>
          <ArrowLeft className="mr-1.5 h-4 w-4" />
          Back
        </Button>
        <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap">
          <Button variant="outline" size="sm" asChild={Boolean(previousMatch)} disabled={!previousMatch}>
            {previousMatch ? <Link to={`/matches/${previousMatch.id}`}>Previous</Link> : <span>Previous</span>}
          </Button>
          <Button variant="outline" size="sm" asChild={Boolean(nextMatch)} disabled={!nextMatch}>
            {nextMatch ? <Link to={`/matches/${nextMatch.id}`}>Next</Link> : <span>Next</span>}
          </Button>
        </div>
        {canManage && (
          <div className="grid grid-cols-2 gap-2 sm:flex">
            <Button variant="outline" size="sm" asChild>
              <Link to={`/matches/${match.id}/edit`}>
                <Pencil className="mr-1.5 h-4 w-4" />
                Edit
              </Link>
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={() => {
                if (confirm("Delete this match? ELO will be recalculated.")) deleteMutation.mutate(match.id);
              }}
              disabled={deleteMutation.isPending}
            >
              <Trash2 className="mr-1.5 h-4 w-4" />
              Delete
            </Button>
          </div>
        )}
      </div>

      <Card className="overflow-hidden">
        <CardContent className="p-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-2xl font-bold text-primary">
                  {winner ? `${winner.playerName} won` : "Match details"}
                </h1>
                {winner && <Badge variant="accent">{winner.points} pts</Badge>}
              </div>
              <p className="mt-2 text-sm text-muted-foreground">
                {format(new Date(match.playedAt), "MMM d, yyyy h:mm a")} - {match.expansionName}
              </p>
              <p className="mt-1 flex items-center gap-1 text-sm text-muted-foreground">
                <MapPin className="h-3.5 w-3.5" />
                {match.locationName}
              </p>
            </div>
            <div className="grid gap-2 sm:grid-cols-3 lg:min-w-96">
              <MiniFact label="Players" value={match.players.length} />
              <MiniFact label="Duration" value={match.durationMinutes ? `${match.durationMinutes} min` : "-"} />
              <MiniFact label="Board" value={match.deckLayout} />
            </div>
          </div>
        </CardContent>
      </Card>

      <CollapsibleSection
        icon={Trophy}
        title="Match details"
        open={detailsOpen}
        onToggle={() => setDetailsOpen((open) => !open)}
      >
        <div className="grid grid-cols-2 gap-2 sm:gap-3 lg:grid-cols-4">
          <MiniFact label="Created by" value={match.createdByName} />
          <MiniFact label="Expansion" value={match.expansionName} />
          <MiniFact label="Played" value={format(new Date(match.playedAt), "MMM d, yyyy")} />
          <MiniFact label="Time" value={format(new Date(match.playedAt), "h:mm a")} />
        </div>
      </CollapsibleSection>

      <CollapsibleSection
        icon={Users}
        title="Players"
        badge={`${match.players.length} players`}
        open={playersOpen}
        onToggle={() => setPlayersOpen((open) => !open)}
      >
          <div className="space-y-3 md:hidden">
            {sortedPlayers.map((player, index) => (
              <PlayerResultCard key={player.id} player={player} placement={index + 1} />
            ))}
          </div>

          <div className="hidden overflow-x-auto md:block">
            <table className="w-full min-w-[720px] text-sm">
            <thead>
              <tr className="border-b text-left text-muted-foreground">
                <th className="py-2 pr-3 font-medium">Player</th>
                <th className="py-2 pr-3 font-medium">Color</th>
                <th className="py-2 pr-3 font-medium">Points</th>
                <th className="py-2 pr-3 font-medium">Result</th>
                <th className="py-2 pr-3 font-medium">Awards</th>
                <th className="py-2 pr-3 font-medium">ELO</th>
              </tr>
            </thead>
            <tbody>
              {sortedPlayers.map((player) => (
                <tr key={player.id} className="border-b last:border-0">
                  <td className="py-3 pr-3">
                    <Link to={`/players/${player.playerId}`} className="font-medium text-primary hover:underline">
                      {player.playerName}
                    </Link>
                  </td>
                  <td className="py-3 pr-3">
                    <span className="inline-flex items-center gap-2">
                      <span
                        className="h-3 w-3 rounded-full border"
                        style={{ backgroundColor: CATAN_COLOR_HEX[player.color.toLowerCase()] ?? "#94a3b8" }}
                      />
                      {player.color}
                    </span>
                  </td>
                  <td className="py-3 pr-3">{player.points}</td>
                  <td className="py-3 pr-3">
                    {player.winner ? (
                      <Badge className="gap-1"><Crown className="h-3 w-3" /> Winner</Badge>
                    ) : (
                      <Badge variant="secondary">Played</Badge>
                    )}
                  </td>
                  <td className="py-3 pr-3">
                    <div className="flex flex-wrap gap-1">
                      {player.longestRoad && <Badge variant="outline">Road</Badge>}
                      {player.largestArmy && <Badge variant="outline">Army</Badge>}
                      {!player.longestRoad && !player.largestArmy && <span className="text-muted-foreground">-</span>}
                    </div>
                  </td>
                  <td className="py-3 pr-3">
                    <span className={player.eloDelta >= 0 ? "text-green-600" : "text-destructive"}>
                      {player.eloBefore} {"->"} {player.eloAfter} ({player.eloDelta >= 0 ? "+" : ""}{player.eloDelta})
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
            </table>
          </div>
      </CollapsibleSection>

      {match.notes && (
        <CollapsibleSection
          icon={Clock3}
          title="Notes"
          open={notesOpen}
          onToggle={() => setNotesOpen((open) => !open)}
        >
          <p className="whitespace-pre-wrap text-sm text-muted-foreground">{match.notes}</p>
        </CollapsibleSection>
      )}
    </div>
  );
}

function MiniFact({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-lg border bg-background p-3">
      <p className="truncate text-xs text-muted-foreground" title={label}>{label}</p>
      <p className="mt-1 truncate font-semibold" title={String(value)}>{value}</p>
    </div>
  );
}

function PlayerResultCard({
  player,
  placement,
}: {
  player: Match["players"][number];
  placement: number;
}) {
  return (
    <div className="rounded-lg border bg-background p-3">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex min-w-0 items-center gap-2">
            <Badge variant="secondary" className="shrink-0">#{placement}</Badge>
            <Link to={`/players/${player.playerId}`} className="truncate font-semibold text-primary hover:underline">
              {player.playerName}
            </Link>
          </div>
          <div className="mt-2 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
            <span className="inline-flex items-center gap-1">
              <span
                className="h-3 w-3 rounded-full border"
                style={{ backgroundColor: CATAN_COLOR_HEX[player.color.toLowerCase()] ?? "#94a3b8" }}
              />
              {player.color}
            </span>
            <span>{player.points} pts</span>
          </div>
        </div>
        {player.winner ? (
          <Badge className="shrink-0 gap-1"><Crown className="h-3 w-3" /> Winner</Badge>
        ) : (
          <Badge variant="secondary" className="shrink-0">Played</Badge>
        )}
      </div>

      <div className="mt-3 grid grid-cols-2 gap-2">
        <MiniFact label="ELO before" value={player.eloBefore} />
        <MiniFact label="ELO after" value={`${player.eloAfter} (${player.eloDelta >= 0 ? "+" : ""}${player.eloDelta})`} />
      </div>

      {(player.longestRoad || player.largestArmy) && (
        <div className="mt-3 flex flex-wrap gap-2">
          {player.longestRoad && <Badge variant="outline">Road</Badge>}
          {player.largestArmy && <Badge variant="outline">Army</Badge>}
        </div>
      )}
    </div>
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

function sortMatchPlayers(a: Match["players"][number], b: Match["players"][number]) {
  if (a.winner !== b.winner) return a.winner ? -1 : 1;
  return b.points - a.points || a.playerName.localeCompare(b.playerName);
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
