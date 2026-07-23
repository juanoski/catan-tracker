import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { format } from "date-fns";
import { useMutation, useQuery } from "@tanstack/react-query";
import { KeyRound, Loader2, Pencil, PlusCircle, Shield, Trash2, UserRound } from "lucide-react";
import { toast } from "sonner";
import api from "@/lib/api";
import { queryClient } from "@/lib/queryClient";
import { useAuth } from "@/context/AuthContext";
import { EmptyState, ErrorState } from "@/components/common/AppState";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
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
import type { AdminCreatePlayerRequest, AdminUpdatePlayerRequest, Player, PlayerRole } from "@/types/api";

const createSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").max(100),
  email: z.string().email("Enter a valid email"),
  avatarUrl: z.string().url("Enter a valid URL").optional().or(z.literal("")),
  password: z.string().min(8, "Password must be at least 8 characters"),
  role: z.enum(["ADMIN", "PLAYER"]),
});

const editSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").max(100),
  email: z.string().email("Enter a valid email"),
  avatarUrl: z.string().url("Enter a valid URL").optional().or(z.literal("")),
  password: z.string().optional().refine((value) => !value || value.length >= 8, {
    message: "Password must be at least 8 characters",
  }),
  role: z.enum(["ADMIN", "PLAYER"]),
});

const resetPasswordSchema = z.object({
  password: z.string().min(8, "Password must be at least 8 characters"),
  confirmPassword: z.string().min(8, "Password must be at least 8 characters"),
}).refine((value) => value.password === value.confirmPassword, {
  path: ["confirmPassword"],
  message: "Passwords must match",
});

type CreateFormValues = z.infer<typeof createSchema>;
type EditFormValues = z.infer<typeof editSchema>;
type ResetPasswordFormValues = z.infer<typeof resetPasswordSchema>;

