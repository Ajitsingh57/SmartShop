import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  customersApi,
  productsApi,
  salesApi,
  creditsApi,
  paymentsApi,
  authStorage,
} from "../services/api";

const Dashboard = () => {
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState(null);

  const [metrics, setMetrics] = useState({
    customerCount: 0,
    productCount: 0,
    todaySalesAmount: 0,
    totalSalesCount: 0,
    pendingCreditAmount: 0,
    pendingCustomersCount: 0,
    pendingPaymentsCount: 0,
  });

  const [recentSales, setRecentSales] = useState([]);

  useEffect(() => {
    const user = authStorage.getUser();
    if (user) {
      setCurrentUser(user);
    }

    const loadDashboardData = async () => {
      try {
        setLoading(true);

        const [
          customersRes,
          productsRes,
          salesRes,
          creditsRes,
          pendingPaymentsRes,
        ] = await Promise.allSettled([
          customersApi.getAll(),
          productsApi.list(),
          salesApi.getAll(),
          creditsApi.getAll(),
          paymentsApi.getPending(),
        ]);

        const customersList =
          customersRes.status === "fulfilled"
            ? Array.isArray(customersRes.value?.customers)
              ? customersRes.value.customers
              : Array.isArray(customersRes.value)
              ? customersRes.value
              : []
            : [];

        const productsList =
          productsRes.status === "fulfilled"
            ? Array.isArray(productsRes.value?.products)
              ? productsRes.value.products
              : Array.isArray(productsRes.value)
              ? productsRes.value
              : []
            : [];

        const salesList =
          salesRes.status === "fulfilled"
            ? Array.isArray(salesRes.value?.sales)
              ? salesRes.value.sales
              : Array.isArray(salesRes.value)
              ? salesRes.value
              : []
            : [];

        const creditsList =
          creditsRes.status === "fulfilled"
            ? Array.isArray(creditsRes.value?.credits)
              ? creditsRes.value.credits
              : Array.isArray(creditsRes.value)
              ? creditsRes.value
              : []
            : [];

        const pendingPaymentsList =
          pendingPaymentsRes.status === "fulfilled"
            ? Array.isArray(pendingPaymentsRes.value?.payments)
              ? pendingPaymentsRes.value.payments
              : Array.isArray(pendingPaymentsRes.value)
              ? pendingPaymentsRes.value
              : []
            : [];

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const todaySales = salesList.filter((s) => {
          const saleDate = new Date(s.createdAt);
          return saleDate >= today;
        });

        const todaySalesAmount = todaySales.reduce(
          (sum, s) => sum + Number(s.totalAmount || 0),
          0
        );

        const activeCredits = creditsList.filter(
          (c) => Number(c.pendingAmount || 0) > 0
        );
        const pendingCreditAmount = activeCredits.reduce(
          (sum, c) => sum + Number(c.pendingAmount || 0),
          0
        );

        const uniquePendingCustomers = new Set(
          activeCredits.map((c) => String(c.customerId?._id || c.customerId || c.userId))
        );

        setMetrics({
          customerCount: customersList.length,
          productCount: productsList.length,
          todaySalesAmount,
          totalSalesCount: salesList.length,
          pendingCreditAmount,
          pendingCustomersCount: uniquePendingCustomers.size,
          pendingPaymentsCount: pendingPaymentsList.length,
        });

        const formattedRecent = salesList.slice(0, 5).map((sale) => {
          const customerName =
            sale.customerId?.name ||
            sale.customerId?.userId?.name ||
            sale.customerId?.userId?.username ||
            "Walk-in Customer";

          const firstItem =
            sale.items && sale.items.length > 0
              ? sale.items[0].productName || "Products"
              : "Sale Items";

          const productDisplay =
            sale.items && sale.items.length > 1
              ? `${firstItem} +${sale.items.length - 1} more`
              : firstItem;

          return {
            id: sale._id,
            customer: customerName,
            product: productDisplay,
            amount: `₹${Number(sale.totalAmount || 0).toLocaleString("en-IN")}`,
            payment:
              sale.paymentType === "credit"
                ? "Credit"
                : sale.paymentType === "partial"
                ? "Partial"
                : "Paid",
            time: new Date(sale.createdAt).toLocaleDateString("en-IN", {
              day: "2-digit",
              month: "short",
              hour: "2-digit",
              minute: "2-digit",
            }),
          };
        });

        setRecentSales(formattedRecent);
      } catch (err) {
        console.error("Failed to load dashboard data:", err);
      } finally {
        setLoading(false);
      }
    };

    loadDashboardData();
  }, []);

  const stats = [
    {
      title: "Total Customers",
      value: metrics.customerCount.toLocaleString("en-IN"),
      change: `${metrics.customerCount} registered`,
      subtitle: "accounts",
      icon: "👥",
      path: "/customers",
    },
    {
      title: "Total Products",
      value: metrics.productCount.toLocaleString("en-IN"),
      change: `${metrics.productCount} items`,
      subtitle: "in inventory",
      icon: "📦",
      path: "/products",
    },
    {
      title: "Today's Sales",
      value: `₹${metrics.todaySalesAmount.toLocaleString("en-IN")}`,
      change: `${metrics.totalSalesCount} total sales`,
      subtitle: "recorded",
      icon: "₹",
      path: "/sales",
    },
    {
      title: "Pending Credits",
      value: `₹${metrics.pendingCreditAmount.toLocaleString("en-IN")}`,
      change: `${metrics.pendingCustomersCount} Customers`,
      subtitle: "need attention",
      icon: "◷",
      path: "/credits",
    },
  ];

  const quickActions = [
    {
      title: "New Sale",
      description: "Create a sale for a customer",
      path: "/sales",
      icon: "＋",
    },
    {
      title: "Add Product",
      description: "Add a new product to stock",
      path: "/products/add",
      icon: "＋",
    },
    {
      title: "Customers",
      description: "Manage customer records",
      path: "/customers",
      icon: "👥",
    },
    {
      title: "Payments",
      description:
        metrics.pendingPaymentsCount > 0
          ? `${metrics.pendingPaymentsCount} claims pending approval`
          : "View and manage payments",
      path: "/payments",
      icon: "₹",
    },
  ];

  const greetingHour = new Date().getHours();
  const greeting =
    greetingHour < 12
      ? "Good morning"
      : greetingHour < 17
      ? "Good afternoon"
      : "Good evening";

  return (
    <div
      className="min-h-screen w-full px-4 py-6 sm:px-6 md:px-10 lg:px-12"
      style={{
        backgroundColor: "var(--app-bg)",
        color: "var(--app-text)",
      }}
    >
      <div className="mx-auto max-w-7xl">
        {/* Welcome greeting banner */}
        <div
          className="relative mb-7 overflow-hidden rounded-2xl border p-6 shadow-[0_10px_40px_rgba(0,0,0,0.35)] sm:p-8"
          style={{
            borderColor: "var(--app-accent-border)",
            background: `radial-gradient(circle at 85% 20%, var(--app-accent-soft), transparent 32%), linear-gradient(135deg, var(--app-surface-light) 0%, var(--app-surface) 100%)`,
          }}
        >
          <div className="relative z-10">
            <p className="mb-2 text-sm font-medium" style={{ color: "var(--app-accent)" }}>
              SmartShop Admin Panel
            </p>
            <h1 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
              {greeting}, {currentUser?.name || "Admin"}.
            </h1>
            <p className="mt-2 max-w-xl text-sm leading-6 text-zinc-400 sm:text-base">
              Here's what's happening in your shop today. Keep track of sales, customers, products and pending credits from one place.
            </p>
          </div>

          <div
            className="pointer-events-none absolute -right-16 -top-20 h-56 w-56 rounded-full border"
            style={{ borderColor: "var(--app-accent-border)" }}
          />
          <div
            className="pointer-events-none absolute -right-5 -top-9 h-36 w-36 rounded-full border"
            style={{ borderColor: "var(--app-accent-border)" }}
          />
        </div>

        {/* Dashboard quick statistic metrics */}
        <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {stats.map((stat) => (
            <Link
              key={stat.title}
              to={stat.path}
              className="group rounded-xl border p-5 transition-all duration-300 hover:-translate-y-1"
              style={{
                borderColor: "var(--app-border)",
                backgroundColor: "var(--app-surface)",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = "var(--app-accent-border)";
                e.currentTarget.style.backgroundColor = "var(--app-surface-light)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = "var(--app-border)";
                e.currentTarget.style.backgroundColor = "var(--app-surface)";
              }}
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
                    {stat.title}
                  </p>
                  <p className="mt-3 text-2xl font-bold text-white sm:text-3xl">
                    {loading ? "..." : stat.value}
                  </p>
                </div>
                <div
                  className="flex h-11 w-11 items-center justify-center rounded-lg border text-lg"
                  style={{
                    borderColor: "var(--app-accent-border)",
                    backgroundColor: "var(--app-accent-soft)",
                    color: "var(--app-accent)",
                  }}
                >
                  {stat.icon}
                </div>
              </div>

              <div className="mt-4 flex items-center gap-1.5 text-xs text-zinc-400">
                <span className="font-semibold" style={{ color: "var(--app-accent)" }}>
                  {stat.change}
                </span>
                <span>{stat.subtitle}</span>
              </div>
            </Link>
          ))}
        </div>

        {/* Action center and recent activity */}
        <div className="mb-8 grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Quick shortcuts grid */}
          <div
            className="rounded-2xl border p-6 lg:col-span-1"
            style={{
              borderColor: "var(--app-border)",
              backgroundColor: "var(--app-surface)",
            }}
          >
            <h2 className="text-lg font-semibold text-white">Quick Actions</h2>
            <p className="mt-1 text-xs text-zinc-500">Frequently used operations</p>

            <div className="mt-5 space-y-3">
              {quickActions.map((action) => (
                <Link
                  key={action.title}
                  to={action.path}
                  className="group flex items-center justify-between rounded-xl border p-3.5 transition-all duration-200"
                  style={{
                    borderColor: "var(--app-border)",
                    backgroundColor: "var(--app-surface-light)",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = "var(--app-accent-border)";
                    e.currentTarget.style.backgroundColor = "var(--app-accent-soft)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = "var(--app-border)";
                    e.currentTarget.style.backgroundColor = "var(--app-surface-light)";
                  }}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="flex h-9 w-9 items-center justify-center rounded-lg border text-sm font-bold"
                      style={{
                        borderColor: "var(--app-accent-border)",
                        backgroundColor: "var(--app-accent-soft)",
                        color: "var(--app-accent)",
                      }}
                    >
                      {action.icon}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-white">{action.title}</p>
                      <p className="text-xs text-zinc-500">{action.description}</p>
                    </div>
                  </div>
                  <span className="text-zinc-600 transition-transform group-hover:translate-x-1">
                    →
                  </span>
                </Link>
              ))}
            </div>
          </div>

          {/* Recent sales ledger list */}
          <div
            className="rounded-2xl border p-6 lg:col-span-2"
            style={{
              borderColor: "var(--app-border)",
              backgroundColor: "var(--app-surface)",
            }}
          >
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-white">Recent Sales</h2>
                <p className="mt-1 text-xs text-zinc-500">Live sales recorded in your store</p>
              </div>
              <Link
                to="/sales"
                className="text-xs font-semibold transition hover:underline"
                style={{ color: "var(--app-accent)" }}
              >
                View all sales →
              </Link>
            </div>

            {loading ? (
              <p className="py-10 text-center text-sm text-zinc-500">Loading recent sales...</p>
            ) : recentSales.length === 0 ? (
              <div className="py-12 text-center">
                <p className="text-sm text-zinc-500">No sales recorded yet.</p>
                <Link
                  to="/sales"
                  className="mt-3 inline-block rounded-lg px-4 py-2 text-xs font-semibold text-white"
                  style={{ backgroundColor: "var(--app-accent)" }}
                >
                  Create First Sale
                </Link>
              </div>
            ) : (
              <div className="mt-5 space-y-3">
                {recentSales.map((sale) => (
                  <div
                    key={sale.id}
                    className="flex flex-col gap-2 rounded-xl border p-4 sm:flex-row sm:items-center sm:justify-between"
                    style={{
                      borderColor: "var(--app-border)",
                      backgroundColor: "var(--app-surface-light)",
                    }}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full font-bold text-white"
                        style={{ backgroundColor: "var(--app-accent)" }}
                      >
                        {sale.customer.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-white">{sale.customer}</p>
                        <p className="text-xs text-zinc-500">{sale.product}</p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between sm:justify-end sm:gap-4">
                      <span
                        className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${
                          sale.payment === "Paid"
                            ? "bg-emerald-500/10 text-emerald-400"
                            : sale.payment === "Credit"
                            ? "bg-red-500/10 text-red-400"
                            : "bg-yellow-500/10 text-yellow-400"
                        }`}
                      >
                        {sale.payment}
                      </span>
                      <p className="text-sm font-bold text-white">{sale.amount}</p>
                      <p className="text-xs text-zinc-500">{sale.time}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;