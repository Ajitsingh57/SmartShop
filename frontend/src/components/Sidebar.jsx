import React, { useEffect } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import {
  Home,
  Package,
  Receipt,
  CreditCard,
  User,
  KeyRound,
  HelpCircle,
  Sparkles,
  Code,
  LogOut,
  X,
  LogIn,
  UserPlus,
  ShieldCheck,
  ChevronRight,
} from "lucide-react";
import Logo from "./Logo";
import { authStorage } from "../services/api";

const Sidebar = ({ isOpen, setIsOpen, user, setUser }) => {
  const navigate = useNavigate();

  // Close on Escape key press
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape" && isOpen) {
        setIsOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, setIsOpen]);

  // Lock body scroll when mobile sidebar drawer is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  const handleLogout = () => {
    authStorage.clear();
    if (setUser) setUser(null);
    setIsOpen(false);
    navigate("/");
  };

  const navGroups = [
    {
      label: "Explore",
      items: [
        { name: "Home", path: "/", icon: Home },
        { name: "Products Catalog", path: "/products", icon: Package },
      ],
    },
    ...(user
      ? [
          {
            label: "Khata & Activity",
            items: [
              { name: "My Transactions", path: "/transactions", icon: Receipt },
              { name: "Payments & Ledger", path: "/payments", icon: CreditCard },
              { name: "My Profile", path: "/settings/profile", icon: User },
              { name: "Change Password", path: "/settings/change-password", icon: KeyRound },
            ],
          },
        ]
      : []),
    {
      label: "Support & Info",
      items: [
        { name: "Help & Support", path: "/settings/help-support", icon: HelpCircle },
        { name: "About SmartShop", path: "/about-smartshop", icon: Sparkles },
        { name: "Developer", path: "/about", icon: Code },
      ],
    },
  ];

  const getLinkClass = ({ isActive }) =>
    `flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all duration-200 ${
      isActive
        ? "bg-[var(--app-accent-soft)] text-[var(--app-accent)] border border-[var(--app-accent-border)] shadow-[0_0_15px_var(--app-accent-soft)]"
        : "text-zinc-400 hover:text-white hover:bg-zinc-900/90 border border-transparent"
    }`;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50">
      {/* Backdrop overlay */}
      <div
        onClick={() => setIsOpen(false)}
        className="fixed inset-0 bg-black/80 backdrop-blur-sm transition-opacity duration-300 animate-fade-in-up"
        aria-hidden="true"
      />

      {/* Slide-out Sidebar Drawer */}
      <aside
        className="fixed inset-y-0 left-0 w-80 max-w-[85vw] bg-zinc-950/95 border-r border-white/10 shadow-[0_0_50px_rgba(0,0,0,0.8)] z-50 flex flex-col justify-between p-4 overflow-y-auto no-scrollbar backdrop-blur-2xl animate-fade-in-up"
        aria-label="Sidebar Navigation"
      >
        <div>
          {/* Header with Brand Logo & Close Button */}
          <div className="flex items-center justify-between pb-4 border-b border-white/5">
            <NavLink to="/" onClick={() => setIsOpen(false)}>
              <Logo size="sm" showBadge badgeText="Store" />
            </NavLink>

            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-zinc-900/90 text-zinc-300 hover:text-white hover:border-red-500/30 hover:bg-red-500/10 transition active:scale-95 shadow-sm"
              title="Close Menu"
              aria-label="Close sidebar drawer"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* User Profile Card or Guest Welcome Banner */}
          <div className="mt-4">
            {user ? (
              <div className="rounded-2xl border border-white/10 bg-gradient-to-br from-zinc-900/90 to-zinc-950/80 p-3.5 shadow-lg">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[var(--app-accent)] font-bold text-white text-sm shadow-[0_0_15px_var(--app-accent-glow)]">
                    {(user.name || user.username || "C").charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-xs font-bold text-white">
                      {user.name || user.username || "Valued Customer"}
                    </p>
                    <p className="truncate text-[11px] text-zinc-400">
                      {user.phone || user.email || "Active Customer"}
                    </p>
                    <div className="mt-1 flex items-center gap-1.5">
                      <span className="inline-flex items-center gap-1 rounded bg-emerald-500/15 border border-emerald-500/25 px-1.5 py-0.2 text-[9px] font-semibold text-emerald-400">
                        <ShieldCheck className="h-2.5 w-2.5" />
                        Verified Account
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="rounded-2xl border border-white/10 bg-zinc-900/60 p-3.5">
                <p className="text-xs font-bold text-white">Welcome to SmartShop</p>
                <p className="text-[11px] text-zinc-400 mt-0.5">
                  Sign in to track bills, payments & order history.
                </p>
                <div className="mt-3 flex items-center gap-2">
                  <NavLink
                    to="/login"
                    onClick={() => setIsOpen(false)}
                    className="flex-1 flex items-center justify-center gap-1.5 rounded-xl border border-white/10 bg-zinc-800/80 py-2 text-xs font-semibold text-white hover:bg-zinc-700 transition active:scale-95"
                  >
                    <LogIn className="h-3.5 w-3.5" />
                    <span>Login</span>
                  </NavLink>
                  <NavLink
                    to="/signup"
                    onClick={() => setIsOpen(false)}
                    className="flex-1 flex items-center justify-center gap-1.5 rounded-xl btn-primary py-2 text-xs font-bold transition active:scale-95"
                  >
                    <UserPlus className="h-3.5 w-3.5" />
                    <span>Register</span>
                  </NavLink>
                </div>
              </div>
            )}
          </div>

          {/* Navigation Groups */}
          <div className="mt-5 space-y-5">
            {navGroups.map((group) => (
              <div key={group.label}>
                <p className="px-3 mb-2 text-[10px] font-bold uppercase tracking-wider text-zinc-500">
                  {group.label}
                </p>
                <div className="space-y-1">
                  {group.items.map((item) => {
                    const Icon = item.icon;
                    return (
                      <NavLink
                        key={item.path}
                        to={item.path}
                        onClick={() => setIsOpen(false)}
                        className={getLinkClass}
                        title={item.name}
                      >
                        <div className="flex items-center gap-3">
                          <Icon className="h-4 w-4 shrink-0" />
                          <span className="truncate">{item.name}</span>
                        </div>
                        <ChevronRight className="h-3 w-3 opacity-40 group-hover:opacity-100 transition-opacity" />
                      </NavLink>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Sidebar Footer */}
        <div className="pt-4 mt-6 border-t border-white/5 space-y-2.5">
          {user ? (
            <button
              type="button"
              onClick={handleLogout}
              className="flex w-full items-center justify-center gap-2 rounded-xl border border-zinc-800 bg-zinc-900/80 px-3 py-2.5 text-xs font-semibold text-zinc-400 hover:border-red-500/40 hover:bg-red-500/10 hover:text-red-400 transition active:scale-95 shadow-sm"
              title="Sign Out"
            >
              <LogOut className="h-3.5 w-3.5" />
              <span>Sign Out</span>
            </button>
          ) : (
            <div className="flex items-center justify-between text-[11px] text-zinc-500 px-2">
              <span>Customer Portal</span>
              <span className="text-[10px] text-zinc-600">v2.0</span>
            </div>
          )}
        </div>
      </aside>
    </div>
  );
};

export default Sidebar;
