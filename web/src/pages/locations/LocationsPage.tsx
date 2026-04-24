import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useQuery, useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { PlusCircle, Pencil, Trash2, MapPin, Loader2 } from "lucide-react";
import api from "@/lib/api";
import { queryClient } from "@/lib/queryClient";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
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
import type { Location, Player } from "@/types/api";

const schema = z.object({
  ownerId: z.string().min(1, "Select an owner"),
  name: z.string().min(2, "Name must be at least 2 characters").max(100),
  address: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

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

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/locations/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["locations"] });
      toast.success("Location deleted");
    },
    onError: () => toast.error("Failed to delete location"),
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
            Places where matches are played
          </p>
        </div>
        <Button onClick={() => setCreateOpen(true)}>
          <PlusCircle className="mr-2 h-4 w-4" />
          Add location
        </Button>
      </div>

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
          <p className="text-sm mt-1">Add the first place you play Catan</p>
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
    onError: () => toast.error("Failed to save location"),
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
                    <span className="text-muted-foreground font-normal">— optional</span>
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
