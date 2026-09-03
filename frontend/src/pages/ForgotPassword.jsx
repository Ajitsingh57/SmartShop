import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Eye, EyeOff, ArrowLeft, CheckCircle2 } from "lucide-react";
import { toast } from "react-toastify";
import { authApi } from "../services/api";
import { isValidEmail, isValidPhone } from "../utils/validators";

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
  const [fieldErrors, setFieldErrors] = useState({});

  // Step 1: Request password reset verification token
  const handleRequestToken = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setFieldErrors({});

    const trimmedId = identifier.trim();
    const newFieldErrors = {};

    if (!trimmedId) {
      newFieldErrors.identifier = "Please enter your registered email or 10-digit phone number.";
    } else {
      const isDigitsOnly = /^[\d+\-\s]+$/.test(trimmedId);
      if (isDigitsOnly && !isValidPhone(trimmedId)) {
        newFieldErrors.identifier = "Please enter a valid 10-digit mobile number.";
      }
      if (trimmedId.includes("@") && !isValidEmail(trimmedId)) {
        newFieldErrors.identifier = "Please enter a valid email address.";
      }
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
      const response = await authApi.forgotPassword({
        identifier: identifier.trim(),
      });

      if (response.resetToken) {
        setResetToken(response.resetToken);
        setUserPreview(response.user);
        setStep(2);
        setSuccess("Account verified. Please enter your new password.");
        toast.success("Account verified. Please enter your new password.");
      } else {
        const msg = response.message || "If an account exists with this credential, instructions have been prepared.";
        setSuccess(msg);
        toast.info(msg);
      }
    } catch (err) {
      console.error("Forgot password error:", err);
      const msg = err?.message || "Unable to find your account. Please check your credentials.";
      setError(msg);
      if (err?.errors && Object.keys(err.errors).length > 0) {
        setFieldErrors(err.errors);
      } else {
        setFieldErrors({ identifier: msg });
      }
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Submit new password with reset token
  const handleResetPassword = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setFieldErrors({});

    const newFieldErrors = {};

    if (!newPassword) {
      newFieldErrors.newPassword = "Please enter your new password.";
    } else if (newPassword.length < 6) {
      newFieldErrors.newPassword = "Password must be at least 6 characters long.";
    }

    if (newPassword && confirmPassword && newPassword !== confirmPassword) {
      newFieldErrors.confirmPassword = "Passwords do not match.";
    } else if (!confirmPassword) {
      newFieldErrors.confirmPassword = "Please confirm your new password.";
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
      const response = await authApi.resetPassword({
        resetToken,
        newPassword,
      });

      const successMsg = response?.message || "Password updated successfully! Redirecting to login...";
      setSuccess(successMsg);
      toast.success(successMsg);

      setTimeout(() => {
        navigate("/login", { replace: true });
      }, 1500);
    } catch (err) {
      console.error("Reset password error:", err);
      const msg = err?.message || "Unable to reset password. Please try again.";
      setError(msg);
      if (err?.errors && Object.keys(err.errors).length > 0) {
        setFieldErrors(err.errors);
      } else {
        setFieldErrors({ newPassword: msg });
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
            {step === 1 ? "Forgot Password" : "Set New Password"}
          </h1>

          <p className="mt-2 text-sm" style={{ color: "var(--app-text-muted)" }}>
            {step === 1
              ? "Enter registered details to recover account access"
              : `Resetting credentials for ${userPreview?.name || "your account"}`}
          </p>
        </div>

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
                  if (fieldErrors.identifier) setFieldErrors((prev) => ({ ...prev, identifier: "" }));
                }}
                required
                autoComplete="username"
                disabled={loading}
                className={`w-full rounded-lg border px-4 py-3 text-sm outline-none transition-all duration-200 disabled:cursor-not-allowed disabled:opacity-60 ${
                  fieldErrors.identifier ? "border-red-500 ring-1 ring-red-500" : ""
                }`}
                style={{
                  borderColor: fieldErrors.identifier ? "#ef4444" : "var(--app-border)",
                  backgroundColor: "var(--app-surface-light)",
                  color: "var(--app-text)",
                }}
                onFocus={(e) => {
                  if (!fieldErrors.identifier) {
                    e.currentTarget.style.borderColor = "var(--app-accent-border)";
                    e.currentTarget.style.boxShadow = "0 0 0 1px var(--app-accent-soft)";
                  }
                }}
                onBlur={(e) => {
                  if (!fieldErrors.identifier) {
                    e.currentTarget.style.borderColor = "var(--app-border)";
                    e.currentTarget.style.boxShadow = "none";
                  }
                }}
              />
              {fieldErrors.identifier && (
                <p className="mt-1 text-xs text-red-500 font-medium">
                  {fieldErrors.identifier}
                </p>
              )}
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
                    if (fieldErrors.newPassword) setFieldErrors((prev) => ({ ...prev, newPassword: "" }));
                  }}
                  required
                  autoComplete="new-password"
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
                  onClick={() => setShowNewPassword((prev) => !prev)}
                  tabIndex={-1}
                  aria-label={showNewPassword ? "Hide password" : "Show password"}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-zinc-400 transition-colors hover:text-zinc-200"
                  style={{ color: "var(--app-text-muted)" }}
                >
                  {showNewPassword ? (
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
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder="Re-enter new password"
                  value={confirmPassword}
                  onChange={(e) => {
                    setConfirmPassword(e.target.value);
                    if (error) setError("");
                    if (fieldErrors.confirmPassword) setFieldErrors((prev) => ({ ...prev, confirmPassword: "" }));
                  }}
                  required
                  autoComplete="new-password"
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
                  onClick={() => setShowConfirmPassword((prev) => !prev)}
                  tabIndex={-1}
                  aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-zinc-400 transition-colors hover:text-zinc-200"
                  style={{ color: "var(--app-text-muted)" }}
                >
                  {showConfirmPassword ? (
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