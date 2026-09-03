import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  Users,
  Search,
  CheckCircle2,
  XCircle,
  Eye,
  Trash2,
  Power,
  RefreshCw,
  Award,
  CreditCard,
  Sliders,
  Sparkles,
} from "lucide-react";
import { toast } from "react-toastify";
import { customersApi } from "../services/api";

const Customers = () => {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionLoading, setActionLoading] = useState(null);

  // Fetch all customers from backend and normalize structure
  const loadCustomers = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await customersApi.getAll();

      const customerList = Array.isArray(response)
        ? response
        : Array.isArray(response?.customers)
        ? response.customers
        : Array.isArray(response?.data)
        ? response.data
        : Array.isArray(response?.data?.customers)
        ? response.data.customers
        : [];

      const formattedCustomers = customerList
        .map((item) => {
          const user = item?.user || item?.customer || item?.userId || {};
          const profile = item?.profile || item?.customerProfile || {};
          const directUser = item?.user?._id || item?.user?.id ? item.user : null;

          const id =
            user?._id ||
            user?.id ||
            item?.customerId ||
            item?._id ||
            item?.id ||
            "";

          const name =
            directUser?.name ||
            user?.name ||
            item?.name ||
            item?.customerName ||
            profile?.name ||
            profile?.fullName ||
            "Unknown Customer";

          const username =
            directUser?.username || user?.username || item?.username || "";

          const email =
            directUser?.email || user?.email || item?.email || "";

          const phone =
            directUser?.phone || user?.phone || item?.phone || "";

          const isActive =
            typeof user?.isActive === "boolean"
              ? user.isActive
              : typeof item?.isActive === "boolean"
              ? item.isActive
              : true;

          const sales = Array.isArray(item?.sales)
            ? item.sales
            : Array.isArray(item?.orders)
            ? item.orders
            : [];

          const totalSpent = Number(
            profile?.totalPurchase ??
              item?.totalPurchase ??
              item?.totalSpent ??
              0
          );

          const trustScore = Number(
            profile?.trustScore ?? item?.trustScore ?? 0
          );

          const autoLimit = Number(
            profile?.autoBorrowLimit ??
              profile?.maxBorrowAmount ??
              item?.maxBorrowAmount ??
              0
          );

          const manualLimit = Number(
            profile?.manualBorrowLimit ?? item?.manualBorrowLimit ?? 0
          );

          const creditLimitMode =
            profile?.creditLimitMode ??
            item?.creditLimitMode ??
            (manualLimit > 0 ? "manual" : "auto");

          const effectiveLimit =
            creditLimitMode === "manual" ? manualLimit : autoLimit;
          const isManual = creditLimitMode === "manual";

          const pendingDebt = Number(
            profile?.pendingAmount ?? item?.pendingAmount ?? 0
          );

          let trustTier = "Bronze";
          if (trustScore >= 85) trustTier = "Platinum";
          else if (trustScore >= 70) trustTier = "Gold";
          else if (trustScore >= 50) trustTier = "Silver";

          return {
            id: String(id),
            name: String(name),
            username: String(username),
            email: String(email),
            phone: String(phone),
            status: isActive ? "Active" : "Inactive",
            purchases: sales.length,
            totalSpent,
            trustScore,
            trustTier,
            autoLimit,
            manualLimit,
            effectiveLimit,
            isManual,
            pendingDebt,
            isActive,
          };
        })
        .filter((customer) => customer.id);

      setCustomers(formattedCustomers);
    } catch (err) {
      console.error("Load customers error:", err);
      setError(err?.message || "Failed to load customers.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCustomers();
  }, []);

  // Filter customers by search term and status
  const filteredCustomers = useMemo(() => {
    const value = search.trim().toLowerCase();

    return customers.filter((customer) => {
      const matchesSearch =
        !value ||
        customer.name.toLowerCase().includes(value) ||
        customer.username.toLowerCase().includes(value) ||
        customer.email.toLowerCase().includes(value) ||
        customer.phone.toLowerCase().includes(value);

      const matchesStatus =
        statusFilter === "All" ||
        (statusFilter === "Active" && customer.isActive) ||
        (statusFilter === "Inactive" && !customer.isActive);

      return matchesSearch && matchesStatus;
    });
  }, [customers, search, statusFilter]);

  const activeCount = useMemo(
    () => customers.filter((customer) => customer.isActive).length,
    [customers]
  );

  const inactiveCount = useMemo(
    () => customers.filter((customer) => !customer.isActive).length,
    [customers]
  );

  const handleToggleStatus = async (customer) => {
    const nextStatus = !customer.isActive;
    const confirmed = window.confirm(
      nextStatus
        ? `Activate ${customer.name}?`
        : `Deactivate ${customer.name}?`
    );

    if (!confirmed) return;

    try {
      setActionLoading(`status-${customer.id}`);
      setError("");

      const res = await customersApi.updateStatus(customer.id, nextStatus);

      setCustomers((prev) =>
        prev.map((item) =>
          item.id === customer.id
            ? {
                ...item,
                isActive: nextStatus,
                status: nextStatus ? "Active" : "Inactive",
              }
            : item
        )
      );
      toast.success(res?.message || `Customer account ${nextStatus ? "activated" : "deactivated"} successfully.`);
    } catch (err) {
      console.error("Update customer status error:", err);
      const msg = err?.message || "Failed to update customer status.";
      setError(msg);
      toast.error(msg);
    } finally {
      setActionLoading(null);
    }
  };

  const handleDelete = async (customer) => {
    if (customer.isActive) {
      const msg = "Please deactivate the customer account before deleting.";
      window.alert(msg);
      toast.warn(msg);
      return;
    }

    const confirmed = window.confirm(
      `Delete ${customer.name} permanently?\n\nThis will remove all transaction history and cannot be undone.`
    );

    if (!confirmed) return;

    try {
      setActionLoading(`delete-${customer.id}`);
      setError("");

      const res = await customersApi.delete(customer.id);
      setCustomers((prev) => prev.filter((item) => item.id !== customer.id));
      toast.success(res?.message || "Customer deleted successfully.");
    } catch (err) {
      console.error("Delete customer error:", err);
      const msg = err?.message || "Failed to delete customer.";
      setError(msg);
      toast.error(msg);
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <div
      className="min-h-[calc(100vh-73px)] w-full px-4 py-7 text-white transition-colors duration-500 sm:px-6 md:px-10 lg:px-12"
      style={{ backgroundColor: "var(--app-bg)" }}
    >
      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <div className="mb-8 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="mb-2 flex items-center gap-2 text-sm">
              <span
                className="h-1.5 w-1.5 rounded-full"
                style={{ backgroundColor: "var(--app-accent)" }}
              />
              <span className="font-medium" style={{ color: "var(--app-accent)" }}>
                Customer Directory & Credit Limits
              </span>
            </div>

            <h1 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
              Customers
            </h1>
            <p className="mt-2 max-w-xl text-sm leading-6 text-zinc-400">
              Manage accounts, trust scores, dual credit limits (Auto & Manual Override) and view financial history.
            </p>
          </div>

          <div
            className="rounded-xl border px-5 py-4 shadow-[0_8px_30px_rgba(0,0,0,0.25)] transition-colors duration-500"
            style={{
              borderColor: "var(--app-border)",
              backgroundColor: "var(--app-surface)",
            }}
          >
            <p className="text-xs font-medium uppercase tracking-wider text-zinc-500">
              Total Customers
            </p>
            <p className="mt-1 text-2xl font-bold text-white">{customers.length}</p>
          </div>
        </div>

        {error && (
          <div
            className="mb-6 flex flex-col gap-3 rounded-xl border px-4 py-4 sm:flex-row sm:items-center sm:justify-between"
            style={{
              borderColor: "rgba(239,68,68,0.20)",
              backgroundColor: "rgba(239,68,68,0.05)",
            }}
          >
            <p className="text-sm text-red-400">{error}</p>
            <button
              type="button"
              onClick={loadCustomers}
              className="rounded-lg border border-red-500/20 bg-red-500/5 px-3 py-2 text-xs font-medium text-red-400 transition hover:bg-red-500/10"
            >
              Retry
            </button>
          </div>
        )}

        {/* Customer Count Metrics */}
        <div className="mb-7 grid gap-4 sm:grid-cols-3">
          <div
            className="group rounded-xl border p-5 transition-all duration-300 hover:-translate-y-0.5"
            style={{
              borderColor: "var(--app-border)",
              backgroundColor: "var(--app-surface)",
            }}
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-medium uppercase tracking-wider text-zinc-500">
                  Total Customers
                </p>
                <p className="mt-3 text-3xl font-bold text-white">{customers.length}</p>
              </div>
              <div
                className="flex h-10 w-10 items-center justify-center rounded-lg text-lg"
                style={{
                  backgroundColor: "var(--app-accent-soft)",
                  color: "var(--app-accent)",
                }}
              >
                <Users className="h-5 w-5" />
              </div>
            </div>
            <p className="mt-3 text-xs text-zinc-500">Registered store users</p>
          </div>

          <div
            className="group rounded-xl border p-5 transition-all duration-300 hover:-translate-y-0.5"
            style={{
              borderColor: "var(--app-border)",
              backgroundColor: "var(--app-surface)",
            }}
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-medium uppercase tracking-wider text-zinc-500">
                  Active Accounts
                </p>
                <p className="mt-3 text-3xl font-bold text-emerald-400">{activeCount}</p>
              </div>
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-400">
                <CheckCircle2 className="h-5 w-5" />
              </div>
            </div>
            <p className="mt-3 text-xs text-emerald-500">Authorized for shopping & credit</p>
          </div>

          <div
            className="group rounded-xl border p-5 transition-all duration-300 hover:-translate-y-0.5"
            style={{
              borderColor: "var(--app-border)",
              backgroundColor: "var(--app-surface)",
            }}
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-medium uppercase tracking-wider text-zinc-500">
                  Inactive Accounts
                </p>
                <p className="mt-3 text-3xl font-bold text-red-400">{inactiveCount}</p>
              </div>
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-red-500/10 text-red-400">
                <XCircle className="h-5 w-5" />
              </div>
            </div>
            <p className="mt-3 text-xs text-red-500">Suspended or deactivated</p>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative w-full sm:w-80">
            <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
            <input
              type="search"
              placeholder="Search by name, phone, email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-xl border border-white/10 bg-zinc-950 pl-9 pr-4 py-2.5 text-xs text-white outline-none focus:border-[var(--app-accent-border)]"
            />
          </div>

          <div className="flex gap-2">
            {["All", "Active", "Inactive"].map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => setStatusFilter(tab)}
                className={`rounded-lg px-4 py-2 text-xs font-semibold transition ${
                  statusFilter === tab
                    ? "text-white shadow-sm"
                    : "text-zinc-500 hover:text-zinc-300"
                }`}
                style={
                  statusFilter === tab
                    ? { backgroundColor: "var(--app-accent)", color: "#fff" }
                    : {}
                }
              >
                {tab}
              </button>
            ))}
          </div>
        </div>

        {/* Table */}
        {loading ? (
          <div className="py-20 text-center text-zinc-500">
            <RefreshCw className="mx-auto mb-2 h-8 w-8 animate-spin text-[var(--app-accent)]" />
            <p>Loading customers...</p>
          </div>
        ) : filteredCustomers.length === 0 ? (
          <div
            className="rounded-xl border p-12 text-center"
            style={{
              borderColor: "var(--app-border)",
              backgroundColor: "var(--app-surface)",
            }}
          >
            <p className="text-zinc-500">No customers match your criteria.</p>
          </div>
        ) : (
          <div
            className="overflow-hidden rounded-2xl border"
            style={{
              borderColor: "var(--app-border)",
              backgroundColor: "var(--app-surface)",
            }}
          >
            <div className="overflow-x-auto">
              <table className="w-full min-w-[900px] text-left text-sm">
                <thead>
                  <tr
                    className="border-b text-xs uppercase tracking-wider text-zinc-500"
                    style={{ borderColor: "var(--app-border)" }}
                  >
                    <th className="px-5 py-4">Customer</th>
                    <th className="px-5 py-4">Contact</th>
                    <th className="px-5 py-4">Purchases</th>
                    <th className="px-5 py-4">Trust Score</th>
                    <th className="px-5 py-4">Credit Limit</th>
                    <th className="px-5 py-4">Pending Debt</th>
                    <th className="px-5 py-4">Status</th>
                    <th className="px-5 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredCustomers.map((customer) => (
                    <tr
                      key={customer.id}
                      className="border-b transition hover:bg-white/[0.02]"
                      style={{ borderColor: "var(--app-border)" }}
                    >
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div
                            className="flex h-9 w-9 items-center justify-center rounded-full font-bold text-xs"
                            style={{
                              backgroundColor: "var(--app-accent-soft)",
                              color: "var(--app-accent)",
                            }}
                          >
                            {customer.name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="font-semibold text-white">{customer.name}</p>
                            {customer.username && (
                              <p className="text-[11px] font-mono text-zinc-500">
                                @{customer.username}
                              </p>
                            )}
                          </div>
                        </div>
                      </td>

                      <td className="px-5 py-4 text-xs">
                        <p className="text-zinc-300">{customer.phone || "—"}</p>
                        <p className="text-zinc-500">{customer.email || ""}</p>
                      </td>

                      <td className="px-5 py-4">
                        <p className="font-bold text-white">
                          ₹{customer.totalSpent.toLocaleString("en-IN")}
                        </p>
                        <p className="text-[11px] text-zinc-500">
                          {customer.purchases} order(s)
                        </p>
                      </td>

                      {/* Trust Score */}
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-white text-sm">
                            {customer.trustScore}/100
                          </span>
                          <span
                            className={`rounded px-1.5 py-0.5 text-[10px] font-bold ${
                              customer.trustTier === "Platinum"
                                ? "bg-purple-500/20 text-purple-300"
                                : customer.trustTier === "Gold"
                                ? "bg-amber-500/20 text-amber-300"
                                : customer.trustTier === "Silver"
                                ? "bg-teal-500/20 text-teal-300"
                                : "bg-rose-500/20 text-rose-300"
                            }`}
                          >
                            {customer.trustTier}
                          </span>
                        </div>
                      </td>

                      {/* Dual Credit Limit */}
                      <td className="px-5 py-4">
                        <p className="font-bold text-white text-sm">
                          ₹{customer.effectiveLimit.toLocaleString("en-IN")}
                        </p>
                        <div className="mt-0.5 flex flex-wrap items-center gap-1">
                          {customer.isManual ? (
                            <span className="rounded bg-blue-500/15 px-1.5 py-0.5 text-[10px] font-bold text-blue-400 border border-blue-500/30">
                              Manual Mode
                            </span>
                          ) : (
                            <span className="rounded bg-emerald-500/15 px-1.5 py-0.5 text-[10px] font-bold text-emerald-400 border border-emerald-500/30">
                              Auto Mode
                            </span>
                          )}
                          {customer.manualLimit > 0 && !customer.isManual && (
                            <span className="text-[10px] text-zinc-500 font-mono">
                              (Set: ₹{customer.manualLimit.toLocaleString("en-IN")})
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Pending Debt */}
                      <td className="px-5 py-4">
                        <span
                          className={`font-bold ${
                            customer.pendingDebt > 0 ? "text-rose-400" : "text-zinc-500"
                          }`}
                        >
                          ₹{customer.pendingDebt.toLocaleString("en-IN")}
                        </span>
                      </td>

                      <td className="px-5 py-4">
                        <span
                          className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                            customer.isActive
                              ? "bg-emerald-500/10 text-emerald-400"
                              : "bg-red-500/10 text-red-400"
                          }`}
                        >
                          {customer.status}
                        </span>
                      </td>

                      <td className="px-5 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Link
                            to={`/customers/${customer.id}`}
                            className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 px-3 py-1.5 text-xs font-semibold text-zinc-200 transition hover:border-[var(--app-accent-border)] hover:bg-[var(--app-accent-soft)] hover:text-[var(--app-accent)]"
                          >
                            <Eye className="h-3.5 w-3.5" />
                            <span>Profile & Limits</span>
                          </Link>

                          <button
                            type="button"
                            onClick={() => handleToggleStatus(customer)}
                            disabled={actionLoading === `status-${customer.id}`}
                            className={`rounded-lg p-1.5 text-xs transition ${
                              customer.isActive
                                ? "text-yellow-400 hover:bg-yellow-500/10"
                                : "text-emerald-400 hover:bg-emerald-500/10"
                            }`}
                            title={customer.isActive ? "Deactivate" : "Activate"}
                          >
                            <Power className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Customers;