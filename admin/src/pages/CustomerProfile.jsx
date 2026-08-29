import React, { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  User,
  Mail,
  Phone,
  ShieldCheck,
  ShoppingBag,
  Wallet,
  CreditCard,
  Calendar,
  CheckCircle2,
  XCircle,
  Clock,
  AlertCircle,
  Receipt,
  RotateCcw,
  Hash,
  Power,
  Trash2,
  RefreshCw,
  Search,
} from "lucide-react";

import { customersApi } from "../services/api";

const money = (value) => {
  const amount = Number(value || 0);
  return `₹${amount.toLocaleString("en-IN", {
    maximumFractionDigits: 2,
  })}`;
};

const formatDate = (value) => {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const formatDateTime = (value) => {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const getNumber = (...values) => {
  for (const value of values) {
    if (
      value !== undefined &&
      value !== null &&
      value !== "" &&
      !Number.isNaN(Number(value))
    ) {
      return Number(value);
    }
  }
  return 0;
};

const getId = (value) => {
  if (!value) return "";
  if (typeof value === "string") return value;
  return String(
    value._id || value.id || value.userId || value.customerId || ""
  );
};

const getErrorMessage = (error, fallback) => {
  return (
    error?.response?.data?.message ||
    error?.response?.data?.error ||
    error?.message ||
    fallback
  );
};

const CustomerProfile = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [customerData, setCustomerData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState("");

  const [historyType, setHistoryType] = useState("All");
  const [historySearch, setHistorySearch] = useState("");

  const loadCustomer = async (refresh = false) => {
    if (!id) {
      setError("Customer ID is missing.");
      setLoading(false);
      return;
    }

    try {
      if (refresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      setError("");

      const response = await customersApi.getById(id);
      const data =
        response?.customer ||
        response?.data?.customer ||
        response?.data ||
        response;

      if (!data || typeof data !== "object") {
        throw new Error("Customer profile not found.");
      }

      setCustomerData(data);
    } catch (err) {
      console.error("Load customer profile error:", err);
      setError(getErrorMessage(err, "Failed to load customer profile."));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadCustomer();
  }, [id]);

  const user = customerData?.profile || customerData?.user || customerData || {};
  const summary = customerData?.summary || customerData?.profile || {};
  const records = customerData?.records || {};

  const sales = Array.isArray(records?.sales)
    ? records.sales
    : Array.isArray(customerData?.sales)
    ? customerData.sales
    : [];

  const credits = Array.isArray(records?.credits)
    ? records.credits
    : Array.isArray(customerData?.credits)
    ? customerData.credits
    : [];

  const payments = Array.isArray(records?.payments)
    ? records.payments
    : Array.isArray(customerData?.payments)
    ? customerData.payments
    : [];

  const returns = Array.isArray(records?.returns)
    ? records.returns
    : Array.isArray(customerData?.returns)
    ? customerData.returns
    : [];

  const customerId = user?._id || summary?.customerId || id;
  const customerName = user?.name || user?.username || "Customer";
  const username = user?.username || "";
  const email = user?.email || "Not available";
  const phone = user?.phone || "Not available";
  const role = user?.role || "customer";
  const isActive = user?.isActive !== false;
  const status = isActive ? "Active" : "Inactive";

  const joinedDate = user?.createdAt;
  const updatedDate = user?.updatedAt;

  const totalPurchase = getNumber(
    summary?.totalPurchase,
    summary?.totalSaleAmount,
    user?.totalPurchase
  );
  const pendingAmount = getNumber(
    summary?.pendingAmount,
    summary?.totalCreditPending,
    user?.pendingAmount
  );
  const creditLimit = getNumber(
    summary?.manualBorrowLimit,
    summary?.maxBorrowAmount
  );

  const trustScore = Math.min(100, Math.max(0, getNumber(summary?.trustScore)));
  const trustLabel =
    trustScore >= 80
      ? "Excellent"
      : trustScore >= 60
      ? "Good"
      : trustScore >= 40
      ? "Average"
      : "Low";

  const totalSalesAmount = useMemo(() => {
    return sales.reduce(
      (sum, sale) => sum + getNumber(sale?.totalAmount, sale?.amount),
      0
    );
  }, [sales]);

  const totalBorrowed = useMemo(() => {
    return credits.reduce(
      (sum, credit) =>
        sum + getNumber(credit?.borrowedAmount, credit?.creditAmount),
      0
    );
  }, [credits]);

  const totalPaid = useMemo(() => {
    return credits.reduce(
      (sum, credit) => sum + getNumber(credit?.paidAmount, credit?.paid),
      0
    );
  }, [credits]);

  const totalPending = useMemo(() => {
    return credits.reduce(
      (sum, credit) => sum + getNumber(credit?.pendingAmount, credit?.pending),
      0
    );
  }, [credits]);

  const totalReturns = useMemo(() => {
    return returns.reduce(
      (sum, item) => sum + getNumber(item?.returnAmount, item?.totalAmount),
      0
    );
  }, [returns]);

  // Aggregate combined timeline from sales, credits, payments and return records
  const history = useMemo(() => {
    const saleHistory = sales.map((sale, index) => {
      const itemsList = Array.isArray(sale?.items) ? sale.items : [];
      const itemNames = itemsList
        .map((it) => `${it.productName || "Item"}${it.quantity ? ` x${it.quantity}` : ""}`)
        .join(", ");

      return {
        id: getId(sale) || `sale-${index}`,
        type: "Sale",
        title: itemNames || `Sale #${index + 1}`,
        rawId: sale?._id,
        amount: getNumber(sale?.totalAmount, sale?.amount),
        paidAmount: getNumber(sale?.paidAmount),
        pendingAmount: getNumber(sale?.pendingAmount),
        date: sale?.createdAt,
        status: sale?.status === "completed" ? "Completed" : sale?.status || "Completed",
        paymentType: (sale?.paymentType || "cash").toUpperCase(),
        items: itemsList,
      };
    });

    const creditHistory = credits.map((credit, index) => ({
      id: getId(credit) || `credit-${index}`,
      type: "Credit",
      title: `Credit Line (${money(credit?.borrowedAmount)})`,
      amount: getNumber(credit?.borrowedAmount, credit?.creditAmount),
      borrowed: getNumber(credit?.borrowedAmount, credit?.creditAmount),
      paid: getNumber(credit?.paidAmount),
      pending: getNumber(credit?.pendingAmount),
      dueDate: credit?.dueDate,
      date: credit?.borrowDate || credit?.createdAt,
      status: credit?.status === "paid" ? "Paid" : credit?.status === "overdue" ? "Overdue" : "Active",
    }));

    const paymentHistory = payments.map((payment, index) => ({
      id: getId(payment) || `payment-${index}`,
      type: "Payment",
      title: payment?.note || `Payment via ${(payment?.paymentMethod || "cash").toUpperCase()}`,
      amount: getNumber(payment?.amount, payment?.paidAmount),
      date: payment?.paidAt || payment?.createdAt,
      status: payment?.status === "approved" ? "Approved" : payment?.status === "rejected" ? "Rejected" : "Pending",
      method: (payment?.paymentMethod || "cash").toUpperCase(),
      transactionId: payment?.transactionId || payment?.razorpayPaymentId,
    }));

    const returnHistory = returns.map((item, index) => ({
      id: getId(item) || `return-${index}`,
      type: "Return",
      title: item?.reason || `Product Return`,
      amount: getNumber(item?.returnAmount, item?.totalAmount),
      date: item?.returnedAt || item?.createdAt,
      status: item?.refundStatus === "completed" ? "Completed" : "Returned",
      refundMethod: (item?.refundMethod || "cash").toUpperCase(),
      items: item?.items || [],
    }));

    return [
      ...saleHistory,
      ...creditHistory,
      ...paymentHistory,
      ...returnHistory,
    ].sort((a, b) => {
      const first = new Date(a.date || 0).getTime();
      const second = new Date(b.date || 0).getTime();
      return second - first;
    });
  }, [sales, credits, payments, returns]);

  const filteredHistory = useMemo(() => {
    const query = historySearch.trim().toLowerCase();

    return history.filter((item) => {
      const typeMatch = historyType === "All" || item.type === historyType;
      const searchMatch =
        !query ||
        String(item.type).toLowerCase().includes(query) ||
        String(item.title || "").toLowerCase().includes(query) ||
        String(item.status || "").toLowerCase().includes(query) ||
        String(item.paymentType || "").toLowerCase().includes(query) ||
        String(item.method || "").toLowerCase().includes(query);

      return typeMatch && searchMatch;
    });
  }, [history, historyType, historySearch]);

  const initials =
    customerName
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((word) => word.charAt(0).toUpperCase())
      .join("") || "C";

  const handleToggleStatus = async () => {
    if (!customerId || actionLoading) return;

    const nextStatus = !isActive;
    const confirmed = window.confirm(
      nextStatus ? `Activate ${customerName}?` : `Deactivate ${customerName}?`
    );

    if (!confirmed) return;

    try {
      setActionLoading(true);
      setError("");

      await customersApi.updateStatus(customerId, nextStatus);
      await loadCustomer(true);
    } catch (err) {
      console.error("Update customer status error:", err);
      setError(getErrorMessage(err, "Failed to update customer status."));
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!customerId || actionLoading) return;

    if (isActive) {
      window.alert("Please deactivate the customer before deleting the account.");
      return;
    }

    const confirmed = window.confirm(
      `Delete ${customerName} permanently?\n\nThis will remove all transaction history and cannot be undone.`
    );

    if (!confirmed) return;

    try {
      setActionLoading(true);
      setError("");

      await customersApi.delete(customerId);
      navigate("/customers");
    } catch (err) {
      console.error("Delete customer error:", err);
      setError(getErrorMessage(err, "Failed to delete customer."));
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen w-full px-4 py-6 sm:px-6 md:px-10 lg:px-12"
      style={{
        backgroundColor: "var(--app-bg)",
        color: "var(--app-text)",
      }}
    >
      <div className="mx-auto max-w-7xl space-y-6">
        {/* Navigation & Actions Topbar */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <Link
            to="/customers"
            className="inline-flex items-center gap-2 rounded-xl border border-zinc-800 bg-zinc-900/60 px-4 py-2 text-sm font-medium text-zinc-300 transition hover:border-[var(--app-accent-border)] hover:bg-[var(--app-accent-soft)] hover:text-white"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Customers
          </Link>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => loadCustomer(true)}
              disabled={refreshing || loading}
              className="inline-flex items-center gap-2 rounded-xl border border-zinc-800 bg-zinc-900/60 px-4 py-2 text-sm font-medium text-zinc-300 transition hover:border-[var(--app-accent-border)] hover:bg-[var(--app-accent-soft)] hover:text-white disabled:opacity-50"
            >
              <RefreshCw
                className={`h-4 w-4 ${refreshing ? "animate-spin text-[var(--app-accent)]" : ""}`}
              />
              {refreshing ? "Refreshing..." : "Refresh"}
            </button>

            <button
              type="button"
              onClick={handleToggleStatus}
              disabled={actionLoading || loading}
              className={`inline-flex items-center gap-2 rounded-xl border px-4 py-2 text-sm font-semibold transition disabled:opacity-50 ${
                isActive
                  ? "border-yellow-500/30 bg-yellow-500/10 text-yellow-400 hover:bg-yellow-500/20"
                  : "border-emerald-500/30 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20"
              }`}
            >
              <Power className="h-4 w-4" />
              {isActive ? "Deactivate Account" : "Activate Account"}
            </button>

            <button
              type="button"
              onClick={handleDelete}
              disabled={actionLoading || loading}
              className="inline-flex items-center gap-2 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-2 text-sm font-semibold text-red-400 transition hover:bg-red-500/20 disabled:opacity-50"
            >
              <Trash2 className="h-4 w-4" />
              Delete
            </button>
          </div>
        </div>

        {error && (
          <div className="flex items-center gap-3 rounded-2xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-300">
            <AlertCircle className="h-5 w-5 shrink-0" />
            <p>{error}</p>
          </div>
        )}

        {loading ? (
          <div className="flex min-h-[400px] flex-col items-center justify-center rounded-3xl border border-zinc-800/80 bg-zinc-900/30 p-12 text-center">
            <RefreshCw className="h-8 w-8 animate-spin text-[var(--app-accent)]" />
            <p className="mt-4 text-sm text-zinc-400">Loading customer profile and history...</p>
          </div>
        ) : (
          <>
            {/* Customer Dossier Overview Card */}
            <div
              className="relative overflow-hidden rounded-3xl border p-6 shadow-2xl sm:p-8"
              style={{
                borderColor: "var(--app-accent-border)",
                background: `radial-gradient(circle at 90% 10%, var(--app-accent-soft), transparent 40%), linear-gradient(135deg, var(--app-surface-light) 0%, var(--app-surface) 100%)`,
              }}
            >
              <div className="relative z-10 flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
                <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
                  <div
                    className="flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl text-2xl font-bold text-white shadow-xl sm:h-24 sm:w-24 sm:text-3xl"
                    style={{ backgroundColor: "var(--app-accent)" }}
                  >
                    {initials}
                  </div>

                  <div>
                    <div className="flex flex-wrap items-center gap-2.5">
                      <h1 className="text-2xl font-bold text-white sm:text-3xl">
                        {customerName}
                      </h1>
                      <span
                        className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold ${
                          isActive
                            ? "border border-emerald-500/30 bg-emerald-500/10 text-emerald-400"
                            : "border border-red-500/30 bg-red-500/10 text-red-400"
                        }`}
                      >
                        {isActive ? <CheckCircle2 className="h-3 w-3" /> : <XCircle className="h-3 w-3" />}
                        {status}
                      </span>
                    </div>

                    {username && (
                      <p className="mt-1 font-mono text-xs text-zinc-400">
                        @{username}
                      </p>
                    )}

                    <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-zinc-300">
                      <div className="flex items-center gap-1.5">
                        <Mail className="h-3.5 w-3.5 text-zinc-500" />
                        <span>{email}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Phone className="h-3.5 w-3.5 text-zinc-500" />
                        <span>{phone}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Calendar className="h-3.5 w-3.5 text-zinc-500" />
                        <span>Joined {formatDate(joinedDate)}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Score & Limits Banner */}
                <div className="flex flex-wrap items-center gap-3">
                  <div className="rounded-2xl border border-zinc-800 bg-zinc-950/80 p-4 text-center">
                    <p className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500">
                      Trust Score
                    </p>
                    <p className="mt-1 text-xl font-bold text-white">
                      {trustScore}
                      <span className="text-xs font-normal text-zinc-500">/100</span>
                    </p>
                    <p className="text-[10px] text-emerald-400">{trustLabel}</p>
                  </div>

                  <div className="rounded-2xl border border-zinc-800 bg-zinc-950/80 p-4 text-center">
                    <p className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500">
                      Credit Limit
                    </p>
                    <p className="mt-1 text-xl font-bold text-white">
                      {money(creditLimit)}
                    </p>
                    <p className="text-[10px] text-zinc-400">Max allowed</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Financial Summary Stat Cards */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div
                className="rounded-2xl border p-5"
                style={{
                  borderColor: "var(--app-border)",
                  backgroundColor: "var(--app-surface)",
                }}
              >
                <div className="flex items-center justify-between">
                  <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
                    Total Purchases
                  </p>
                  <ShoppingBag className="h-4 w-4 text-[var(--app-accent)]" />
                </div>
                <p className="mt-3 text-2xl font-bold text-white">
                  {money(totalSalesAmount || totalPurchase)}
                </p>
                <p className="mt-1 text-xs text-zinc-400">
                  {sales.length} purchase orders recorded
                </p>
              </div>

              <div
                className="rounded-2xl border p-5"
                style={{
                  borderColor: "var(--app-border)",
                  backgroundColor: "var(--app-surface)",
                }}
              >
                <div className="flex items-center justify-between">
                  <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
                    Total Credit Borrowed
                  </p>
                  <CreditCard className="h-4 w-4 text-yellow-400" />
                </div>
                <p className="mt-3 text-2xl font-bold text-white">
                  {money(totalBorrowed)}
                </p>
                <p className="mt-1 text-xs text-zinc-400">
                  {credits.length} credit transactions
                </p>
              </div>

              <div
                className="rounded-2xl border p-5"
                style={{
                  borderColor: "var(--app-border)",
                  backgroundColor: "var(--app-surface)",
                }}
              >
                <div className="flex items-center justify-between">
                  <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
                    Pending Credit Debt
                  </p>
                  <Wallet className="h-4 w-4 text-red-400" />
                </div>
                <p className="mt-3 text-2xl font-bold" style={{ color: "var(--app-accent)" }}>
                  {money(totalPending || pendingAmount)}
                </p>
                <p className="mt-1 text-xs text-red-400">
                  Remaining balance to clear
                </p>
              </div>

              <div
                className="rounded-2xl border p-5"
                style={{
                  borderColor: "var(--app-border)",
                  backgroundColor: "var(--app-surface)",
                }}
              >
                <div className="flex items-center justify-between">
                  <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
                    Cleared Repayments
                  </p>
                  <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                </div>
                <p className="mt-3 text-2xl font-bold text-emerald-400">
                  {money(totalPaid)}
                </p>
                <p className="mt-1 text-xs text-emerald-500">
                  {payments.length} payment records
                </p>
              </div>
            </div>

            {/* Purchasing & Transaction History Section */}
            <div
              className="rounded-3xl border p-6 sm:p-8"
              style={{
                borderColor: "var(--app-border)",
                backgroundColor: "var(--app-surface)",
              }}
            >
              <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className="text-xl font-bold text-white sm:text-2xl">
                    Purchasing & Activity History
                  </h2>
                  <p className="mt-1 text-xs text-zinc-400">
                    Live purchases, items bought, credit lines and repayments by {customerName}.
                  </p>
                </div>

                <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                  {/* History Type Tabs */}
                  <div className="flex flex-wrap gap-1.5">
                    {[
                      { key: "All", label: `All (${history.length})` },
                      { key: "Sale", label: `Purchases (${sales.length})` },
                      { key: "Credit", label: `Credits (${credits.length})` },
                      { key: "Payment", label: `Payments (${payments.length})` },
                      { key: "Return", label: `Returns (${returns.length})` },
                    ].map((tab) => (
                      <button
                        key={tab.key}
                        type="button"
                        onClick={() => setHistoryType(tab.key)}
                        className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                          historyType === tab.key
                            ? "text-white shadow-sm"
                            : "text-zinc-500 hover:text-zinc-300"
                        }`}
                        style={
                          historyType === tab.key
                            ? { backgroundColor: "var(--app-accent)", color: "#fff" }
                            : {}
                        }
                      >
                        {tab.label}
                      </button>
                    ))}
                  </div>

                  <div className="relative">
                    <input
                      type="search"
                      placeholder="Search items or ID..."
                      value={historySearch}
                      onChange={(e) => setHistorySearch(e.target.value)}
                      className="w-full rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-1.5 text-xs text-white outline-none sm:w-48"
                    />
                  </div>
                </div>
              </div>

              {/* Records List / Table */}
              {filteredHistory.length === 0 ? (
                <div className="rounded-2xl border border-zinc-800/80 bg-zinc-950/40 p-12 text-center">
                  <Receipt className="mx-auto h-8 w-8 text-zinc-600" />
                  <p className="mt-3 text-sm text-zinc-400">
                    No {historyType !== "All" ? historyType.toLowerCase() : ""} records found for this customer.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredHistory.map((item) => (
                    <div
                      key={item.id}
                      className="flex flex-col gap-3 rounded-2xl border p-4 transition-all duration-200 hover:bg-white/[0.02] sm:flex-row sm:items-center sm:justify-between"
                      style={{
                        borderColor: "var(--app-border)",
                        backgroundColor: "var(--app-surface-light)",
                      }}
                    >
                      <div className="flex items-start gap-3.5">
                        <div
                          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-sm font-bold ${
                            item.type === "Sale"
                              ? "bg-blue-500/10 text-blue-400 border border-blue-500/20"
                              : item.type === "Credit"
                              ? "bg-yellow-500/10 text-yellow-400 border border-yellow-500/20"
                              : item.type === "Payment"
                              ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                              : "bg-purple-500/10 text-purple-400 border border-purple-500/20"
                          }`}
                        >
                          {item.type === "Sale" ? (
                            <ShoppingBag className="h-4 w-4" />
                          ) : item.type === "Credit" ? (
                            <CreditCard className="h-4 w-4" />
                          ) : item.type === "Payment" ? (
                            <Wallet className="h-4 w-4" />
                          ) : (
                            <RotateCcw className="h-4 w-4" />
                          )}
                        </div>

                        <div>
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="text-sm font-bold text-white">
                              {item.type}
                            </span>
                            <span className="rounded-full bg-zinc-800 px-2 py-0.5 text-[10px] font-medium text-zinc-300">
                              {item.status}
                            </span>
                            {item.paymentType && (
                              <span className="rounded-full border border-zinc-700 px-2 py-0.5 text-[10px] text-zinc-400">
                                {item.paymentType}
                              </span>
                            )}
                            {item.method && (
                              <span className="rounded-full border border-zinc-700 px-2 py-0.5 text-[10px] text-zinc-400">
                                {item.method}
                              </span>
                            )}
                          </div>

                          <p className="mt-1 text-xs text-zinc-300 font-medium">
                            {item.title}
                          </p>

                          {/* Items Breakdown if Sale */}
                          {item.items && item.items.length > 0 && (
                            <div className="mt-2 flex flex-wrap gap-1.5">
                              {item.items.map((prod, idx) => (
                                <span
                                  key={idx}
                                  className="rounded-md border border-zinc-800 bg-zinc-950/80 px-2 py-1 text-[11px] text-zinc-400"
                                >
                                  {prod.productName || "Item"} {prod.quantity ? `(Qty: ${prod.quantity})` : ""} {prod.price ? `- ₹${prod.price}` : ""}
                                </span>
                              ))}
                            </div>
                          )}

                          {item.dueDate && (
                            <p className="mt-1 text-[11px] text-yellow-400/90">
                              Due Date: {formatDate(item.dueDate)}
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center justify-between border-t border-zinc-800/60 pt-2 sm:flex-col sm:items-end sm:border-0 sm:pt-0">
                        <p
                          className="text-base font-bold sm:text-lg"
                          style={{
                            color:
                              item.type === "Payment"
                                ? "#4ade80"
                                : item.type === "Return"
                                ? "#c084fc"
                                : "var(--app-accent)",
                          }}
                        >
                          {money(item.amount)}
                        </p>
                        <p className="text-xs text-zinc-500 font-mono">
                          {formatDateTime(item.date)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default CustomerProfile;