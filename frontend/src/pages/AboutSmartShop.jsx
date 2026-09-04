import React from "react";

const AboutSmartShop = () => {
  return (
    <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8 pb-16">
      <div
        className="mx-auto max-w-5xl overflow-hidden rounded-xl border border-white/5 px-5 py-10 text-white shadow-[0_10px_40px_rgba(0,0,0,0.5)] sm:rounded-[16px] sm:px-8 sm:py-12 md:px-10 md:py-14"
        style={{
          background:
            "radial-gradient(circle at top right, var(--app-accent-soft), transparent 60%), linear-gradient(135deg, var(--app-surface-light) 0%, var(--app-surface) 100%)",
        }}
      >
        {/* Platform introduction header */}
        <div className="mb-12 text-center">
          <div
            className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-[var(--app-accent)] text-3xl font-bold text-white shadow-lg"
            style={{ boxShadow: "0 10px 25px var(--app-accent-soft)" }}
          >
            S
          </div>

          <h1 className="text-3xl font-bold sm:text-4xl">
            About SmartShop<span className="text-[var(--app-accent)]">.</span>
          </h1>

          <p className="mx-auto mt-3 max-w-2xl text-sm leading-6 text-zinc-400 sm:text-base">
            A modern shop management platform designed to make everyday business operations simple, organized and efficient.
          </p>
        </div>

        {/* Overview section */}
        <section className="mb-8">
          <div className="rounded-xl border border-zinc-800 bg-zinc-950/70 p-6 sm:p-8">
            <h2 className="text-2xl font-bold text-white">What is SmartShop?</h2>
            <p className="mt-4 text-sm leading-7 text-zinc-400 sm:text-base">
              SmartShop is a shop management system created to manage products, customers, sales, payments, transactions and other important shop activities from a single platform.
            </p>
            <p className="mt-4 text-sm leading-7 text-zinc-400 sm:text-base">
              The main goal of SmartShop is to reduce manual work, keep business information organized and provide a smooth experience for both customers and shop administrators.
            </p>
          </div>
        </section>

        {/* Feature capabilities grid */}
        <section className="mb-8">
          <h2 className="mb-5 text-2xl font-bold text-white">What SmartShop Offers</h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {[
              {
                title: "Product Management",
                description: "Manage shop products and keep product information organized.",
              },
              {
                title: "Customer Management",
                description: "Maintain customer information and manage customer-related activities.",
              },
              {
                title: "Sales Management",
                description: "Keep track of sales and important transaction records.",
              },
              {
                title: "Payment Management",
                description: "Manage payment records and customer payment activities.",
              },
              {
                title: "Credit Management",
                description: "Track customer credit, pending amounts and borrowing limits.",
              },
              {
                title: "Admin Control",
                description: "Provide controlled access for administrators and super administrators.",
              },
            ].map((feature) => (
              <div
                key={feature.title}
                className="rounded-xl border border-zinc-800 bg-zinc-950/60 p-5 transition-all duration-300 hover:-translate-y-1 hover:border-[var(--app-accent-border)] hover:bg-zinc-900"
              >
                <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg border border-[var(--app-accent-border)] bg-[var(--app-accent-soft)] text-[var(--app-accent)]">
                  ✓
                </div>
                <h3 className="font-semibold text-white">{feature.title}</h3>
                <p className="mt-2 text-sm leading-6 text-zinc-500">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </section>

        <section className="mb-8">
          <div className="rounded-xl border border-[var(--app-accent-border)] bg-[var(--app-accent-soft)] p-6 sm:p-8">
            <h2 className="text-2xl font-bold text-white">Our Purpose</h2>
            <p className="mt-4 text-sm leading-7 text-zinc-400 sm:text-base">
              SmartShop focuses on bringing essential shop management operations together in one reliable system. It is designed with simplicity, accessibility and efficient management in mind.
            </p>
          </div>
        </section>

        {/* Feature modules tags */}
        <section>
          <div className="rounded-xl border border-zinc-800 bg-zinc-950/70 p-6 sm:p-8">
            <h2 className="text-2xl font-bold text-white">
              Built for Modern Digital Shop Management
            </h2>
            <p className="mt-4 text-sm leading-7 text-zinc-400 sm:text-base">
              SmartShop brings together a customer-friendly store ledger portal and powerful POS management features for shop administrators, creating a complete digital solution for shop operations.
            </p>
            <div className="mt-6 flex flex-wrap gap-2">
              {[
                "Products",
                "Customers",
                "Sales",
                "Payments",
                "Credits",
                "Transactions",
                "Admin Management",
              ].map((item) => (
                <span
                  key={item}
                  className="rounded-full border border-zinc-700 bg-zinc-900 px-4 py-2 text-xs font-medium text-zinc-400"
                >
                  {item}
                </span>
              ))}
            </div>
          </div>
        </section>

        <div className="mt-10 text-center">
          <p className="text-sm text-zinc-600">
            SmartShop — Simple. Smart. Organized.
          </p>
        </div>
      </div>
    </div>
  );
};

export default AboutSmartShop;