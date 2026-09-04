import React from "react";
import { NavLink, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  ShoppingCart,
  Users,
  CreditCard,
  Wallet,
  Receipt,
  Package,
  BellRing,
  Layers,
  RotateCcw,
  ShieldCheck,
  History,
  Settings,
  HelpCircle,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  ExternalLink,
} from "lucide-react";
import Logo from "./Logo";
import { authStorage } from "../services/api";

const Sidebar = ({
  isOpen,
  setIsOpen,
  isCollapsed,
  setIsCollapsed,
  user,
}) => {
  const navigate = useNavigate();
  const isSuperAdmin = user?.role?.toLowerCase() === "superadmin";

  const handleLogout = () => {
    authStorage.clear();
    navigate("/login");
  };

  const navGroups = [
    {
      label: "Main",
      items: [
        { name: "Dashboard", path: "/dashboard", icon: LayoutDashboard },
        { name: "POS Billing / Sales", path: "/sales", icon: ShoppingCart, highlight: true },
      ],
    },
    {
      label: "Khata & CRM",
      items: [
        { name: "Customers", path: "/customers", icon: Users },
        { name: "Credit Ledger", path: "/credits", icon: CreditCard },
        { name: "Payments", path: "/payments", icon: Wallet },
        { name: "Transactions", path: "/transactions", icon: Receipt },
      ],
    },
    {
      label: "Inventory",
      items: [
        { name: "Products Catalog", path: "/products", icon: Package },
        { name: "Restock Requests", path: "/product-requests", icon: BellRing },
        { name: "Categories", path: "/categories", icon: Layers },
      ],
    },
    {
      label: "Operations",
      items: [
        { name: "Returns / Refunds", path: "/returns", icon: RotateCcw },
        ...(isSuperAdmin
          ? [
              { name: "Admins Staff", path: "/admins", icon: ShieldCheck },
              { name: "Activity Log", path: "/admin-activity", icon: History },
            ]
          : []),
      ],
    },
    {
      label: "System",
      items: [
        { name: "Settings", path: "/settings", icon: Settings },
        { name: "Help & Support", path: "/help-support", icon: HelpCircle },
      ],
    },
  ];

  const linkClass = ({ isActive }) =>
    `flex items-center ${
      isCollapsed ? "justify-center p-2.5" : "gap-3 px-3 py-2.5"
    } rounded-xl text-xs font-semibold transition-all duration-200 ${
      isActive
        ? "bg-[var(--app-accent-soft)] text-[var(--app-accent)] border border-[var(--app-accent-border)] shadow-[0_0_15px_var(--app-accent-soft)]"
        : "text-zinc-400 hover:text-white hover:bg-zinc-900 border border-transparent"
    }`;

  const sidebarContent = (
    <div className="flex h-full flex-col justify-between p-3 sm:p-4 overflow-y-auto no-scrollbar">
      <div>
        {/* Brand Header */}
        <div
          className={`flex items-center ${
            isCollapsed ? "flex-col gap-3 justify-center" : "justify-between"
          } pb-4 border-b border-white/5`}
        >
          <div className="flex items-center justify-center">
            <Logo
              size="sm"
              showText={!isCollapsed}
              showBadge={!isCollapsed}
              badgeText="Admin"
            />
          </div>

          {/* Desktop collapse / expand toggle */}
          <button
            type="button"
            onClick={() => setIsCollapsed?.((prev) => !prev)}
            className="hidden lg:flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-zinc-900/90 text-zinc-300 hover:text-white hover:border-[var(--app-accent-border)] hover:bg-zinc-800 transition active:scale-95 shadow-sm group"
            title={isCollapsed ? "Expand Sidebar (Normal View)" : "Collapse Sidebar (Compact View)"}
            aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {isCollapsed ? (
              <ChevronRight className="h-4 w-4 text-[var(--app-accent)] group-hover:translate-x-0.5 transition-transform" />
            ) : (
              <ChevronLeft className="h-4 w-4 group-hover:-translate-x-0.5 transition-transform" />
            )}
          </button>
        </div>

        {/* Navigation Groups */}
        <div className="mt-5 space-y-6">
          {navGroups.map((group) => (
            <div key={group.label}>
              {!isCollapsed && (
                <p className="px-3 mb-2 text-[10px] font-bold uppercase tracking-wider text-zinc-500">
                  {group.label}
                </p>
              )}
              <div className="space-y-1">
                {group.items.map((item) => {
                  const Icon = item.icon;
                  return (
                    <NavLink
                      key={item.path}
                      to={item.path}
                      onClick={() => setIsOpen?.(false)}
                      className={linkClass}
                      title={item.name}
                    >
                      <Icon className="h-4 w-4 shrink-0" />
                      {!isCollapsed && (
                        <span className="truncate">{item.name}</span>
                      )}
                      {!isCollapsed && item.highlight && (
                        <span className="ml-auto rounded-full bg-[var(--app-accent)]/20 px-2 py-0.5 text-[9px] font-bold text-[var(--app-accent)]">
                          POS
                        </span>
                      )}
                    </NavLink>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* User Profile & Footer Section */}
      <div className="pt-4 mt-6 border-t border-white/5 space-y-2.5">
        {/* Admin profile snippet */}
        <div
          className={`flex items-center ${
            isCollapsed ? "justify-center p-2" : "gap-3 p-2.5"
          } rounded-xl bg-zinc-900/60 border border-white/5`}
          title={isCollapsed ? `${user?.name || user?.username || "Admin"} (${user?.role || "Staff"})` : undefined}
        >
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[var(--app-accent)] text-xs font-bold text-white shadow-sm">
            {(user?.name || user?.username || "A").charAt(0).toUpperCase()}
          </div>
          {!isCollapsed && (
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-bold text-white">
                {user?.name || user?.username || "Admin"}
              </p>
              <span className="inline-block rounded px-1.5 py-0.2 text-[9px] font-semibold bg-white/10 text-zinc-300 uppercase">
                {user?.role || "Staff"}
              </span>
            </div>
          )}
        </div>

        {/* Expand Sidebar Quick Action Button when collapsed */}
        {isCollapsed && (
          <button
            type="button"
            onClick={() => setIsCollapsed?.(false)}
            className="hidden lg:flex w-full items-center justify-center p-2 rounded-xl border border-[var(--app-accent-border)] bg-[var(--app-accent-soft)] text-[var(--app-accent)] hover:bg-[var(--app-accent)] hover:text-white transition active:scale-95 shadow-sm"
            title="Expand Sidebar"
            aria-label="Expand Sidebar"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        )}

        {/* Logout button */}
        <button
          type="button"
          onClick={handleLogout}
          className={`flex w-full items-center justify-center ${
            isCollapsed ? "p-2.5" : "gap-2 px-3 py-2"
          } rounded-xl border border-zinc-800 bg-zinc-900/80 text-xs font-semibold text-zinc-400 hover:border-red-500/40 hover:bg-red-500/10 hover:text-red-400 transition active:scale-95`}
          title="Sign Out"
        >
          <LogOut className="h-3.5 w-3.5 shrink-0" />
          {!isCollapsed && <span>Sign Out</span>}
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Persistent Sidebar (>= 1024px) */}
      <aside
        className={`hidden lg:flex flex-col shrink-0 border-r border-white/5 bg-zinc-950/90 backdrop-blur-2xl transition-all duration-300 sticky top-0 h-screen z-40 ${
          isCollapsed ? "w-20" : "w-64"
        }`}
      >
        {sidebarContent}
      </aside>

      {/* Mobile & Tablet Slide-over Drawer (< 1024px) */}
      {isOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          {/* Backdrop overlay */}
          <div
            onClick={() => setIsOpen(false)}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm transition-opacity"
          />

          {/* Slide-out Panel */}
          <div className="fixed inset-y-0 left-0 w-72 max-w-[85vw] bg-zinc-950 border-r border-white/10 shadow-2xl z-50 animate-fade-in-up">
            {sidebarContent}
          </div>
        </div>
      )}
    </>
  );
};

export default Sidebar;
