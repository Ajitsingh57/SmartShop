import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
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

          return {
            id: String(id),
            name: String(name),
            username: String(username),
            email: String(email),
            phone: String(phone),
            status: isActive ? "Active" : "Inactive",
            purchases: sales.length,
            totalSpent,
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
        statusFilter === "All" || customer.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [customers, search, statusFilter]);

  const activeCustomers = customers.filter((customer) => customer.status === "Active").length;
  const inactiveCustomers = customers.filter((customer) => customer.status === "Inactive").length;

  const toggleStatus = async (customer) => {
    if (!customer?.id) return;
    const newIsActive = customer.status !== "Active";

    try {
      setActionLoading(`status-${customer.id}`);
      setError("");

      const response = await customersApi.updateStatus(customer.id, newIsActive);
      const updatedCustomer =
        response?.customer ||
        response?.user ||
        response?.data?.customer ||
        response?.data?.user;

      const actualIsActive =
        typeof updatedCustomer?.isActive === "boolean"
          ? updatedCustomer.isActive
          : newIsActive;

      setCustomers((prev) =>
        prev.map((item) =>
          item.id === customer.id
            ? {
                ...item,
                isActive: actualIsActive,
                status: actualIsActive ? "Active" : "Inactive",
              }
            : item
        )
      );
    } catch (err) {
      console.error("Update customer status error:", err);
      setError(err?.message || "Failed to update customer status.");
    } finally {
      setActionLoading(null);
    }
  };

  const handleDelete = async (customer) => {
    if (!customer?.id) return;
    if (customer.status !== "Inactive") return;

    const confirmed = window.confirm(
      `Are you sure you want to permanently delete ${customer.name}? This action cannot be undone.`
    );
    if (!confirmed) return;

    try {
      setActionLoading(`delete-${customer.id}`);
      setError("");

      await customersApi.delete(customer.id);
      setCustomers((prev) => prev.filter((item) => item.id !== customer.id));
    } catch (err) {
      console.error("Delete customer error:", err);
      setError(err?.message || "Failed to delete customer.");
    } finally {
      setActionLoading(null);
    }
  };

  const handleRetry = () => {
    loadCustomers();
  };

  return (
    <div
      className="min-h-[calc(100vh-73px)] w-full px-4 py-7 text-white transition-colors duration-500 sm:px-6 md:px-10 lg:px-12"
      style={{ backgroundColor: "var(--app-bg)" }}
    >
      <div className="mx-auto max-w-7xl">
        <div className="mb-8 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="mb-2 flex items-center gap-2 text-sm">
              <span
                className="h-1.5 w-1.5 rounded-full"
                style={{ backgroundColor: "var(--app-accent)" }}
              />
              <span className="font-medium" style={{ color: "var(--app-accent)" }}>
                Customer Management
              </span>
            </div>

            <h1 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
              Customers
            </h1>
            <p className="mt-2 max-w-xl text-sm leading-6 text-zinc-500">
              Manage customer accounts, check their activity, and keep your customer records organized.
            </p>
          </div>

          <div
            className="rounded-xl border px-5 py-4 shadow-[0_8px_30px_rgba(0,0,0,0.25)] transition-colors duration-500"
            style={{
              borderColor: "var(--app-border)",
              backgroundColor: "var(--app-surface)",
            }}
          >
            <p className="text-xs font-medium uppercase tracking-wider text-zinc-600">
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
              onClick={handleRetry}
              className="rounded-lg border border-red-500/20 bg-red-500/5 px-3 py-2 text-xs font-medium text-red-400 transition hover:bg-red-500/10"
            >
              Retry
            </button>
          </div>
        )}

        {/* Customer count metrics */}
        <div className="mb-7 grid gap-4 sm:grid-cols-3">
          <div
            className="group rounded-xl border p-5 transition-all duration-300 hover:-translate-y-0.5"
            style={{
              borderColor: "var(--app-border)",
              backgroundColor: "var(--app-surface)",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = "var(--app-accent-border)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = "var(--app-border)";
            }}
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-medium uppercase tracking-wider text-zinc-600">
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
                👥
              </div>
            </div>
            <div className="mt-4 h-px" style={{ backgroundColor: "var(--app-border)" }} />
            <p className="mt-3 text-xs text-zinc-600">All registered customers</p>
          </div>

          <div
            className="group rounded-xl border border-zinc-800 p-5 transition-all duration-300 hover:-translate-y-0.5 hover:border-emerald-500/20"
            style={{ backgroundColor: "var(--app-surface)" }}
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-medium uppercase tracking-wider text-zinc-600">
                  Active Customers
                </p>
                <p className="mt-3 text-3xl font-bold text-white">{activeCustomers}</p>
              </div>
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-400">
                ✓
              </div>
            </div>
            <div className="mt-4 h-px bg-zinc-800" />
            <p className="mt-3 text-xs text-zinc-600">Currently active accounts</p>
          </div>

          <div
            className="group rounded-xl border border-zinc-800 p-5 transition-all duration-300 hover:-translate-y-0.5 hover:border-red-500/20"
            style={{ backgroundColor: "var(--app-surface)" }}
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-medium uppercase tracking-wider text-zinc-600">
                  Inactive Customers
                </p>
                <p className="mt-3 text-3xl font-bold text-white">{inactiveCustomers}</p>
              </div>
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-red-500/10 text-red-400">
                !
              </div>
            </div>
            <div className="mt-4 h-px bg-zinc-800" />
            <p className="mt-3 text-xs text-zinc-600">Deactivated accounts</p>
          </div>
        </div>

        {/* Search and filters toolbar */}
        <div
          className="mb-5 rounded-xl border p-4 shadow-[0_8px_30px_rgba(0,0,0,0.2)]"
          style={{
            borderColor: "var(--app-border)",
            backgroundColor: "var(--app-surface)",
          }}
        >
          <div className="flex flex-col gap-3 lg:flex-row">
            <div className="relative flex-1">
              <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-lg text-zinc-600">
                ⌕
              </span>
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search name, username, email or phone..."
                className="w-full rounded-lg border bg-transparent py-3 pl-11 pr-4 text-sm text-white outline-none placeholder:text-zinc-600 transition"
                style={{ borderColor: "var(--app-border)" }}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = "var(--app-accent)";
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = "var(--app-border)";
                }}
              />
            </div>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="rounded-lg border bg-transparent px-4 py-3 text-sm text-zinc-300 outline-none transition lg:w-44"
              style={{ borderColor: "var(--app-border)" }}
            >
              <option value="All">All Status</option>
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
            </select>
          </div>
        </div>

        {/* Customer records table */}
        <div
          className="overflow-hidden rounded-xl border shadow-[0_10px_40px_rgba(0,0,0,0.3)]"
          style={{
            borderColor: "var(--app-border)",
            backgroundColor: "var(--app-surface)",
          }}
        >
          <div
            className="flex items-center justify-between border-b px-5 py-4"
            style={{ borderColor: "var(--app-border)" }}
          >
            <div>
              <h2 className="text-sm font-semibold text-white">Customer List</h2>
              <p className="mt-1 text-xs text-zinc-600">Manage registered customer accounts</p>
            </div>
            <span
              className="rounded-full border px-3 py-1.5 text-xs"
              style={{
                borderColor: "var(--app-border)",
                backgroundColor: "var(--app-bg)",
                color: "#71717a",
              }}
            >
              {filteredCustomers.length} Results
            </span>
          </div>

          {loading ? (
            <div className="flex min-h-[350px] flex-col items-center justify-center px-5 py-20">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-zinc-800 border-t-white" />
              <p className="mt-4 text-sm text-zinc-500">Loading customers...</p>
            </div>
          ) : (
            <>
              {/* Desktop Table View */}
              <div className="hidden overflow-x-auto lg:block">
                <table className="w-full min-w-[1000px]">
                  <thead
                    className="border-b"
                    style={{
                      borderColor: "var(--app-border)",
                      backgroundColor: "var(--app-bg)",
                    }}
                  >
                    <tr>
                      <th className="px-5 py-4 text-left text-[11px] font-semibold uppercase tracking-wider text-zinc-600">
                        Customer
                      </th>
                      <th className="px-5 py-4 text-left text-[11px] font-semibold uppercase tracking-wider text-zinc-600">
                        Contact
                      </th>
                      <th className="px-5 py-4 text-left text-[11px] font-semibold uppercase tracking-wider text-zinc-600">
                        Purchases
                      </th>
                      <th className="px-5 py-4 text-left text-[11px] font-semibold uppercase tracking-wider text-zinc-600">
                        Total Spent
                      </th>
                      <th className="px-5 py-4 text-left text-[11px] font-semibold uppercase tracking-wider text-zinc-600">
                        Status
                      </th>
                      <th className="px-5 py-4 text-right text-[11px] font-semibold uppercase tracking-wider text-zinc-600">
                        Actions
                      </th>
                    </tr>
                  </thead>

                  <tbody>
                    {filteredCustomers.length > 0 ? (
                      filteredCustomers.map((customer) => {
                        const statusLoading = actionLoading === `status-${customer.id}`;
                        const deleteLoading = actionLoading === `delete-${customer.id}`;

                        return (
                          <tr
                            key={customer.id}
                            className="group border-b transition-colors duration-200 hover:bg-white/[0.02]"
                            style={{ borderColor: "rgba(39,39,42,0.7)" }}
                          >
                            <td className="px-5 py-5">
                              <div className="flex items-center gap-3">
                                <div
                                  className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-full border text-sm font-bold"
                                  style={{
                                    borderColor: "var(--app-accent-border)",
                                    backgroundColor: "var(--app-accent-soft)",
                                    color: "var(--app-accent)",
                                  }}
                                >
                                  {customer.name.charAt(0).toUpperCase()}
                                  {customer.status === "Active" && (
                                    <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-zinc-900 bg-emerald-400" />
                                  )}
                                </div>

                                <div>
                                  <p className="text-sm font-semibold text-zinc-200">
                                    {customer.name}
                                  </p>
                                  <p className="mt-1 text-xs text-zinc-600">
                                    @{customer.username || "no-username"}
                                  </p>
                                </div>
                              </div>
                            </td>

                            <td className="px-5 py-5">
                              <p className="text-sm text-zinc-300">{customer.email || "—"}</p>
                              <p className="mt-1 text-xs text-zinc-600">
                                {customer.phone ? `+91 ${customer.phone}` : "—"}
                              </p>
                            </td>

                            <td className="px-5 py-5">
                              <span
                                className="rounded-md px-3 py-1.5 text-sm font-medium"
                                style={{
                                  backgroundColor: "var(--app-bg)",
                                  color: "#d4d4d8",
                                }}
                              >
                                {customer.purchases}
                              </span>
                            </td>

                            <td className="px-5 py-5">
                              <p className="text-sm font-semibold text-zinc-200">
                                ₹{customer.totalSpent.toLocaleString("en-IN")}
                              </p>
                            </td>

                            <td className="px-5 py-5">
                              <span
                                className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-medium ${
                                  customer.status === "Active"
                                    ? "border-emerald-500/10 bg-emerald-500/5 text-emerald-400"
                                    : "border-red-500/10 bg-red-500/5 text-red-400"
                                }`}
                              >
                                <span
                                  className={`h-1.5 w-1.5 rounded-full ${
                                    customer.status === "Active" ? "bg-emerald-400" : "bg-red-400"
                                  }`}
                                />
                                {customer.status}
                              </span>
                            </td>

                            <td className="px-5 py-5">
                              <div className="flex items-center justify-end gap-2">
                                <Link
                                  to={`/customers/${customer.id}`}
                                  className="rounded-lg border px-3 py-2 text-xs font-medium transition"
                                  style={{
                                    borderColor: "var(--app-border)",
                                    backgroundColor: "var(--app-bg)",
                                    color: "#a1a1aa",
                                  }}
                                >
                                  View
                                </Link>

                                <button
                                  type="button"
                                  disabled={statusLoading || deleteLoading}
                                  onClick={() => toggleStatus(customer)}
                                  className={`rounded-lg border px-3 py-2 text-xs font-medium transition disabled:cursor-not-allowed disabled:opacity-50 ${
                                    customer.status === "Active"
                                      ? "border-red-500/10 bg-red-500/5 text-red-400 hover:border-red-500/20 hover:bg-red-500/10"
                                      : "border-emerald-500/10 bg-emerald-500/5 text-emerald-400 hover:border-emerald-500/20 hover:bg-emerald-500/10"
                                  }`}
                                >
                                  {statusLoading
                                    ? "Updating..."
                                    : customer.status === "Active"
                                    ? "Deactivate"
                                    : "Activate"}
                                </button>

                                {customer.status === "Inactive" && (
                                  <button
                                    type="button"
                                    disabled={deleteLoading || statusLoading}
                                    onClick={() => handleDelete(customer)}
                                    className="rounded-lg border border-red-500/10 bg-red-500/5 px-3 py-2 text-xs font-medium text-red-400 transition hover:border-red-500/30 hover:bg-red-500/10 disabled:cursor-not-allowed disabled:opacity-50"
                                  >
                                    {deleteLoading ? "Deleting..." : "Delete"}
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    ) : (
                      <tr>
                        <td colSpan="6" className="px-5 py-20 text-center">
                          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-zinc-900 text-xl text-zinc-600">
                            ⌕
                          </div>
                          <p className="mt-4 text-sm font-medium text-zinc-400">
                            No customers found
                          </p>
                          <p className="mt-1 text-xs text-zinc-600">
                            Try a different search or status filter.
                          </p>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Mobile & Tablet Cards View */}
              <div className="grid grid-cols-1 gap-3 p-3 sm:grid-cols-2 sm:p-4 lg:hidden">
                {filteredCustomers.length > 0 ? (
                  filteredCustomers.map((customer) => {
                    const statusLoading = actionLoading === `status-${customer.id}`;
                    const deleteLoading = actionLoading === `delete-${customer.id}`;

                    return (
                      <div
                        key={customer.id}
                        className="rounded-xl border p-4"
                        style={{
                          borderColor: "var(--app-border)",
                          backgroundColor: "var(--app-surface-light)",
                        }}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-center gap-3 min-w-0">
                            <div
                              className="relative flex h-11 w-11 shrink-0 items-center justify-center rounded-full border text-sm font-bold"
                              style={{
                                borderColor: "var(--app-accent-border)",
                                backgroundColor: "var(--app-accent-soft)",
                                color: "var(--app-accent)",
                              }}
                            >
                              {customer.name.charAt(0).toUpperCase()}
                              {customer.status === "Active" && (
                                <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-zinc-900 bg-emerald-400" />
                              )}
                            </div>
                            <div className="min-w-0">
                              <p className="font-semibold text-white truncate text-base">{customer.name}</p>
                              <p className="text-xs text-zinc-500 truncate">@{customer.username || "customer"}</p>
                            </div>
                          </div>

                          <span
                            className={`shrink-0 rounded-full border px-2.5 py-0.5 text-[11px] font-medium ${
                              customer.status === "Active"
                                ? "border-emerald-500/10 bg-emerald-500/5 text-emerald-400"
                                : "border-red-500/10 bg-red-500/5 text-red-400"
                            }`}
                          >
                            {customer.status}
                          </span>
                        </div>

                        <div className="mt-3 grid grid-cols-2 gap-2 border-t pt-3" style={{ borderColor: "var(--app-border)" }}>
                          <div>
                            <p className="text-[11px] text-zinc-500 uppercase">Contact</p>
                            <p className="text-xs text-zinc-300 truncate">{customer.phone ? `+91 ${customer.phone}` : customer.email || "No contact"}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-[11px] text-zinc-500 uppercase">Total Purchases</p>
                            <p className="text-sm font-bold text-white">₹{customer.totalSpent.toLocaleString("en-IN")}</p>
                          </div>
                        </div>

                        <div className="mt-3 flex gap-2 border-t pt-3" style={{ borderColor: "var(--app-border)" }}>
                          <Link
                            to={`/customers/${customer.id}`}
                            className="flex-1 rounded-lg border py-2 text-center text-xs font-semibold text-zinc-300 transition hover:bg-white/5"
                            style={{ borderColor: "var(--app-border)" }}
                          >
                            View Profile
                          </Link>
                          <button
                            type="button"
                            disabled={statusLoading || deleteLoading}
                            onClick={() => toggleStatus(customer)}
                            className={`flex-1 rounded-lg border py-2 text-xs font-semibold transition disabled:opacity-50 ${
                              customer.status === "Active"
                                ? "border-red-500/20 bg-red-500/5 text-red-400 hover:bg-red-500/10"
                                : "border-emerald-500/20 bg-emerald-500/5 text-emerald-400 hover:bg-emerald-500/10"
                            }`}
                          >
                            {statusLoading
                              ? "Updating..."
                              : customer.status === "Active"
                              ? "Deactivate"
                              : "Activate"}
                          </button>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="p-8 text-center text-zinc-500 text-xs">
                    No customers found matching search filter.
                  </div>
                )}
              </div>
            </>
          )}

          {!loading && (
            <div
              className="flex flex-col gap-2 border-t px-5 py-4 sm:flex-row sm:items-center sm:justify-between"
              style={{
                borderColor: "var(--app-border)",
                backgroundColor: "var(--app-bg)",
              }}
            >
              <p className="text-xs text-zinc-600">
                Showing <span className="font-medium text-zinc-400">{filteredCustomers.length}</span> of{" "}
                <span className="font-medium text-zinc-400">{customers.length}</span> customers
              </p>
              <p className="text-xs text-zinc-700">SmartShop Customer Management</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Customers;