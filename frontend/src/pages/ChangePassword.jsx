import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { authApi } from "../services/api";

const ChangePassword = () => {
  const navigate = useNavigate();

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

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
    <div className="w-full px-4 sm:px-6 md:px-[50px]">
      <div
        className="relative mx-auto mt-8 max-w-2xl overflow-hidden rounded-xl border border-white/5 px-5 py-10 text-white shadow-[0_10px_40px_rgba(0,0,0,0.5)] sm:mt-10 sm:rounded-[16px] sm:px-[50px] sm:py-[55px]"
        style={{
          background:
            "radial-gradient(circle at top right, var(--app-accent-soft), transparent 60%), linear-gradient(135deg, var(--app-surface-light) 0%, var(--app-surface) 100%)",
        }}
      >
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-white sm:text-4xl">
            Change Password
          </h1>
          <p className="mt-2 text-sm text-zinc-400 sm:text-base">
            Update your account password securely
          </p>
        </div>

        {error && (
          <div
            className="mb-5 rounded-lg border border-red-500/20 bg-red-500/5 px-4 py-3 text-sm leading-5 text-red-400"
            role="alert"
          >
            {error}
          </div>
        )}

        {success && (
          <div
            className="mb-5 rounded-lg border border-green-500/20 bg-green-500/5 px-4 py-3 text-sm leading-5 text-green-400"
            role="status"
          >
            {success}
          </div>
        )}

        {/* Change password form */}
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label
              htmlFor="currentPassword"
              className="mb-2 block text-sm font-medium text-zinc-300"
            >
              Current Password
            </label>

            <input
              id="currentPassword"
              type="password"
              placeholder="Enter your current password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              autoComplete="current-password"
              required
              className="w-full rounded-lg border border-zinc-700 bg-zinc-950 px-4 py-3 text-sm text-white placeholder:text-zinc-600 outline-none transition focus:border-[var(--app-accent-border)] focus:ring-1 focus:ring-[var(--app-accent-soft)]"
            />
          </div>

          <div>
            <label
              htmlFor="newPassword"
              className="mb-2 block text-sm font-medium text-zinc-300"
            >
              New Password
            </label>

            <input
              id="newPassword"
              type="password"
              placeholder="Enter your new password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              autoComplete="new-password"
              required
              className="w-full rounded-lg border border-zinc-700 bg-zinc-950 px-4 py-3 text-sm text-white placeholder:text-zinc-600 outline-none transition focus:border-[var(--app-accent-border)] focus:ring-1 focus:ring-[var(--app-accent-soft)]"
            />

            <p className="mt-2 text-xs text-zinc-600">
              Password must be at least 6 characters.
            </p>
          </div>

          <div>
            <label
              htmlFor="confirmPassword"
              className="mb-2 block text-sm font-medium text-zinc-300"
            >
              Confirm New Password
            </label>

            <input
              id="confirmPassword"
              type="password"
              placeholder="Confirm your new password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              autoComplete="new-password"
              required
              className="w-full rounded-lg border border-zinc-700 bg-zinc-950 px-4 py-3 text-sm text-white placeholder:text-zinc-600 outline-none transition focus:border-[var(--app-accent-border)] focus:ring-1 focus:ring-[var(--app-accent-soft)]"
            />
          </div>

          <div className="flex flex-col gap-3 pt-2 sm:flex-row">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 rounded-lg bg-[var(--app-accent)] px-5 py-3 font-semibold text-white shadow-lg transition-all duration-300 hover:-translate-y-[1px] hover:bg-[var(--app-accent-hover)] disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0"
              style={{ boxShadow: "0 10px 25px var(--app-accent-soft)" }}
            >
              {loading ? "Changing Password..." : "Change Password"}
            </button>

            <button
              type="button"
              onClick={() => navigate("/settings/profile")}
              disabled={loading}
              className="flex-1 rounded-lg border border-zinc-700 bg-zinc-900 px-5 py-3 font-semibold text-zinc-300 transition-all duration-300 hover:border-zinc-600 hover:bg-zinc-800 hover:text-white disabled:cursor-not-allowed disabled:opacity-60"
            >
              Cancel
            </button>
          </div>
        </form>

        <div className="mt-8 rounded-lg border border-[var(--app-accent-border)] bg-[var(--app-accent-soft)] px-4 py-4">
          <p className="text-sm font-medium text-[var(--app-accent)]">Security Tip</p>
          <p className="mt-1 text-xs leading-5 text-zinc-500">
            Use a strong password that is difficult to guess and avoid sharing your password with anyone.
          </p>
        </div>
      </div>
    </div>
  );
};

export default ChangePassword;