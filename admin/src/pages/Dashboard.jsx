import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  Users,
  Package,
  IndianRupee,
  CreditCard,
  PlusCircle,
  ShoppingCart,
  Wallet,
  ArrowRight,
  Sparkles,
  RefreshCw,
} from "lucide-react";
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

        const formattedRecent = salesList.slice(0, 6).map((sale) => {
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
              sale.paymentType === "cash"
                ? "Cash"
                : sale.paymentType === "credit"
                ? "Credit / Udhar"
                : "UPI / Online",
            paymentType: sale.paymentType,
            time: new Date(sale.createdAt).toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            }),
            date: new Date(sale.createdAt).toLocaleDateString("en-IN", {
              day: "numeric",
              month: "short",
            }),
          };
        });

        setRecentSales(formattedRecent);
      } catch (err) {
        console.error("Dashboard data load failed:", err);
      } finally {
        setLoading(false);
      }
    };

    loadDashboardData();
  }, []);

  const stats = [
    {
      title: "Today's Sales",
      value: `₹${metrics.todaySalesAmount.toLocaleString("en-IN")}`,
      change: "Live revenue",
      subtitle: "from today's orders",
      icon: IndianRupee,
      color: "text-emerald-400",
      bg: "bg-emerald-500/10 border-emerald-500/20",
      path: "/sales",
    },
    {
      title: "Pending Khata",
      value: `₹${metrics.pendingCreditAmount.toLocaleString("en-IN")}`,
      change: `${metrics.pendingCustomersCount} customers`,
      subtitle: "with balance due",
      icon: CreditCard,
      color: "text-rose-400",
      bg: "bg-rose-500/10 border-rose-500/20",
      path: "/credits",
    },
    {
      title: "Active Customers",
      value: `${metrics.customerCount}`,
      change: "Digital accounts",
      subtitle: "registered in khata",
      icon: Users,
      color: "text-blue-400",
      bg: "bg-blue-500/10 border-blue-500/20",
      path: "/customers",
    },
    {
      title: "In-Store Products",
      value: `${metrics.productCount}`,
      change: `${metrics.totalSalesCount} total sales`,
      subtitle: "in inventory database",
      icon: Package,
      color: "text-amber-400",
      bg: "bg-amber-500/10 border-amber-500/20",
      path: "/products",
    },
  ];

  const quickActions = [
    {
      title: "New POS Bill",
      description: "Create a fast invoice / barcode sale",
      path: "/sales",
      icon: ShoppingCart,
      badge: "F2",
    },
    {
      title: "Add Product",
      description: "Add a new item to shop stock",
      path: "/products/add",
      icon: PlusCircle,
    },
    {
      title: "Customer Khata",
      description: "Manage customer ledger & limits",
      path: "/customers",
      icon: Users,
    },
    {
      title: "Verify Payments",
      description:
        metrics.pendingPaymentsCount > 0
          ? `${metrics.pendingPaymentsCount} claims waiting approval`
          : "View online & cash settlements",
      path: "/payments",
      icon: Wallet,
      alert: metrics.pendingPaymentsCount > 0,
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
    <div className="space-y-6">
      {/* Welcome greeting banner */}
      <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-r from-zinc-900 via-zinc-900/90 to-zinc-950 p-6 sm:p-8 shadow-2xl animate-fade-in-up">
        {/* Glow orb */}
        <div className="pointer-events-none absolute -right-16 -top-20 h-64 w-64 rounded-full bg-[var(--app-accent-soft)] blur-3xl" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="mb-2 inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold glow-pill">
              <Sparkles className="h-3.5 w-3.5" />
              <span>SmartShop Retail POS & Khata Suite</span>
            </div>

            <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-white font-display">
              {greeting}, {currentUser?.name || "Admin"}.
            </h1>

            <p className="mt-1 text-xs sm:text-sm text-zinc-400 max-w-xl">
              Here is your real-time store snapshot. Monitor live revenue, track pending customer udhar, and manage inventory operations.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <Link
              to="/sales"
              className="inline-flex items-center gap-2 rounded-xl btn-primary px-5 py-3 text-xs sm:text-sm font-bold shadow-lg"
            >
              <ShoppingCart className="h-4 w-4" />
              <span>New POS Sale (F2)</span>
            </Link>

            <Link
              to="/credits"
              className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-xs sm:text-sm font-semibold text-zinc-200 hover:bg-white/10 hover:text-white transition"
            >
              <CreditCard className="h-4 w-4" />
              <span>Khata Ledger</span>
            </Link>
          </div>
        </div>
      </div>

      {/* KPI Statistic Metrics Grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Link
              key={stat.title}
              to={stat.path}
              className="group glass-card rounded-2xl p-5"
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-zinc-400">
                    {stat.title}
                  </p>
                  <p className="mt-2 text-2xl sm:text-3xl font-extrabold text-white font-display tracking-tight">
                    {loading ? (
                      <span className="inline-block h-8 w-24 animate-pulse rounded bg-zinc-800" />
                    ) : (
                      stat.value
                    )}
                  </p>
                </div>
                <div
                  className={`flex h-12 w-12 items-center justify-center rounded-2xl border ${stat.bg} ${stat.color} shadow-inner transition-transform duration-300 group-hover:scale-110`}
                >
                  <Icon className="h-6 w-6" />
                </div>
              </div>

              <div className="mt-4 flex items-center gap-1.5 text-xs text-zinc-400 pt-3 border-t border-white/5">
                <span className={`font-semibold ${stat.color}`}>
                  {stat.change}
                </span>
                <span>{stat.subtitle}</span>
              </div>
            </Link>
          );
        })}
      </div>

      {/* Action Center and Recent Sales */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Quick Shortcuts Grid */}
        <div className="glass-card rounded-2xl p-5 sm:p-6 lg:col-span-1 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-base sm:text-lg font-bold text-white font-display">
                  Quick Actions
                </h2>
                <p className="text-xs text-zinc-400">Frequently accessed operations</p>
              </div>
            </div>

            <div className="space-y-2.5">
              {quickActions.map((action) => {
                const ActionIcon = action.icon;
                return (
                  <Link
                    key={action.title}
                    to={action.path}
                    className="group flex items-center justify-between rounded-xl border border-white/5 bg-zinc-950/60 p-3.5 transition-all duration-200 hover:border-[var(--app-accent-border)] hover:bg-zinc-900/90"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-[var(--app-accent-border)] bg-[var(--app-accent-soft)] text-[var(--app-accent)] shadow-sm">
                        <ActionIcon className="h-5 w-5" />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="truncate text-xs sm:text-sm font-bold text-white group-hover:text-[var(--app-accent)] transition">
                            {action.title}
                          </p>
                          {action.badge && (
                            <span className="rounded bg-[var(--app-accent)]/20 px-1.5 py-0.2 text-[9px] font-bold text-[var(--app-accent)]">
                              {action.badge}
                            </span>
                          )}
                          {action.alert && (
                            <span className="flex h-2 w-2 rounded-full bg-amber-400 animate-ping" />
                          )}
                        </div>
                        <p className="truncate text-[11px] text-zinc-400">
                          {action.description}
                        </p>
                      </div>
                    </div>
                    <ArrowRight className="h-4 w-4 shrink-0 text-zinc-500 transition-transform group-hover:translate-x-1 group-hover:text-white" />
                  </Link>
                );
              })}
            </div>
          </div>
        </div>

        {/* Recent Sales Ledger List */}
        <div className="glass-card rounded-2xl p-5 sm:p-6 lg:col-span-2">
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-white/5">
            <div>
              <h2 className="text-base sm:text-lg font-bold text-white font-display">
                Recent Store Sales
              </h2>
              <p className="text-xs text-zinc-400">Live sales recorded in your store</p>
            </div>
            <Link
              to="/sales"
              className="inline-flex items-center gap-1 text-xs font-bold text-[var(--app-accent)] hover:underline"
            >
              <span>View All Sales</span>
              <ArrowRight className="h-3 w-3" />
            </Link>
          </div>

          {loading ? (
            <div className="py-12 text-center text-zinc-500">
              <RefreshCw className="mx-auto mb-2 h-7 w-7 animate-spin text-[var(--app-accent)]" />
              <p className="text-xs font-medium">Loading sales history...</p>
            </div>
          ) : recentSales.length === 0 ? (
            <div className="py-12 text-center">
              <ShoppingCart className="mx-auto mb-2 h-8 w-8 text-zinc-600" />
              <p className="text-sm font-medium text-zinc-400">No sales recorded yet.</p>
              <Link
                to="/sales"
                className="mt-3 inline-block rounded-xl btn-primary px-4 py-2 text-xs font-bold"
              >
                Create First Sale
              </Link>
            </div>
          ) : (
            <div className="space-y-2.5 overflow-x-auto">
              {recentSales.map((sale) => (
                <div
                  key={sale.id}
                  className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-xl border border-white/5 bg-zinc-950/60 p-3.5 hover:border-white/10 hover:bg-zinc-900/60 transition"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-zinc-900 border border-white/10 font-bold text-white text-xs">
                      {sale.customer.charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-xs sm:text-sm font-bold text-white">
                        {sale.customer}
                      </p>
                      <p className="truncate text-[11px] text-zinc-400">
                        {sale.product}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0">
                    <span
                      className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                        sale.paymentType === "cash"
                          ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                          : sale.paymentType === "credit"
                          ? "bg-rose-500/10 text-rose-400 border border-rose-500/20"
                          : "bg-blue-500/10 text-blue-400 border border-blue-500/20"
                      }`}
                    >
                      {sale.payment}
                    </span>
                    <span className="text-sm font-extrabold text-white">
                      {sale.amount}
                    </span>
                    <span className="text-[11px] text-zinc-500">
                      {sale.time}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;