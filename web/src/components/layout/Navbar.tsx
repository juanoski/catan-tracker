import { Link, NavLink, useLocation, useNavigate } from "react-router-dom";
import { Award, LogOut, PlusCircle, LayoutDashboard, MapPin, Menu, X, Scale, Shield, Users, Swords, Trophy, User } from "lucide-react";
import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export function Navbar() {
  const { user, logout, isAdmin } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);

  function handleLogout() {
    logout();
    navigate("/login");
  }

  const initials = user?.name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  const navItems = [
    { to: "/", label: "Dashboard", icon: LayoutDashboard, active: location.pathname === "/" },
    ...(user ? [{ to: `/players/${user.playerId}`, label: "My Profile", icon: User, active: location.pathname === `/players/${user.playerId}` }] : []),
    { to: "/leaderboard", label: "Leaderboard", icon: Trophy, active: location.pathname === "/leaderboard" },
    { to: "/compare", label: "Compare", icon: Scale, active: location.pathname === "/compare" },
    { to: "/achievements", label: "Achievements", icon: Award, active: location.pathname === "/achievements" },
    { to: "/matches", label: "Matches", icon: Swords, active: location.pathname === "/matches" || (location.pathname.startsWith("/matches/") && location.pathname !== "/matches/new") },
    { to: "/matches/new", label: "Log Match", icon: PlusCircle, active: location.pathname === "/matches/new" },
    { to: "/locations", label: "Locations", icon: MapPin, active: location.pathname === "/locations" },
    ...(isAdmin ? [{ to: "/admin/users", label: "Users", icon: Users, active: location.pathname === "/admin/users" }] : []),
  ];

  return (
    <header className="sticky top-0 z-40 w-full border-b bg-primary text-primary-foreground shadow-md">
      <div className="container mx-auto flex h-14 items-center justify-between px-4">
        {/* Brand */}
        <Link to="/" className="flex items-center gap-2 font-bold text-lg tracking-tight">
          <HexIcon className="h-6 w-6 text-accent" />
          <span>Catan Tracker</span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-2">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={cn(
                "inline-flex h-9 items-center justify-center rounded-md px-3 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/80 hover:text-primary-foreground",
                item.active && "bg-primary/70 text-primary-foreground ring-1 ring-primary-foreground/20"
              )}
            >
              <item.icon className="mr-1.5 h-4 w-4" />
              {item.label}
            </NavLink>
          ))}
        </nav>

        {/* Desktop user */}
        <div className="hidden md:flex items-center gap-3">
          <Link to={user ? `/players/${user.playerId}` : "/"} className="flex items-center gap-2 rounded-md px-1 py-1 hover:bg-primary/80">
            <Avatar className="h-8 w-8">
              <AvatarFallback className="bg-accent text-accent-foreground text-xs font-bold">
                {initials}
              </AvatarFallback>
            </Avatar>
            <span className="text-sm font-medium">{user?.name}</span>
            <Badge variant="accent" className="text-xs flex items-center gap-1">
              {isAdmin && <Shield className="h-3 w-3" />}
              {user?.role}
            </Badge>
          </Link>
          <Button variant="ghost" size="icon" onClick={handleLogout} className="text-primary-foreground hover:bg-primary/80">
            <LogOut className="h-4 w-4" />
          </Button>
        </div>

        {/* Mobile menu toggle */}
        <button
          className="md:hidden p-1"
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label="Toggle menu"
        >
          {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {/* Mobile menu */}
      <div
        className={cn(
          "md:hidden border-t border-primary/30 transition-all duration-200",
          menuOpen
            ? "max-h-[calc(100dvh-3.5rem)] overflow-y-auto overscroll-contain touch-pan-y [-webkit-overflow-scrolling:touch]"
            : "max-h-0 overflow-hidden"
        )}
      >
        <div className="container mx-auto flex flex-col gap-1 px-4 py-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))]">
          {navItems.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              onClick={() => setMenuOpen(false)}
              className={cn(
                "flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium hover:bg-primary/80",
                item.active && "bg-primary/75"
              )}
            >
              <item.icon className="h-4 w-4" /> {item.label}
            </Link>
          ))}
          <div className="flex items-center justify-between rounded-md px-3 py-2">
            <Link
              to={user ? `/players/${user.playerId}` : "/"}
              onClick={() => setMenuOpen(false)}
              className="flex items-center gap-2 rounded-md text-sm hover:underline"
            >
              <Avatar className="h-7 w-7">
                <AvatarFallback className="bg-accent text-accent-foreground text-xs font-bold">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <span>{user?.name}</span>
            </Link>
            <button onClick={handleLogout} className="flex items-center gap-1 text-sm hover:underline">
              <LogOut className="h-4 w-4" /> Logout
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}

function HexIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path d="M12 2L3 7v10l9 5 9-5V7L12 2zm0 2.18L19 8.09v7.82L12 19.82 5 15.91V8.09L12 4.18z" />
    </svg>
  );
}
