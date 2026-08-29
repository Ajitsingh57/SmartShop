import React from "react";
import { Link } from "react-router-dom";

const Settings = () => {
  const settingsItems = [
    {
      title: "My Profile",
      description: "View your personal information and account details.",
      path: "/settings/profile",
      button: "Open Profile",
      protected: true,
    },
    {
      title: "Change Password",
      description: "Update your account password and keep your account secure.",
      path: "/settings/change-password",
      button: "Change Password",
      protected: true,
    },
    {
      title: "Help & Support",
      description: "Need help? Find support information and contact options.",
      path: "/settings/help-support",
      button: "Get Support",
      protected: false,
    },
    {
      title: "About SmartShop",
      description: "Learn about SmartShop, its features, purpose and how the platform works.",
      path: "/about-smartshop",
      button: "About SmartShop",
      protected: false,
    },
    {
      title: "About Developer",
      description: "Meet the developer and team behind the SmartShop project.",
      path: "/about",
      button: "Meet the Team",
      protected: false,
    },
  ];

  return (
    <div className="w-full px-4 sm:px-6 md:px-[50px]">
      <div
        className="mx-auto max-w-5xl rounded-xl border border-white/5 p-5 text-white shadow-[0_10px_40px_rgba(0,0,0,0.5)] sm:rounded-[16px] sm:p-8 md:p-10"
        style={{
          background:
            "radial-gradient(circle at top right, var(--app-accent-soft), transparent 60%), linear-gradient(135deg, var(--app-surface-light) 0%, var(--app-surface) 100%)",
        }}
      >
        <div className="mb-10">
          <h1 className="text-3xl font-bold text-white sm:text-4xl">Settings</h1>
          <p className="mt-2 text-sm text-zinc-400 sm:text-base">
            Manage your SmartShop account and explore useful information
          </p>
        </div>

        {/* Customer settings navigation tiles */}
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
          {settingsItems.map((item) => (
            <div
              key={item.path}
              className="group rounded-xl border border-zinc-800 bg-zinc-950/70 p-6 transition-all duration-300 hover:-translate-y-1 hover:border-[var(--app-accent-border)] hover:bg-zinc-900"
            >
              <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-lg border border-[var(--app-accent-border)] bg-[var(--app-accent-soft)] text-xl text-[var(--app-accent)]">
                ⚙
              </div>

              <h2 className="text-xl font-semibold text-white">{item.title}</h2>

              <p className="mt-2 min-h-[48px] text-sm leading-6 text-zinc-500">
                {item.description}
              </p>

              <Link
                to={item.path}
                className="mt-5 inline-flex w-full items-center justify-center rounded-lg border border-zinc-700 bg-zinc-900 px-4 py-3 text-sm font-semibold text-zinc-300 transition duration-300 hover:border-[var(--app-accent-border)] hover:bg-[var(--app-accent)] hover:text-white"
              >
                {item.button}
              </Link>
            </div>
          ))}
        </div>

        <div className="mt-8 rounded-lg border border-[var(--app-accent-border)] bg-[var(--app-accent-soft)] p-5">
          <p className="text-sm leading-6 text-zinc-400">
            Your account settings help you manage your profile, password and SmartShop experience from one place.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Settings;