import React, { useEffect, useState } from "react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import {
  Menu,
  ShoppingCart,
  User,
  LogOut,
  Sparkles,
  LogIn,
  UserPlus,
} from "lucide-react";
import { authStorage } from "../services/api";
import Logo from "./Logo";
import ThemeToggle from "./ThemeToggle";

const Navbar = ({ onToggleSidebar }) => {
  const [user, setUser] = useState(() => authStorage.getUser());
  const [isVisible, setIsVisible] = useState(true);
  const location = useLocation();
  const navigate = useNavigate();

  // Smart Auto-Hide Scroll Listener (Scroll Down = Hide, Scroll Up = Show)
  useEffect(() => {
    let lastScrollY = window.scrollY;
    let ticking = false;

    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          const currentScrollY = window.scrollY;

          // Always visible at the top of the page
          if (currentScrollY <= 40) {
            setIsVisible(true);
          } else if (currentScrollY > lastScrollY && currentScrollY - lastScrollY > 8) {
            // Scrolling down -> Hide on mobile
            setIsVisible(false);
          } else if (lastScrollY - currentScrollY > 6) {
            // Scrolling up -> Reveal immediately
            setIsVisible(true);
          }

          lastScrollY = Math.max(0, currentScrollY);
          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Reset visibility upon route change
  useEffect(() => {
    setIsVisible(true);
  }, [location.pathname]);

  // Synchronize authenticated customer state
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
    navigate("/");
  };

  // Public items for desktop
  const publicNavItems = [
    { name: "Home", path: "/" },
    { name: "Products", path: "/products" },
  ];

  // Customer items for desktop
  const customerNavItems = [
    { name: "Transactions", path: "/transactions" },
    { name: "Payments", path: "/payments" },
    { name: "Settings", path: "/settings" },
  ];

  const visibleNavItems = user
    ? [...publicNavItems, ...customerNavItems]
    : publicNavItems;

  const desktopLinkClass = ({ isActive }) =>
    `relative px-3 py-1.5 text-xs font-semibold rounded-xl transition-all duration-200 ${
      isActive
        ? "bg-[var(--app-accent-soft)] text-[var(--app-accent)] border border-[var(--app-accent-border)] shadow-[0_0_12px_var(--app-accent-soft)]"
        : "text-zinc-400 hover:text-white hover:bg-zinc-900/80 border border-transparent"
    }`;

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-40 border-b border-white/5 bg-zinc-950/85 px-3 py-2.5 sm:px-6 sm:py-3 shadow-[0_4px_25px_rgba(0,0,0,0.4)] backdrop-blur-2xl transition-transform duration-300 ease-in-out ${
        isVisible ? "translate-y-0" : "-translate-y-full lg:translate-y-0"
      }`}
    >
      <div className="flex items-center justify-between gap-4 max-w-7xl mx-auto">
        {/* Left: Mobile Sidebar Trigger & Brand Logo */}
        <div className="flex items-center gap-2.5 sm:gap-4">
          {/* Mobile hamburger (< 1024px) */}
          <button
            type="button"
            onClick={onToggleSidebar}
            className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 bg-zinc-900/80 text-white lg:hidden hover:border-[var(--app-accent-border)] hover:bg-zinc-800 transition active:scale-95 shadow-sm"
            aria-label="Open sidebar menu"
            title="Open Menu"
          >
            <Menu className="h-5 w-5 text-zinc-200" />
          </button>

          <NavLink
            to="/"
            onClick={() => {
              window.scrollTo({ top: 0, left: 0, behavior: "smooth" });
            }}
            className="transition-transform active:scale-95 cursor-pointer"
            title="SmartShop Home - Scroll to top"
          >
            <Logo size="sm" showBadge badgeText="Store" />
          </NavLink>
        </div>

        {/* Center: Desktop Navigation Bar (>= 1024px) */}
        <nav className="hidden lg:flex items-center gap-1.5 rounded-2xl border border-white/5 bg-zinc-900/50 p-1 backdrop-blur-md">
          {visibleNavItems.map((item) => (
            <NavLink key={item.path} to={item.path} className={desktopLinkClass}>
              {item.name}
            </NavLink>
          ))}
        </nav>

        {/* Right: Actions, Theme Toggle & Mobile Compact Trigger */}
        <div className="flex items-center gap-2 sm:gap-2.5">
          {/* Theme Switcher Toggle (Desktop & Tablet) */}
          <ThemeToggle className="hidden sm:inline-flex" />

          {user ? (
            <>
              {/* Desktop Profile Pill */}
              <NavLink
                to="/settings/profile"
                className="hidden sm:flex items-center gap-2 rounded-xl border border-white/10 bg-zinc-900/80 px-3 py-1.5 text-xs font-semibold text-zinc-300 hover:border-[var(--app-accent-border)] hover:text-white hover:bg-zinc-800/90 transition shadow-sm"
                title="View Profile"
              >
                <div className="flex h-5 w-5 items-center justify-center rounded-md bg-[var(--app-accent)] font-bold text-white text-[10px]">
                  {(user.name || user.username || "C").charAt(0).toUpperCase()}
                </div>
                <span className="max-w-[120px] truncate">
                  {user.name || user.username || "Customer"}
                </span>
              </NavLink>

              {/* Desktop Logout Button */}
              <button
                type="button"
                onClick={handleLogout}
                className="hidden sm:flex h-9 w-9 items-center justify-center rounded-xl border border-zinc-800 bg-zinc-900/80 text-zinc-400 hover:border-red-500/40 hover:bg-red-500/10 hover:text-red-400 transition active:scale-95 shadow-sm"
                title="Sign out"
              >
                <LogOut className="h-4 w-4" />
              </button>

              {/* Mobile Profile Avatar Link */}
              <NavLink
                to="/settings/profile"
                className="flex sm:hidden h-8 w-8 items-center justify-center rounded-xl bg-[var(--app-accent)] text-white font-bold text-xs shadow-md active:scale-95"
                title="My Profile"
              >
                {(user.name || user.username || "C").charAt(0).toUpperCase()}
              </NavLink>
            </>
          ) : (
            <>
              {/* Desktop Guest Auth Actions */}
              <div className="hidden sm:flex items-center gap-2">
                <NavLink
                  to="/login"
                  className="rounded-xl border border-white/10 bg-zinc-900/80 px-3.5 py-1.5 text-xs font-semibold text-zinc-300 hover:border-[var(--app-accent-border)] hover:text-white hover:bg-zinc-800/90 transition shadow-sm"
                >
                  Login
                </NavLink>

                <NavLink
                  to="/signup"
                  className="rounded-xl btn-primary px-3.5 py-1.5 text-xs font-bold shadow-md transition active:scale-95"
                >
                  Register
                </NavLink>
              </div>

              {/* Mobile Guest Compact Login Button */}
              <NavLink
                to="/login"
                className="flex sm:hidden items-center gap-1 rounded-xl btn-primary px-3 py-1.5 text-xs font-bold shadow-md active:scale-95"
              >
                <LogIn className="h-3.5 w-3.5" />
                <span>Login</span>
              </NavLink>
            </>
          )}
        </div>
      </div>
    </header>
  );
};

export default Navbar;