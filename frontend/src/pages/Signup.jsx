import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Eye, EyeOff } from "lucide-react";
import { toast } from "react-toastify";
import { authApi, authStorage } from "../services/api";
import {
  isValidName,
  isValidPhone,
  isValidEmail,
  sanitizeNameInput,
  sanitizePhoneInput,
} from "../utils/validators";

const Signup = () => {
  const navigate = useNavigate();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});

  // Submit customer registration payload and establish session
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setFieldErrors({});

    const newFieldErrors = {};

    if (!name.trim() || !isValidName(name)) {
      newFieldErrors.name = "Please enter a valid full name (letters only, min 2 characters).";
    }

    if (!email.trim() && !phone.trim()) {
      newFieldErrors.phone = "Please enter at least a mobile number or email.";
      newFieldErrors.email = "Please enter at least a mobile number or email.";
    }

    if (phone.trim() && !isValidPhone(phone)) {
      newFieldErrors.phone = "Please enter a valid 10-digit mobile number.";
    }

    if (email.trim()) {
      if (!email.includes("@")) {
        newFieldErrors.email = "Email address must include '@' symbol (e.g. user@example.com).";
      } else if (!isValidEmail(email)) {
        newFieldErrors.email = "Please enter a valid email address (e.g. user@example.com).";
      }
    }

    if (!password) {
      newFieldErrors.password = "Please enter a password.";
    } else if (password.length < 6) {
      newFieldErrors.password = "Password must be at least 6 characters long.";
    }

    if (password && confirmPassword && password !== confirmPassword) {
      newFieldErrors.confirmPassword = "Passwords do not match.";
    } else if (!confirmPassword) {
      newFieldErrors.confirmPassword = "Please confirm your password.";
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
      const data = await authApi.register({
        name: name.trim(),
        email: email.trim() || undefined,
        phone: phone.trim() || undefined,
        password,
        role: "customer",
      });

      if (data?.token) {
        authStorage.setToken(data.token);
      }
      if (data?.user) {
        authStorage.setUser(data.user);
      }

      toast.success(data?.message || "Account created successfully!");
      navigate("/", { replace: true });
    } catch (err) {
      console.error("Signup failed:", err);
      const msg = err?.message || "Registration failed. Please try again.";
      setError(msg);
      if (err?.errors && Object.keys(err.errors).length > 0) {
        setFieldErrors(err.errors);
      } else {
        setFieldErrors({ general: msg });
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
            Create Account
          </h1>

          <p className="mt-2 text-sm" style={{ color: "var(--app-text-muted)" }}>
            Join SmartShop to track orders & credit ledger
          </p>
        </div>

        {/* Customer registration form */}
        <form onSubmit={handleSubmit} noValidate className="space-y-4">
          {error && (
            <div
              className="rounded-xl border p-3.5 text-xs font-medium text-red-400 flex items-start gap-2.5 animate-in fade-in"
              style={{
                borderColor: "rgba(239, 68, 68, 0.3)",
                backgroundColor: "rgba(239, 68, 68, 0.08)",
              }}
            >
              <span className="text-base leading-none">⚠️</span>
              <div className="flex-1">{error}</div>
            </div>
          )}

          <div>
            <label
              htmlFor="name"
              className="mb-1.5 block text-sm font-medium"
              style={{ color: "var(--app-text-secondary)" }}
            >
              Full Name
            </label>

            <input
              id="name"
              type="text"
              placeholder="Enter your full name (letters only)"
              value={name}
              onChange={(e) => {
                setName(sanitizeNameInput(e.target.value));
                if (error) setError("");
                if (fieldErrors.name) setFieldErrors((prev) => ({ ...prev, name: "" }));
              }}
              autoComplete="name"
              disabled={loading}
              className={`w-full rounded-lg border px-4 py-2.5 text-sm outline-none transition-all duration-200 disabled:cursor-not-allowed disabled:opacity-60 ${
                fieldErrors.name ? "border-red-500 ring-1 ring-red-500" : ""
              }`}
              style={{
                borderColor: fieldErrors.name ? "#ef4444" : "var(--app-border)",
                backgroundColor: "var(--app-surface-light)",
                color: "var(--app-text)",
              }}
              onFocus={(e) => {
                if (!fieldErrors.name) {
                  e.currentTarget.style.borderColor = "var(--app-accent-border)";
                  e.currentTarget.style.boxShadow = "0 0 0 1px var(--app-accent-soft)";
                }
              }}
              onBlur={(e) => {
                if (!fieldErrors.name) {
                  e.currentTarget.style.borderColor = "var(--app-border)";
                  e.currentTarget.style.boxShadow = "none";
                }
              }}
            />
            {fieldErrors.name && (
              <p className="mt-1 text-xs text-red-500 font-medium">
                {fieldErrors.name}
              </p>
            )}
          </div>

          <div>
            <label
              htmlFor="phone"
              className="mb-1.5 flex items-center justify-between text-sm font-medium"
              style={{ color: "var(--app-text-secondary)" }}
            >
              <span>Phone Number (10 Digits)</span>
              <span className="text-[11px] text-zinc-500">Required if no email</span>
            </label>

            <input
              id="phone"
              type="tel"
              maxLength={10}
              placeholder="e.g. 9876543210 (10 digits)"
              value={phone}
              onChange={(e) => {
                setPhone(sanitizePhoneInput(e.target.value));
                if (error) setError("");
                if (fieldErrors.phone) setFieldErrors((prev) => ({ ...prev, phone: "" }));
              }}
              autoComplete="tel"
              disabled={loading}
              className={`w-full rounded-lg border px-4 py-2.5 text-sm outline-none transition-all duration-200 disabled:cursor-not-allowed disabled:opacity-60 ${
                fieldErrors.phone ? "border-red-500 ring-1 ring-red-500" : ""
              }`}
              style={{
                borderColor: fieldErrors.phone ? "#ef4444" : "var(--app-border)",
                backgroundColor: "var(--app-surface-light)",
                color: "var(--app-text)",
              }}
              onFocus={(e) => {
                if (!fieldErrors.phone) {
                  e.currentTarget.style.borderColor = "var(--app-accent-border)";
                  e.currentTarget.style.boxShadow = "0 0 0 1px var(--app-accent-soft)";
                }
              }}
              onBlur={(e) => {
                if (!fieldErrors.phone) {
                  e.currentTarget.style.borderColor = "var(--app-border)";
                  e.currentTarget.style.boxShadow = "none";
                }
              }}
            />
            {fieldErrors.phone && (
              <p className="mt-1 text-xs text-red-500 font-medium">
                {fieldErrors.phone}
              </p>
            )}
          </div>

          <div>
            <label
              htmlFor="email"
              className="mb-1.5 flex items-center justify-between text-sm font-medium"
              style={{ color: "var(--app-text-secondary)" }}
            >
              <span>Email Address</span>
              <span className="text-[11px] text-zinc-500">Optional</span>
            </label>

            <div className="relative">
              <span
                className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-semibold text-zinc-500"
              >
                @
              </span>
              <input
                id="email"
                type="email"
                placeholder="user@example.com"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (error) setError("");
                  if (fieldErrors.email) setFieldErrors((prev) => ({ ...prev, email: "" }));
                }}
                autoComplete="email"
                disabled={loading}
                className={`w-full rounded-lg border py-2.5 pl-8 pr-4 text-sm outline-none transition-all duration-200 disabled:cursor-not-allowed disabled:opacity-60 ${
                  fieldErrors.email ? "border-red-500 ring-1 ring-red-500" : ""
                }`}
                style={{
                  borderColor: fieldErrors.email ? "#ef4444" : "var(--app-border)",
                  backgroundColor: "var(--app-surface-light)",
                  color: "var(--app-text)",
                }}
                onFocus={(e) => {
                  if (!fieldErrors.email) {
                    e.currentTarget.style.borderColor = "var(--app-accent-border)";
                    e.currentTarget.style.boxShadow = "0 0 0 1px var(--app-accent-soft)";
                  }
                }}
                onBlur={(e) => {
                  if (!fieldErrors.email) {
                    e.currentTarget.style.borderColor = "var(--app-border)";
                    e.currentTarget.style.boxShadow = "none";
                  }
                }}
              />
            </div>
            {fieldErrors.email && (
              <p className="mt-1 text-xs text-red-500 font-medium">
                {fieldErrors.email}
              </p>
            )}
          </div>

          <div>
            <label
              htmlFor="password"
              className="mb-1.5 block text-sm font-medium"
              style={{ color: "var(--app-text-secondary)" }}
            >
              Password
            </label>

            <div className="relative">
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder="At least 6 characters"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (error) setError("");
                  if (fieldErrors.password) setFieldErrors((prev) => ({ ...prev, password: "" }));
                }}
                required
                autoComplete="new-password"
                disabled={loading}
                className={`w-full rounded-lg border px-4 py-2.5 pr-11 text-sm outline-none transition-all duration-200 disabled:cursor-not-allowed disabled:opacity-60 ${
                  fieldErrors.password ? "border-red-500 ring-1 ring-red-500" : ""
                }`}
                style={{
                  borderColor: fieldErrors.password ? "#ef4444" : "var(--app-border)",
                  backgroundColor: "var(--app-surface-light)",
                  color: "var(--app-text)",
                }}
                onFocus={(e) => {
                  if (!fieldErrors.password) {
                    e.currentTarget.style.borderColor = "var(--app-accent-border)";
                    e.currentTarget.style.boxShadow = "0 0 0 1px var(--app-accent-soft)";
                  }
                }}
                onBlur={(e) => {
                  if (!fieldErrors.password) {
                    e.currentTarget.style.borderColor = "var(--app-border)";
                    e.currentTarget.style.boxShadow = "none";
                  }
                }}
              />

              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                tabIndex={-1}
                aria-label={showPassword ? "Hide password" : "Show password"}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-zinc-400 transition-colors hover:text-zinc-200"
                style={{ color: "var(--app-text-muted)" }}
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            </div>
            {fieldErrors.password && (
              <p className="mt-1 text-xs text-red-500 font-medium">
                {fieldErrors.password}
              </p>
            )}
          </div>

          <div>
            <label
              htmlFor="confirmPassword"
              className="mb-1.5 block text-sm font-medium"
              style={{ color: "var(--app-text-secondary)" }}
            >
              Confirm Password
            </label>

            <div className="relative">
              <input
                id="confirmPassword"
                type={showConfirmPassword ? "text" : "password"}
                placeholder="Re-enter password"
                value={confirmPassword}
                onChange={(e) => {
                  setConfirmPassword(e.target.value);
                  if (error) setError("");
                  if (fieldErrors.confirmPassword) setFieldErrors((prev) => ({ ...prev, confirmPassword: "" }));
                }}
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
            {loading ? "Creating Account..." : "Create Account"}
          </button>
        </form>

        {/* Switch to Login */}
        <div
          className="mt-6 rounded-lg border p-4 text-center"
          style={{
            borderColor: "var(--app-accent-border)",
            backgroundColor: "var(--app-accent-soft)",
          }}
        >
          <p className="text-xs leading-5" style={{ color: "var(--app-text-muted)" }}>
            Already have an account?{" "}
            <Link
              to="/login"
              className="font-semibold transition hover:underline"
              style={{ color: "var(--app-accent)" }}
            >
              Sign In
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Signup;