import React from "react";
import { Link } from "react-router-dom";

const AboutSmartShop = () => {
  return (
    <div
      className="w-full px-4 py-6 sm:px-6 md:px-10 lg:px-12"
      style={{
        backgroundColor: "var(--app-bg)",
        color: "var(--app-text)",
      }}
    >
      <div className="mx-auto max-w-7xl">
        {/* Hero banner */}
        <section
          className="relative mb-6 overflow-hidden rounded-2xl border p-6 shadow-[0_10px_40px_rgba(0,0,0,0.35)] sm:p-8 lg:p-10"
          style={{
            borderColor: "var(--app-accent-border)",
            background: `radial-gradient(circle at 85% 20%, var(--app-accent-soft), transparent 32%), linear-gradient(135deg, var(--app-surface-light) 0%, var(--app-surface) 100%)`,
          }}
        >
          <div className="relative z-10 max-w-3xl">
            <div className="mb-4 flex items-center gap-3">
              <div
                className="flex h-12 w-12 items-center justify-center rounded-xl text-lg font-bold"
                style={{
                  backgroundColor: "var(--app-accent-soft)",
                  color: "var(--app-accent)",
                }}
              >
                S
              </div>

              <div>
                <p
                  className="text-xs font-semibold uppercase tracking-wider"
                  style={{ color: "var(--app-accent)" }}
                >
                  About SmartShop
                </p>
                <p className="mt-0.5 text-xs text-zinc-600">
                  Shop Management System
                </p>
              </div>
            </div>

            <h1 className="text-3xl font-bold tracking-tight text-white sm:text-4xl lg:text-5xl">
              Smarter way to manage your shop.
            </h1>

            <p className="mt-4 max-w-2xl text-sm leading-7 text-zinc-400 sm:text-base">
              SmartShop is a shop management system designed to simplify everyday business operations. It brings
              products, customers, sales, payments, bookings and administrative activities together in one organized platform.
            </p>
          </div>

          <div
            className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full border"
            style={{ borderColor: "var(--app-accent-border)" }}
          />
          <div
            className="pointer-events-none absolute -right-5 -top-5 h-40 w-40 rounded-full border"
            style={{ borderColor: "var(--app-accent-border)" }}
          />
        </section>

        {/* Platform overview */}
        <section className="mb-6 grid grid-cols-1 gap-6 lg:grid-cols-[1.4fr_1fr]">
          <div
            className="rounded-xl border p-6 sm:p-7"
            style={{
              borderColor: "var(--app-border)",
              backgroundColor: "var(--app-surface)",
            }}
          >
            <p
              className="text-xs font-semibold uppercase tracking-wider"
              style={{ color: "var(--app-accent)" }}
            >
              Our Purpose
            </p>

            <h2 className="mt-2 text-2xl font-bold text-white">
              Everything your shop needs, in one place.
            </h2>

            <p className="mt-4 text-sm leading-7 text-zinc-500">
              Managing a shop involves many daily tasks. Products need to be maintained, customers need to be managed,
              sales need to be recorded and payments need to be tracked.
            </p>
            <p className="mt-3 text-sm leading-7 text-zinc-500">
              SmartShop provides a centralized system where these operations can be managed efficiently. The goal is to
              reduce unnecessary manual work, keep information organized and make day-to-day shop management easier.
            </p>
            <p className="mt-3 text-sm leading-7 text-zinc-500">
              The system also provides administrative controls so authorized users can manage shop operations while
              maintaining a clear record of important activities.
            </p>
          </div>

          <div
            className="rounded-xl border p-6 sm:p-7"
            style={{
              borderColor: "var(--app-accent-border)",
              background: `radial-gradient(circle at top right, var(--app-accent-soft), transparent 60%), var(--app-surface)`,
            }}
          >
            <p
              className="text-xs font-semibold uppercase tracking-wider"
              style={{ color: "var(--app-accent)" }}
            >
              Built Around Simplicity
            </p>

            <h2 className="mt-2 text-xl font-bold text-white">
              Simple. Organized. Efficient.
            </h2>

            <div className="mt-6 space-y-5">
              <div className="flex gap-3">
                <div
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-xs font-bold"
                  style={{
                    backgroundColor: "var(--app-accent-soft)",
                    color: "var(--app-accent)",
                  }}
                >
                  01
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-zinc-300">Centralized Management</h3>
                  <p className="mt-1 text-xs leading-5 text-zinc-600">
                    Keep important shop information organized in one system.
                  </p>
                </div>
              </div>

              <div className="flex gap-3">
                <div
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-xs font-bold"
                  style={{
                    backgroundColor: "var(--app-accent-soft)",
                    color: "var(--app-accent)",
                  }}
                >
                  02
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-zinc-300">Faster Operations</h3>
                  <p className="mt-1 text-xs leading-5 text-zinc-600">
                    Reduce repetitive work and make everyday tasks easier to handle.
                  </p>
                </div>
              </div>

              <div className="flex gap-3">
                <div
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-xs font-bold"
                  style={{
                    backgroundColor: "var(--app-accent-soft)",
                    color: "var(--app-accent)",
                  }}
                >
                  03
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-zinc-300">Better Visibility</h3>
                  <p className="mt-1 text-xs leading-5 text-zinc-600">
                    Access useful records and operational information when you need it.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Feature areas */}
        <section
          className="mb-6 rounded-xl border p-6 sm:p-7"
          style={{
            borderColor: "var(--app-border)",
            backgroundColor: "var(--app-surface)",
          }}
        >
          <div className="mb-6">
            <p
              className="text-xs font-semibold uppercase tracking-wider"
              style={{ color: "var(--app-accent)" }}
            >
              What SmartShop Covers
            </p>
            <h2 className="mt-2 text-2xl font-bold text-white">
              Designed for everyday shop operations
            </h2>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div
              className="rounded-lg border p-5"
              style={{
                borderColor: "var(--app-border)",
                backgroundColor: "var(--app-surface-light)",
              }}
            >
              <h3 className="text-sm font-semibold text-zinc-200">Product Management</h3>
              <p className="mt-2 text-xs leading-5 text-zinc-600">
                Manage product information and keep your shop inventory records organized.
              </p>
            </div>

            <div
              className="rounded-lg border p-5"
              style={{
                borderColor: "var(--app-border)",
                backgroundColor: "var(--app-surface-light)",
              }}
            >
              <h3 className="text-sm font-semibold text-zinc-200">Customer Management</h3>
              <p className="mt-2 text-xs leading-5 text-zinc-600">
                Maintain customer information and keep customer related records accessible.
              </p>
            </div>

            <div
              className="rounded-lg border p-5"
              style={{
                borderColor: "var(--app-border)",
                backgroundColor: "var(--app-surface-light)",
              }}
            >
              <h3 className="text-sm font-semibold text-zinc-200">Sales Management</h3>
              <p className="mt-2 text-xs leading-5 text-zinc-600">
                Record and manage sales transactions through an organized workflow.
              </p>
            </div>

            <div
              className="rounded-lg border p-5"
              style={{
                borderColor: "var(--app-border)",
                backgroundColor: "var(--app-surface-light)",
              }}
            >
              <h3 className="text-sm font-semibold text-zinc-200">Payment Tracking</h3>
              <p className="mt-2 text-xs leading-5 text-zinc-600">
                Keep track of payment information and related transaction records.
              </p>
            </div>

            <div
              className="rounded-lg border p-5"
              style={{
                borderColor: "var(--app-border)",
                backgroundColor: "var(--app-surface-light)",
              }}
            >
              <h3 className="text-sm font-semibold text-zinc-200">Booking Management</h3>
              <p className="mt-2 text-xs leading-5 text-zinc-600">
                Manage customer bookings and keep their status organized.
              </p>
            </div>

            <div
              className="rounded-lg border p-5"
              style={{
                borderColor: "var(--app-border)",
                backgroundColor: "var(--app-surface-light)",
              }}
            >
              <h3 className="text-sm font-semibold text-zinc-200">Administration</h3>
              <p className="mt-2 text-xs leading-5 text-zinc-600">
                Authorized administrators can manage operational activities and account access.
              </p>
            </div>
          </div>
        </section>

        {/* Access and role-based administration info */}
        <section
          className="mb-6 rounded-xl border p-6 sm:p-7"
          style={{
            borderColor: "var(--app-accent-border)",
            background: `linear-gradient(135deg, var(--app-accent-soft), transparent 70%), var(--app-surface)`,
          }}
        >
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p
                className="text-xs font-semibold uppercase tracking-wider"
                style={{ color: "var(--app-accent)" }}
              >
                Access & Control
              </p>
              <h2 className="mt-2 text-xl font-bold text-white">
                Built with role-based administration in mind.
              </h2>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-zinc-500">
                SmartShop separates administrative responsibilities so that shop operations can be handled by authorized
                users while higher-level controls remain protected.
              </p>
            </div>

            <Link
              to="/help-support"
              className="shrink-0 rounded-lg border px-4 py-2.5 text-xs font-semibold transition"
              style={{
                borderColor: "var(--app-accent-border)",
                backgroundColor: "var(--app-accent-soft)",
                color: "var(--app-accent)",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = "var(--app-accent)";
                e.currentTarget.style.color = "#ffffff";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = "var(--app-accent-soft)";
                e.currentTarget.style.color = "var(--app-accent)";
              }}
            >
              Help & Support →
            </Link>
          </div>
        </section>

        {/* Closing action card */}
        <section
          className="rounded-xl border p-6 text-center sm:p-8"
          style={{
            borderColor: "var(--app-border)",
            backgroundColor: "var(--app-surface)",
          }}
        >
          <h2 className="text-xl font-bold text-white">
            Manage smarter with SmartShop.
          </h2>
          <p className="mx-auto mt-2 max-w-2xl text-sm leading-6 text-zinc-600">
            A centralized shop management experience focused on keeping everyday operations simple, organized and efficient.
          </p>

          <div className="mt-5 flex flex-wrap justify-center gap-3">
            <Link
              to="/help-support"
              className="rounded-lg border px-4 py-2.5 text-xs font-medium transition"
              style={{
                borderColor: "var(--app-border)",
                color: "var(--app-text-muted)",
              }}
            >
              Help & Support
            </Link>

            <Link
              to="/"
              className="rounded-lg px-4 py-2.5 text-xs font-semibold text-white"
              style={{ backgroundColor: "var(--app-accent)" }}
            >
              Back to Dashboard
            </Link>
          </div>
        </section>
      </div>
    </div>
  );
};

export default AboutSmartShop;