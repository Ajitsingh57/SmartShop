import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { authApi, authStorage } from "../services/api";

const Login = () => {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    identifier: "",
    password: "",
  });

  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    if (error) setError("");
  };

  // Submit admin login credentials to backend
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    const identifier = formData.identifier.trim();
    const password = formData.password;

    if (!identifier) {
      setError("Please enter your username.");
      return;
    }

    if (!password) {
      setError("Please enter your password.");
      return;
    }

    setLoading(true);

    try {
      const data = await authApi.login({
        identifier,
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

      navigate("/dashboard", { replace: true });
    } catch (err) {
      console.error("Admin login failed:", err);
      setError(err?.message || "Unable to login. Please try again.");
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

          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl" style={{ color: "var(--app-text)" }}>
            Admin Login
          </h1>

          <p className="mt-2 text-sm" style={{ color: "var(--app-text-muted)" }}>
            Sign in to your SmartShop admin account
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
          >
            {error}
          </div>
        )}

        {/* Login credentials form */}
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label
              htmlFor="identifier"
              className="mb-2 block text-sm font-medium"
              style={{ color: "var(--app-text-secondary)" }}
            >
              Username
            </label>

            <input
              id="identifier"
              name="identifier"
              type="text"
              value={formData.identifier}
              onChange={handleChange}
              autoComplete="username"
              placeholder="Enter your username"
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
            <label
              htmlFor="password"
              className="mb-2 block text-sm font-medium"
              style={{ color: "var(--app-text-secondary)" }}
            >
              Password
            </label>

            <div className="relative">
              <input
                id="password"
                name="password"
                type={showPassword ? "text" : "password"}
                value={formData.password}
                onChange={handleChange}
                autoComplete="current-password"
                placeholder="Enter your password"
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
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50"
                style={{ color: "var(--app-text-muted)" }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.color = "var(--app-accent)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.color = "var(--app-text-muted)";
                }}
              >
                {showPassword ? "Hide" : "Show"}
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

        <div
          className="mt-6 rounded-lg border p-4"
          style={{
            borderColor: "var(--app-accent-border)",
            backgroundColor: "var(--app-accent-soft)",
          }}
        >
          <p className="text-center text-xs leading-5" style={{ color: "var(--app-text-muted)" }}>
            Admin accounts are created and managed by the Super Admin.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;