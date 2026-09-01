import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Eye, EyeOff } from "lucide-react";
import { authApi, authStorage } from "../services/api";

const Login = () => {
  const navigate = useNavigate();

  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Submit customer login credentials and establish session
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    const trimmedId = identifier.trim();
    if (!trimmedId) {
      setError("Please enter your email or phone number.");
      return;
    }

    if (!password) {
      setError("Please enter your password.");
      return;
    }

    setLoading(true);

    try {
      const data = await authApi.login({
        identifier: trimmedId,
        password,
      });

      const token = data?.token;
      const loggedInUser = data?.user;

      if (!token) {
        throw new Error("Login could not be completed. Please try again.");
      }

      authStorage.setToken(token);
      if (loggedInUser) {
        authStorage.setUser(loggedInUser);
      }

      navigate("/", { replace: true });
    } catch (err) {
      console.error("Login failed:", err);
      setError(err?.message || "Unable to login. Please check your credentials.");
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
            Customer Login
          </h1>

          <p className="mt-2 text-sm" style={{ color: "var(--app-text-muted)" }}>
            Sign in to your SmartShop customer account
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

        {/* Customer authentication form */}
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label
              htmlFor="identifier"
              className="mb-2 block text-sm font-medium"
              style={{ color: "var(--app-text-secondary)" }}
            >
              Email or Phone Number
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

          <div>
            <div className="mb-2 flex items-center justify-between">
              <label
                htmlFor="password"
                className="text-sm font-medium"
                style={{ color: "var(--app-text-secondary)" }}
              >
                Password
              </label>

              <Link
                to="/forgot-password"
                className="text-xs transition-colors hover:underline"
                style={{ color: "var(--app-accent)" }}
              >
                Forgot Password?
              </Link>
            </div>

            <div className="relative">
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder="Enter your password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (error) setError("");
                }}
                required
                autoComplete="current-password"
                disabled={loading}
                className="w-full rounded-lg border px-4 py-3 pr-20 text-sm outline-none transition-all duration-200 disabled:cursor-not-allowed disabled:opacity-60"
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
            {loading ? "Signing In..." : "Login"}
          </button>
        </form>

        {/* Switch to Signup */}
        <div
          className="mt-6 rounded-lg border p-4 text-center"
          style={{
            borderColor: "var(--app-accent-border)",
            backgroundColor: "var(--app-accent-soft)",
          }}
        >
          <p className="text-xs leading-5" style={{ color: "var(--app-text-muted)" }}>
            Don't have a customer account?{" "}
            <Link
              to="/signup"
              className="font-semibold transition hover:underline"
              style={{ color: "var(--app-accent)" }}
            >
              Create Account
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;