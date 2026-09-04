import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Eye, EyeOff } from "lucide-react";
import { toast } from "react-toastify";
import { authApi, authStorage } from "../services/api";
import Logo from "../components/Logo";

const Login = () => {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    identifier: "",
    password: "",
  });

  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    if (error) setError("");
    if (fieldErrors[name]) {
      setFieldErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  // Submit admin login credentials to backend
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setFieldErrors({});

    const identifier = formData.identifier.trim();
    const password = formData.password;
    const newFieldErrors = {};

    if (!identifier) {
      newFieldErrors.identifier = "Please enter your username.";
    }

    if (!password) {
      newFieldErrors.password = "Please enter your password.";
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

      toast.success(data?.message || "Login successful!");
      navigate("/dashboard", { replace: true });
    } catch (err) {
      console.error("Admin login failed:", err);
      const msg = err?.message || "Unable to login. Please try again.";
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

  return (
    <div
      className="flex min-h-screen w-full items-center justify-center px-4 py-10 sm:px-6"
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
        <div className="mb-8 text-center flex flex-col items-center">
          <div className="mb-4">
            <Logo size="lg" showText={false} />
          </div>

          <h1 className="text-3xl font-display font-extrabold tracking-tight sm:text-4xl" style={{ color: "var(--app-text)" }}>
            Admin Login
          </h1>

          <p className="mt-2 text-sm" style={{ color: "var(--app-text-muted)" }}>
            Sign in to your SmartShop admin account
          </p>
        </div>

        {/* Login credentials form */}
        <form onSubmit={handleSubmit} noValidate className="space-y-5">
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
                className={`w-full rounded-lg border px-4 py-3 pr-11 text-sm outline-none transition-all duration-200 disabled:cursor-not-allowed disabled:opacity-60 ${
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
                onClick={() => setShowPassword(!showPassword)}
                tabIndex={-1}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-zinc-400 transition-colors hover:text-zinc-200"
                style={{ color: "var(--app-text-muted)" }}
                aria-label={showPassword ? "Hide password" : "Show password"}
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