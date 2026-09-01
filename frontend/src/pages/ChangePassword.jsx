import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Eye, EyeOff, ArrowLeft, CheckCircle2 } from "lucide-react";
import { authApi } from "../services/api";

const ChangePassword = () => {
  const navigate = useNavigate();

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Validate and submit new password credentials
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!currentPassword) {
      setError("Please enter your current password.");
      return;
    }

    if (!newPassword) {
      setError("Please enter your new password.");
      return;
    }

    if (newPassword.length < 6) {
      setError("New password must be at least 6 characters long.");
      return;
    }

    if (!confirmPassword) {
      setError("Please confirm your new password.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("New password and confirm password do not match.");
      return;
    }

    if (currentPassword === newPassword) {
      setError("New password must be different from your current password.");
      return;
    }

    setLoading(true);

    try {
      const data = await authApi.changePassword({
        currentPassword,
        newPassword,
      });

      setSuccess(data?.message || "Password changed successfully.");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err) {
      console.error("Change password failed:", err);
      setError(err?.message || "Unable to change password. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="flex min-h-[calc(100vh-73px)] w-full items-center justify-center px-4 py-10 sm:px-6"
      style={{
        backgroundColor: "var(--app-bg)",
        color: "var(--app-text)",
      }}
    >
      <div
        className="w-full max-w-md rounded-2xl border p-6 shadow-[0_10px_40px_rgba(0,0,0,0.5)] sm:p-8"
        style={{
          borderColor: "var(--app-accent-border)",
          background: `radial-gradient(circle at top right, var(--app-accent-soft), transparent 60%), linear-gradient(135deg, var(--app-surface-light) 0%, var(--app-surface) 100%)`,
        }}
      >
        <div className="mb-8 text-center">
          <div
            className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full text-2xl font-bold text-white shadow-lg transition-all duration-300"
            style={{
              backgroundColor: "var(--app-accent)",
              boxShadow: "0 10px 25px var(--app-accent-soft)",
            }}
          >
            S
          </div>

          <h1
            className="text-3xl font-bold tracking-tight sm:text-4xl"
            style={{ color: "var(--app-text)" }}
          >
            Change Password
          </h1>

          <p className="mt-2 text-sm" style={{ color: "var(--app-text-muted)" }}>
            Update your account password securely
          </p>
        </div>

        {error && (
          <div
            className="mb-5 rounded-lg border px-4 py-3 text-sm leading-5"
            style={{
              borderColor: "rgba(239,68,68,0.20)",
              backgroundColor: "rgba(239,68,68,0.05)",
              color: "#f87171",
            }}
            role="alert"
          >
            {error}
          </div>
        )}

        {success && (
          <div
            className="mb-5 rounded-lg border px-4 py-3 text-sm leading-5"
            style={{
              borderColor: "rgba(34,197,94,0.20)",
              backgroundColor: "rgba(34,197,94,0.05)",
              color: "#4ade80",
            }}
            role="status"
          >
            {success}
          </div>
        )}

        {/* Change password form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="currentPassword"
              className="mb-1.5 block text-sm font-medium"
              style={{ color: "var(--app-text-secondary)" }}
            >
              Current Password
            </label>

            <div className="relative">
              <input
                id="currentPassword"
                type={showCurrent ? "text" : "password"}
                placeholder="Enter your current password"
                value={currentPassword}
                onChange={(e) => {
                  setCurrentPassword(e.target.value);
                  if (error) setError("");
                }}
                autoComplete="current-password"
                required
                disabled={loading}
                className="w-full rounded-lg border px-4 py-2.5 pr-20 text-sm outline-none transition-all duration-200 disabled:cursor-not-allowed disabled:opacity-60"
                style={{
                  borderColor: "var(--app-border)",
                  backgroundColor: "var(--app-surface-light)",
                  color: "var(--app-text)",
                }}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = "var(--app-accent-border)";
                  e.currentTarget.style.boxShadow = "0 0 0 1px var(--app-accent-soft)";
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = "var(--app-border)";
                  e.currentTarget.style.boxShadow = "none";
                }}
              />

              <button
                type="button"
                onClick={() => setShowCurrent((prev) => !prev)}
                disabled={loading}
                aria-label={showCurrent ? "Hide current password" : "Show current password"}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 rounded-md p-1 text-zinc-400 transition-colors hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
              >
                {showCurrent ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            </div>
          </div>

          <div>
            <label
              htmlFor="newPassword"
              className="mb-1.5 block text-sm font-medium"
              style={{ color: "var(--app-text-secondary)" }}
            >
              New Password
            </label>

            <div className="relative">
              <input
                id="newPassword"
                type={showNew ? "text" : "password"}
                placeholder="At least 6 characters"
                value={newPassword}
                onChange={(e) => {
                  setNewPassword(e.target.value);
                  if (error) setError("");
                }}
                autoComplete="new-password"
                required
                disabled={loading}
                className="w-full rounded-lg border px-4 py-2.5 pr-20 text-sm outline-none transition-all duration-200 disabled:cursor-not-allowed disabled:opacity-60"
                style={{
                  borderColor: "var(--app-border)",
                  backgroundColor: "var(--app-surface-light)",
                  color: "var(--app-text)",
                }}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = "var(--app-accent-border)";
                  e.currentTarget.style.boxShadow = "0 0 0 1px var(--app-accent-soft)";
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = "var(--app-border)";
                  e.currentTarget.style.boxShadow = "none";
                }}
              />

              <button
                type="button"
                onClick={() => setShowNew((prev) => !prev)}
                disabled={loading}
                aria-label={showNew ? "Hide new password" : "Show new password"}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 rounded-md p-1 text-zinc-400 transition-colors hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
              >
                {showNew ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            </div>
          </div>

          <div>
            <label
              htmlFor="confirmPassword"
              className="mb-1.5 block text-sm font-medium"
              style={{ color: "var(--app-text-secondary)" }}
            >
              Confirm New Password
            </label>

            <div className="relative">
              <input
                id="confirmPassword"
                type={showConfirm ? "text" : "password"}
                placeholder="Confirm your new password"
                value={confirmPassword}
                onChange={(e) => {
                  setConfirmPassword(e.target.value);
                  if (error) setError("");
                }}
                autoComplete="new-password"
                required
                disabled={loading}
                className="w-full rounded-lg border px-4 py-2.5 pr-20 text-sm outline-none transition-all duration-200 disabled:cursor-not-allowed disabled:opacity-60"
                style={{
                  borderColor: "var(--app-border)",
                  backgroundColor: "var(--app-surface-light)",
                  color: "var(--app-text)",
                }}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = "var(--app-accent-border)";
                  e.currentTarget.style.boxShadow = "0 0 0 1px var(--app-accent-soft)";
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = "var(--app-border)";
                  e.currentTarget.style.boxShadow = "none";
                }}
              />

              <button
                type="button"
                onClick={() => setShowConfirm((prev) => !prev)}
                disabled={loading}
                aria-label={showConfirm ? "Hide confirm password" : "Show confirm password"}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 rounded-md p-1 text-zinc-400 transition-colors hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
              >
                {showConfirm ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg px-5 py-3 text-sm font-semibold text-white transition-all duration-300 hover:-translate-y-[1px] disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0 mt-2"
            style={{
              backgroundColor: "var(--app-accent)",
              boxShadow: "0 10px 25px var(--app-accent-soft)",
            }}
            onMouseEnter={(e) => {
              if (!loading) {
                e.currentTarget.style.backgroundColor = "var(--app-accent-hover)";
              }
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = "var(--app-accent)";
            }}
          >
            {loading ? "Updating..." : "Update Password"}
          </button>
        </form>

        {/* Back to Settings link */}
        <div
          className="mt-6 rounded-lg border p-4 text-center"
          style={{
            borderColor: "var(--app-accent-border)",
            backgroundColor: "var(--app-accent-soft)",
          }}
        >
          <Link
            to="/settings"
            className="inline-flex items-center gap-1.5 text-xs font-semibold transition hover:underline"
            style={{ color: "var(--app-accent)" }}
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>Back to Settings</span>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default ChangePassword;