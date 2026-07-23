import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import { AlertTriangle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type AppStateProps = {
  icon?: LucideIcon;
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
};

export function EmptyState({ icon: Icon, title, description, action, className }: AppStateProps) {
  return (
    <div
      className={cn(
        "flex min-h-40 flex-col items-center justify-center rounded-lg border border-dashed bg-muted/30 px-4 py-10 text-center",
        className
      )}
    >
      {Icon && (
        <div className="mb-3 rounded-md bg-background p-2 text-muted-foreground shadow-sm">
          <Icon className="h-5 w-5" />
        </div>
      )}
      <p className="font-medium">{title}</p>
      {description && <p className="mt-1 max-w-sm text-sm text-muted-foreground">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

export function ErrorState({
  title = "Something went wrong",
  description = "Try refreshing the page. If it keeps happening, the server may be unavailable.",
  action,
  className,
}: Partial<AppStateProps>) {
  return (
    <EmptyState
      icon={AlertTriangle}
      title={title}
      description={description}
      action={
        action ?? (
          <Button type="button" variant="outline" onClick={() => window.location.reload()}>
            Refresh
          </Button>
        )
      }
      className={cn("border-destructive/25 bg-destructive/5 text-destructive", className)}
    />
  );
}

export function LoadingState({ title = "Loading", description, className }: Pick<AppStateProps, "title" | "description" | "className">) {
  return (
    <div
      className={cn(
        "flex min-h-40 flex-col items-center justify-center rounded-lg border bg-muted/30 px-4 py-10 text-center text-muted-foreground",
        className
      )}
    >
      <Loader2 className="mb-3 h-5 w-5 animate-spin text-accent" />
      <p className="font-medium text-foreground">{title}</p>
      {description && <p className="mt-1 max-w-sm text-sm">{description}</p>}
    </div>
  );
}
