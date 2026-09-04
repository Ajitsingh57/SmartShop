import React, { useEffect, useState, useMemo } from "react";
import { Link } from "react-router-dom";
import {
  Users,
  Package,
  IndianRupee,
  CreditCard,
  ShoppingCart,
  Wallet,
  ArrowRight,
  Sparkles,
  RefreshCw,
  TrendingUp,
  AlertTriangle,
  ArrowUpRight,
  Clock,
  Layers,
  CheckCircle2,
  Phone,
  Plus,
  Flame,
  Activity,
  BarChart3,
  PieChart,
  ShieldCheck,
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
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(new Date());
  const [currentUser, setCurrentUser] = useState(null);

  // Raw Data States
  const [customers, setCustomers] = useState([]);
  const [products, setProducts] = useState([]);
  const [sales, setSales] = useState([]);
  const [credits, setCredits] = useState([]);
  const [pendingPayments, setPendingPayments] = useState([]);

  // Metrics State
  const [metrics, setMetrics] = useState({
    customerCount: 0,
    productCount: 0,
    todaySalesAmount: 0,
    todaySalesCount: 0,
    todayAOV: 0,
    totalSalesCount: 0,
    totalSalesAmount: 0,
    pendingCreditAmount: 0,
    pendingCustomersCount: 0,
    pendingPaymentsCount: 0,
    lowStockCount: 0,
    outOfStockCount: 0,
  });

  const loadDashboardData = async (isManualRefresh = false) => {
    try {
      if (isManualRefresh) setRefreshing(true);
      else setLoading(true);

      const user = authStorage.getUser();
      if (user) setCurrentUser(user);

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

      setCustomers(customersList);
      setProducts(productsList);
      setSales(salesList);
      setCredits(creditsList);
      setPendingPayments(pendingPaymentsList);

      // Calculations
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const todaySalesList = salesList.filter((s) => {
        const saleDate = new Date(s.createdAt);
        return saleDate >= today;
      });

      const todaySalesAmount = todaySalesList.reduce(
        (sum, s) => sum + Number(s.totalAmount || 0),
        0
      );
      const totalSalesAmount = salesList.reduce(
        (sum, s) => sum + Number(s.totalAmount || 0),
        0
      );
      const todayAOV =
        todaySalesList.length > 0
          ? Math.round(todaySalesAmount / todaySalesList.length)
          : 0;

      const activeCredits = creditsList.filter(
        (c) => Number(c.pendingAmount || 0) > 0
      );
      const pendingCreditAmount = activeCredits.reduce(
        (sum, c) => sum + Number(c.pendingAmount || 0),
        0
      );

      const uniquePendingCustomers = new Set(
        activeCredits.map((c) =>
          String(c.customerId?._id || c.customerId || c.userId)
        )
      );

      const lowStockItems = productsList.filter((p) => {
        const stock = Number(p.stock || 0);
        return stock > 0 && stock <= 5;
      });

      const outOfStockItems = productsList.filter((p) => {
        const stock = Number(p.stock || 0);
        return stock <= 0 || p.available === false;
      });

      setMetrics({
        customerCount: customersList.length,
        productCount: productsList.length,
        todaySalesAmount,
        todaySalesCount: todaySalesList.length,
        todayAOV,
        totalSalesCount: salesList.length,
        totalSalesAmount,
        pendingCreditAmount,
        pendingCustomersCount: uniquePendingCustomers.size,
        pendingPaymentsCount: pendingPaymentsList.length,
        lowStockCount: lowStockItems.length,
        outOfStockCount: outOfStockItems.length,
      });

      setLastUpdated(new Date());
    } catch (err) {
      console.error("Dashboard data load failed:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, []);

  // 1. Compute Last 7 Days Sales Trend
  const weeklySalesTrend = useMemo(() => {
    const days = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      d.setHours(0, 0, 0, 0);

      const nextDay = new Date(d);
      nextDay.setDate(nextDay.getDate() + 1);

      const daySales = sales.filter((s) => {
        const st = new Date(s.createdAt);
        return st >= d && st < nextDay;
      });

      const dayAmount = daySales.reduce(
        (sum, s) => sum + Number(s.totalAmount || 0),
        0
      );

      days.push({
        date: d,
        dayName: i === 0 ? "Today" : d.toLocaleDateString("en-IN", { weekday: "short" }),
        amount: dayAmount,
        count: daySales.length,
        isToday: i === 0,
      });
    }

    const maxAmount = Math.max(...days.map((d) => d.amount), 1);
    return days.map((d) => ({
      ...d,
      heightPercent: Math.max(Math.round((d.amount / maxAmount) * 100), 8),
    }));
  }, [sales]);

  // 2. Compute Payment Mode Distribution
  const paymentBreakdown = useMemo(() => {
    let cashTotal = 0;
    let upiTotal = 0;
    let creditTotal = 0;

    sales.forEach((s) => {
      const amt = Number(s.totalAmount || 0);
      const type = (s.paymentType || "cash").toLowerCase();
      if (type === "cash") cashTotal += amt;
      else if (type === "upi" || type === "online" || type === "card") upiTotal += amt;
      else if (type === "credit" || type === "udhar") creditTotal += amt;
      else cashTotal += amt;
    });

    const total = cashTotal + upiTotal + creditTotal || 1;
    return {
      cash: { amount: cashTotal, pct: Math.round((cashTotal / total) * 100) },
      upi: { amount: upiTotal, pct: Math.round((upiTotal / total) * 100) },
      credit: { amount: creditTotal, pct: Math.round((creditTotal / total) * 100) },
      total,
    };
  }, [sales]);

  // 3. Compute Top Selling Products
  const topProducts = useMemo(() => {
    const productStats = {};

    sales.forEach((sale) => {
      if (Array.isArray(sale.items)) {
        sale.items.forEach((item) => {
          const name = item.productName || item.name || "Item";
          const qty = Number(item.quantity || item.qty || 1);
          const price = Number(item.price || 0) * qty;

          if (!productStats[name]) {
            productStats[name] = { name, quantity: 0, revenue: 0 };
          }
          productStats[name].quantity += qty;
          productStats[name].revenue += price;
        });
      }
    });

    return Object.values(productStats)
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 4);
  }, [sales]);

  // 4. Compute High-Risk / Priority Khata Recovery Customers
  const priorityKhataCustomers = useMemo(() => {
    const customerDebts = {};

    credits.forEach((credit) => {
      const pending = Number(credit.pendingAmount || 0);
      if (pending > 0 && credit.customerId) {
        const id = credit.customerId._id || credit.customerId;
        const name =
          credit.customerId.name ||
          credit.customerId.userId?.name ||
          "Customer";
        const phone =
          credit.customerId.phone ||
          credit.customerId.userId?.phone ||
          "";

        if (!customerDebts[id]) {
          customerDebts[id] = { id, name, phone, pendingAmount: 0, count: 0 };
        }
        customerDebts[id].pendingAmount += pending;
        customerDebts[id].count += 1;
      }
    });

    return Object.values(customerDebts)
      .sort((a, b) => b.pendingAmount - a.pendingAmount)
      .slice(0, 4);
  }, [credits]);

  // 5. Critical Stock Radar (Out of Stock or Low Stock)
  const criticalStockList = useMemo(() => {
    return products
      .filter((p) => {
        const stock = Number(p.stock || 0);
        return stock <= 5 || p.available === false;
      })
      .sort((a, b) => Number(a.stock || 0) - Number(b.stock || 0))
      .slice(0, 4);
  }, [products]);

  // 6. Recent Sales Feed
  const recentSalesFeed = useMemo(() => {
    return sales.slice(0, 5).map((sale) => {
      const customerName =
        sale.customerId?.name ||
        sale.customerId?.userId?.name ||
        sale.customerId?.userId?.username ||
        "Walk-in Customer";

      const firstItem =
        sale.items && sale.items.length > 0
          ? sale.items[0].productName || "Product"
          : "Sale Items";

      const productDisplay =
        sale.items && sale.items.length > 1
          ? `${firstItem} +${sale.items.length - 1} more`
          : firstItem;

      return {
        id: sale._id,
        customer: customerName,
        product: productDisplay,
        itemsCount: sale.items?.length || 1,
        amount: Number(sale.totalAmount || 0),
        payment:
          sale.paymentType === "cash"
            ? "Cash"
            : sale.paymentType === "credit"
            ? "Credit / Khata"
            : "UPI / Online",
        paymentType: (sale.paymentType || "cash").toLowerCase(),
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
  }, [sales]);

  const greetingHour = new Date().getHours();
  const greeting =
    greetingHour < 12
      ? "Good morning"
      : greetingHour < 17
      ? "Good afternoon"
      : "Good evening";

  const isSuperAdmin =
    String(currentUser?.role || authStorage.getUser()?.role || "")
      .toLowerCase()
      .replace(/[\s_-]/g, "") === "superadmin";

  return (
    <div className="w-full space-y-6 animate-fade-in">
      {/* ========================================================================= */}
      {/* 1. EXECUTIVE COMMAND HEADER & QUICK ACTIONS BAR                           */}
      {/* ========================================================================= */}
      <div className="relative overflow-hidden rounded-2xl sm:rounded-3xl border border-white/10 bg-gradient-to-br from-zinc-900/95 via-zinc-900/80 to-zinc-950 p-5 sm:p-7 shadow-2xl backdrop-blur-xl">
        {/* Dynamic Background Glow Mesh */}
        <div className="pointer-events-none absolute -right-16 -top-20 h-72 w-72 rounded-full bg-[var(--app-accent-soft)] blur-3xl opacity-75" />
        <div className="pointer-events-none absolute left-1/3 -bottom-20 h-56 w-56 rounded-full bg-emerald-500/10 blur-3xl opacity-60" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5">
          {/* Left: Store Status & Executive Greeting */}
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2 mb-2.5">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-950/60 px-3 py-1 text-[11px] font-bold text-emerald-400 shadow-sm backdrop-blur-md">
                <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_8px_#34d399]" />
                <span>Store POS Online & Active</span>
              </span>

              {isSuperAdmin && (
                <span className="inline-flex items-center gap-1 rounded-full border border-purple-500/30 bg-purple-950/60 px-2.5 py-0.5 text-[11px] font-bold text-purple-300">
                  <ShieldCheck className="h-3 w-3 text-purple-400" />
                  <span>Super Administrator</span>
                </span>
              )}

              <span className="hidden sm:inline-flex items-center gap-1 rounded-full border border-white/10 bg-white/5 px-2.5 py-0.5 text-[11px] font-medium text-zinc-400">
                <Clock className="h-3 w-3 text-zinc-500" />
                <span>{lastUpdated.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight text-white font-display">
              {greeting}, {currentUser?.name || currentUser?.username || "Store Admin"}! 👋
            </h1>

            <p className="mt-1.5 text-xs sm:text-sm text-zinc-400 max-w-2xl leading-relaxed">
              Real-time store control center. Monitor today's live revenue, track customer khata udhar balances, and manage inventory operations.
            </p>
          </div>

          {/* Right: Quick Action Command Deck */}
          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <button
              type="button"
              onClick={() => loadDashboardData(true)}
              disabled={refreshing}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-zinc-900/80 px-3.5 py-2.5 text-xs font-semibold text-zinc-300 hover:text-white hover:bg-zinc-800 transition active:scale-95 shadow-sm"
              title="Refresh Dashboard Data"
            >
              <RefreshCw className={`h-4 w-4 text-[var(--app-accent)] ${refreshing ? "animate-spin" : ""}`} />
              <span className="hidden sm:inline">{refreshing ? "Syncing..." : "Sync Data"}</span>
            </button>

            {isSuperAdmin && (
              <Link
                to="/admins"
                className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-purple-500/30 bg-purple-500/10 px-3.5 py-2.5 text-xs sm:text-sm font-semibold text-purple-300 hover:bg-purple-500/20 hover:border-purple-500/50 transition active:scale-95 shadow-sm"
              >
                <ShieldCheck className="h-4 w-4 text-purple-400" />
                <span>Admin Accounts</span>
              </Link>
            )}

            <Link
              to="/credits"
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-2.5 text-xs sm:text-sm font-semibold text-rose-300 hover:bg-rose-500/20 hover:border-rose-500/50 transition active:scale-95 shadow-sm"
            >
              <CreditCard className="h-4 w-4 text-rose-400" />
              <span>Khata Ledger</span>
            </Link>

            <Link
              to="/sales"
              className="inline-flex items-center justify-center gap-2 rounded-xl btn-primary px-5 py-2.5 text-xs sm:text-sm font-bold shadow-lg active:scale-95 transition"
            >
              <ShoppingCart className="h-4 w-4" />
              <span>New POS Bill (F2)</span>
            </Link>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. CORE KPI CARDS (4 Executive Pillars)                                   */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {/* Metric 1: Today's Revenue */}
        <Link
          to="/sales"
          className="group relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-zinc-900/90 to-zinc-950/90 p-5 shadow-lg transition-all duration-300 hover:-translate-y-1 hover:border-emerald-500/40 hover:shadow-emerald-950/30 hover:shadow-xl"
        >
          <div className="flex items-start justify-between">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-emerald-400">
                Today's Live Revenue
              </p>
              <p className="mt-1.5 text-2xl sm:text-3xl font-extrabold text-white font-display tracking-tight">
                {loading ? (
                  <span className="inline-block h-8 w-28 animate-pulse rounded bg-zinc-800" />
                ) : (
                  `₹${metrics.todaySalesAmount.toLocaleString("en-IN")}`
                )}
              </p>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-emerald-500/30 bg-emerald-500/10 text-emerald-400 shadow-inner group-hover:scale-110 transition-transform">
              <IndianRupee className="h-6 w-6" />
            </div>
          </div>

          <div className="mt-4 flex items-center justify-between pt-3 border-t border-white/5 text-xs text-zinc-400">
            <span className="font-semibold text-emerald-400">
              {metrics.todaySalesCount} {metrics.todaySalesCount === 1 ? "bill" : "bills"} created
            </span>
            <span>Avg: ₹{metrics.todayAOV.toLocaleString("en-IN")}</span>
          </div>
        </Link>

        {/* Metric 2: Pending Khata / Udhar Risk */}
        <Link
          to="/credits"
          className="group relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-zinc-900/90 to-zinc-950/90 p-5 shadow-lg transition-all duration-300 hover:-translate-y-1 hover:border-rose-500/40 hover:shadow-rose-950/30 hover:shadow-xl"
        >
          <div className="flex items-start justify-between">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-rose-400">
                Khata Pending Udhar
              </p>
              <p className="mt-1.5 text-2xl sm:text-3xl font-extrabold text-white font-display tracking-tight">
                {loading ? (
                  <span className="inline-block h-8 w-28 animate-pulse rounded bg-zinc-800" />
                ) : (
                  `₹${metrics.pendingCreditAmount.toLocaleString("en-IN")}`
                )}
              </p>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-rose-500/30 bg-rose-500/10 text-rose-400 shadow-inner group-hover:scale-110 transition-transform">
              <CreditCard className="h-6 w-6" />
            </div>
          </div>

          <div className="mt-4 flex items-center justify-between pt-3 border-t border-white/5 text-xs text-zinc-400">
            <span className="font-semibold text-rose-400">
              {metrics.pendingCustomersCount} {metrics.pendingCustomersCount === 1 ? "customer" : "customers"} with due
            </span>
            <span className="text-zinc-500">Recovery Queue</span>
          </div>
        </Link>

        {/* Metric 3: Active Customers & CRM */}
        <Link
          to="/customers"
          className="group relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-zinc-900/90 to-zinc-950/90 p-5 shadow-lg transition-all duration-300 hover:-translate-y-1 hover:border-blue-500/40 hover:shadow-blue-950/30 hover:shadow-xl"
        >
          <div className="flex items-start justify-between">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-blue-400">
                Customer Network
              </p>
              <p className="mt-1.5 text-2xl sm:text-3xl font-extrabold text-white font-display tracking-tight">
                {loading ? (
                  <span className="inline-block h-8 w-20 animate-pulse rounded bg-zinc-800" />
                ) : (
                  metrics.customerCount
                )}
              </p>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-blue-500/30 bg-blue-500/10 text-blue-400 shadow-inner group-hover:scale-110 transition-transform">
              <Users className="h-6 w-6" />
            </div>
          </div>

          <div className="mt-4 flex items-center justify-between pt-3 border-t border-white/5 text-xs text-zinc-400">
            <span className="font-semibold text-blue-400">
              {metrics.totalSalesCount} lifetime orders
            </span>
            <span className="text-zinc-500">CRM Directory</span>
          </div>
        </Link>

        {/* Metric 4: Inventory & Stock Status */}
        <Link
          to="/products"
          className="group relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-zinc-900/90 to-zinc-950/90 p-5 shadow-lg transition-all duration-300 hover:-translate-y-1 hover:border-amber-500/40 hover:shadow-amber-950/30 hover:shadow-xl"
        >
          <div className="flex items-start justify-between">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-amber-400">
                In-Store Inventory
              </p>
              <p className="mt-1.5 text-2xl sm:text-3xl font-extrabold text-white font-display tracking-tight">
                {loading ? (
                  <span className="inline-block h-8 w-20 animate-pulse rounded bg-zinc-800" />
                ) : (
                  metrics.productCount
                )}
              </p>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-amber-500/30 bg-amber-500/10 text-amber-400 shadow-inner group-hover:scale-110 transition-transform">
              <Package className="h-6 w-6" />
            </div>
          </div>

          <div className="mt-4 flex items-center justify-between pt-3 border-t border-white/5 text-xs text-zinc-400">
            {metrics.lowStockCount + metrics.outOfStockCount > 0 ? (
              <span className="font-semibold text-amber-400 flex items-center gap-1">
                <AlertTriangle className="h-3 w-3" />
                {metrics.lowStockCount + metrics.outOfStockCount} items need restock
              </span>
            ) : (
              <span className="font-semibold text-emerald-400 flex items-center gap-1">
                <CheckCircle2 className="h-3 w-3" />
                Healthy Stock Levels
              </span>
            )}
            <span className="text-zinc-500">Active SKUs</span>
          </div>
        </Link>
      </div>

      {/* ========================================================================= */}
      {/* 3. VISUAL ANALYTICS: 7-Day Trend Chart & Payment Mode Breakdown           */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* 7-Day Sales Volume Chart (2 Cols on lg) */}
        <div className="rounded-2xl border border-white/10 bg-zinc-900/60 p-5 sm:p-6 shadow-xl backdrop-blur-md lg:col-span-2 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-4 mb-4 border-b border-white/5">
              <div className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[var(--app-accent-soft)] text-[var(--app-accent)] border border-[var(--app-accent-border)]">
                  <BarChart3 className="h-4.5 w-4.5" />
                </div>
                <div>
                  <h2 className="text-base sm:text-lg font-bold text-white font-display">
                    7-Day Revenue Velocity
                  </h2>
                  <p className="text-xs text-zinc-400">Daily retail sales distribution</p>
                </div>
              </div>

              <span className="text-xs font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 rounded-lg px-2.5 py-1">
                ₹{metrics.todaySalesAmount.toLocaleString("en-IN")} Today
              </span>
            </div>

            {/* Visual Bar Chart */}
            <div className="mt-6 pt-4 pb-2">
              <div className="grid grid-cols-7 gap-2 sm:gap-4 items-end h-44 sm:h-48 border-b border-zinc-800 pb-2">
                {weeklySalesTrend.map((day, idx) => (
                  <div key={idx} className="flex flex-col items-center gap-2 h-full justify-end group">
                    {/* Value Tooltip on hover */}
                    <span className="text-[10px] sm:text-xs font-bold text-zinc-400 group-hover:text-white transition-colors opacity-80 group-hover:opacity-100">
                      {day.amount > 0 ? `₹${day.amount >= 1000 ? `${(day.amount / 1000).toFixed(1)}k` : day.amount}` : "₹0"}
                    </span>

                    {/* Animated Bar */}
                    <div className="w-full max-w-[38px] bg-zinc-800/80 rounded-t-xl overflow-hidden flex items-end h-full">
                      <div
                        style={{ height: `${day.heightPercent}%` }}
                        className={`w-full rounded-t-xl transition-all duration-500 ${
                          day.isToday
                            ? "bg-gradient-to-t from-[var(--app-accent)] to-orange-400 shadow-[0_0_15px_var(--app-accent-soft)]"
                            : day.amount > 0
                            ? "bg-gradient-to-t from-emerald-600 to-emerald-400 group-hover:from-emerald-500 group-hover:to-teal-300"
                            : "bg-zinc-800"
                        }`}
                      />
                    </div>

                    {/* Day label */}
                    <span
                      className={`text-[11px] sm:text-xs font-semibold ${
                        day.isToday ? "text-[var(--app-accent)] font-bold" : "text-zinc-400"
                      }`}
                    >
                      {day.dayName}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-xs text-zinc-400 pt-3 border-t border-white/5">
            <span className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-[var(--app-accent)]" />
              <span>Today Active Sales</span>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-emerald-400" />
              <span>Past Daily Revenue</span>
            </span>
            <Link to="/sales" className="font-semibold text-[var(--app-accent)] hover:underline inline-flex items-center gap-1">
              <span>View POS Ledgers</span>
              <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
        </div>

        {/* Payment Split & Mode Distribution (1 Col on lg) */}
        <div className="rounded-2xl border border-white/10 bg-zinc-900/60 p-5 sm:p-6 shadow-xl backdrop-blur-md flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2.5 pb-4 mb-4 border-b border-white/5">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20">
                <PieChart className="h-4.5 w-4.5" />
              </div>
              <div>
                <h2 className="text-base sm:text-lg font-bold text-white font-display">
                  Payment Channels
                </h2>
                <p className="text-xs text-zinc-400">Revenue mode breakdown</p>
              </div>
            </div>

            {/* Segment Progress Bar */}
            <div className="my-4">
              <div className="h-3 w-full rounded-full bg-zinc-800 overflow-hidden flex shadow-inner">
                <div
                  style={{ width: `${paymentBreakdown.cash.pct}%` }}
                  className="bg-emerald-500 transition-all duration-500"
                  title={`Cash: ${paymentBreakdown.cash.pct}%`}
                />
                <div
                  style={{ width: `${paymentBreakdown.upi.pct}%` }}
                  className="bg-blue-500 transition-all duration-500"
                  title={`UPI / Online: ${paymentBreakdown.upi.pct}%`}
                />
                <div
                  style={{ width: `${paymentBreakdown.credit.pct}%` }}
                  className="bg-rose-500 transition-all duration-500"
                  title={`Credit (Udhar): ${paymentBreakdown.credit.pct}%`}
                />
              </div>
            </div>

            {/* Individual Channels List */}
            <div className="space-y-3 mt-5">
              {/* Cash */}
              <div className="flex items-center justify-between p-3 rounded-xl bg-zinc-950/60 border border-white/5">
                <div className="flex items-center gap-2.5">
                  <span className="h-3 w-3 rounded-full bg-emerald-500" />
                  <div>
                    <p className="text-xs font-bold text-white">Cash In Hand</p>
                    <p className="text-[10px] text-zinc-400">{paymentBreakdown.cash.pct}% of revenue</p>
                  </div>
                </div>
                <span className="text-xs font-bold text-emerald-400">
                  ₹{paymentBreakdown.cash.amount.toLocaleString("en-IN")}
                </span>
              </div>

              {/* UPI */}
              <div className="flex items-center justify-between p-3 rounded-xl bg-zinc-950/60 border border-white/5">
                <div className="flex items-center gap-2.5">
                  <span className="h-3 w-3 rounded-full bg-blue-500" />
                  <div>
                    <p className="text-xs font-bold text-white">UPI / Digital</p>
                    <p className="text-[10px] text-zinc-400">{paymentBreakdown.upi.pct}% of revenue</p>
                  </div>
                </div>
                <span className="text-xs font-bold text-blue-400">
                  ₹{paymentBreakdown.upi.amount.toLocaleString("en-IN")}
                </span>
              </div>

              {/* Credit / Udhar */}
              <div className="flex items-center justify-between p-3 rounded-xl bg-zinc-950/60 border border-white/5">
                <div className="flex items-center gap-2.5">
                  <span className="h-3 w-3 rounded-full bg-rose-500" />
                  <div>
                    <p className="text-xs font-bold text-white">Khata (Udhar)</p>
                    <p className="text-[10px] text-zinc-400">{paymentBreakdown.credit.pct}% of revenue</p>
                  </div>
                </div>
                <span className="text-xs font-bold text-rose-400">
                  ₹{paymentBreakdown.credit.amount.toLocaleString("en-IN")}
                </span>
              </div>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-white/5 text-center">
            <Link
              to="/payments"
              className="text-xs font-semibold text-[var(--app-accent)] hover:underline inline-flex items-center gap-1"
            >
              <span>Manage Payment Settlements</span>
              <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 4. TRIO OPERATIONS RADAR: Low Stock, Khata Recovery, Top Selling Items   */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        {/* Radar 1: Low Stock Alert Radar */}
        <div className="rounded-2xl border border-white/10 bg-zinc-900/60 p-5 sm:p-6 shadow-xl backdrop-blur-md flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3.5 mb-3.5 border-b border-white/5">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20">
                  <AlertTriangle className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">Stock Alert Radar</h3>
                  <p className="text-[11px] text-zinc-400">Critical & low inventory</p>
                </div>
              </div>
              <Link to="/products" className="text-[11px] font-bold text-amber-400 hover:underline">
                View All
              </Link>
            </div>

            {criticalStockList.length === 0 ? (
              <div className="py-8 text-center">
                <CheckCircle2 className="h-8 w-8 text-emerald-400 mx-auto mb-2" />
                <p className="text-xs font-semibold text-zinc-300">All products in healthy stock</p>
                <p className="text-[10px] text-zinc-500 mt-0.5">No immediate restock required</p>
              </div>
            ) : (
              <div className="space-y-2.5">
                {criticalStockList.map((item) => {
                  const stock = Number(item.stock || 0);
                  const isOut = stock <= 0 || item.available === false;
                  return (
                    <div
                      key={item._id}
                      className="flex items-center justify-between p-2.5 rounded-xl bg-zinc-950/60 border border-white/5 hover:border-white/10 transition"
                    >
                      <div className="min-w-0 pr-2">
                        <p className="text-xs font-bold text-white truncate">{item.name}</p>
                        <p className="text-[10px] text-zinc-400 truncate">₹{item.price} · {item.category || "General"}</p>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <span
                          className={`rounded-full px-2 py-0.5 text-[9px] font-bold ${
                            isOut
                              ? "bg-red-500/15 text-red-400 border border-red-500/30"
                              : "bg-amber-500/15 text-amber-400 border border-amber-500/30"
                          }`}
                        >
                          {isOut ? "Out of Stock" : `${stock} left`}
                        </span>

                        <Link
                          to={`/products/edit/${item._id}`}
                          className="rounded-lg bg-zinc-800 p-1.5 text-zinc-400 hover:text-white hover:bg-zinc-700 transition"
                          title="Edit / Restock item"
                        >
                          <ArrowUpRight className="h-3 w-3" />
                        </Link>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="mt-4 pt-3 border-t border-white/5">
            <Link
              to="/products/add"
              className="w-full inline-flex items-center justify-center gap-1.5 rounded-xl border border-zinc-700 bg-zinc-800/80 px-3 py-2 text-xs font-semibold text-zinc-200 hover:text-white hover:bg-zinc-700 transition"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Add Stock Item</span>
            </Link>
          </div>
        </div>

        {/* Radar 2: Khata Priority Recovery Watchlist */}
        <div className="rounded-2xl border border-white/10 bg-zinc-900/60 p-5 sm:p-6 shadow-xl backdrop-blur-md flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3.5 mb-3.5 border-b border-white/5">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-rose-500/10 text-rose-400 border border-rose-500/20">
                  <CreditCard className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">Khata Recovery List</h3>
                  <p className="text-[11px] text-zinc-400">High priority pending balances</p>
                </div>
              </div>
              <Link to="/credits" className="text-[11px] font-bold text-rose-400 hover:underline">
                View All
              </Link>
            </div>

            {priorityKhataCustomers.length === 0 ? (
              <div className="py-8 text-center">
                <CheckCircle2 className="h-8 w-8 text-emerald-400 mx-auto mb-2" />
                <p className="text-xs font-semibold text-zinc-300">No overdue credit accounts</p>
                <p className="text-[10px] text-zinc-500 mt-0.5">All customer balances are clear</p>
              </div>
            ) : (
              <div className="space-y-2.5">
                {priorityKhataCustomers.map((cust) => (
                  <Link
                    key={cust.id}
                    to={`/customers/${cust.id}`}
                    className="flex items-center justify-between p-2.5 rounded-xl bg-zinc-950/60 border border-white/5 hover:border-rose-500/30 hover:bg-zinc-900/80 transition group"
                  >
                    <div className="flex items-center gap-2.5 min-w-0 pr-2">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-rose-500/10 border border-rose-500/20 text-xs font-bold text-rose-400">
                        {cust.name.charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-white group-hover:text-rose-300 transition truncate">
                          {cust.name}
                        </p>
                        <p className="text-[10px] text-zinc-400 truncate">{cust.phone || "No phone listed"}</p>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <p className="text-xs font-extrabold text-rose-400">
                        ₹{cust.pendingAmount.toLocaleString("en-IN")}
                      </p>
                      <span className="text-[9px] text-zinc-500">{cust.count} {cust.count === 1 ? "bill" : "bills"}</span>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>

          <div className="mt-4 pt-3 border-t border-white/5">
            <Link
              to="/credits"
              className="w-full inline-flex items-center justify-center gap-1.5 rounded-xl border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-xs font-semibold text-rose-300 hover:bg-rose-500/20 transition"
            >
              <span>Review Credit Due Dates</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>

        {/* Radar 3: Top Selling Products */}
        <div className="rounded-2xl border border-white/10 bg-zinc-900/60 p-5 sm:p-6 shadow-xl backdrop-blur-md flex flex-col justify-between md:col-span-2 lg:col-span-1">
          <div>
            <div className="flex items-center justify-between pb-3.5 mb-3.5 border-b border-white/5">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-orange-500/10 text-orange-400 border border-orange-500/20">
                  <Flame className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">Top Sales Spotlight</h3>
                  <p className="text-[11px] text-zinc-400">Best performing store items</p>
                </div>
              </div>
              <Link to="/products" className="text-[11px] font-bold text-[var(--app-accent)] hover:underline">
                Catalog
              </Link>
            </div>

            {topProducts.length === 0 ? (
              <div className="py-8 text-center">
                <Package className="h-8 w-8 text-zinc-600 mx-auto mb-2" />
                <p className="text-xs font-semibold text-zinc-400">No items sold yet</p>
                <p className="text-[10px] text-zinc-500 mt-0.5">Sales data will populate here</p>
              </div>
            ) : (
              <div className="space-y-2.5">
                {topProducts.map((prod, idx) => (
                  <div
                    key={prod.name}
                    className="flex items-center justify-between p-2.5 rounded-xl bg-zinc-950/60 border border-white/5 hover:border-white/10 transition"
                  >
                    <div className="flex items-center gap-2.5 min-w-0 pr-2">
                      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-zinc-800 text-[10px] font-bold text-zinc-300">
                        #{idx + 1}
                      </span>
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-white truncate">{prod.name}</p>
                        <p className="text-[10px] text-zinc-400">{prod.quantity} units sold</p>
                      </div>
                    </div>

                    <span className="text-xs font-extrabold text-white shrink-0">
                      ₹{prod.revenue.toLocaleString("en-IN")}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="mt-4 pt-3 border-t border-white/5">
            <Link
              to="/categories"
              className="w-full inline-flex items-center justify-center gap-1.5 rounded-xl border border-zinc-700 bg-zinc-800/80 px-3 py-2 text-xs font-semibold text-zinc-200 hover:text-white hover:bg-zinc-700 transition"
            >
              <Layers className="h-3.5 w-3.5" />
              <span>Explore Categories</span>
            </Link>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 5. LIVE RECENT TRANSACTIONS FEED & QUICK POS SHORTCUTS                    */}
      {/* ========================================================================= */}
      <div className="rounded-2xl border border-white/10 bg-zinc-900/60 p-5 sm:p-7 shadow-xl backdrop-blur-md">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-4 mb-4 border-b border-white/5">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <Activity className="h-4.5 w-4.5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-white font-display">
                Live Retail Transactions Feed
              </h2>
              <p className="text-xs text-zinc-400">Real-time receipts and POS sales generated in store</p>
            </div>
          </div>

          <Link
            to="/sales"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-[var(--app-accent)] hover:underline self-start sm:self-auto"
          >
            <span>Open POS Terminal</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        {loading ? (
          <div className="py-12 text-center text-zinc-500">
            <RefreshCw className="mx-auto mb-2.5 h-7 w-7 animate-spin text-[var(--app-accent)]" />
            <p className="text-xs font-semibold">Synchronizing recent receipts...</p>
          </div>
        ) : recentSalesFeed.length === 0 ? (
          <div className="py-12 text-center">
            <ShoppingCart className="mx-auto mb-2 h-9 w-9 text-zinc-600" />
            <p className="text-sm font-semibold text-zinc-300">No transactions recorded yet</p>
            <p className="text-xs text-zinc-500 mt-1">Start by generating your first sale invoice</p>
            <Link
              to="/sales"
              className="mt-4 inline-flex items-center gap-1.5 rounded-xl btn-primary px-5 py-2.5 text-xs font-bold shadow-lg"
            >
              <ShoppingCart className="h-3.5 w-3.5" />
              <span>Create First POS Bill</span>
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {recentSalesFeed.map((sale) => (
              <div
                key={sale.id}
                className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 sm:p-4 rounded-xl border border-white/5 bg-zinc-950/70 hover:border-white/15 hover:bg-zinc-900/70 transition-all duration-200"
              >
                {/* Left: Customer & Items */}
                <div className="flex items-center gap-3.5 min-w-0">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-zinc-900 border border-white/10 font-bold text-white text-sm shadow-inner">
                    {sale.customer.charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-xs sm:text-sm font-bold text-white truncate">
                        {sale.customer}
                      </p>
                      <span className="hidden sm:inline-block rounded bg-zinc-800 px-1.5 py-0.2 text-[9px] font-semibold text-zinc-400">
                        {sale.itemsCount} {sale.itemsCount === 1 ? "item" : "items"}
                      </span>
                    </div>
                    <p className="text-[11px] text-zinc-400 truncate mt-0.5">
                      {sale.product}
                    </p>
                  </div>
                </div>

                {/* Right: Payment badge, Amount, Time */}
                <div className="flex items-center justify-between sm:justify-end gap-3.5 shrink-0 pt-2 sm:pt-0 border-t sm:border-0 border-zinc-800">
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

                  <span className="text-sm sm:text-base font-extrabold text-white font-display">
                    ₹{sale.amount.toLocaleString("en-IN")}
                  </span>

                  <span className="text-[11px] text-zinc-500 min-w-[50px] text-right">
                    {sale.time}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;