import React, { useEffect, useMemo, useState } from "react";
import { adminsApi } from "../services/api";

const AdminActivity = () => {
  const [search, setSearch] = useState("");
  const [adminFilter, setAdminFilter] = useState("all");
  const [actionFilter, setActionFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [activities, setActivities] = useState([]);

  // Fetch real audit trail of admin actions
  const loadActivities = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await adminsApi.getActivities();
      const rawActivities = Array.isArray(response?.activities)
        ? response.activities
        : Array.isArray(response)
        ? response
        : [];

      setActivities(rawActivities);
    } catch (err) {
      console.error("Failed to load admin activities:", err);
      setError(err?.message || "Failed to load admin activities.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadActivities();
  }, []);

  const adminOptions = useMemo(() => {
    const names = new Set(
      activities
        .map((a) => a.adminName)
        .filter(Boolean)
    );
    return ["all", ...names];
  }, [activities]);

  const actionOptions = useMemo(() => {
    const categories = new Set(
      activities
        .map((a) => a.category)
        .filter(Boolean)
    );
    return ["all", ...categories];
  }, [activities]);

  const filteredActivities = useMemo(() => {
    return activities.filter((activity) => {
      const matchesAdmin =
        adminFilter === "all" || activity.adminName === adminFilter;

      const matchesAction =
        actionFilter === "all" || activity.category === actionFilter;

      const q = search.toLowerCase().trim();
      const matchesSearch =
        !q ||
        (activity.adminName && activity.adminName.toLowerCase().includes(q)) ||
        (activity.username && activity.username.toLowerCase().includes(q)) ||
        (activity.action && activity.action.toLowerCase().includes(q)) ||
        (activity.detail && activity.detail.toLowerCase().includes(q));

      return matchesAdmin && matchesAction && matchesSearch;
    });
  }, [activities, adminFilter, actionFilter, search]);

  const getCategoryBadgeStyle = (category) => {
    switch (category) {
      case "Customer":
        return "bg-cyan-500/10 text-cyan-400 border border-cyan-500/20";
      case "Credit":
        return "bg-amber-500/10 text-amber-400 border border-amber-500/20";
      case "Settings":
        return "bg-rose-500/10 text-rose-400 border border-rose-500/20";
      case "Admin":
        return "bg-indigo-500/10 text-indigo-400 border border-indigo-500/20";
      case "Product":
        return "bg-orange-500/10 text-orange-400 border border-orange-500/20";
      case "Category":
        return "bg-teal-500/10 text-teal-400 border border-teal-500/20";
      case "Sale":
        return "bg-blue-500/10 text-blue-400 border border-blue-500/20";
      case "Payment":
        return "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20";
      case "Return":
        return "bg-purple-500/10 text-purple-400 border border-purple-500/20";
      default:
        return "bg-zinc-500/10 text-zinc-400 border border-zinc-500/20";
    }
  };

  return (
    <div
      className="min-h-screen w-full px-4 py-6 sm:px-6 md:px-10 lg:px-12"
      style={{
        backgroundColor: "var(--app-bg)",
        color: "var(--app-text)",
      }}
    >
      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <div className="mb-7 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white sm:text-3xl">Admin Activity Audit</h1>
            <p className="mt-1 text-sm text-zinc-400">
              Complete chronological audit trail of all actions performed across the store.
            </p>
          </div>

          <button
            type="button"
            onClick={loadActivities}
            className="rounded-lg border px-3 py-2 text-xs font-semibold text-zinc-300 transition hover:bg-white/5 hover:text-white"
            style={{ borderColor: "var(--app-border)" }}
          >
            ↻ Refresh Audit Log
          </button>
        </div>

        {error && (
          <div className="mb-5 rounded-lg border border-red-500/20 bg-red-500/5 px-4 py-3 text-sm text-red-400">
            {error}
          </div>
        )}

        {/* Filters */}
        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap gap-3">
            <select
              value={adminFilter}
              onChange={(e) => setAdminFilter(e.target.value)}
              className="rounded-lg border px-3 py-2 text-xs text-zinc-300 outline-none"
              style={{
                borderColor: "var(--app-border)",
                backgroundColor: "var(--app-surface)",
              }}
            >
              {adminOptions.map((opt) => (
                <option key={opt} value={opt}>
                  {opt === "all" ? "All Administrators" : opt}
                </option>
              ))}
            </select>

            <select
              value={actionFilter}
              onChange={(e) => setActionFilter(e.target.value)}
              className="rounded-lg border px-3 py-2 text-xs text-zinc-300 outline-none"
              style={{
                borderColor: "var(--app-border)",
                backgroundColor: "var(--app-surface)",
              }}
            >
              {actionOptions.map((opt) => (
                <option key={opt} value={opt}>
                  {opt === "all" ? "All Categories" : opt}
                </option>
              ))}
            </select>
          </div>

          <input
            type="search"
            placeholder="Search action or detail..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-lg border px-4 py-2 text-sm text-white outline-none sm:w-72"
            style={{
              borderColor: "var(--app-border)",
              backgroundColor: "var(--app-surface)",
            }}
          />
        </div>

        {/* Activity Feed Table */}
        {loading ? (
          <div className="py-20 text-center text-zinc-500">Loading audit log...</div>
        ) : filteredActivities.length === 0 ? (
          <div className="rounded-xl border p-12 text-center" style={{ borderColor: "var(--app-border)", backgroundColor: "var(--app-surface)" }}>
            <p className="text-zinc-500">No activity records matching filters.</p>
          </div>
        ) : (
          <div className="overflow-hidden rounded-xl border" style={{ borderColor: "var(--app-border)", backgroundColor: "var(--app-surface)" }}>
            {/* Desktop Table View */}
            <div className="hidden overflow-x-auto lg:block">
              <table className="w-full min-w-[750px] text-left text-sm">
                <thead>
                  <tr className="border-b text-xs uppercase tracking-wider text-zinc-500" style={{ borderColor: "var(--app-border)" }}>
                    <th className="px-5 py-4">Timestamp</th>
                    <th className="px-5 py-4">Actor</th>
                    <th className="px-5 py-4">Action</th>
                    <th className="px-5 py-4">Category</th>
                    <th className="px-5 py-4">Details</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredActivities.map((act) => (
                    <tr
                      key={act.id}
                      className="border-b transition hover:bg-white/[0.02]"
                      style={{ borderColor: "var(--app-border)" }}
                    >
                      <td className="px-5 py-4 text-xs font-mono text-zinc-400">{act.date}</td>
                      <td className="px-5 py-4">
                        <p className="font-semibold text-white">{act.adminName}</p>
                        <p className="text-xs font-mono text-zinc-500">{act.username}</p>
                      </td>
                      <td className="px-5 py-4 font-semibold text-white">{act.action}</td>
                      <td className="px-5 py-4">
                        <span className={`rounded-md px-2.5 py-1 text-xs font-semibold ${getCategoryBadgeStyle(act.category)}`}>
                          {act.category}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-zinc-300">{act.detail}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile & Tablet Cards View */}
            <div className="grid grid-cols-1 gap-3 p-3 sm:grid-cols-2 sm:p-4 lg:hidden">
              {filteredActivities.map((act) => (
                <div
                  key={act.id}
                  className="rounded-xl border p-4"
                  style={{
                    borderColor: "var(--app-border)",
                    backgroundColor: "var(--app-surface-light)",
                  }}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="font-semibold text-white text-sm">{act.action}</p>
                      <p className="text-xs font-mono text-zinc-400 mt-0.5">By {act.adminName} (@{act.username})</p>
                    </div>
                    <span className={`rounded-md px-2 py-0.5 text-[11px] font-semibold ${getCategoryBadgeStyle(act.category)}`}>
                      {act.category}
                    </span>
                  </div>

                  <p className="mt-2 text-xs text-zinc-300">{act.detail}</p>
                  <p className="mt-2 text-[11px] text-zinc-500 font-mono">{act.date}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminActivity;