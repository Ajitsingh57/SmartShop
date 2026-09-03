import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Eye, EyeOff, ArrowLeft, CheckCircle2 } from "lucide-react";
import { toast } from "react-toastify";
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
  const [fieldErrors, setFieldErrors] = useState({});

  // Validate and submit new password credentials
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setFieldErrors({});

    const newFieldErrors = {};

    if (!currentPassword) {
      newFieldErrors.currentPassword = "Please enter your current password.";
    }

    if (!newPassword) {
      newFieldErrors.newPassword = "Please enter your new password.";
    } else if (newPassword.length < 6) {
      newFieldErrors.newPassword = "New password must be at least 6 characters long.";
    }

    if (!confirmPassword) {
      newFieldErrors.confirmPassword = "Please confirm your new password.";
    } else if (newPassword && newPassword !== confirmPassword) {
      newFieldErrors.confirmPassword = "New password and confirm password do not match.";
    }

    if (currentPassword && newPassword && currentPassword === newPassword) {
      newFieldErrors.newPassword = "New password must be different from your current password.";
    }

    if (Object.keys(newFieldErrors).length > 0) {
      setFieldErrors(newFieldErrors);
      const firstMsg = Object.values(newFieldErrors)[0];
      setError(firstMsg);
      toast.error(firstMsg);
      return;
    }

    setLoading(true);

    try {
      const data = await authApi.changePassword({
        currentPassword,
        newPassword,
      });

      const successMsg = data?.message || "Password changed successfully.";
      setSuccess(successMsg);
      toast.success(successMsg);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err) {
      console.error("Change password failed:", err);
      const msg = err?.message || "Unable to change password. Please try again.";
      setError(msg);
      if (err?.errors && Object.keys(err.errors).length > 0) {
        setFieldErrors(err.errors);
      } else {
        setFieldErrors({ currentPassword: msg });
      }
      toast.error(msg);
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
                  if (fieldErrors.currentPassword) setFieldErrors((prev) => ({ ...prev, currentPassword: "" }));
                }}
                autoComplete="current-password"
                required
                disabled={loading}
                className={`w-full rounded-lg border px-4 py-2.5 pr-11 text-sm outline-none transition-all duration-200 disabled:cursor-not-allowed disabled:opacity-60 ${
                  fieldErrors.currentPassword ? "border-red-500 ring-1 ring-red-500" : ""
                }`}
                style={{
                  borderColor: fieldErrors.currentPassword ? "#ef4444" : "var(--app-border)",
                  backgroundColor: "var(--app-surface-light)",
                  color: "var(--app-text)",
                }}
                onFocus={(e) => {
                  if (!fieldErrors.currentPassword) {
                    e.currentTarget.style.borderColor = "var(--app-accent-border)";
                    e.currentTarget.style.boxShadow = "0 0 0 1px var(--app-accent-soft)";
                  }
                }}
                onBlur={(e) => {
                  if (!fieldErrors.currentPassword) {
                    e.currentTarget.style.borderColor = "var(--app-border)";
                    e.currentTarget.style.boxShadow = "none";
                  }
                }}
              />

              <button
                type="button"
                onClick={() => setShowCurrent((prev) => !prev)}
                tabIndex={-1}
                aria-label={showCurrent ? "Hide current password" : "Show current password"}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-zinc-400 transition-colors hover:text-zinc-200"
                style={{ color: "var(--app-text-muted)" }}
              >
                {showCurrent ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            </div>
            {fieldErrors.currentPassword && (
              <p className="mt-1 text-xs text-red-500 font-medium">
                {fieldErrors.currentPassword}
              </p>
            )}
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
                  if (fieldErrors.newPassword) setFieldErrors((prev) => ({ ...prev, newPassword: "" }));
                }}
                autoComplete="new-password"
                required
                disabled={loading}
                className={`w-full rounded-lg border px-4 py-2.5 pr-11 text-sm outline-none transition-all duration-200 disabled:cursor-not-allowed disabled:opacity-60 ${
                  fieldErrors.newPassword ? "border-red-500 ring-1 ring-red-500" : ""
                }`}
                style={{
                  borderColor: fieldErrors.newPassword ? "#ef4444" : "var(--app-border)",
                  backgroundColor: "var(--app-surface-light)",
                  color: "var(--app-text)",
                }}
                onFocus={(e) => {
                  if (!fieldErrors.newPassword) {
                    e.currentTarget.style.borderColor = "var(--app-accent-border)";
                    e.currentTarget.style.boxShadow = "0 0 0 1px var(--app-accent-soft)";
                  }
                }}
                onBlur={(e) => {
                  if (!fieldErrors.newPassword) {
                    e.currentTarget.style.borderColor = "var(--app-border)";
                    e.currentTarget.style.boxShadow = "none";
                  }
                }}
              />

              <button
                type="button"
                onClick={() => setShowNew((prev) => !prev)}
                tabIndex={-1}
                aria-label={showNew ? "Hide new password" : "Show new password"}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-zinc-400 transition-colors hover:text-zinc-200"
                style={{ color: "var(--app-text-muted)" }}
              >
                {showNew ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            </div>
            {fieldErrors.newPassword && (
              <p className="mt-1 text-xs text-red-500 font-medium">
                {fieldErrors.newPassword}
              </p>
            )}
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
                  if (fieldErrors.confirmPassword) setFieldErrors((prev) => ({ ...prev, confirmPassword: "" }));
                }}
                autoComplete="new-password"
                required
                disabled={loading}
                className={`w-full rounded-lg border px-4 py-2.5 pr-11 text-sm outline-none transition-all duration-200 disabled:cursor-not-allowed disabled:opacity-60 ${
                  fieldErrors.confirmPassword ? "border-red-500 ring-1 ring-red-500" : ""
                }`}
                style={{
                  borderColor: fieldErrors.confirmPassword ? "#ef4444" : "var(--app-border)",
                  backgroundColor: "var(--app-surface-light)",
                  color: "var(--app-text)",
                }}
                onFocus={(e) => {
                  if (!fieldErrors.confirmPassword) {
                    e.currentTarget.style.borderColor = "var(--app-accent-border)";
                    e.currentTarget.style.boxShadow = "0 0 0 1px var(--app-accent-soft)";
                  }
                }}
                onBlur={(e) => {
                  if (!fieldErrors.confirmPassword) {
                    e.currentTarget.style.borderColor = "var(--app-border)";
                    e.currentTarget.style.boxShadow = "none";
                  }
                }}
              />

              <button
                type="button"
                onClick={() => setShowConfirm((prev) => !prev)}
                tabIndex={-1}
                aria-label={showConfirm ? "Hide confirm password" : "Show confirm password"}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-zinc-400 transition-colors hover:text-zinc-200"
                style={{ color: "var(--app-text-muted)" }}
              >
                {showConfirm ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            </div>
            {fieldErrors.confirmPassword && (
              <p className="mt-1 text-xs text-red-500 font-medium">
                {fieldErrors.confirmPassword}
              </p>
            )}
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