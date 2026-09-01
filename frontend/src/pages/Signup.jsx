import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Eye, EyeOff } from "lucide-react";
import { authApi, authStorage } from "../services/api";

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

  // Submit customer registration payload and establish session
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!name.trim()) {
      setError("Please enter your full name.");
      return;
    }

    if (!email.trim() && !phone.trim()) {
      setError("Please enter at least one of email or phone number.");
      return;
    }

    if (!password) {
      setError("Please enter a password.");
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
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

      navigate("/", { replace: true });
    } catch (err) {
      console.error("Signup failed:", err);
      setError(err?.message || "Registration failed. Please try again.");
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

        {/* Customer registration form */}
        <form onSubmit={handleSubmit} className="space-y-4">
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
              placeholder="Enter your full name"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                if (error) setError("");
              }}
              required
              autoComplete="name"
              disabled={loading}
              className="w-full rounded-lg border px-4 py-2.5 text-sm outline-none transition-all duration-200 disabled:cursor-not-allowed disabled:opacity-60"
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

          <div>
            <label
              htmlFor="phone"
              className="mb-1.5 flex items-center justify-between text-sm font-medium"
              style={{ color: "var(--app-text-secondary)" }}
            >
              <span>Phone Number</span>
              <span className="text-[11px] text-zinc-500">Required if no email</span>
            </label>

            <input
              id="phone"
              type="tel"
              placeholder="e.g. 9876543210"
              value={phone}
              onChange={(e) => {
                setPhone(e.target.value);
                if (error) setError("");
              }}
              autoComplete="tel"
              disabled={loading}
              className="w-full rounded-lg border px-4 py-2.5 text-sm outline-none transition-all duration-200 disabled:cursor-not-allowed disabled:opacity-60"
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

          <div>
            <label
              htmlFor="email"
              className="mb-1.5 flex items-center justify-between text-sm font-medium"
              style={{ color: "var(--app-text-secondary)" }}
            >
              <span>Email Address</span>
              <span className="text-[11px] text-zinc-500">Optional</span>
            </label>

            <input
              id="email"
              type="email"
              placeholder="e.g. user@example.com"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (error) setError("");
              }}
              autoComplete="email"
              disabled={loading}
              className="w-full rounded-lg border px-4 py-2.5 text-sm outline-none transition-all duration-200 disabled:cursor-not-allowed disabled:opacity-60"
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
                onClick={() => setShowPassword((prev) => !prev)}
                disabled={loading}
                aria-label={showPassword ? "Hide password" : "Show password"}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 rounded-md p-1 text-zinc-400 transition-colors hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
              >
                {showPassword ? (
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
                aria-label={showConfirmPassword ? "Hide confirm password" : "Show confirm password"}
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