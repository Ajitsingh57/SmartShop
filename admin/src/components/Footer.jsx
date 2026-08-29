import React from "react";
import { Link } from "react-router-dom";

const Footer = () => {
  const currentYear = new Date().getFullYear();
  const linkClass = "text-xs text-zinc-500 transition hover:text-[var(--app-accent)] whitespace-nowrap";

  return (
    <footer
      className="mt-auto border-t"
      style={{
        borderColor: "var(--app-border)",
        backgroundColor: "var(--app-surface)",
        color: "var(--app-text)",
      }}
    >
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 md:px-10 lg:px-12">
        {/* Mobile footer layout */}
        <div className="sm:hidden">
          <div className="flex items-start gap-3">
            <div
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-sm font-bold"
              style={{
                backgroundColor: "var(--app-accent-soft)",
                color: "var(--app-accent)",
              }}
            >
              S
            </div>

            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-x-2">
                <h2 className="text-sm font-bold text-white">SmartShop</h2>
                <span className="text-xs text-zinc-700">|</span>
                <span className="text-xs text-zinc-500">Shop Management System</span>
              </div>
              <p className="mt-1 text-[11px] leading-5 text-zinc-600">
                SmartShop helps manage daily shop operations, records and administrative activities efficiently.
              </p>
            </div>
          </div>

          <div
            className="mt-5 border-y py-4"
            style={{ borderColor: "var(--app-border)" }}
          >
            <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-3">
              <Link
                to="/about"
                className="text-xs font-medium"
                style={{ color: "var(--app-accent)" }}
              >
                About SmartShop
              </Link>
              <span className="text-zinc-700">•</span>
              <Link to="/help-support" className={linkClass}>Help & Support</Link>
              <span className="text-zinc-700">•</span>
              <Link to="/privacy" className={linkClass}>Privacy Policy</Link>
              <span className="text-zinc-700">•</span>
              <Link to="/terms" className={linkClass}>Terms & Conditions</Link>
            </div>
          </div>

          <div className="mt-4 text-center">
            <p className="text-[10px] text-zinc-600">© {currentYear} SmartShop. All rights reserved.</p>
            <p className="mt-1 text-[10px] text-zinc-700">Built for smarter shop management.</p>
          </div>
        </div>

        {/* Tablet footer layout */}
        <div className="hidden sm:block lg:hidden">
          <div className="flex items-center justify-between gap-8">
            <div className="flex min-w-0 items-center gap-3">
              <div
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-sm font-bold"
                style={{
                  backgroundColor: "var(--app-accent-soft)",
                  color: "var(--app-accent)",
                }}
              >
                S
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h2 className="text-sm font-bold text-white">SmartShop</h2>
                  <span className="text-xs text-zinc-700">|</span>
                  <span className="text-xs text-zinc-500">Shop Management System</span>
                </div>
                <p className="mt-1 text-[11px] text-zinc-600">
                  SmartShop helps manage daily shop operations, records and administrative activities efficiently.
                </p>
              </div>
            </div>

            <Link
              to="/about"
              className="shrink-0 whitespace-nowrap text-xs font-medium"
              style={{ color: "var(--app-accent)" }}
            >
              About SmartShop →
            </Link>
          </div>

          <div
            className="mt-5 flex items-center justify-center gap-6 border-y py-3"
            style={{ borderColor: "var(--app-border)" }}
          >
            <Link to="/help-support" className={linkClass}>Help & Support</Link>
            <Link to="/privacy" className={linkClass}>Privacy Policy</Link>
            <Link to="/terms" className={linkClass}>Terms & Conditions</Link>
          </div>

          <div className="mt-4 flex items-center justify-between">
            <p className="text-[10px] text-zinc-600">© {currentYear} SmartShop. All rights reserved.</p>
            <p className="text-[10px] text-zinc-700">Built for smarter shop management.</p>
          </div>
        </div>

        {/* Desktop footer layout */}
        <div className="hidden lg:flex lg:items-center lg:justify-between lg:gap-8">
          <div className="flex min-w-0 items-center gap-3">
            <div
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-sm font-bold"
              style={{
                backgroundColor: "var(--app-accent-soft)",
                color: "var(--app-accent)",
              }}
            >
              S
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-bold text-white">SmartShop</h2>
                <span className="text-xs text-zinc-700">|</span>
                <span className="text-xs text-zinc-500">Shop Management System</span>
              </div>
              <p className="mt-1 text-[11px] text-zinc-600">
                SmartShop helps manage daily shop operations, records and administrative activities efficiently.
              </p>
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-6">
            <Link
              to="/about"
              className="whitespace-nowrap text-xs font-medium"
              style={{ color: "var(--app-accent)" }}
            >
              About SmartShop →
            </Link>
            <Link to="/help-support" className={linkClass}>Help & Support</Link>
            <Link to="/privacy" className={linkClass}>Privacy Policy</Link>
            <Link to="/terms" className={linkClass}>Terms & Conditions</Link>
          </div>

          <div className="shrink-0 text-right">
            <p className="text-[10px] text-zinc-600">© {currentYear} SmartShop</p>
            <p className="mt-0.5 text-[10px] text-zinc-700">Built for smarter shop management.</p>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;