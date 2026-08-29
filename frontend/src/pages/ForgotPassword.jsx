import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { authApi } from "../services/api";

const ForgotPassword = () => {
  const navigate = useNavigate();

  const [step, setStep] = useState(1);
  const [identifier, setIdentifier] = useState("");
  const [resetToken, setResetToken] = useState("");
  const [userPreview, setUserPreview] = useState(null);

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Step 1: Request password reset verification token
  const handleRequestToken = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!identifier.trim()) {
      setError("Please enter your email or phone number.");
      return;
    }

    setLoading(true);

    try {
      const response = await authApi.forgotPassword({
        identifier: identifier.trim(),
      });

      if (response.resetToken) {
        setResetToken(response.resetToken);
        setUserPreview(response.user);
        setStep(2);
        setSuccess("Account verified. Please choose a new password.");
      } else {
        setSuccess(
          response.message ||
            "If an account exists with this credential, a reset link will be sent."
        );
      }
    } catch (err) {
      console.error("Forgot password error:", err);
      setError(
        err?.message || "Unable to process your request. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Submit new password with reset token
  const handleResetPassword = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!newPassword) {
      setError("Please enter a new password.");
      return;
    }

    if (newPassword.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);

    try {
      const response = await authApi.resetPassword({
        resetToken,
        newPassword,
      });

      setSuccess(
        response.message || "Password has been reset successfully! Redirecting to login..."
      );
      setTimeout(() => {
        navigate("/login");
      }, 1500);
    } catch (err) {
      console.error("Reset password error:", err);
      setError(err?.message || "Failed to reset password. Please try again.");
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
            {step === 1 ? "Forgot Password?" : "Reset Password"}
          </h1>
          <p className="mt-2 text-sm text-zinc-400 sm:text-base">
            {step === 1
              ? "Enter your email or phone to verify your SmartShop account"
              : `Create a new password for ${userPreview?.name || "your account"}`}
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

        {/* Step 1 Form */}
        {step === 1 && (
          <form onSubmit={handleRequestToken} className="space-y-5">
            <div>
              <label
                htmlFor="identifier"
                className="mb-2 block text-sm font-medium text-zinc-300"
              >
                Email or Phone Number
              </label>

              <input
                id="identifier"
                type="text"
                placeholder="Enter your email or phone"
                value={identifier}
                onChange={(e) => {
                  setIdentifier(e.target.value);
                  setError("");
                  setSuccess("");
                }}
                required
                className="w-full rounded-lg border border-zinc-700 bg-zinc-950 px-4 py-3 text-sm text-white placeholder:text-zinc-600 outline-none transition focus:border-[var(--app-accent-border)] focus:ring-1 focus:ring-[var(--app-accent-soft)]"
              />

              <p className="mt-2 text-xs text-zinc-600">
                Enter the email address or phone associated with your account.
              </p>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-lg bg-[var(--app-accent)] px-5 py-3 font-semibold text-white shadow-lg transition-all duration-300 hover:-translate-y-[1px] hover:bg-[var(--app-accent-hover)] disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0"
              style={{ boxShadow: "0 10px 25px var(--app-accent-soft)" }}
            >
              {loading ? "Verifying Account..." : "Continue"}
            </button>
          </form>
        )}

        {/* Step 2 Form */}
        {step === 2 && (
          <form onSubmit={handleResetPassword} className="space-y-5">
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
                placeholder="Create new password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                minLength={6}
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
                placeholder="Re-enter new password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                minLength={6}
                className="w-full rounded-lg border border-zinc-700 bg-zinc-950 px-4 py-3 text-sm text-white placeholder:text-zinc-600 outline-none transition focus:border-[var(--app-accent-border)] focus:ring-1 focus:ring-[var(--app-accent-soft)]"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-lg bg-[var(--app-accent)] px-5 py-3 font-semibold text-white shadow-lg transition-all duration-300 hover:-translate-y-[1px] hover:bg-[var(--app-accent-hover)] disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0"
              style={{ boxShadow: "0 10px 25px var(--app-accent-soft)" }}
            >
              {loading ? "Resetting Password..." : "Set New Password"}
            </button>
          </form>
        )}

        <div className="mt-7 text-center">
          <p className="text-sm text-zinc-500">
            Remember your password?{" "}
            <Link
              to="/login"
              className="font-medium text-[var(--app-accent)] transition-colors hover:text-[var(--app-accent-hover)]"
            >
              Back to Login
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;