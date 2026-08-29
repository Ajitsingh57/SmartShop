import React from "react";
import { Link } from "react-router-dom";

const Footer = () => {
  return (
    <footer className="mt-16 border-t border-white/5 bg-zinc-950">
      <div className="mx-auto flex max-w-7xl flex-col items-center gap-8 px-5 py-10 text-center md:flex-row md:justify-between md:text-left">
        {/* Brand */}
        <div>
          <h3 className="mb-2.5 text-xl font-bold text-[var(--app-accent)]">
            SmartShop
          </h3>

          <p className="text-sm text-zinc-400">
            Digital Shop Management & Customer Credit Ledger.
          </p>
        </div>

        {/* Footer Links */}
        <div className="flex flex-wrap items-center justify-center gap-6">
          <Link
            to="/about-smartshop"
            className="text-sm text-zinc-400 transition-colors duration-300 hover:text-white"
          >
            About Platform
          </Link>

          <Link
            to="/settings/help-support"
            className="text-sm text-zinc-400 transition-colors duration-300 hover:text-white"
          >
            Help & Support
          </Link>

          <Link
            to="/about"
            className="text-sm text-zinc-400 transition-colors duration-300 hover:text-white"
          >
            Meet the Team
          </Link>
        </div>

        {/* Copyright */}
        <div className="text-sm text-zinc-400">
          &copy; {new Date().getFullYear()} SmartShop. All rights reserved.
        </div>
      </div>
    </footer>
  );
};

export default Footer;