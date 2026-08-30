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

  // Submit customer login credentials and handle session tokens
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!identifier.trim()) {
      setError("Please enter your email, phone or username.");
      return;
    }

    if (!password) {
      setError("Please enter your password.");
      return;
    }

    setLoading(true);

    try {
      const data = await authApi.login({
        identifier: identifier.trim(),
        password,
      });

      authStorage.setToken(data.token);
      authStorage.setUser(data.user);

      if (data.user.role === "superadmin") {
        navigate("/superadmin");
      } else if (data.user.role === "admin") {
        navigate("/admin");
      } else {
        navigate("/");
      }
    } catch (error) {
      console.error("Login failed:", error);
      setError(error.message || "Login failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full px-4 sm:px-6 md:px-[50px]">
      <div
        className="relative mx-auto mt-8 max-w-2xl overflow-hidden rounded-2xl border border-white/5 px-5 py-10 text-white shadow-[0_10px_40px_rgba(0,0,0,0.5)] sm:mt-10 sm:rounded-3xl sm:px-[50px] sm:py-[55px]"
        style={{
          background:
            "radial-gradient(circle at top right, var(--app-accent-soft), transparent 60%), linear-gradient(135deg, var(--app-surface-light) 0%, var(--app-surface) 100%)",
        }}
      >
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-white sm:text-4xl">
            Welcome Back
          </h1>
          <p className="mt-2 text-sm text-zinc-400 sm:text-base">
            Login to your SmartShop account
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

        {/* Customer authentication form */}
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label
              htmlFor="identifier"
              className="mb-2 block text-sm font-medium text-zinc-300"
            >
              Email or Phone
            </label>

            <input
              id="identifier"
              type="text"
              placeholder="Enter email or Phone"
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              required
              autoComplete="username"
              className="w-full rounded-lg border border-zinc-700 bg-zinc-950 px-4 py-3 text-sm text-white placeholder:text-zinc-600 outline-none transition focus:border-[var(--app-accent-border)] focus:ring-1 focus:ring-[var(--app-accent-soft)]"
            />

            <p className="mt-2 text-xs text-zinc-600">
              Customers can use email or phone
            </p>
          </div>

          <div>
            <div className="mb-2 flex items-center justify-between">
              <label
                htmlFor="password"
                className="text-sm font-medium text-zinc-300"
              >
                Password
              </label>

              <Link
                to="/forgot-password"
                className="text-xs text-[var(--app-accent)] transition-colors hover:text-[var(--app-accent-hover)]"
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
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
                className="w-full rounded-lg border border-zinc-700 bg-zinc-950 px-4 py-3 pr-11 text-sm text-white placeholder:text-zinc-600 outline-none transition focus:border-[var(--app-accent-border)] focus:ring-1 focus:ring-[var(--app-accent-soft)]"
              />

              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                className="absolute right-3 top-1/2 -translate-y-1/2 rounded p-1 text-zinc-400 hover:text-white"
                aria-label={showPassword ? "Hide password" : "Show password"}
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
            className="w-full rounded-lg bg-[var(--app-accent)] px-5 py-3 font-semibold text-white shadow-lg transition-all duration-300 hover:-translate-y-[1px] hover:bg-[var(--app-accent-hover)] disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0"
            style={{ boxShadow: "0 10px 25px var(--app-accent-soft)" }}
          >
            {loading ? "Logging in..." : "Login"}
          </button>
        </form>

        <div className="mt-7 text-center">
          <p className="text-sm text-zinc-500">
            Don't have an account?{" "}
            <Link
              to="/signup"
              className="font-medium text-[var(--app-accent)] transition-colors hover:text-[var(--app-accent-hover)]"
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