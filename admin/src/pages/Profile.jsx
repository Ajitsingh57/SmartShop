import React, { useEffect, useState } from "react";
import { toast } from "react-toastify";
import { adminsApi, authStorage } from "../services/api";
import {
  isValidName,
  isValidPhone,
  sanitizeNameInput,
  sanitizePhoneInput,
} from "../utils/validators";

const Profile = () => {
  const [admin, setAdmin] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState(false);

  const [form, setForm] = useState({
    name: "",
    phone: "",
  });

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});

  // Load real admin profile from backend
  const loadAdminProfile = async () => {
    try {
      setLoading(true);
      setError("");

      const cachedUser = authStorage.getUser();
      if (cachedUser) {
        setAdmin({
          _id: cachedUser.id || cachedUser._id,
          name: cachedUser.name,
          username: cachedUser.username,
          email: cachedUser.email,
          phone: cachedUser.phone,
          role: cachedUser.role === "superadmin" ? "Super Administrator" : "Store Administrator",
          status: cachedUser.isActive !== false ? "Active" : "Inactive",
          createdAt: cachedUser.createdAt || new Date().toISOString(),
        });
        setForm({
          name: cachedUser.name || "",
          phone: cachedUser.phone || "",
        });
      }

      const response = await adminsApi.getMyProfile();
      if (response?.admin) {
        setAdmin(response.admin);
        setForm({
          name: response.admin.name || "",
          phone: response.admin.phone || "",
        });

        // Update local session
        authStorage.setUser({
          ...cachedUser,
          ...response.admin,
          id: response.admin._id,
        });
      }
    } catch (err) {
      console.error("Load admin profile error:", err);
      // If error, fall back to cached user in local storage
      const cached = authStorage.getUser();
      if (cached) {
        setAdmin({
          _id: cached.id || cached._id,
          name: cached.name,
          username: cached.username,
          email: cached.email,
          phone: cached.phone,
          role: cached.role === "superadmin" ? "Super Administrator" : "Store Administrator",
          status: "Active",
          createdAt: cached.createdAt || new Date().toISOString(),
        });
      } else {
        setError(err?.message || "Failed to load admin profile.");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAdminProfile();
  }, []);

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setFieldErrors({});

    const newFieldErrors = {};

    if (!form.name.trim() || !isValidName(form.name)) {
      newFieldErrors.name = "Please enter a valid full name (letters only, min 2 characters).";
    }

    if (form.phone.trim() && !isValidPhone(form.phone)) {
      newFieldErrors.phone = "Please enter a valid 10-digit mobile number.";
    }

    if (Object.keys(newFieldErrors).length > 0) {
      setFieldErrors(newFieldErrors);
      const firstMsg = Object.values(newFieldErrors)[0];
      setError(firstMsg);
      toast.error(firstMsg);
      return;
    }

    try {
      setSaving(true);
      setError("");
      setMessage("");

      const response = await adminsApi.updateMyProfile({
        name: form.name.trim(),
        phone: form.phone.trim() ? form.phone.trim().replace(/[\s\-()]/g, "") : "",
      });

      const successMsg = response?.message || "Profile updated successfully.";
      setMessage(successMsg);
      toast.success(successMsg);
      setEditing(false);
      await loadAdminProfile();
    } catch (err) {
      console.error("Update admin profile error:", err);
      const msg = err?.message || "Failed to update profile.";
      setError(msg);
      if (err?.errors) setFieldErrors(err.errors);
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  };

  const getInitials = (name) => {
    if (!name) return "A";
    return name
      .split(" ")
      .map((word) => word.charAt(0))
      .slice(0, 2)
      .join("")
      .toUpperCase();
  };

  const getStatusStyle = (status) => {
    if (status === "Active") {
      return {
        backgroundColor: "rgba(34,197,94,0.10)",
        borderColor: "rgba(34,197,94,0.20)",
        color: "#4ade80",
      };
    }
    return {
      backgroundColor: "rgba(239,68,68,0.10)",
      borderColor: "rgba(239,68,68,0.20)",
      color: "#f87171",
    };
  };

  const formatDate = (dateVal) => {
    if (!dateVal) return "—";
    const d = new Date(dateVal);
    if (isNaN(d.getTime())) return "—";
    return d.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  return (
    <div className="w-full max-w-5xl space-y-6">
      <div>
        {/* Profile header banner */}
        <div
          className="relative mb-6 overflow-hidden rounded-2xl border p-6 shadow-[0_10px_40px_rgba(0,0,0,0.35)] sm:p-8"
          style={{
            borderColor: "var(--app-accent-border)",
            background: `radial-gradient(circle at 85% 20%, var(--app-accent-soft), transparent 32%), linear-gradient(135deg, var(--app-surface-light) 0%, var(--app-surface) 100%)`,
          }}
        >
          <div className="relative z-10">
            <p className="mb-2 text-sm font-medium" style={{ color: "var(--app-accent)" }}>
              Account Settings
            </p>
            <h1 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
              Administrator Profile
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-zinc-400 sm:text-base">
              View and manage your administrator account information and administrative role.
            </p>
          </div>

          <div
            className="pointer-events-none absolute -right-16 -top-20 h-56 w-56 rounded-full border"
            style={{ borderColor: "var(--app-accent-border)" }}
          />
          <div
            className="pointer-events-none absolute -right-5 -top-9 h-36 w-36 rounded-full border"
            style={{ borderColor: "var(--app-accent-border)" }}
          />
        </div>

        {error && (
          <div className="mb-5 rounded-lg border border-red-500/20 bg-red-500/5 px-4 py-3 text-sm text-red-400">
            {error}
          </div>
        )}

        {message && (
          <div className="mb-5 rounded-lg border border-emerald-500/20 bg-emerald-500/5 px-4 py-3 text-sm text-emerald-400">
            {message}
          </div>
        )}

        {/* Profile card */}
        {loading && !admin ? (
          <div className="rounded-2xl border p-12 text-center text-zinc-500" style={{ borderColor: "var(--app-border)", backgroundColor: "var(--app-surface)" }}>
            Loading administrator profile...
          </div>
        ) : (
          <div
            className="overflow-hidden rounded-2xl border"
            style={{
              borderColor: "var(--app-border)",
              backgroundColor: "var(--app-surface)",
            }}
          >
            <div
              className="flex flex-col gap-5 border-b p-6 sm:flex-row sm:items-center sm:justify-between sm:p-8"
              style={{ borderColor: "var(--app-border)" }}
            >
              <div className="flex items-center gap-4">
                <div
                  className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl text-lg font-bold sm:h-20 sm:w-20 sm:text-xl text-white"
                  style={{
                    backgroundColor: "var(--app-accent)",
                    boxShadow: "0 10px 25px var(--app-accent-soft)",
                  }}
                >
                  {getInitials(admin?.name)}
                </div>

                <div>
                  <h2 className="text-xl font-bold text-white sm:text-2xl">{admin?.name || "Admin"}</h2>
                  <p className="mt-1 font-mono text-sm text-zinc-400">@{admin?.username || "admin"}</p>
                  <div className="mt-2 flex items-center gap-2">
                    <span
                      className="inline-flex rounded-full border px-2.5 py-1 text-[11px] font-medium"
                      style={getStatusStyle(admin?.status || "Active")}
                    >
                      {admin?.status || "Active"}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
                <div
                  className="rounded-xl border px-4 py-3 sm:min-w-[170px]"
                  style={{
                    borderColor: "var(--app-accent-border)",
                    backgroundColor: "var(--app-accent-soft)",
                  }}
                >
                  <p className="text-[10px] uppercase tracking-wider text-zinc-500">Access Level</p>
                  <p className="mt-1 text-sm font-semibold" style={{ color: "var(--app-accent)" }}>
                    {admin?.role || "Store Administrator"}
                  </p>
                </div>

                {!editing && (
                  <button
                    type="button"
                    onClick={() => setEditing(true)}
                    className="rounded-xl border border-zinc-700 bg-zinc-900 px-4 py-2.5 text-xs font-semibold text-zinc-300 transition hover:bg-zinc-800 hover:text-white"
                  >
                    Edit Profile
                  </button>
                )}
              </div>
            </div>

            {/* Editable Profile Information Form */}
            {editing ? (
              <form onSubmit={handleUpdateProfile} className="p-6 sm:p-8 space-y-4">
                <h3 className="text-base font-semibold text-white">Edit Your Details</h3>

                <div>
                  <label className="mb-1 block text-xs font-semibold text-zinc-400">Full Name</label>
                  <input
                    type="text"
                    required
                    placeholder="Full name (letters only)..."
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
                  <label className="mb-1 block text-xs font-semibold text-zinc-400">Phone Number (10 Digits)</label>
                  <input
                    type="tel"
                    maxLength={10}
                    placeholder="Enter 10-digit mobile number..."
                    value={form.phone}
                    onChange={(e) => {
                      setForm({ ...form, phone: sanitizePhoneInput(e.target.value) });
                      if (fieldErrors.phone) setFieldErrors((prev) => ({ ...prev, phone: "" }));
                    }}
                    className={`w-full rounded-lg border p-3 text-sm text-white outline-none ${
                      fieldErrors.phone ? "border-red-500 ring-1 ring-red-500" : ""
                    }`}
                    style={{ borderColor: fieldErrors.phone ? "#ef4444" : "var(--app-border)", backgroundColor: "var(--app-surface-light)" }}
                  />
                  {fieldErrors.phone && (
                    <p className="mt-1 text-xs text-red-500 font-medium">
                      {fieldErrors.phone}
                    </p>
                  )}
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    type="submit"
                    disabled={saving}
                    className="rounded-lg px-5 py-2.5 font-semibold text-white disabled:opacity-50"
                    style={{ backgroundColor: "var(--app-accent)" }}
                  >
                    {saving ? "Saving..." : "Save Changes"}
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditing(false)}
                    className="rounded-lg border px-5 py-2.5 font-semibold text-zinc-300 hover:bg-white/5"
                    style={{ borderColor: "var(--app-border)" }}
                  >
                    Cancel
                  </button>
                </div>
              </form>
            ) : (
              <div className="p-6 sm:p-8">
                <div className="mb-5">
                  <h3 className="text-base font-semibold text-white">Account Information</h3>
                  <p className="mt-1 text-xs text-zinc-500">
                    Live session details retrieved from your SmartShop administrator account.
                  </p>
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div
                    className="rounded-xl border p-5"
                    style={{
                      borderColor: "var(--app-border)",
                      backgroundColor: "var(--app-surface-light)",
                    }}
                  >
                    <p className="text-[11px] uppercase tracking-wider text-zinc-500">Full Name</p>
                    <p className="mt-2 text-sm font-medium text-zinc-200">{admin?.name || "—"}</p>
                  </div>

                  <div
                    className="rounded-xl border p-5"
                    style={{
                      borderColor: "var(--app-border)",
                      backgroundColor: "var(--app-surface-light)",
                    }}
                  >
                    <p className="text-[11px] uppercase tracking-wider text-zinc-500">Username</p>
                    <p className="mt-2 text-sm font-mono text-zinc-200">@{admin?.username || "—"}</p>
                  </div>

                  <div
                    className="rounded-xl border p-5"
                    style={{
                      borderColor: "var(--app-border)",
                      backgroundColor: "var(--app-surface-light)",
                    }}
                  >
                    <p className="text-[11px] uppercase tracking-wider text-zinc-500">Email Address</p>
                    <p className="mt-2 text-sm font-medium text-zinc-200">{admin?.email || "No email linked"}</p>
                  </div>

                  <div
                    className="rounded-xl border p-5"
                    style={{
                      borderColor: "var(--app-border)",
                      backgroundColor: "var(--app-surface-light)",
                    }}
                  >
                    <p className="text-[11px] uppercase tracking-wider text-zinc-500">Phone Number</p>
                    <p className="mt-2 text-sm font-medium text-zinc-200">{admin?.phone || "No phone linked"}</p>
                  </div>
                </div>

                {/* Live Store Contributions */}
                <div className="mt-6 border-t pt-6" style={{ borderColor: "var(--app-border)" }}>
                  <h3 className="text-base font-semibold text-white">Store Contributions & Statistics</h3>
                  <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
                    <div
                      className="rounded-xl border p-5"
                      style={{
                        borderColor: "var(--app-border)",
                        backgroundColor: "var(--app-surface-light)",
                      }}
                    >
                      <p className="text-[11px] uppercase tracking-wider text-zinc-500">Sales Invoices Created</p>
                      <p className="mt-2 text-xl font-bold text-white">
                        {admin?.stats?.salesRecorded ?? "—"}
                      </p>
                    </div>

                    <div
                      className="rounded-xl border p-5"
                      style={{
                        borderColor: "var(--app-border)",
                        backgroundColor: "var(--app-surface-light)",
                      }}
                    >
                      <p className="text-[11px] uppercase tracking-wider text-zinc-500">Payments Processed</p>
                      <p className="mt-2 text-xl font-bold text-emerald-400">
                        {admin?.stats?.paymentsVerified ?? "—"}
                      </p>
                    </div>

                    <div
                      className="rounded-xl border p-5"
                      style={{
                        borderColor: "var(--app-border)",
                        backgroundColor: "var(--app-surface-light)",
                      }}
                    >
                      <p className="text-[11px] uppercase tracking-wider text-zinc-500">Account Joined</p>
                      <p className="mt-2 text-sm font-medium text-zinc-300">
                        {formatDate(admin?.createdAt)}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Profile;