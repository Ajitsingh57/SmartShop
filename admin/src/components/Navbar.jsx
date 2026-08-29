import React, { useEffect, useState } from "react";
import {
  NavLink,
  useLocation,
  useNavigate,
} from "react-router-dom";
import { authStorage } from "../services/api";

const Navbar = () => {
  const [menuOpen, setMenuOpen] = useState(false);
  const [user, setUser] = useState(null);

  const location = useLocation();
  const navigate = useNavigate();

  // Load authenticated admin user
  useEffect(() => {
    const currentUser = authStorage.getUser();
    const token = authStorage.getToken();

    if (token) {
      setUser(currentUser || { name: "Admin" });
    } else {
      setUser(null);
    }
  }, [location.pathname]);

  // Close mobile drawer on route navigation
  useEffect(() => {
    setMenuOpen(false);
  }, [location.pathname]);

  const navItems = [
    { name: "Dashboard", path: "/dashboard" },
    { name: "Customers", path: "/customers" },
    { name: "Products", path: "/products" },
    { name: "Sales", path: "/sales" },
    { name: "Payments", path: "/payments" },
    { name: "Credits", path: "/credits" },
    { name: "Returns", path: "/returns" },
    { name: "Transactions", path: "/transactions" },
    { name: "Settings", path: "/settings" },
  ];

  const isSuperAdmin = user?.role?.toLowerCase() === "superadmin";

  const handleLogout = () => {
    authStorage.clear();
    setUser(null);
    setMenuOpen(false);
    navigate("/login");
  };

  const linkClass = ({ isActive }) =>
    `relative text-[14px] 2xl:text-[15px] font-medium transition-all duration-300 ${
      isActive
        ? "text-white after:w-full"
        : "text-zinc-400 hover:text-white after:w-0"
    } after:absolute after:left-0 after:-bottom-2 after:h-[2px] after:w-0 after:rounded-full after:transition-all after:duration-300 after:bg-[var(--app-accent)] hover:after:w-full`;

  return (
    <nav
      className="sticky top-0 z-50 border-b border-white/5 bg-zinc-950/75 px-4 py-3.5 shadow-[0_4px_30px_rgba(0,0,0,0.5)] backdrop-blur-2xl sm:px-6 md:px-8 lg:px-12"
    >
      <div className="flex items-center justify-between">
        {/* Brand logo */}
        <NavLink to="/dashboard" className="flex items-center gap-2">
          <div
            className="flex h-9 w-9 sm:h-10 sm:w-10 shrink-0 items-center justify-center rounded-full bg-[var(--app-accent)] text-base sm:text-lg font-bold text-white shadow-lg"
            style={{ boxShadow: "0 10px 25px var(--app-accent-soft)" }}
          >
            S
          </div>
          <span className="text-xl font-bold tracking-tight text-white sm:text-2xl">
            SmartShop<span className="text-[var(--app-accent)]">.</span>
          </span>
        </NavLink>

        {/* Desktop navigation items (xl and above for 10+ nav items) */}
        <div className="hidden items-center gap-5 2xl:gap-7 xl:flex">
          {navItems.map((item) => (
            <NavLink key={item.path} to={item.path} className={linkClass}>
              {item.name}
            </NavLink>
          ))}

          {isSuperAdmin && (
            <NavLink to="/admins" className={linkClass}>
              Admins
            </NavLink>
          )}

          {user ? (
            <div className="ml-2 flex items-center gap-3">
              <NavLink
                to="/profile"
                className="max-w-[130px] truncate text-xs font-medium text-zinc-300 transition-colors hover:text-[var(--app-accent)]"
                title="View Profile"
              >
                {user.name}
              </NavLink>

              <button
                type="button"
                onClick={handleLogout}
                className="rounded-lg border border-zinc-800 bg-zinc-900/80 px-3 py-1.5 text-xs font-semibold text-zinc-300 transition-all hover:border-red-500/40 hover:bg-red-500/10 hover:text-red-400"
              >
                Logout
              </button>
            </div>
          ) : (
            <NavLink
              to="/login"
              className="rounded-lg bg-[var(--app-accent)] px-4 py-2 text-xs font-semibold text-white transition hover:opacity-90"
            >
              Login
            </NavLink>
          )}
        </div>

        {/* Mobile & Tablet menu trigger toggle */}
        <button
          type="button"
          onClick={() => setMenuOpen(!menuOpen)}
          className="flex h-10 w-10 items-center justify-center rounded-lg border border-white/10 bg-zinc-900/70 text-white xl:hidden backdrop-blur-md transition hover:border-white/20 hover:bg-zinc-900/90"
          aria-label="Toggle navigation menu"
        >
          <span className="text-xl">{menuOpen ? "✕" : "☰"}</span>
        </button>
      </div>

      {/* Mobile & Tablet Drawer Menu with half transparent blur background */}
      <div
        className={`overflow-hidden transition-all duration-300 xl:hidden ${
          menuOpen ? "max-h-[85vh] pt-4 opacity-100" : "max-h-0 pt-0 opacity-0"
        }`}
      >
        <div className="rounded-2xl border border-white/10 bg-zinc-950/65 p-4 shadow-[0_12px_40px_rgba(0,0,0,0.6)] backdrop-blur-2xl max-h-[80vh] overflow-y-auto">
          <div className="flex flex-col items-center gap-1.5">
            {navItems.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={() => setMenuOpen(false)}
                className={({ isActive }) =>
                  `w-full max-w-[280px] rounded-lg px-4 py-2.5 text-center text-sm font-medium transition-all duration-200 ${
                    isActive
                      ? "bg-[var(--app-accent-soft)] text-[var(--app-accent)] font-semibold border border-[var(--app-accent-border)] backdrop-blur-sm"
                      : "text-zinc-300 hover:bg-white/10 hover:text-white"
                  }`
                }
              >
                {item.name}
              </NavLink>
            ))}

            {isSuperAdmin && (
              <NavLink
                to="/admins"
                onClick={() => setMenuOpen(false)}
                className={({ isActive }) =>
                  `w-full max-w-[280px] rounded-lg px-4 py-2.5 text-center text-sm font-medium transition-all duration-200 ${
                    isActive
                      ? "bg-[var(--app-accent-soft)] text-[var(--app-accent)] font-semibold border border-[var(--app-accent-border)] backdrop-blur-sm"
                      : "text-zinc-300 hover:bg-white/10 hover:text-white"
                  }`
                }
              >
                Admins Management
              </NavLink>
            )}

            {user ? (
              <div className="mt-3 w-full max-w-[280px] border-t border-white/10 pt-3">
                <NavLink
                  to="/profile"
                  onClick={() => setMenuOpen(false)}
                  className="mb-2 block rounded-lg bg-white/[0.05] border border-white/5 px-4 py-2.5 text-center text-sm font-medium text-zinc-300 backdrop-blur-md transition-colors hover:bg-[var(--app-accent-soft)] hover:text-[var(--app-accent)]"
                >
                  My Profile ({user.name})
                </NavLink>

                <button
                  type="button"
                  onClick={handleLogout}
                  className="w-full rounded-lg border border-zinc-700/60 bg-zinc-900/60 px-4 py-2.5 text-center text-sm font-medium text-zinc-300 backdrop-blur-md transition-all hover:border-red-500/40 hover:bg-red-500/10 hover:text-red-400"
                >
                  Logout
                </button>
              </div>
            ) : (
              <div className="mt-3 w-full max-w-[280px] border-t border-white/10 pt-3">
                <NavLink
                  to="/login"
                  onClick={() => setMenuOpen(false)}
                  className={({ isActive }) =>
                    `block w-full rounded-lg px-4 py-2.5 text-center text-sm font-medium transition-all ${
                      isActive
                        ? "bg-[var(--app-accent-soft)] text-[var(--app-accent)]"
                        : "text-zinc-400 hover:bg-white/10 hover:text-white"
                    }`
                  }
                >
                  Login
                </NavLink>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;