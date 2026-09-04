import React, { useEffect, useState } from "react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import {
  Menu,
  ShoppingCart,
  User,
  LogOut,
  Sparkles,
  ExternalLink,
  Shield,
  Layers,
} from "lucide-react";
import { authStorage } from "../services/api";
import Logo from "./Logo";

const Navbar = ({ onToggleSidebar, onToggleCollapse, isCollapsed }) => {
  const [user, setUser] = useState(() => authStorage.getUser());
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const syncUser = () => {
      const currentUser = authStorage.getUser();
      setUser(currentUser);
    };

    syncUser();
    window.addEventListener("auth-changed", syncUser);
    window.addEventListener("storage", syncUser);

    return () => {
      window.removeEventListener("auth-changed", syncUser);
      window.removeEventListener("storage", syncUser);
    };
  }, [location.pathname]);

  const handleLogout = () => {
    authStorage.clear();
    setUser(null);
    navigate("/login");
  };

  // If user is not logged in (e.g. on /login page), do not render any navbar
  if (!user) {
    return null;
  }

  return (
    <header className="sticky top-0 z-30 border-b border-white/5 bg-zinc-950/80 px-4 py-3 shadow-[0_4px_25px_rgba(0,0,0,0.4)] backdrop-blur-2xl sm:px-6">
      <div className="flex items-center justify-between gap-3">
        {/* Left: Mobile Sidebar Trigger, Desktop Sidebar Toggle & Status */}
        <div className="flex items-center gap-3">
          {/* Mobile hamburger (< 1024px) */}
          <button
            type="button"
            onClick={onToggleSidebar}
            className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 bg-zinc-900/80 text-white lg:hidden hover:border-white/20 hover:bg-zinc-800 transition active:scale-95"
            aria-label="Toggle sidebar navigation"
          >
            <Menu className="h-5 w-5" />
          </button>

          {/* Desktop sidebar expand / collapse trigger (>= 1024px) */}
          <button
            type="button"
            onClick={onToggleCollapse}
            className="hidden lg:flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 bg-zinc-900/80 text-zinc-300 hover:text-white hover:border-[var(--app-accent-border)] hover:bg-zinc-800 transition active:scale-95 shadow-sm"
            title={isCollapsed ? "Expand Side Menu" : "Collapse Side Menu"}
            aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            <Menu className="h-4.5 w-4.5" />
          </button>

          <div className="lg:hidden">
            <Logo size="sm" showBadge badgeText="Admin" />
          </div>

          {/* Live Store Status Pill */}
          <div className="hidden sm:inline-flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-950/40 px-3 py-1 text-[11px] font-semibold text-emerald-400 backdrop-blur-md">
            <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_8px_#34d399]" />
            <span>Store Live & Active</span>
          </div>
        </div>

        {/* Right: Quick Action Shortcuts & Profile */}
        <div className="flex items-center gap-2.5">
          {/* Quick POS Sale Button */}
          <NavLink
            to="/sales"
            className="inline-flex items-center gap-1.5 rounded-xl btn-primary px-3.5 py-2 text-xs font-bold shadow-md transition active:scale-95"
          >
            <ShoppingCart className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">New Bill</span>
            <span className="text-[10px] bg-black/20 rounded px-1 hidden md:inline">F2</span>
          </NavLink>

          {/* Quick Profile Link */}
          <NavLink
            to="/profile"
            className="flex items-center gap-2 rounded-xl border border-white/10 bg-zinc-900/80 px-3 py-1.5 text-xs font-semibold text-zinc-300 hover:border-[var(--app-accent-border)] hover:text-white transition"
          >
            <User className="h-3.5 w-3.5 text-[var(--app-accent)]" />
            <span className="max-w-[100px] truncate hidden sm:inline">
              {user.name || user.username || "Admin"}
            </span>
          </NavLink>

          {/* Logout Shortcut */}
          <button
            type="button"
            onClick={handleLogout}
            className="flex h-9 w-9 items-center justify-center rounded-xl border border-zinc-800 bg-zinc-900/80 text-zinc-400 hover:border-red-500/40 hover:bg-red-500/10 hover:text-red-400 transition"
            title="Sign out"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>
    </header>
  );
};

export default Navbar;