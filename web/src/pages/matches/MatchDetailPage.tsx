import { Link, useNavigate, useParams } from "react-router-dom";
import { format } from "date-fns";
import { useMutation, useQuery } from "@tanstack/react-query";
import { ArrowLeft, Crown, MapPin, Pencil, Trash2, Trophy, Users } from "lucide-react";
import { toast } from "sonner";
import api from "@/lib/api";
import { queryClient } from "@/lib/queryClient";
import { useAuth } from "@/context/AuthContext";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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

export function MatchDetailPage() {
  const { matchId = "" } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const { data: match, isPending } = useQuery({
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

  if (isPending) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-32 rounded-xl" />
        <Skeleton className="h-80 rounded-xl" />
      </div>
    );
  }

  if (!match) {
    return (
      <Card>
        <CardContent className="py-12 text-center text-muted-foreground">
          <Trophy className="mx-auto mb-2 h-8 w-8 opacity-40" />
          <p className="text-sm">Match not found.</p>
        </CardContent>
      </Card>
    );
  }

  const winner = match.players.find((player) => player.winner);
  const canDelete = match.createdById === user?.playerId;
  const matchIndex = (matchPage?.content ?? []).findIndex((item) => item.id === match.id);
  const previousMatch = matchIndex >= 0 ? matchPage?.content[matchIndex + 1] : undefined;
  const nextMatch = matchIndex > 0 ? matchPage?.content[matchIndex - 1] : undefined;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Button variant="outline" size="sm" onClick={goBack}>
          <ArrowLeft className="mr-1.5 h-4 w-4" />
          Back
        </Button>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" asChild disabled={!previousMatch}>
            <Link to={previousMatch ? `/matches/${previousMatch.id}` : "#"}>Previous</Link>
          </Button>
          <Button variant="outline" size="sm" asChild disabled={!nextMatch}>
            <Link to={nextMatch ? `/matches/${nextMatch.id}` : "#"}>Next</Link>
          </Button>
        </div>
        {canDelete && (
          <div className="flex gap-2">
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

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Users className="h-4 w-4 text-accent" />
            Players
          </CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto">
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
              {[...match.players].sort((a, b) => b.points - a.points).map((player) => (
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
        </CardContent>
      </Card>

      {match.notes && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Notes</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">{match.notes}</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function MiniFact({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-lg border bg-background p-3">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-1 font-semibold">{value}</p>
    </div>
  );
}
