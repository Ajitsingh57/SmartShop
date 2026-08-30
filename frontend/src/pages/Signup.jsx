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
      setError("Please enter your name.");
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

      authStorage.setToken(data.token);
      authStorage.setUser(data.user);

      navigate("/");
    } catch (error) {
      console.error("Signup failed:", error);
      setError(error.message || "Registration failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full px-4 sm:px-6 md:px-[50px] pb-16">
      <div
        className="relative mx-auto mt-8 max-w-2xl overflow-hidden rounded-2xl border border-white/5 px-5 py-10 text-white shadow-[0_10px_40px_rgba(0,0,0,0.5)] sm:mt-10 sm:rounded-3xl sm:px-[50px] sm:py-[55px]"
        style={{
          background:
            "radial-gradient(circle at top right, var(--app-accent-soft), transparent 60%), linear-gradient(135deg, var(--app-surface-light) 0%, var(--app-surface) 100%)",
        }}
      >
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-white sm:text-4xl">
            Create Account
          </h1>
          <p className="mt-2 text-sm text-zinc-400 sm:text-base">
            Join SmartShop to track your purchases, credit ledger and payments
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

        {/* Customer registration form */}
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label
              htmlFor="name"
              className="mb-2 block text-sm font-medium text-zinc-300"
            >
              Full Name
            </label>

            <input
              id="name"
              type="text"
              placeholder="Enter your full name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              autoComplete="name"
              className="w-full rounded-lg border border-zinc-700 bg-zinc-950 px-4 py-3 text-sm text-white placeholder:text-zinc-600 outline-none transition focus:border-[var(--app-accent-border)] focus:ring-1 focus:ring-[var(--app-accent-soft)]"
            />
          </div>

          <div>
            <label
              htmlFor="email"
              className="mb-2 block text-sm font-medium text-zinc-300"
            >
              Email Address
              <span className="ml-2 text-xs text-zinc-500">Optional</span>
            </label>

            <input
              id="email"
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              className="w-full rounded-lg border border-zinc-700 bg-zinc-950 px-4 py-3 text-sm text-white placeholder:text-zinc-600 outline-none transition focus:border-[var(--app-accent-border)] focus:ring-1 focus:ring-[var(--app-accent-soft)]"
            />
          </div>

          <div>
            <label
              htmlFor="phone"
              className="mb-2 block text-sm font-medium text-zinc-300"
            >
              Phone Number
              <span className="ml-2 text-xs text-zinc-500">Optional</span>
            </label>

            <input
              id="phone"
              type="tel"
              placeholder="Enter your phone number"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              autoComplete="tel"
              className="w-full rounded-lg border border-zinc-700 bg-zinc-950 px-4 py-3 text-sm text-white placeholder:text-zinc-600 outline-none transition focus:border-[var(--app-accent-border)] focus:ring-1 focus:ring-[var(--app-accent-soft)]"
            />
          </div>

          <div className="rounded-lg border border-[var(--app-accent-border)] bg-[var(--app-accent-soft)] px-4 py-3">
            <p className="text-xs leading-5 text-zinc-400">
              Provide at least{" "}
              <span className="font-semibold text-[var(--app-accent)]">one</span> of email or phone number.
            </p>
          </div>

          <div>
            <label
              htmlFor="password"
              className="mb-2 block text-sm font-medium text-zinc-300"
            >
              Password
            </label>

            <div className="relative">
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder="Create a password (min 6 characters)"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                autoComplete="new-password"
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

            <p className="mt-2 text-xs text-zinc-600">
              Password must be at least 6 characters.
            </p>
          </div>

          <div>
            <label
              htmlFor="confirmPassword"
              className="mb-2 block text-sm font-medium text-zinc-300"
            >
              Confirm Password
            </label>

            <div className="relative">
              <input
                id="confirmPassword"
                type={showConfirmPassword ? "text" : "password"}
                placeholder="Confirm your password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                minLength={6}
                autoComplete="new-password"
                className="w-full rounded-lg border border-zinc-700 bg-zinc-950 px-4 py-3 pr-11 text-sm text-white placeholder:text-zinc-600 outline-none transition focus:border-[var(--app-accent-border)] focus:ring-1 focus:ring-[var(--app-accent-soft)]"
              />

              <button
                type="button"
                onClick={() => setShowConfirmPassword((prev) => !prev)}
                className="absolute right-3 top-1/2 -translate-y-1/2 rounded p-1 text-zinc-400 hover:text-white"
                aria-label={showConfirmPassword ? "Hide confirm password" : "Show confirm password"}
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
            className="w-full rounded-lg bg-[var(--app-accent)] px-5 py-3 font-semibold text-white shadow-lg transition-all duration-300 hover:-translate-y-[1px] hover:bg-[var(--app-accent-hover)] disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0"
            style={{ boxShadow: "0 10px 25px var(--app-accent-soft)" }}
          >
            {loading ? "Creating Account..." : "Create Account"}
          </button>
        </form>

        <div className="mt-7 text-center">
          <p className="text-sm text-zinc-500">
            Already have an account?{" "}
            <Link
              to="/login"
              className="font-medium text-[var(--app-accent)] transition-colors hover:text-[var(--app-accent-hover)]"
            >
              Login
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Signup;