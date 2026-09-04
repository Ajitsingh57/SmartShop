import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "react-toastify";
import {
  authStorage,
  authApi,
  salesApi,
  creditsApi,
} from "../services/api";
import {
  isValidName,
  isValidPhone,
  sanitizeNameInput,
  sanitizePhoneInput,
} from "../utils/validators";

const Profile = () => {
  const [user, setUser] = useState(null);
  const [customerSummary, setCustomerSummary] = useState({
    totalPurchases: 0,
    totalSalesCount: 0,
    pendingCredit: 0,
    trustScore: 0,
    borrowLimit: 0,
  });
  const [recentPurchases, setRecentPurchases] = useState([]);

  const [editingName, setEditingName] = useState(false);
  const [name, setName] = useState("");

  const [addingPhone, setAddingPhone] = useState(false);
  const [phone, setPhone] = useState("");

  const [loading, setLoading] = useState(false);
  const [profileLoading, setProfileLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});

  // Load customer profile and real purchasing history
  const loadProfileData = async () => {
    try {
      setProfileLoading(true);
      setError("");

      const currentUser = authStorage.getUser();
      if (currentUser) {
        setUser(currentUser);
        setName(currentUser.name || "");
        setPhone(currentUser.phone || "");
      }

      const [profileRes, salesRes, creditsRes] = await Promise.allSettled([
        authApi.getMyProfile(),
        salesApi.getMySales(),
        creditsApi.getMyCredits(),
      ]);

      let loadedSales = [];
      if (salesRes.status === "fulfilled") {
        loadedSales = Array.isArray(salesRes.value?.sales)
          ? salesRes.value.sales
          : Array.isArray(salesRes.value)
          ? salesRes.value
          : [];
        setRecentPurchases(loadedSales.slice(0, 5));
      }

      let loadedCredits = [];
      if (creditsRes.status === "fulfilled") {
        loadedCredits = Array.isArray(creditsRes.value?.credits)
          ? creditsRes.value.credits
          : Array.isArray(creditsRes.value)
          ? creditsRes.value
          : [];
      }

      if (profileRes.status === "fulfilled") {
        const data = profileRes.value;
        const fetchedUser = data?.user || currentUser;
        if (fetchedUser) {
          setUser(fetchedUser);
          setName(fetchedUser.name || "");
          setPhone(fetchedUser.phone || "");
          authStorage.setUser(fetchedUser);
        }

        const totalPurchases = loadedSales.reduce(
          (sum, s) => sum + Number(s.totalAmount || 0),
          0
        );
        const totalPending = loadedCredits.reduce(
          (sum, c) => sum + Number(c.pendingAmount || 0),
          0
        );

        setCustomerSummary({
          totalPurchases: totalPurchases || data?.summary?.totalPurchases || 0,
          totalSalesCount: loadedSales.length || data?.summary?.totalSalesCount || 0,
          pendingCredit: totalPending || data?.summary?.pendingCredit || 0,
          trustScore: data?.customer?.trustScore || data?.summary?.trustScore || 0,
          borrowLimit:
            data?.customer?.manualBorrowLimit ||
            data?.customer?.maxBorrowAmount ||
            data?.summary?.borrowLimit ||
            0,
        });
      }
    } catch (err) {
      console.error("Failed to load profile:", err);
    } finally {
      setProfileLoading(false);
    }
  };

  useEffect(() => {
    loadProfileData();
  }, []);

  // Update customer display name
  const handleNameUpdate = async (e) => {
    e.preventDefault();
    setError("");
    setMessage("");
    setFieldErrors({});

    const trimmedName = name.trim();
    if (!trimmedName || !isValidName(trimmedName)) {
      setFieldErrors({ name: "Please enter a valid full name (letters only, min 2 characters)." });
      toast.error("Please enter a valid full name (letters only, min 2 characters).");
      return;
    }

    if (trimmedName === user?.name) {
      setEditingName(false);
      return;
    }

    setLoading(true);

    try {
      const data = await authApi.updateMyProfile({
        name: trimmedName,
      });

      const updatedUser = {
        ...user,
        name:
          data?.user?.name ||
          data?.customer?.userId?.name ||
          trimmedName,
      };

      setUser(updatedUser);
      setName(updatedUser.name);
      authStorage.setUser(updatedUser);
      setEditingName(false);
      const successMsg = data?.message || "Name updated successfully.";
      setMessage(successMsg);
      toast.success(successMsg);
    } catch (err) {
      console.error("Name update failed:", err);
      const msg = err?.message || "Unable to update name.";
      setError(msg);
      if (err?.errors) setFieldErrors(err.errors);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleEditName = () => {
    setError("");
    setMessage("");
    setFieldErrors({});
    setName(user?.name || "");
    setEditingName(true);
  };

  const handleCancelName = () => {
    setError("");
    setMessage("");
    setFieldErrors({});
    setName(user?.name || "");
    setEditingName(false);
  };

  const handleAddPhone = () => {
    setError("");
    setMessage("");
    setFieldErrors({});
    setPhone("");
    setAddingPhone(true);
  };

  const handleCancelPhone = () => {
    setError("");
    setMessage("");
    setFieldErrors({});
    setPhone(user?.phone || "");
    setAddingPhone(false);
  };

  // Update or attach phone number to customer account
  const handlePhoneUpdate = async (e) => {
    e.preventDefault();
    setError("");
    setMessage("");
    setFieldErrors({});

    const trimmedPhone = phone.trim().replace(/[\s\-()]/g, "");
    if (!trimmedPhone || !isValidPhone(trimmedPhone)) {
      setFieldErrors({ phone: "Please enter a valid 10-digit mobile number." });
      toast.error("Please enter a valid 10-digit mobile number.");
      return;
    }

    if (trimmedPhone === user?.phone) {
      setAddingPhone(false);
      return;
    }

    setLoading(true);

    try {
      const data = await authApi.updateMyProfile({
        phone: trimmedPhone,
      });

      const updatedUser = {
        ...user,
        phone:
          data?.user?.phone ||
          data?.customer?.userId?.phone ||
          trimmedPhone,
      };

      setUser(updatedUser);
      setPhone(updatedUser.phone);
      authStorage.setUser(updatedUser);
      setAddingPhone(false);
      const successMsg = data?.message || "Phone number saved successfully.";
      setMessage(successMsg);
      toast.success(successMsg);
    } catch (err) {
      console.error("Phone update failed:", err);
      const msg = err?.message || "Unable to update phone number.";
      setError(msg);
      if (err?.errors) setFieldErrors(err.errors);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const displayName = user?.name || user?.username || "SmartShop User";
  const email = user?.email || null;
  const currentPhone = user?.phone || null;

  return (
    <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8 pb-16">
      <div
        className="mx-auto max-w-4xl rounded-xl border border-white/5 p-5 text-white shadow-[0_10px_40px_rgba(0,0,0,0.5)] sm:rounded-[16px] sm:p-8 md:p-10"
        style={{
          background:
            "radial-gradient(circle at top right, var(--app-accent-soft), transparent 60%), linear-gradient(135deg, var(--app-surface-light) 0%, var(--app-surface) 100%)",
        }}
      >
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white sm:text-4xl">
            My Profile
          </h1>
          <p className="mt-2 text-sm text-zinc-400 sm:text-base">
            Manage your account, view your purchasing history and credit lines.
          </p>
        </div>

        {error && (
          <div className="mb-5 rounded-lg border border-red-500/20 bg-red-500/5 px-4 py-3 text-sm text-red-400">
            {error}
          </div>
        )}

        {message && (
          <div className="mb-5 rounded-lg border border-green-500/20 bg-green-500/5 px-4 py-3 text-sm text-green-400">
            {message}
          </div>
        )}

        {/* Profile summary header */}
        <div className="mb-8 flex flex-col items-center gap-5 rounded-xl border border-zinc-800 bg-zinc-950/70 p-6 sm:flex-row sm:items-center">
          <div
            className="flex h-20 w-20 shrink-0 items-center justify-center rounded-full text-3xl font-bold text-white shadow-lg"
            style={{
              backgroundColor: "var(--app-accent)",
              boxShadow: "0 10px 25px var(--app-accent-soft)",
            }}
          >
            {displayName.charAt(0).toUpperCase()}
          </div>

          <div className="text-center sm:text-left">
            <h2 className="text-2xl font-bold text-white">{displayName}</h2>
            <p className="mt-1 text-sm text-zinc-400">
              {email || currentPhone || "SmartShop Account"}
            </p>
            <span className="mt-3 inline-block rounded-full border border-[var(--app-accent-border)] bg-[var(--app-accent-soft)] px-3 py-1 text-xs font-medium text-[var(--app-accent)]">
              Customer Account
            </span>
          </div>
        </div>

        {/* Purchasing & Financial Summary Cards */}
        <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="rounded-xl border border-zinc-800 bg-zinc-950/80 p-5">
            <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
              Total Purchases
            </p>
            <p className="mt-2 text-2xl font-bold text-white sm:text-3xl">
              ₹{Number(customerSummary.totalPurchases || 0).toLocaleString("en-IN")}
            </p>
            <p className="mt-1 text-xs text-zinc-400">
              {customerSummary.totalSalesCount} orders recorded
            </p>
          </div>

          <div className="rounded-xl border border-zinc-800 bg-zinc-950/80 p-5">
            <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
              Pending Credit Balance
            </p>
            <p className="mt-2 text-2xl font-bold sm:text-3xl" style={{ color: "var(--app-accent)" }}>
              ₹{Number(customerSummary.pendingCredit || 0).toLocaleString("en-IN")}
            </p>
            <Link to="/payments" className="mt-1 inline-block text-xs font-semibold hover:underline" style={{ color: "var(--app-accent)" }}>
              Pay / Clear balance →
            </Link>
          </div>

          <div className="rounded-xl border border-zinc-800 bg-zinc-950/80 p-5">
            <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
              Trust Score
            </p>
            <p className="mt-2 text-2xl font-bold text-white sm:text-3xl">
              {customerSummary.trustScore}
              <span className="text-sm font-normal text-zinc-500">/100</span>
            </p>
            <p className="mt-1 text-xs text-emerald-400">
              Borrow Limit: ₹{Number(customerSummary.borrowLimit || 0).toLocaleString("en-IN")}
            </p>
          </div>
        </div>

        {/* Recent Purchases Breakdown */}
        <div className="mb-8 rounded-xl border border-zinc-800 bg-zinc-950/70 p-6">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-white">Recent Purchases</h2>
              <p className="text-xs text-zinc-400">Items bought in your shop</p>
            </div>
            <Link
              to="/transactions"
              className="text-xs font-semibold hover:underline"
              style={{ color: "var(--app-accent)" }}
            >
              View all transactions →
            </Link>
          </div>

          {profileLoading ? (
            <p className="py-6 text-center text-xs text-zinc-500">Loading purchase history...</p>
          ) : recentPurchases.length === 0 ? (
            <p className="py-6 text-center text-xs text-zinc-500">No purchases recorded yet.</p>
          ) : (
            <div className="space-y-3">
              {recentPurchases.map((sale) => {
                const items = Array.isArray(sale?.items) ? sale.items : [];
                return (
                  <div
                    key={sale._id}
                    className="flex flex-col gap-2 rounded-lg border border-zinc-800 bg-zinc-900/60 p-3.5 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div>
                      <p className="font-semibold text-white text-sm">
                        Sale #{String(sale._id).slice(-6).toUpperCase()}
                      </p>
                      {items.length > 0 && (
                        <p className="text-xs text-zinc-400 mt-0.5">
                          {items.map((it) => `${it.productName || "Item"}${it.quantity ? ` (x${it.quantity})` : ""}`).join(", ")}
                        </p>
                      )}
                      <p className="text-[11px] text-zinc-500 mt-1">
                        {new Date(sale.createdAt).toLocaleString("en-IN", {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                    </div>

                    <div className="flex items-center justify-between sm:justify-end sm:gap-4">
                      <span className="rounded-full bg-zinc-800 px-2.5 py-0.5 text-[10px] font-semibold text-zinc-300 uppercase">
                        {sale.paymentType}
                      </span>
                      <p className="font-bold text-white text-sm">
                        ₹{Number(sale.totalAmount || 0).toLocaleString("en-IN")}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Editable profile parameters */}
        <div className="mb-8">
          <h2 className="mb-4 text-lg font-semibold text-white">
            Personal Information
          </h2>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="rounded-lg border border-zinc-800 bg-zinc-950 p-4 sm:col-span-2">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <p className="text-xs text-zinc-500">Full Name</p>

                  {editingName ? (
                    <form onSubmit={handleNameUpdate} className="mt-3">
                      <input
                        type="text"
                        value={name}
                        onChange={(e) => {
                          setName(sanitizeNameInput(e.target.value));
                          if (fieldErrors.name) setFieldErrors((prev) => ({ ...prev, name: "" }));
                        }}
                        autoFocus
                        disabled={loading}
                        placeholder="Enter full name (letters only)"
                        className={`w-full rounded-lg border bg-zinc-900 px-4 py-3 text-sm text-white outline-none transition ${
                          fieldErrors.name ? "border-red-500 ring-1 ring-red-500" : "border-zinc-700 focus:border-[var(--app-accent-border)] focus:ring-1 focus:ring-[var(--app-accent-soft)]"
                        }`}
                      />
                      {fieldErrors.name && (
                        <p className="mt-1 text-xs text-red-500 font-medium">
                          {fieldErrors.name}
                        </p>
                      )}

                      <div className="mt-3 flex flex-wrap gap-2">
                        <button
                          type="submit"
                          disabled={loading}
                          className="rounded-lg bg-[var(--app-accent)] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[var(--app-accent-hover)] disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          {loading ? "Saving..." : "Save Name"}
                        </button>

                        <button
                          type="button"
                          onClick={handleCancelName}
                          disabled={loading}
                          className="rounded-lg border border-zinc-700 bg-zinc-900 px-4 py-2 text-sm font-medium text-zinc-300 transition hover:bg-zinc-800 hover:text-white"
                        >
                          Cancel
                        </button>
                      </div>
                    </form>
                  ) : (
                    <p className="mt-1 text-sm font-medium text-zinc-200">
                      {displayName}
                    </p>
                  )}
                </div>

                {!editingName && (
                  <button
                    type="button"
                    onClick={handleEditName}
                    className="shrink-0 rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-xs font-medium text-zinc-300 transition hover:border-[var(--app-accent-border)] hover:bg-[var(--app-accent-soft)] hover:text-[var(--app-accent)]"
                  >
                    Edit
                  </button>
                )}
              </div>
            </div>

            <div className="rounded-lg border border-zinc-800 bg-zinc-950 p-4">
              <p className="text-xs text-zinc-500">Email</p>
              {email ? (
                <p className="mt-1 break-all text-sm font-medium text-zinc-200">
                  {email}
                </p>
              ) : (
                <p className="mt-1 text-sm text-zinc-500">Not added yet</p>
              )}
            </div>

            <div className="rounded-lg border border-zinc-800 bg-zinc-950 p-4">
              <p className="text-xs text-zinc-500">Phone</p>

              {addingPhone ? (
                <form onSubmit={handlePhoneUpdate} className="mt-3">
                  <input
                    type="tel"
                    maxLength={10}
                    value={phone}
                    onChange={(e) => {
                      setPhone(sanitizePhoneInput(e.target.value));
                      if (fieldErrors.phone) setFieldErrors((prev) => ({ ...prev, phone: "" }));
                    }}
                    autoFocus
                    disabled={loading}
                    placeholder="Enter 10-digit phone number"
                    className={`w-full rounded-lg border bg-zinc-900 px-4 py-3 text-sm text-white placeholder:text-zinc-600 outline-none transition ${
                      fieldErrors.phone ? "border-red-500 ring-1 ring-red-500" : "border-zinc-700 focus:border-[var(--app-accent-border)] focus:ring-1 focus:ring-[var(--app-accent-soft)]"
                    }`}
                  />
                  {fieldErrors.phone && (
                    <p className="mt-1 text-xs text-red-500 font-medium">
                      {fieldErrors.phone}
                    </p>
                  )}

                  <div className="mt-3 flex flex-wrap gap-2">
                    <button
                      type="submit"
                      disabled={loading}
                      className="rounded-lg bg-[var(--app-accent)] px-4 py-2 text-xs font-semibold text-white transition hover:bg-[var(--app-accent-hover)] disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {loading ? "Saving..." : "Save Phone"}
                    </button>

                    <button
                      type="button"
                      onClick={handleCancelPhone}
                      disabled={loading}
                      className="rounded-lg border border-zinc-700 bg-zinc-900 px-4 py-2 text-xs font-medium text-zinc-300 transition hover:bg-zinc-800 hover:text-white"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              ) : currentPhone ? (
                <div className="mt-1 flex items-center justify-between gap-2">
                  <p className="text-sm font-medium text-zinc-200">
                    {currentPhone}
                  </p>
                  <button
                    type="button"
                    onClick={handleAddPhone}
                    className="rounded-md border border-zinc-700 bg-zinc-900 px-2 py-1 text-xs text-zinc-300 transition hover:bg-zinc-800 hover:text-white"
                  >
                    Edit
                  </button>
                </div>
              ) : (
                <div className="mt-1 flex items-center justify-between gap-2">
                  <p className="text-sm text-zinc-500">Not added yet</p>
                  <button
                    type="button"
                    onClick={handleAddPhone}
                    className="rounded-md border border-zinc-700 bg-zinc-900 px-2 py-1 text-xs text-zinc-300 transition hover:bg-zinc-800 hover:text-white"
                  >
                    Add Phone
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        <div>
          <h2 className="mb-4 text-lg font-semibold text-white">
            Account Security
          </h2>

          <div className="flex flex-col gap-3 sm:flex-row">
            <Link
              to="/settings/change-password"
              className="rounded-lg border border-[var(--app-accent-border)] bg-[var(--app-accent)] px-5 py-3 text-center text-sm font-semibold text-white transition hover:bg-[var(--app-accent-hover)]"
            >
              Change Password
            </Link>

            <Link
              to="/settings"
              className="rounded-lg border border-zinc-700 bg-zinc-900 px-5 py-3 text-center text-sm font-medium text-zinc-300 transition hover:border-zinc-600 hover:bg-zinc-800 hover:text-white"
            >
              Back to Settings
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;