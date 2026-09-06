import React, { useEffect, useState } from "react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import {
  Menu,
  ShoppingCart,
  User,
  LogOut,
  Sparkles,
  Shield,
} from "lucide-react";
import { authStorage } from "../services/api";
import Logo from "./Logo";
import ThemeToggle from "./ThemeToggle";

const Navbar = ({ onToggleSidebar }) => {
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

  const isSuperAdmin =
    String(user.role || "").toLowerCase().includes("superadmin");

  return (
    <header className="sticky top-0 z-30 border-b border-white/5 bg-zinc-950/80 px-3 py-2.5 sm:px-6 sm:py-3 shadow-[0_4px_25px_rgba(0,0,0,0.4)] backdrop-blur-2xl">
      <div className="flex items-center justify-between gap-3">
        {/* Left Section: Mobile Sidebar Trigger & Brand Logo */}
        <div className="flex items-center gap-2.5 sm:gap-3">
          {/* Mobile hamburger (< 1024px) */}
          <button
            type="button"
            onClick={onToggleSidebar}
            className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 bg-zinc-900/80 text-white lg:hidden hover:border-[var(--app-accent-border)] hover:bg-zinc-800 transition active:scale-95 shadow-sm"
            aria-label="Toggle sidebar navigation"
            title="Open Menu"
          >
            <Menu className="h-5 w-5 text-zinc-200" />
          </button>

          {/* Brand Logo for Mobile Screens */}
          <NavLink
            to="/dashboard"
            onClick={() => {
              window.scrollTo({ top: 0, left: 0, behavior: "smooth" });
              const scrollContainers = document.querySelectorAll(".overflow-y-auto, main");
              scrollContainers.forEach((el) => {
                el.scrollTo({ top: 0, left: 0, behavior: "smooth" });
              });
            }}
            className="lg:hidden cursor-pointer transition-transform active:scale-95"
            title="SmartShop Admin - Scroll to top"
          >
            <Logo size="sm" showBadge badgeText={isSuperAdmin ? "Super" : "Admin"} />
          </NavLink>

          {/* Live Store Status Pill (Visible on tablet & desktop) */}
          <div className="hidden sm:inline-flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-950/40 px-3 py-1 text-[11px] font-semibold text-emerald-400 backdrop-blur-md">
            <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_8px_#34d399]" />
            <span>Store Live & Active</span>
          </div>
        </div>

        {/* Right Section: Actions & Theme Toggle */}
        <div className="flex items-center gap-2 sm:gap-2.5">
          {/* Theme Mode & Color Roller Toggle */}
          <ThemeToggle className="hidden sm:inline-flex" />

          {/* Quick POS Sale Button */}
          <NavLink
            to="/sales"
            className="inline-flex items-center gap-1.5 rounded-xl btn-primary px-3 py-1.5 sm:px-3.5 sm:py-2 text-xs font-bold shadow-md transition active:scale-95"
            title="Quick Billing (F2)"
          >
            <ShoppingCart className="h-3.5 w-3.5" />
            <span className="hidden xs:inline sm:inline">New Bill</span>
            <span className="text-[10px] bg-black/20 rounded px-1 hidden md:inline">F2</span>
          </NavLink>

          {/* Desktop-Only Quick Profile Link */}
          <NavLink
            to="/profile"
            className="hidden sm:flex items-center gap-2 rounded-xl border border-white/10 bg-zinc-900/80 px-3 py-1.5 text-xs font-semibold text-zinc-300 hover:border-[var(--app-accent-border)] hover:text-white hover:bg-zinc-800/90 transition shadow-sm"
            title="Admin Profile"
          >
            <div className={`flex h-5 w-5 items-center justify-center rounded-md ${
              isSuperAdmin ? "bg-amber-500 text-black font-extrabold" : "bg-[var(--app-accent)] text-white font-bold"
            } text-[10px]`}>
              {(user.name || user.username || "A").charAt(0).toUpperCase()}
            </div>
            <span className="max-w-[110px] truncate">
              {user.name || user.username || "Admin"}
            </span>
          </NavLink>

          {/* Desktop-Only Logout Shortcut */}
          <button
            type="button"
            onClick={handleLogout}
            className="hidden sm:flex h-9 w-9 items-center justify-center rounded-xl border border-zinc-800 bg-zinc-900/80 text-zinc-400 hover:border-red-500/40 hover:bg-red-500/10 hover:text-red-400 transition active:scale-95 shadow-sm"
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