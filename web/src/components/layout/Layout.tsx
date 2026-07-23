import { ArrowLeft, LayoutDashboard, PlusCircle, Scale, Swords, Trophy } from "lucide-react";
import { Link, Outlet, useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Navbar } from "./Navbar";

export function Layout() {
  const location = useLocation();
  const navigate = useNavigate();
  const showMobileBack = location.pathname !== "/";

  function handleBack() {
    const historyIndex = window.history.state?.idx;

    if (typeof historyIndex === "number" && historyIndex > 0) {
      navigate(-1);
      return;
    }

    navigate("/", { replace: true });
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 container mx-auto px-4 py-6 pb-24 md:pb-6 max-w-5xl">
        {showMobileBack && (
          <div className="mb-4 md:hidden">
            <Button type="button" variant="outline" size="sm" onClick={handleBack}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Button>
          </div>
        )}
        <Outlet />
      </main>
      <MobileBottomNav />
    </div>
  );
}

function MobileBottomNav() {
  const location = useLocation();
  const items = [
    { to: "/", label: "Home", icon: LayoutDashboard, active: location.pathname === "/" },
    {
      to: "/matches",
      label: "Matches",
      icon: Swords,
      active: location.pathname === "/matches" || (location.pathname.startsWith("/matches/") && location.pathname !== "/matches/new"),
    },
    { to: "/matches/new", label: "Log", icon: PlusCircle, active: location.pathname === "/matches/new" },
    { to: "/compare", label: "Compare", icon: Scale, active: location.pathname === "/compare" },
    { to: "/leaderboard", label: "Ranks", icon: Trophy, active: location.pathname === "/leaderboard" },
  ];

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t bg-background/95 px-2 pb-[calc(0.35rem+env(safe-area-inset-bottom))] pt-2 shadow-[0_-8px_24px_rgba(15,23,42,0.08)] backdrop-blur md:hidden">
      <div className="mx-auto grid max-w-5xl grid-cols-5 gap-1">
        {items.map((item) => (
          <Link
            key={item.to}
            to={item.to}
            className={cn(
              "flex min-h-14 flex-col items-center justify-center gap-1 rounded-md px-1 text-[11px] font-medium text-muted-foreground transition-colors",
              item.active && "bg-primary text-primary-foreground",
              !item.active && "hover:bg-muted hover:text-foreground"
            )}
          >
            <item.icon className="h-4 w-4" />
            <span className="leading-none">{item.label}</span>
          </Link>
        ))}
      </div>
    </nav>
  );
}
