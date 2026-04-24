import { Link, useNavigate } from "react-router-dom";
import { LogOut, PlusCircle, LayoutDashboard, MapPin, Menu, X, Shield, Users } from "lucide-react";
import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export function Navbar() {
  const { user, logout, isAdmin } = useAuth();
  const navigate = useNavigate();
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
          <Button variant="ghost" size="sm" asChild className="text-primary-foreground hover:bg-primary/80 hover:text-primary-foreground">
            <Link to="/"><LayoutDashboard className="mr-1.5 h-4 w-4" />Dashboard</Link>
          </Button>
          <Button variant="ghost" size="sm" asChild className="text-primary-foreground hover:bg-primary/80 hover:text-primary-foreground">
            <Link to="/matches/new"><PlusCircle className="mr-1.5 h-4 w-4" />Log Match</Link>
          </Button>
          <Button variant="ghost" size="sm" asChild className="text-primary-foreground hover:bg-primary/80 hover:text-primary-foreground">
            <Link to="/locations"><MapPin className="mr-1.5 h-4 w-4" />Locations</Link>
          </Button>
          {isAdmin && (
            <Button variant="ghost" size="sm" asChild className="text-primary-foreground hover:bg-primary/80 hover:text-primary-foreground">
              <Link to="/admin/users"><Users className="mr-1.5 h-4 w-4" />Users</Link>
            </Button>
          )}
        </nav>

        {/* Desktop user */}
        <div className="hidden md:flex items-center gap-3">
          <div className="flex items-center gap-2">
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
          </div>
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
          "md:hidden border-t border-primary/30 overflow-hidden transition-all duration-200",
          menuOpen ? "max-h-80" : "max-h-0"
        )}
      >
        <div className="container mx-auto flex flex-col px-4 py-3 gap-1">
          <Link
            to="/"
            onClick={() => setMenuOpen(false)}
            className="flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium hover:bg-primary/80"
          >
            <LayoutDashboard className="h-4 w-4" /> Dashboard
          </Link>
          <Link
            to="/matches/new"
            onClick={() => setMenuOpen(false)}
            className="flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium hover:bg-primary/80"
          >
            <PlusCircle className="h-4 w-4" /> Log Match
          </Link>
          <Link
            to="/locations"
            onClick={() => setMenuOpen(false)}
            className="flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium hover:bg-primary/80"
          >
            <MapPin className="h-4 w-4" /> Locations
          </Link>
          {isAdmin && (
            <Link
              to="/admin/users"
              onClick={() => setMenuOpen(false)}
              className="flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium hover:bg-primary/80"
            >
              <Users className="h-4 w-4" /> Users
            </Link>
          )}
          <div className="flex items-center justify-between rounded-md px-3 py-2">
            <div className="flex items-center gap-2 text-sm">
              <Avatar className="h-7 w-7">
                <AvatarFallback className="bg-accent text-accent-foreground text-xs font-bold">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <span>{user?.name}</span>
            </div>
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