export function UsersPage() {
  const { user } = useAuth();
  const [createOpen, setCreateOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Player | null>(null);
  const [resetTarget, setResetTarget] = useState<Player | null>(null);

  const { data: players = [], isPending, isError, refetch } = useQuery({
    queryKey: ["players"],
    queryFn: () => api.get<Player[]>("/players").then((r) => r.data),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/admin/players/${id}`),
    onSuccess: () => {
      invalidateUserRelatedQueries();
      toast.success("User deleted");
    },
    onError: (error: unknown) => {
      const msg = (error as { response?: { data?: { error?: string } } })?.response?.data?.error;
      toast.error(msg ?? "Could not delete user");
    },
  });

  function handleDelete(player: Player) {
    if (player.id === user?.playerId) {
      toast.error("You can't delete your own admin account from here");
      return;
    }
    if (confirm(`Delete "${player.name}"?`)) {
      deleteMutation.mutate(player.id);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-primary">Users</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Manage player accounts, roles, and password resets.
          </p>
        </div>
        <Button onClick={() => setCreateOpen(true)}>
          <PlusCircle className="mr-2 h-4 w-4" />
          Add user
        </Button>
      </div>

      {isPending ? (
        <div className="grid gap-3 lg:grid-cols-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-32 rounded-lg" />
          ))}
        </div>
      ) : isError ? (
        <ErrorState
          title="Could not load users"
          description="User accounts could not be fetched from the server."
          action={<Button type="button" variant="outline" onClick={() => refetch()}>Try again</Button>}
        />
      ) : players.length === 0 ? (
        <EmptyState
          icon={UserRound}
          title="No users yet"
          description="Create the first player account to start logging matches."
          action={
            <Button onClick={() => setCreateOpen(true)}>
              <PlusCircle className="mr-2 h-4 w-4" />
              Add user
            </Button>
          }
        />
      ) : (
        <div className="grid gap-3 lg:grid-cols-2">
          {players.map((player) => (
            <Card key={player.id} className="group">
              <CardContent className="p-4 flex flex-col gap-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-semibold truncate">{player.name}</p>
                      <RoleBadge role={player.role} />
                      {player.id === user?.playerId && (
                        <Badge variant="outline" className="text-xs">you</Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground truncate">{player.email}</p>
                  </div>
                  <div className="flex gap-1 shrink-0 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      title={`Reset password for ${player.name}`}
                      aria-label={`Reset password for ${player.name}`}
                      onClick={() => setResetTarget(player)}
                    >
                      <KeyRound className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      title={`Edit ${player.name}`}
                      aria-label={`Edit ${player.name}`}
                      onClick={() => setEditTarget(player)}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-destructive hover:text-destructive"
                      title={`Delete ${player.name}`}
                      aria-label={`Delete ${player.name}`}
                      onClick={() => handleDelete(player)}
                      disabled={deleteMutation.isPending && deleteMutation.variables === player.id}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>{player.eloRating} ELO</span>
                  <span>Created {format(new Date(player.createdAt), "MMM d, yyyy")}</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <CreateUserDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
      />

      <EditUserDialog
        open={!!editTarget}
        onOpenChange={(open) => {
          if (!open) setEditTarget(null);
        }}
        player={editTarget ?? undefined}
        isSelf={editTarget?.id === user?.playerId}
      />

      <ResetPasswordDialog
        open={!!resetTarget}
        onOpenChange={(open) => {
          if (!open) setResetTarget(null);
        }}
        player={resetTarget ?? undefined}
      />
    </div>
  );
}

function RoleBadge({ role }: { role: PlayerRole }) {
  return (
    <Badge variant={role === "ADMIN" ? "accent" : "secondary"} className="text-xs flex items-center gap-1">
      {role === "ADMIN" ? <Shield className="h-3 w-3" /> : <UserRound className="h-3 w-3" />}
      {role === "ADMIN" ? "Admin" : "Player"}
    </Badge>
  );
}

function CreateUserDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const form = useForm<CreateFormValues>({
    resolver: zodResolver(createSchema),
    defaultValues: {
      name: "",
      email: "",
      avatarUrl: "",
      password: "",
      role: "PLAYER",
    },
  });

  const mutation = useMutation({
    mutationFn: (data: CreateFormValues) => {
      const payload: AdminCreatePlayerRequest = {
        ...data,
        avatarUrl: data.avatarUrl || undefined,
      };
      return api.post<Player>("/admin/players", payload);
    },
    onSuccess: () => {
      invalidateUserRelatedQueries();
      toast.success("User created");
      form.reset();
      onOpenChange(false);
    },
    onError: (error: unknown) => {
      const msg = (error as { response?: { data?: { error?: string } } })?.response?.data?.error;
      toast.error(msg ?? "Could not create user");
    },
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Create user</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit((values) => mutation.mutate(values))} className="space-y-4">
            <UserFormFields form={form} includePassword passwordOptional={false} isSelf={false} />
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={mutation.isPending}>
                {mutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Create user
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

function EditUserDialog({
  open,
  onOpenChange,
  player,
  isSelf,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  player?: Player;
  isSelf: boolean;
}) {
  const form = useForm<EditFormValues>({
    resolver: zodResolver(editSchema),
    defaultValues: {
      name: "",
      email: "",
      avatarUrl: "",
      password: "",
      role: "PLAYER",
    },
  });

  useEffect(() => {
    form.reset({
      name: player?.name ?? "",
      email: player?.email ?? "",
      avatarUrl: player?.avatarUrl ?? "",
      password: "",
      role: player?.role ?? "PLAYER",
    });
  }, [form, player]);

  const mutation = useMutation({
    mutationFn: (data: EditFormValues) => {
      if (!player) return Promise.reject(new Error("No player selected"));
      const payload: AdminUpdatePlayerRequest = {
        ...data,
        avatarUrl: data.avatarUrl || undefined,
        password: data.password || undefined,
      };
      return api.patch<Player>(`/admin/players/${player.id}`, payload);
    },
    onSuccess: () => {
      invalidateUserRelatedQueries();
      toast.success("User updated");
      form.reset();
      onOpenChange(false);
    },
    onError: (error: unknown) => {
      const msg = (error as { response?: { data?: { error?: string } } })?.response?.data?.error;
      toast.error(msg ?? "Could not update user");
    },
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Edit user</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit((values) => mutation.mutate(values))} className="space-y-4">
            <UserFormFields form={form} includePassword passwordOptional isSelf={isSelf} />
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={mutation.isPending}>
                {mutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Save changes
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

function ResetPasswordDialog({
  open,
  onOpenChange,
  player,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  player?: Player;
}) {
  const form = useForm<ResetPasswordFormValues>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      password: "",
      confirmPassword: "",
    },
  });

  useEffect(() => {
    if (open) {
      form.reset({
        password: "",
        confirmPassword: "",
      });
    }
  }, [form, open, player]);

  const mutation = useMutation({
    mutationFn: (data: ResetPasswordFormValues) => {
      if (!player) return Promise.reject(new Error("No player selected"));
      const payload: AdminUpdatePlayerRequest = {
        password: data.password,
      };
      return api.patch<Player>(`/admin/players/${player.id}`, payload);
    },
    onSuccess: () => {
      toast.success("Password reset");
      form.reset();
      onOpenChange(false);
    },
    onError: (error: unknown) => {
      const msg = (error as { response?: { data?: { error?: string } } })?.response?.data?.error;
      toast.error(msg ?? "Could not reset password");
    },
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Reset password</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit((values) => mutation.mutate(values))} className="space-y-4">
            <div className="rounded-md border bg-muted/40 px-3 py-2 text-sm">
              <p className="font-medium">{player?.name}</p>
              <p className="text-muted-foreground">{player?.email}</p>
            </div>

            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>New password</FormLabel>
                  <FormControl>
                    <Input type="password" placeholder="At least 8 characters" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="confirmPassword"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Confirm password</FormLabel>
                  <FormControl>
                    <Input type="password" placeholder="Repeat new password" {...field} />
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
                Reset password
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

function UserFormFields<T extends CreateFormValues | EditFormValues>({
  form,
  includePassword,
  passwordOptional,
  isSelf,
}: {
  form: ReturnType<typeof useForm<T>>;
  includePassword: boolean;
  passwordOptional: boolean;
  isSelf: boolean;
}) {
  return (
    <>
      <FormField
        control={form.control}
        name={"name" as never}
        render={({ field }) => (
          <FormItem>
            <FormLabel>Name</FormLabel>
            <FormControl>
              <Input placeholder="Player name" {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name={"email" as never}
        render={({ field }) => (
          <FormItem>
            <FormLabel>Email</FormLabel>
            <FormControl>
              <Input type="email" placeholder="player@example.com" {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name={"role" as never}
        render={({ field }) => (
          <FormItem>
            <FormLabel>Role</FormLabel>
            <Select onValueChange={field.onChange} value={field.value} disabled={isSelf}>
              <FormControl>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                <SelectItem value="PLAYER">Player</SelectItem>
                <SelectItem value="ADMIN">Admin</SelectItem>
              </SelectContent>
            </Select>
            {isSelf && (
              <p className="text-xs text-muted-foreground">Your own admin role can't be changed here.</p>
            )}
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name={"avatarUrl" as never}
        render={({ field }) => (
          <FormItem>
            <FormLabel>Avatar URL</FormLabel>
            <FormControl>
              <Input placeholder="https://example.com/avatar.png" {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      {includePassword && (
        <FormField
          control={form.control}
          name={"password" as never}
          render={({ field }) => (
            <FormItem>
              <FormLabel>
                Password{" "}
                {passwordOptional && (
                  <span className="text-muted-foreground font-normal">optional</span>
                )}
              </FormLabel>
              <FormControl>
                <Input
                  type="password"
                  placeholder={passwordOptional ? "Leave blank to keep current password" : "At least 8 characters"}
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      )}
    </>
  );
}

function invalidateUserRelatedQueries() {
  queryClient.invalidateQueries({ queryKey: ["players"] });
  queryClient.invalidateQueries({ queryKey: ["locations"] });
  queryClient.invalidateQueries({ queryKey: ["matches"] });
  queryClient.invalidateQueries({ queryKey: ["leaderboard"] });
}
