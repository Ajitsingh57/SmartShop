import React, { useEffect, useMemo, useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { toast } from "react-toastify";
import { adminsApi } from "../services/api";
import {
  isValidName,
  isValidUsername,
  sanitizeNameInput,
  sanitizeUsernameInput,
} from "../utils/validators";

const Admins = () => {
  const [activeTab, setActiveTab] = useState("accounts");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const [showAddModal, setShowAddModal] = useState(false);
  const [showAddPassword, setShowAddPassword] = useState(false);
  const [selectedAdmin, setSelectedAdmin] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showActivityModal, setShowActivityModal] = useState(false);

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});

  const [form, setForm] = useState({
    name: "",
    username: "",
    password: "",
  });

  const [editForm, setEditForm] = useState({
    name: "",
    username: "",
    password: "",
  });

  const [admins, setAdmins] = useState([]);
  const [allActivities, setAllActivities] = useState([]);

  // Load all admin accounts and live activity audit trail
  const loadAdminsAndActivities = async () => {
    try {
      setLoading(true);
      setError("");

      const [adminsRes, activitiesRes] = await Promise.allSettled([
        adminsApi.getAll(),
        adminsApi.getActivities(),
      ]);

      let activitiesList = [];
      if (activitiesRes.status === "fulfilled") {
        activitiesList = Array.isArray(activitiesRes.value?.activities)
          ? activitiesRes.value.activities
          : Array.isArray(activitiesRes.value)
          ? activitiesRes.value
          : [];
        setAllActivities(activitiesList);
      }

      if (adminsRes.status === "fulfilled") {
        const rawList = Array.isArray(adminsRes.value?.admins)
          ? adminsRes.value.admins
          : Array.isArray(adminsRes.value)
          ? adminsRes.value
          : [];

        const formatted = rawList.map((admin) => {
          const adminActivities = activitiesList.filter(
            (act) =>
              String(act.adminId) === String(admin._id) ||
              (act.adminName && act.adminName.toLowerCase() === (admin.name || "").toLowerCase()) ||
              (act.username && act.username.toLowerCase() === (admin.username || "").toLowerCase())
          );

          return {
            id: admin._id,
            name: admin.name,
            username: admin.username || "—",
            status: admin.isActive !== false ? "Active" : "Inactive",
            isActive: admin.isActive !== false,
            activitiesCount: adminActivities.length,
            activities: adminActivities,
            createdAt: new Date(admin.createdAt).toLocaleDateString("en-IN", {
              day: "2-digit",
              month: "short",
              year: "numeric",
            }),
          };
        });

        setAdmins(formatted);
      }
    } catch (err) {
      console.error("Failed to load admins:", err);
      setError(err?.message || "Failed to load admins.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAdminsAndActivities();
  }, []);

  const filteredAdmins = useMemo(() => {
    return admins.filter((admin) => {
      const matchesStatus =
        statusFilter === "all"
          ? true
          : statusFilter === "active"
          ? admin.isActive
          : !admin.isActive;

      const q = search.toLowerCase().trim();
      const matchesSearch =
        !q ||
        admin.name.toLowerCase().includes(q) ||
        admin.username.toLowerCase().includes(q);

      return matchesStatus && matchesSearch;
    });
  }, [admins, statusFilter, search]);

  const filteredActivities = useMemo(() => {
    const q = search.toLowerCase().trim();
    if (!q) return allActivities;

    return allActivities.filter(
      (a) =>
        (a.adminName && a.adminName.toLowerCase().includes(q)) ||
        (a.username && a.username.toLowerCase().includes(q)) ||
        (a.action && a.action.toLowerCase().includes(q)) ||
        (a.detail && a.detail.toLowerCase().includes(q)) ||
        (a.category && a.category.toLowerCase().includes(q))
    );
  }, [allActivities, search]);

  const handleAddSubmit = async (e) => {
    e.preventDefault();
    setFieldErrors({});

    const newFieldErrors = {};

    if (!form.name.trim() || !isValidName(form.name)) {
      newFieldErrors.name = "Please enter a valid name (letters only, min 2 characters).";
    }

    if (!form.username.trim() || !isValidUsername(form.username)) {
      newFieldErrors.username = "Username must be 3-30 characters with letters and numbers.";
    }

    if (!form.password) {
      newFieldErrors.password = "Please enter a password.";
    } else if (form.password.length < 6) {
      newFieldErrors.password = "Password must be at least 6 characters long.";
    }

    if (Object.keys(newFieldErrors).length > 0) {
      setFieldErrors(newFieldErrors);
      const firstMsg = Object.values(newFieldErrors)[0];
      setError(firstMsg);
      toast.error(firstMsg);
      return;
    }

    try {
      setSubmitting(true);
      setError("");
      setSuccess("");

      const res = await adminsApi.create({
        name: form.name.trim(),
        username: form.username.trim(),
        password: form.password,
      });

      const successMsg = res?.message || "Admin created successfully.";
      setSuccess(successMsg);
      toast.success(successMsg);
      setShowAddModal(false);
      setForm({ name: "", username: "", password: "" });
      await loadAdminsAndActivities();
    } catch (err) {
      console.error("Create admin error:", err);
      const msg = err?.message || "Failed to create admin.";
      setError(msg);
      if (err?.errors) setFieldErrors(err.errors);
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const handleOpenEdit = (admin) => {
    setSelectedAdmin(admin);
    setFieldErrors({});
    setEditForm({
      name: admin.name,
      username: admin.username,
      password: "",
    });
    setShowEditModal(true);
  };

  const handleOpenActivity = (admin) => {
    setSelectedAdmin(admin);
    setShowActivityModal(true);
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if (!selectedAdmin) return;
    setFieldErrors({});

    const newFieldErrors = {};

    if (!editForm.name.trim() || !isValidName(editForm.name)) {
      newFieldErrors.name = "Please enter a valid name (letters only, min 2 characters).";
    }

    if (!editForm.username.trim() || !isValidUsername(editForm.username)) {
      newFieldErrors.username = "Username must be 3-30 characters with letters and numbers.";
    }

    if (editForm.password && editForm.password.length < 6) {
      newFieldErrors.password = "New password must be at least 6 characters long.";
    }

    if (Object.keys(newFieldErrors).length > 0) {
      setFieldErrors(newFieldErrors);
      const firstMsg = Object.values(newFieldErrors)[0];
      setError(firstMsg);
      toast.error(firstMsg);
      return;
    }

    try {
      setSubmitting(true);
      setError("");
      setSuccess("");

      const payload = {
        name: editForm.name.trim(),
        username: editForm.username.trim(),
      };
      if (editForm.password) {
        payload.password = editForm.password;
      }

      const res = await adminsApi.update(selectedAdmin.id, payload);
      const successMsg = res?.message || "Admin details updated successfully.";
      setSuccess(successMsg);
      toast.success(successMsg);
      setShowEditModal(false);
      setSelectedAdmin(null);
      await loadAdminsAndActivities();
    } catch (err) {
      console.error("Update admin error:", err);
      const msg = err?.message || "Failed to update admin.";
      setError(msg);
      if (err?.errors) setFieldErrors(err.errors);
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleStatus = async (admin) => {
    try {
      setError("");
      setSuccess("");

      await adminsApi.updateStatus(admin.id, !admin.isActive);
      setSuccess(`Admin ${!admin.isActive ? "activated" : "deactivated"} successfully.`);
      await loadAdminsAndActivities();
    } catch (err) {
      console.error("Toggle admin status error:", err);
      setError(err?.message || "Failed to update status.");
    }
  };

  const handleDeleteSubmit = async () => {
    if (!selectedAdmin) return;

    try {
      setSubmitting(true);
      setError("");
      setSuccess("");

      await adminsApi.delete(selectedAdmin.id);
      setSuccess("Admin deleted successfully.");
      setShowDeleteModal(false);
      setSelectedAdmin(null);
      await loadAdminsAndActivities();
    } catch (err) {
      console.error("Delete admin error:", err);
      setError(err?.message || "Failed to delete admin.");
    } finally {
      setSubmitting(false);
    }
  };

  const getCategoryBadgeStyle = (category) => {
    switch (category) {
      case "Sale":
        return "bg-blue-500/10 text-blue-400 border border-blue-500/20";
      case "Payment":
        return "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20";
      case "Return":
        return "bg-purple-500/10 text-purple-400 border border-purple-500/20";
      case "Product":
        return "bg-orange-500/10 text-orange-400 border border-orange-500/20";
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
        {/* Header toolbar */}
        <div className="mb-7 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white sm:text-3xl">Admin Management & Activities</h1>
            <p className="mt-1 text-sm text-zinc-400">
              Manage administrator accounts and audit all actions performed across the store.
            </p>
          </div>

          <button
            type="button"
            onClick={() => {
              setForm({ name: "", username: "", password: "" });
              setShowAddModal(true);
            }}
            className="flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold text-white transition hover:opacity-90 shadow-lg"
            style={{ backgroundColor: "var(--app-accent)" }}
          >
            ＋ Add New Admin
          </button>
        </div>

        {error && (
          <div className="mb-5 rounded-lg border border-red-500/20 bg-red-500/5 px-4 py-3 text-sm text-red-400">
            {error}
          </div>
        )}

        {success && (
          <div className="mb-5 rounded-lg border border-emerald-500/20 bg-emerald-500/5 px-4 py-3 text-sm text-emerald-400">
            {success}
          </div>
        )}

        {/* View Switcher Tabs: Accounts vs Activity Log */}
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex gap-2 border-b sm:border-0 pb-2 sm:pb-0" style={{ borderColor: "var(--app-border)" }}>
            <button
              type="button"
              onClick={() => setActiveTab("accounts")}
              className={`rounded-lg px-4 py-2 text-xs font-semibold transition ${
                activeTab === "accounts"
                  ? "text-white shadow-sm"
                  : "text-zinc-500 hover:text-zinc-300"
              }`}
              style={
                activeTab === "accounts"
                  ? { backgroundColor: "var(--app-accent)", color: "#fff" }
                  : {}
              }
            >
              Admin Accounts ({admins.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("activities")}
              className={`rounded-lg px-4 py-2 text-xs font-semibold transition ${
                activeTab === "activities"
                  ? "text-white shadow-sm"
                  : "text-zinc-500 hover:text-zinc-300"
              }`}
              style={
                activeTab === "activities"
                  ? { backgroundColor: "var(--app-accent)", color: "#fff" }
                  : {}
              }
            >
              Live Activity Audit ({allActivities.length})
            </button>
          </div>

          <div className="flex flex-wrap gap-2 items-center">
            {activeTab === "accounts" && (
              <div className="flex gap-1.5">
                {[
                  { key: "all", label: "All" },
                  { key: "active", label: "Active" },
                  { key: "inactive", label: "Inactive" },
                ].map((f) => (
                  <button
                    key={f.key}
                    type="button"
                    onClick={() => setStatusFilter(f.key)}
                    className={`rounded-lg px-2.5 py-1.5 text-xs font-medium transition ${
                      statusFilter === f.key
                        ? "bg-white/10 text-white border border-white/20"
                        : "text-zinc-500 hover:text-zinc-300"
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
            )}

            <input
              type="search"
              placeholder={activeTab === "accounts" ? "Search admin..." : "Search actions, admin..."}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-lg border px-4 py-2 text-sm text-white outline-none sm:w-64"
              style={{
                borderColor: "var(--app-border)",
                backgroundColor: "var(--app-surface)",
              }}
            />
          </div>
        </div>

        {/* Tab 1: Admins Accounts List */}
        {activeTab === "accounts" && (
          <>
            {loading ? (
              <div className="py-20 text-center text-zinc-500">Loading administrators...</div>
            ) : filteredAdmins.length === 0 ? (
              <div className="rounded-xl border p-12 text-center" style={{ borderColor: "var(--app-border)", backgroundColor: "var(--app-surface)" }}>
                <p className="text-zinc-500">No admin accounts found.</p>
              </div>
            ) : (
              <div className="overflow-hidden rounded-xl border" style={{ borderColor: "var(--app-border)", backgroundColor: "var(--app-surface)" }}>
                {/* Desktop Table View */}
                <div className="hidden overflow-x-auto lg:block">
                  <table className="w-full min-w-[700px] text-left text-sm">
                    <thead>
                      <tr className="border-b text-xs uppercase tracking-wider text-zinc-500" style={{ borderColor: "var(--app-border)" }}>
                        <th className="px-5 py-4">Admin Name</th>
                        <th className="px-5 py-4">Username</th>
                        <th className="px-5 py-4">Status</th>
                        <th className="px-5 py-4">Live Activity</th>
                        <th className="px-5 py-4">Created Date</th>
                        <th className="px-5 py-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredAdmins.map((admin) => (
                        <tr
                          key={admin.id}
                          className="border-b transition hover:bg-white/[0.02]"
                          style={{ borderColor: "var(--app-border)" }}
                        >
                          <td className="px-5 py-4 font-semibold text-white">{admin.name}</td>
                          <td className="px-5 py-4 font-mono text-xs text-zinc-300">{admin.username}</td>
                          <td className="px-5 py-4">
                            <span
                              className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                                admin.isActive
                                  ? "bg-emerald-500/10 text-emerald-400"
                                  : "bg-red-500/10 text-red-400"
                              }`}
                            >
                              {admin.status}
                            </span>
                          </td>
                          <td className="px-5 py-4">
                            <button
                              type="button"
                              onClick={() => handleOpenActivity(admin)}
                              className="rounded-lg border px-2.5 py-1 text-xs font-semibold transition"
                              style={{
                                borderColor: "var(--app-accent-border)",
                                backgroundColor: "var(--app-accent-soft)",
                                color: "var(--app-accent)",
                              }}
                            >
                              ⚡ Activity ({admin.activitiesCount})
                            </button>
                          </td>
                          <td className="px-5 py-4 text-xs text-zinc-400">{admin.createdAt}</td>
                          <td className="px-5 py-4 text-right">
                            <div className="flex justify-end gap-2">
                              <button
                                type="button"
                                onClick={() => handleToggleStatus(admin)}
                                className="rounded-lg border px-3 py-1.5 text-xs font-medium text-zinc-300 hover:text-white"
                                style={{ borderColor: "var(--app-border)" }}
                              >
                                {admin.isActive ? "Deactivate" : "Activate"}
                              </button>
                              <button
                                type="button"
                                onClick={() => handleOpenEdit(admin)}
                                className="rounded-lg border px-3 py-1.5 text-xs font-medium text-zinc-300 hover:text-white"
                                style={{ borderColor: "var(--app-border)" }}
                              >
                                Edit
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  setSelectedAdmin(admin);
                                  setShowDeleteModal(true);
                                }}
                                className="rounded-lg border border-red-500/20 bg-red-500/10 px-3 py-1.5 text-xs font-semibold text-red-400 hover:bg-red-500/20"
                              >
                                Delete
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Mobile & Tablet Cards View */}
                <div className="grid grid-cols-1 gap-3 p-3 sm:grid-cols-2 sm:p-4 lg:hidden">
                  {filteredAdmins.map((admin) => (
                    <div
                      key={admin.id}
                      className="rounded-xl border p-4 flex flex-col justify-between"
                      style={{
                        borderColor: "var(--app-border)",
                        backgroundColor: "var(--app-surface-light)",
                      }}
                    >
                      <div>
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <p className="font-semibold text-white text-base">{admin.name}</p>
                            <p className="text-xs font-mono text-zinc-400">@{admin.username}</p>
                          </div>
                          <span
                            className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                              admin.isActive
                                ? "bg-emerald-500/10 text-emerald-400"
                                : "bg-red-500/10 text-red-400"
                            }`}
                          >
                            {admin.status}
                          </span>
                        </div>

                        <div className="mt-3 flex items-center justify-between border-t pt-3" style={{ borderColor: "var(--app-border)" }}>
                          <button
                            type="button"
                            onClick={() => handleOpenActivity(admin)}
                            className="rounded-lg border px-2.5 py-1 text-xs font-semibold"
                            style={{
                              borderColor: "var(--app-accent-border)",
                              backgroundColor: "var(--app-accent-soft)",
                              color: "var(--app-accent)",
                            }}
                          >
                            ⚡ Activity ({admin.activitiesCount})
                          </button>
                          <span className="text-xs text-zinc-500">{admin.createdAt}</span>
                        </div>
                      </div>

                      <div className="mt-3 flex gap-2 border-t pt-3" style={{ borderColor: "var(--app-border)" }}>
                        <button
                          type="button"
                          onClick={() => handleToggleStatus(admin)}
                          className="flex-1 rounded-lg border py-2 text-xs font-semibold text-zinc-300"
                          style={{ borderColor: "var(--app-border)" }}
                        >
                          {admin.isActive ? "Deactivate" : "Activate"}
                        </button>
                        <button
                          type="button"
                          onClick={() => handleOpenEdit(admin)}
                          className="flex-1 rounded-lg border py-2 text-xs font-semibold text-zinc-300"
                          style={{ borderColor: "var(--app-border)" }}
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedAdmin(admin);
                            setShowDeleteModal(true);
                          }}
                          className="rounded-lg border border-red-500/20 bg-red-500/10 px-3 py-2 text-xs font-semibold text-red-400"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}

        {/* Tab 2: Activity Audit Timeline */}
        {activeTab === "activities" && (
          <div className="overflow-hidden rounded-xl border" style={{ borderColor: "var(--app-border)", backgroundColor: "var(--app-surface)" }}>
            {filteredActivities.length === 0 ? (
              <div className="p-12 text-center text-zinc-500">No activity logs recorded.</div>
            ) : (
              <>
                {/* Desktop Table View */}
                <div className="hidden overflow-x-auto lg:block">
                  <table className="w-full min-w-[750px] text-left text-sm">
                    <thead>
                      <tr className="border-b text-xs uppercase tracking-wider text-zinc-500" style={{ borderColor: "var(--app-border)" }}>
                        <th className="px-5 py-4">Timestamp</th>
                        <th className="px-5 py-4">Admin Actor</th>
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
              </>
            )}
          </div>
        )}

        {/* Admin Specific Activity Modal */}
        {showActivityModal && selectedAdmin && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
            <div className="w-full max-w-2xl rounded-2xl border p-5 sm:p-6 shadow-2xl max-h-[90vh] overflow-y-auto" style={{ borderColor: "var(--app-border)", backgroundColor: "var(--app-surface)" }}>
              <div className="mb-4 flex items-center justify-between border-b pb-3" style={{ borderColor: "var(--app-border)" }}>
                <div>
                  <h3 className="text-lg font-bold text-white">Activity Log: {selectedAdmin.name}</h3>
                  <p className="text-xs font-mono text-zinc-400">@{selectedAdmin.username} ({selectedAdmin.activities?.length || 0} total actions)</p>
                </div>
                <button type="button" onClick={() => setShowActivityModal(false)} className="text-zinc-400 hover:text-white">✕</button>
              </div>

              <div className="max-h-[60vh] overflow-y-auto space-y-3 pr-2">
                {(!selectedAdmin.activities || selectedAdmin.activities.length === 0) ? (
                  <p className="py-8 text-center text-sm text-zinc-500">No activity recorded for this admin yet.</p>
                ) : (
                  selectedAdmin.activities.map((act) => (
                    <div
                      key={act.id}
                      className="flex flex-col sm:flex-row sm:items-center sm:justify-between rounded-xl border p-3.5 gap-2"
                      style={{ borderColor: "var(--app-border)", backgroundColor: "var(--app-surface-light)" }}
                    >
                      <div className="flex items-center gap-3">
                        <span className={`rounded-md px-2 py-0.5 text-[11px] font-semibold ${getCategoryBadgeStyle(act.category)}`}>
                          {act.category}
                        </span>
                        <div>
                          <p className="text-sm font-semibold text-white">{act.action}</p>
                          <p className="text-xs text-zinc-400">{act.detail}</p>
                        </div>
                      </div>
                      <span className="text-xs font-mono text-zinc-500">{act.date}</span>
                    </div>
                  ))
                )}
              </div>

              <div className="mt-6">
                <button
                  type="button"
                  onClick={() => setShowActivityModal(false)}
                  className="w-full rounded-lg border py-2.5 font-semibold text-zinc-300 hover:bg-white/5"
                  style={{ borderColor: "var(--app-border)" }}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Add Modal */}
        {showAddModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
            <div className="w-full max-w-md rounded-2xl border p-6 shadow-2xl" style={{ borderColor: "var(--app-border)", backgroundColor: "var(--app-surface)" }}>
              <h3 className="text-lg font-bold text-white">Create New Admin</h3>
              <p className="mt-1 text-xs text-zinc-400">Add an administrator account with dashboard access.</p>

              <form onSubmit={handleAddSubmit} className="mt-5 space-y-4">
                <div>
                  <label className="mb-1 block text-xs font-semibold text-zinc-300">Full Name</label>
                  <input
                    type="text"
                    required
                    placeholder="Admin name (letters only)..."
                    value={form.name}
                    onChange={(e) => {
                      setForm({ ...form, name: sanitizeNameInput(e.target.value) });
                      if (fieldErrors.name) setFieldErrors((prev) => ({ ...prev, name: "" }));
                    }}
                    className={`w-full rounded-lg border p-3 text-sm text-white outline-none ${
                      fieldErrors.name ? "border-red-500 ring-1 ring-red-500" : ""
                    }`}
                    style={{ borderColor: fieldErrors.name ? "#ef4444" : "var(--app-border)", backgroundColor: "var(--app-surface-light)" }}
                  />
                  {fieldErrors.name && (
                    <p className="mt-1 text-xs text-red-500 font-medium">
                      {fieldErrors.name}
                    </p>
                  )}
                </div>

                <div>
                  <label className="mb-1 block text-xs font-semibold text-zinc-300">Username</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. rahul_admin"
                    value={form.username}
                    onChange={(e) => {
                      setForm({ ...form, username: sanitizeUsernameInput(e.target.value) });
                      if (fieldErrors.username) setFieldErrors((prev) => ({ ...prev, username: "" }));
                    }}
                    className={`w-full rounded-lg border p-3 text-sm text-white outline-none ${
                      fieldErrors.username ? "border-red-500 ring-1 ring-red-500" : ""
                    }`}
                    style={{ borderColor: fieldErrors.username ? "#ef4444" : "var(--app-border)", backgroundColor: "var(--app-surface-light)" }}
                  />
                  {fieldErrors.username && (
                    <p className="mt-1 text-xs text-red-500 font-medium">
                      {fieldErrors.username}
                    </p>
                  )}
                </div>

                <div>
                  <label className="mb-1 block text-xs font-semibold text-zinc-300">Password</label>
                  <div className="relative">
                    <input
                      type={showAddPassword ? "text" : "password"}
                      required
                      minLength={6}
                      placeholder="Password (min 6 characters)"
                      value={form.password}
                      onChange={(e) => {
                        setForm({ ...form, password: e.target.value });
                        if (fieldErrors.password) setFieldErrors((prev) => ({ ...prev, password: "" }));
                      }}
                      className={`w-full rounded-lg border p-3 pr-10 text-sm text-white outline-none ${
                        fieldErrors.password ? "border-red-500 ring-1 ring-red-500" : ""
                      }`}
                      style={{ borderColor: fieldErrors.password ? "#ef4444" : "var(--app-border)", backgroundColor: "var(--app-surface-light)" }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowAddPassword((prev) => !prev)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 rounded p-1 text-zinc-400 hover:text-white"
                      aria-label={showAddPassword ? "Hide password" : "Show password"}
                    >
                      {showAddPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  {fieldErrors.password && (
                    <p className="mt-1 text-xs text-red-500 font-medium">
                      {fieldErrors.password}
                    </p>
                  )}
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    type="submit"
                    disabled={submitting}
                    className="flex-1 rounded-lg py-2.5 font-semibold text-white disabled:opacity-50"
                    style={{ backgroundColor: "var(--app-accent)" }}
                  >
                    {submitting ? "Creating..." : "Create Admin"}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    className="flex-1 rounded-lg border py-2.5 font-semibold text-zinc-300"
                    style={{ borderColor: "var(--app-border)" }}
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Edit Modal */}
        {showEditModal && selectedAdmin && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
            <div className="w-full max-w-md rounded-2xl border p-6 shadow-2xl" style={{ borderColor: "var(--app-border)", backgroundColor: "var(--app-surface)" }}>
              <h3 className="text-lg font-bold text-white">Edit Admin Details</h3>

              <form onSubmit={handleEditSubmit} className="mt-5 space-y-4">
                <div>
                  <label className="mb-1 block text-xs font-semibold text-zinc-300">Full Name</label>
                  <input
                    type="text"
                    required
                    placeholder="Admin name (letters only)..."
                    value={editForm.name}
                    onChange={(e) => {
                      setEditForm({ ...editForm, name: sanitizeNameInput(e.target.value) });
                      if (fieldErrors.name) setFieldErrors((prev) => ({ ...prev, name: "" }));
                    }}
                    className={`w-full rounded-lg border p-3 text-sm text-white outline-none ${
                      fieldErrors.name ? "border-red-500 ring-1 ring-red-500" : ""
                    }`}
                    style={{ borderColor: fieldErrors.name ? "#ef4444" : "var(--app-border)", backgroundColor: "var(--app-surface-light)" }}
                  />
                  {fieldErrors.name && (
                    <p className="mt-1 text-xs text-red-500 font-medium">
                      {fieldErrors.name}
                    </p>
                  )}
                </div>

                <div>
                  <label className="mb-1 block text-xs font-semibold text-zinc-300">Username</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. rahul_admin"
                    value={editForm.username}
                    onChange={(e) => {
                      setEditForm({ ...editForm, username: sanitizeUsernameInput(e.target.value) });
                      if (fieldErrors.username) setFieldErrors((prev) => ({ ...prev, username: "" }));
                    }}
                    className={`w-full rounded-lg border p-3 text-sm text-white outline-none ${
                      fieldErrors.username ? "border-red-500 ring-1 ring-red-500" : ""
                    }`}
                    style={{ borderColor: fieldErrors.username ? "#ef4444" : "var(--app-border)", backgroundColor: "var(--app-surface-light)" }}
                  />
                  {fieldErrors.username && (
                    <p className="mt-1 text-xs text-red-500 font-medium">
                      {fieldErrors.username}
                    </p>
                  )}
                </div>

                <div>
                  <label className="mb-1 block text-xs font-semibold text-zinc-300">New Password (leave empty to keep unchanged)</label>
                  <input
                    type="password"
                    placeholder="New password..."
                    value={editForm.password}
                    onChange={(e) => {
                      setEditForm({ ...editForm, password: e.target.value });
                      if (fieldErrors.password) setFieldErrors((prev) => ({ ...prev, password: "" }));
                    }}
                    className={`w-full rounded-lg border p-3 text-sm text-white outline-none ${
                      fieldErrors.password ? "border-red-500 ring-1 ring-red-500" : ""
                    }`}
                    style={{ borderColor: fieldErrors.password ? "#ef4444" : "var(--app-border)", backgroundColor: "var(--app-surface-light)" }}
                  />
                  {fieldErrors.password && (
                    <p className="mt-1 text-xs text-red-500 font-medium">
                      {fieldErrors.password}
                    </p>
                  )}
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    type="submit"
                    disabled={submitting}
                    className="flex-1 rounded-lg py-2.5 font-semibold text-white disabled:opacity-50"
                    style={{ backgroundColor: "var(--app-accent)" }}
                  >
                    {submitting ? "Saving..." : "Save Changes"}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowEditModal(false)}
                    className="flex-1 rounded-lg border py-2.5 font-semibold text-zinc-300"
                    style={{ borderColor: "var(--app-border)" }}
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Delete Confirmation Modal */}
        {showDeleteModal && selectedAdmin && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
            <div className="w-full max-w-md rounded-2xl border p-6 shadow-2xl" style={{ borderColor: "var(--app-border)", backgroundColor: "var(--app-surface)" }}>
              <h3 className="text-lg font-bold text-white">Delete Admin Account</h3>
              <p className="mt-2 text-sm text-zinc-400">
                Are you sure you want to delete administrator <span className="font-semibold text-white">{selectedAdmin.name}</span>? This action cannot be undone.
              </p>

              <div className="mt-6 flex gap-3">
                <button
                  type="button"
                  disabled={submitting}
                  onClick={handleDeleteSubmit}
                  className="flex-1 rounded-lg bg-red-600 py-2.5 font-semibold text-white transition hover:bg-red-500 disabled:opacity-50"
                >
                  {submitting ? "Deleting..." : "Confirm Delete"}
                </button>
                <button
                  type="button"
                  onClick={() => setShowDeleteModal(false)}
                  className="flex-1 rounded-lg border py-2.5 font-semibold text-zinc-300"
                  style={{ borderColor: "var(--app-border)" }}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Admins;