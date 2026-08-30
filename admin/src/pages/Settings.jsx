import React from "react";
import { Link } from "react-router-dom";

const Settings = () => {
  const accentColors = [
    {
      name: "Orange",
      value: "#f97316",
      soft: "rgba(249,115,22,0.10)",
      border: "rgba(249,115,22,0.25)",
    },
    {
      name: "Blue",
      value: "#3b82f6",
      soft: "rgba(59,130,246,0.10)",
      border: "rgba(59,130,246,0.25)",
    },
    {
      name: "Purple",
      value: "#a855f7",
      soft: "rgba(168,85,247,0.10)",
      border: "rgba(168,85,247,0.25)",
    },
    {
      name: "Green",
      value: "#22c55e",
      soft: "rgba(34,197,94,0.10)",
      border: "rgba(34,197,94,0.25)",
    },
    {
      name: "Cyan",
      value: "#06b6d4",
      soft: "rgba(6,182,212,0.10)",
      border: "rgba(6,182,212,0.25)",
    },
    {
      name: "Pink",
      value: "#ec4899",
      soft: "rgba(236,72,153,0.10)",
      border: "rgba(236,72,153,0.25)",
    },
  ];

  // Update root CSS theme variables and persist in localStorage
  const handleAccentChange = (color) => {
    document.documentElement.style.setProperty("--app-accent", color.value);
    document.documentElement.style.setProperty("--app-accent-soft", color.soft);
    document.documentElement.style.setProperty("--app-accent-border", color.border);
    document.documentElement.style.setProperty("--app-accent-hover", color.value);
    localStorage.setItem("smartshopAccent", JSON.stringify(color));
  };

  return (
    <div
      className="min-h-screen w-full px-4 py-6 sm:px-6 md:px-10 lg:px-12"
      style={{
        backgroundColor: "var(--app-bg)",
        color: "var(--app-text)",
      }}
    >
      <div className="mx-auto max-w-5xl">
        <div className="mb-7">
          <p className="mb-2 text-sm font-medium" style={{ color: "var(--app-accent)" }}>
            Administration
          </p>
          <h1 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
            Settings
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-zinc-500 sm:text-base">
            Manage your SmartShop preferences and explore information about the shop management system.
          </p>
        </div>

        <div className="space-y-6">
          {/* Appearance and accent color preferences */}
          <section
            className="overflow-hidden rounded-xl border p-5 sm:p-6"
            style={{
              borderColor: "var(--app-border)",
              backgroundColor: "var(--app-surface)",
            }}
          >
            <div className="mb-6">
              <div className="flex items-center gap-3">
                <div
                  className="flex h-10 w-10 items-center justify-center rounded-lg text-base font-bold"
                  style={{
                    backgroundColor: "var(--app-accent-soft)",
                    color: "var(--app-accent)",
                  }}
                >
                  ◉
                </div>
                <div>
                  <h2 className="text-base font-semibold text-white">Appearance</h2>
                  <p className="mt-1 text-xs text-zinc-500">
                    Customize the visual appearance of the admin panel.
                  </p>
                </div>
              </div>
            </div>

            <div
              className="rounded-xl border p-5"
              style={{
                borderColor: "var(--app-border)",
                backgroundColor: "var(--app-surface-light)",
              }}
            >
              <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <h3 className="text-sm font-semibold text-zinc-200">Accent Color</h3>
                  <p className="mt-1 max-w-lg text-xs leading-5 text-zinc-600">
                    Choose the primary accent color used throughout the SmartShop admin panel.
                  </p>
                </div>

                <div
                  className="rounded-lg px-3 py-2 text-xs font-medium"
                  style={{
                    backgroundColor: "var(--app-accent-soft)",
                    color: "var(--app-accent)",
                  }}
                >
                  Theme
                </div>
              </div>

              <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-6">
                {accentColors.map((color) => (
                  <button
                    key={color.name}
                    type="button"
                    onClick={() => handleAccentChange(color)}
                    className="group rounded-xl border p-3 text-left transition-all duration-200 hover:-translate-y-0.5"
                    style={{
                      borderColor: "var(--app-border)",
                      backgroundColor: "var(--app-surface)",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = color.border;
                      e.currentTarget.style.backgroundColor = color.soft;
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = "var(--app-border)";
                      e.currentTarget.style.backgroundColor = "var(--app-surface)";
                    }}
                  >
                    <div
                      className="mb-3 h-8 w-8 rounded-full"
                      style={{ backgroundColor: color.value }}
                    />
                    <p className="text-xs font-medium text-zinc-300">{color.name}</p>
                  </button>
                ))}
              </div>

              <div
                className="mt-5 rounded-lg border p-4"
                style={{
                  borderColor: "var(--app-accent-border)",
                  backgroundColor: "var(--app-accent-soft)",
                }}
              >
                <div className="flex items-start gap-3">
                  <div
                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-xs font-bold"
                    style={{
                      backgroundColor: "var(--app-accent)",
                      color: "#fff",
                    }}
                  >
                    ✓
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-zinc-300">
                      Accent color preference
                    </p>
                    <p className="mt-1 text-[11px] leading-5 text-zinc-600">
                      Your selected accent color is used for buttons, highlights, borders and other interactive elements across the admin panel.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* About SmartShop shortcut */}
          <section
            className="overflow-hidden rounded-xl border"
            style={{
              borderColor: "var(--app-border)",
              backgroundColor: "var(--app-surface)",
            }}
          >
            <div className="flex flex-col gap-5 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
              <div className="flex items-start gap-4">
                <div
                  className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-lg font-bold"
                  style={{
                    backgroundColor: "var(--app-accent-soft)",
                    color: "var(--app-accent)",
                  }}
                >
                  S
                </div>
                <div>
                  <p
                    className="mb-1 text-[10px] font-semibold uppercase tracking-wider"
                    style={{ color: "var(--app-accent)" }}
                  >
                    Information
                  </p>
                  <h2 className="text-base font-semibold text-white">About SmartShop</h2>
                  <p className="mt-1 max-w-xl text-xs leading-5 text-zinc-600">
                    Learn more about SmartShop, its purpose, features and shop management capabilities.
                  </p>
                </div>
              </div>

              <Link
                to="/about-smartshop"
                className="inline-flex shrink-0 items-center justify-center gap-2 rounded-lg border px-4 py-2.5 text-xs font-semibold transition-all duration-200"
                style={{
                  borderColor: "var(--app-border)",
                  color: "var(--app-accent)",
                  backgroundColor: "var(--app-surface-light)",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = "var(--app-accent-border)";
                  e.currentTarget.style.backgroundColor = "var(--app-accent-soft)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = "var(--app-border)";
                  e.currentTarget.style.backgroundColor = "var(--app-surface-light)";
                }}
              >
                View Details
                <span>→</span>
              </Link>
            </div>
          </section>

          {/* About Developer shortcut */}
          <section
            className="overflow-hidden rounded-xl border"
            style={{
              borderColor: "var(--app-border)",
              backgroundColor: "var(--app-surface)",
            }}
          >
            <div className="flex flex-col gap-5 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
              <div className="flex items-start gap-4">
                <div
                  className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-lg font-bold"
                  style={{
                    backgroundColor: "var(--app-accent-soft)",
                    color: "var(--app-accent)",
                  }}
                >
                  &lt;/&gt;
                </div>
                <div>
                  <p
                    className="mb-1 text-[10px] font-semibold uppercase tracking-wider"
                    style={{ color: "var(--app-accent)" }}
                  >
                    Information
                  </p>
                  <h2 className="text-base font-semibold text-white">About Developer</h2>
                  <p className="mt-1 max-w-xl text-xs leading-5 text-zinc-600">
                    View information about the developer behind the SmartShop management system.
                  </p>
                </div>
              </div>

              <Link
                to="/about-developer"
                className="inline-flex shrink-0 items-center justify-center gap-2 rounded-lg border px-4 py-2.5 text-xs font-semibold transition-all duration-200"
                style={{
                  borderColor: "var(--app-border)",
                  color: "var(--app-accent)",
                  backgroundColor: "var(--app-surface-light)",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = "var(--app-accent-border)";
                  e.currentTarget.style.backgroundColor = "var(--app-accent-soft)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = "var(--app-border)";
                  e.currentTarget.style.backgroundColor = "var(--app-surface-light)";
                }}
              >
                View Details
                <span>→</span>
              </Link>
            </div>
          </section>

          {/* System metadata overview */}
          <section
            className="rounded-xl border p-5 sm:p-6"
            style={{
              borderColor: "var(--app-border)",
              backgroundColor: "var(--app-surface)",
            }}
          >
            <div className="mb-5">
              <h2 className="text-base font-semibold text-white">System Information</h2>
              <p className="mt-1 text-xs text-zinc-600">
                Basic information about this administration panel.
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div
                className="rounded-lg border p-4"
                style={{
                  borderColor: "var(--app-border)",
                  backgroundColor: "var(--app-surface-light)",
                }}
              >
                <p className="text-[10px] font-medium uppercase tracking-wide text-zinc-600">
                  Application
                </p>
                <p className="mt-1 text-sm font-semibold text-zinc-200">SmartShop</p>
              </div>

              <div
                className="rounded-lg border p-4"
                style={{
                  borderColor: "var(--app-border)",
                  backgroundColor: "var(--app-surface-light)",
                }}
              >
                <p className="text-[10px] font-medium uppercase tracking-wide text-zinc-600">
                  Panel
                </p>
                <p className="mt-1 text-sm font-semibold text-zinc-200">Admin Dashboard</p>
              </div>

              <div
                className="rounded-lg border p-4"
                style={{
                  borderColor: "var(--app-border)",
                  backgroundColor: "var(--app-surface-light)",
                }}
              >
                <p className="text-[10px] font-medium uppercase tracking-wide text-zinc-600">
                  Theme
                </p>
                <p className="mt-1 text-sm font-semibold text-zinc-200">Dark</p>
              </div>

              <div
                className="rounded-lg border p-4"
                style={{
                  borderColor: "var(--app-border)",
                  backgroundColor: "var(--app-surface-light)",
                }}
              >
                <p className="text-[10px] font-medium uppercase tracking-wide text-zinc-600">
                  Status
                </p>
                <div className="mt-1 flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-green-400" />
                  <span className="text-sm font-semibold text-zinc-200">Active</span>
                </div>
              </div>
            </div>
          </section>
        </div>

        <div className="py-8 text-center">
          <p className="text-[11px] text-zinc-700">SmartShop Admin Panel</p>
          <p className="mt-1 text-[10px] text-zinc-800">Shop Management System</p>
        </div>
      </div>
    </div>
  );
};

export default Settings;