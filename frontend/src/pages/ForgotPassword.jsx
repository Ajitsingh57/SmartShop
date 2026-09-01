import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Eye, EyeOff, ArrowLeft, CheckCircle2 } from "lucide-react";
import { authApi } from "../services/api";

const ForgotPassword = () => {
  const navigate = useNavigate();

  const [step, setStep] = useState(1);
  const [identifier, setIdentifier] = useState("");
  const [resetToken, setResetToken] = useState("");
  const [userPreview, setUserPreview] = useState(null);

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

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
        setSuccess("Account verified. Please enter your new password.");
      } else {
        setSuccess(
          response.message ||
            "If an account exists with this credential, instructions have been prepared."
        );
      }
    } catch (err) {
      console.error("Forgot password error:", err);
      setError(
        err?.message || "Unable to find your account. Please check your credentials."
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
      setError("Please enter your new password.");
      return;
    }

    if (newPassword.length < 6) {
      setError("Password must be at least 6 characters long.");
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
        response?.message ||
          "Password updated successfully! Redirecting to login..."
      );

      setTimeout(() => {
        navigate("/login", { replace: true });
      }, 1500);
    } catch (err) {
      console.error("Reset password error:", err);
      setError(err?.message || "Unable to reset password. Please try again.");
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
            {step === 1 ? "Forgot Password" : "Reset Password"}
          </h1>

          <p className="mt-2 text-sm" style={{ color: "var(--app-text-muted)" }}>
            {step === 1
              ? "Recover access to your SmartShop account"
              : `Set a new password for ${userPreview?.name || "your account"}`}
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

        {/* Step 1: Identifier Entry */}
        {step === 1 && (
          <form onSubmit={handleRequestToken} className="space-y-5">
            <div>
              <label
                htmlFor="identifier"
                className="mb-2 block text-sm font-medium"
                style={{ color: "var(--app-text-secondary)" }}
              >
                Registered Email or Phone
              </label>

              <input
                id="identifier"
                type="text"
                placeholder="Enter email or phone number"
                value={identifier}
                onChange={(e) => {
                  setIdentifier(e.target.value);
                  if (error) setError("");
                }}
                required
                autoComplete="username"
                disabled={loading}
                className="w-full rounded-lg border px-4 py-3 text-sm outline-none transition-all duration-200 disabled:cursor-not-allowed disabled:opacity-60"
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
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-lg px-5 py-3 text-sm font-semibold text-white transition-all duration-300 hover:-translate-y-[1px] disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0"
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
              {loading ? "Verifying..." : "Verify Account"}
            </button>
          </form>
        )}

        {/* Step 2: Set New Password */}
        {step === 2 && (
          <form onSubmit={handleResetPassword} className="space-y-4">
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
                  type={showNewPassword ? "text" : "password"}
                  placeholder="At least 6 characters"
                  value={newPassword}
                  onChange={(e) => {
                    setNewPassword(e.target.value);
                    if (error) setError("");
                  }}
                  required
                  autoComplete="new-password"
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
                  onClick={() => setShowNewPassword((prev) => !prev)}
                  disabled={loading}
                  aria-label={showNewPassword ? "Hide password" : "Show password"}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 rounded-md p-1 text-zinc-400 transition-colors hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {showNewPassword ? (
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
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder="Re-enter new password"
                  value={confirmPassword}
                  onChange={(e) => {
                    setConfirmPassword(e.target.value);
                    if (error) setError("");
                  }}
                  required
                  autoComplete="new-password"
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
                  onClick={() => setShowConfirmPassword((prev) => !prev)}
                  disabled={loading}
                  aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 rounded-md p-1 text-zinc-400 transition-colors hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {showConfirmPassword ? (
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
              {loading ? "Saving Password..." : "Update Password"}
            </button>
          </form>
        )}

        {/* Back to Login link */}
        <div
          className="mt-6 rounded-lg border p-4 text-center"
          style={{
            borderColor: "var(--app-accent-border)",
            backgroundColor: "var(--app-accent-soft)",
          }}
        >
          <Link
            to="/login"
            className="inline-flex items-center gap-1.5 text-xs font-semibold transition hover:underline"
            style={{ color: "var(--app-accent)" }}
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>Back to Login</span>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;