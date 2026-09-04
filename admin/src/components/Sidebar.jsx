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
  Shield,
  X,
} from "lucide-react";
import Logo from "./Logo";
import { authStorage } from "../services/api";

const parseJwt = (token) => {
  try {
    if (!token || typeof token !== "string") return null;
    const parts = token.split(".");
    if (parts.length !== 3) return null;
    const base64Url = parts[1];
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split("")
        .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
        .join("")
    );
    return JSON.parse(jsonPayload);
  } catch {
    return null;
  }
};

const Sidebar = ({
  isOpen,
  setIsOpen,
  isCollapsed,
  setIsCollapsed,
  user,
}) => {
  const navigate = useNavigate();

  // Robust Super Admin Detection (User State + Storage + JWT Token fallback)
  const token = authStorage.getToken();
  const storedUser = authStorage.getUser();
  const rawRole =
    user?.role ||
    user?.rawRole ||
    storedUser?.role ||
    storedUser?.rawRole ||
    (token ? parseJwt(token)?.role : "");
  const normalizedRole = String(rawRole || "")
    .toLowerCase()
    .replace(/[\s_-]/g, "");
  const isSuperAdmin =
    normalizedRole === "superadmin" ||
    normalizedRole === "superadministrator" ||
    normalizedRole.includes("superadmin");

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
      ],
    },
    ...(isSuperAdmin
      ? [
          {
            label: "Super Admin",
            isSuperAdminGroup: true,
            items: [
              { name: "Admin Accounts", path: "/admins", icon: ShieldCheck, superBadge: "Super" },
              { name: "System Activity Log", path: "/admin-activity", icon: History },
            ],
          },
        ]
      : []),
    {
      label: "System",
      items: [
        { name: "Settings", path: "/settings", icon: Settings },
        { name: "Help & Support", path: "/help-support", icon: HelpCircle },
      ],
    },
  ];

  // Helper function to render sidebar body for either Desktop or Mobile Drawer
  const renderContent = (isMobile = false) => {
    const collapsed = isMobile ? false : isCollapsed;

    const getLinkClass = ({ isActive }) =>
      `flex items-center ${
        collapsed ? "justify-center p-2.5" : "gap-3 px-3 py-2.5"
      } rounded-xl text-xs font-semibold transition-all duration-200 ${
        isActive
          ? "bg-[var(--app-accent-soft)] text-[var(--app-accent)] border border-[var(--app-accent-border)] shadow-[0_0_15px_var(--app-accent-soft)]"
          : "text-zinc-400 hover:text-white hover:bg-zinc-900/90 border border-transparent"
      }`;

    return (
      <div className="flex h-full flex-col justify-between p-3 sm:p-4 overflow-y-auto no-scrollbar">
        <div>
          {/* Brand Header */}
          <div
            className={`flex items-center ${
              collapsed ? "flex-col gap-3 justify-center" : "justify-between"
            } pb-4 border-b border-white/5`}
          >
            <div className="flex items-center justify-center">
              <Logo
                size="sm"
                showText={!collapsed}
                showBadge={!collapsed}
                badgeText={isSuperAdmin ? "Super" : "Admin"}
              />
            </div>

            {/* Desktop single collapse / expand toggle */}
            {!isMobile && (
              <button
                type="button"
                onClick={() => setIsCollapsed?.((prev) => !prev)}
                className="hidden lg:flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-zinc-900/90 text-zinc-300 hover:text-white hover:border-[var(--app-accent-border)] hover:bg-zinc-800 transition active:scale-95 shadow-sm group"
                title={collapsed ? "Expand Sidebar" : "Collapse Sidebar"}
                aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
              >
                {collapsed ? (
                  <ChevronRight className="h-4 w-4 text-[var(--app-accent)] group-hover:translate-x-0.5 transition-transform" />
                ) : (
                  <ChevronLeft className="h-4 w-4 group-hover:-translate-x-0.5 transition-transform" />
                )}
              </button>
            )}

            {/* Mobile close drawer button (< 1024px) */}
            {isMobile && (
              <button
                type="button"
                onClick={() => setIsOpen?.(false)}
                className="flex lg:hidden h-8 w-8 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-zinc-900/90 text-zinc-300 hover:text-white hover:border-red-500/30 hover:bg-red-500/10 transition active:scale-95 shadow-sm"
                title="Close Menu"
                aria-label="Close sidebar drawer"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          {/* Navigation Groups */}
          <div className="mt-5 space-y-6">
            {navGroups.map((group) => (
              <div key={group.label}>
                {!collapsed && (
                  <div className="flex items-center justify-between px-3 mb-2">
                    <p
                      className={`text-[10px] font-bold uppercase tracking-wider ${
                        group.isSuperAdminGroup
                          ? "text-amber-400/90 flex items-center gap-1.5"
                          : "text-zinc-500"
                      }`}
                    >
                      {group.isSuperAdminGroup && <Shield className="h-3 w-3 text-amber-400" />}
                      {group.label}
                    </p>
                    {group.isSuperAdminGroup && (
                      <span className="rounded bg-amber-500/10 border border-amber-500/20 px-1.5 py-0.2 text-[8px] font-bold text-amber-300 uppercase">
                        Master
                      </span>
                    )}
                  </div>
                )}
                <div className="space-y-1">
                  {group.items.map((item) => {
                    const Icon = item.icon;
                    return (
                      <NavLink
                        key={item.path}
                        to={item.path}
                        onClick={() => {
                          if (isMobile) setIsOpen?.(false);
                        }}
                        className={getLinkClass}
                        title={item.name}
                      >
                        <Icon className="h-4 w-4 shrink-0" />
                        {!collapsed && (
                          <span className="truncate">{item.name}</span>
                        )}
                        {!collapsed && item.highlight && (
                          <span className="ml-auto rounded-full bg-[var(--app-accent)]/20 px-2 py-0.5 text-[9px] font-bold text-[var(--app-accent)]">
                            POS
                          </span>
                        )}
                        {!collapsed && item.superBadge && (
                          <span className="ml-auto rounded-full bg-amber-500/20 px-2 py-0.5 text-[9px] font-bold text-amber-400">
                            {item.superBadge}
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
              collapsed ? "justify-center p-2" : "gap-3 p-2.5"
            } rounded-xl bg-zinc-900/60 border border-white/5`}
            title={collapsed ? `${user?.name || user?.username || "Admin"} (${user?.role || "Staff"})` : undefined}
          >
            <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${
              isSuperAdmin ? "bg-amber-500 text-black font-extrabold" : "bg-[var(--app-accent)] text-white font-bold"
            } text-xs shadow-sm`}>
              {(user?.name || user?.username || "A").charAt(0).toUpperCase()}
            </div>
            {!collapsed && (
              <div className="min-w-0 flex-1">
                <p className="truncate text-xs font-bold text-white">
                  {user?.name || user?.username || "Admin"}
                </p>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className={`inline-block rounded px-1.5 py-0.2 text-[9px] font-semibold uppercase ${
                    isSuperAdmin ? "bg-amber-500/20 text-amber-300 border border-amber-500/30" : "bg-white/10 text-zinc-300"
                  }`}>
                    {isSuperAdmin ? "Super Admin" : (user?.role || "Admin")}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Logout button */}
          <button
            type="button"
            onClick={handleLogout}
            className={`flex w-full items-center justify-center ${
              collapsed ? "p-2.5" : "gap-2 px-3 py-2"
            } rounded-xl border border-zinc-800 bg-zinc-900/80 text-xs font-semibold text-zinc-400 hover:border-red-500/40 hover:bg-red-500/10 hover:text-red-400 transition active:scale-95`}
            title="Sign Out"
          >
            <LogOut className="h-3.5 w-3.5 shrink-0" />
            {!collapsed && <span>Sign Out</span>}
          </button>
        </div>
      </div>
    );
  };

  return (
    <>
      {/* Desktop Persistent Sidebar (>= 1024px) */}
      <aside
        className={`hidden lg:flex flex-col shrink-0 border-r border-white/5 bg-zinc-950/90 backdrop-blur-2xl transition-all duration-300 h-screen z-40 ${
          isCollapsed ? "w-20" : "w-64"
        }`}
      >
        {renderContent(false)}
      </aside>

      {/* Mobile & Tablet Slide-over Drawer (< 1024px) */}
      {isOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          {/* Backdrop overlay */}
          <div
            onClick={() => setIsOpen(false)}
            className="fixed inset-0 bg-black/75 backdrop-blur-sm transition-opacity animate-fade-in-up"
          />

          {/* Slide-out Panel (Always rendered in full expanded mode) */}
          <div className="fixed inset-y-0 left-0 w-72 max-w-[85vw] bg-zinc-950 border-r border-white/10 shadow-2xl z-50 animate-fade-in-up">
            {renderContent(true)}
          </div>
        </div>
      )}
    </>
  );
};

export default Sidebar;
