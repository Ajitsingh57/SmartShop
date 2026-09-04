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
  Sliders,
  Sparkles,
  Award,
  AlertTriangle,
  X,
  Bot,
  UserCheck,
  Check,
} from "lucide-react";
import { toast } from "react-toastify";

import { customersApi, creditsApi } from "../services/api";

const money = (value) => {
  const amount = Number(value || 0);
  return `₹${amount.toLocaleString("en-IN", {
    maximumFractionDigits: 2,
  })}`;
};

// Formats a Date object to local YYYY-MM-DD string without timezone drift
const getLocalDateString = (d) => {
  const date = d ? new Date(d) : new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

// Calculates future date by adding N days to a base date
const addDaysToDate = (base, days) => {
  const d = base ? new Date(base) : new Date();
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + Number(days));
  return getLocalDateString(d);
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
  const [recalculatingTrust, setRecalculatingTrust] = useState(false);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});

  const [historyType, setHistoryType] = useState("All");
  const [historySearch, setHistorySearch] = useState("");

  // Edit Manual Limit Modal state
  const [limitModalOpen, setLimitModalOpen] = useState(false);
  const [manualInput, setManualInput] = useState("");
  const [activateOnSave, setActivateOnSave] = useState(true);
  const [savingLimit, setSavingLimit] = useState(false);

  // Extend Due Date Modal state (1-time allowed)
  const [extendModalCredit, setExtendModalCredit] = useState(null);
  const [extendDueDate, setExtendDueDate] = useState("");
  const [extendReason, setExtendReason] = useState("");
  const [extending, setExtending] = useState(false);

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

      const summary = data?.summary || data?.profile || {};
      const manualLimit = getNumber(summary?.manualBorrowLimit);
      setManualInput(manualLimit > 0 ? String(manualLimit) : "");
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

  // Dual limits and Active Mode
  const autoCreditLimit = getNumber(
    summary?.autoCreditLimit,
    summary?.maxBorrowAmount
  );
  const manualBorrowLimit = getNumber(summary?.manualBorrowLimit);

  // Read creditLimitMode directly from summary/customer
  const creditLimitMode =
    summary?.creditLimitMode ||
    customerData?.customer?.creditLimitMode ||
    user?.creditLimitMode ||
    "auto";

  const effectiveLimit =
    creditLimitMode === "manual" ? manualBorrowLimit : autoCreditLimit;

  const trustScore = Math.min(100, Math.max(0, getNumber(summary?.trustScore)));
  const trustTier =
    summary?.trustTier ||
    (trustScore >= 85
      ? "Platinum"
      : trustScore >= 70
      ? "Gold"
      : trustScore >= 50
      ? "Silver"
      : "Bronze");

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

  // Combined timeline from sales, credits, payments and return records
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
        paymentType: sale?.paymentType || "Cash",
        items: itemsList,
        status: sale?.status || "Completed",
      };
    });

    const creditHistory = credits.map((credit, index) => {
      const isPending = getNumber(credit?.pendingAmount) > 0;
      const isOverdue =
        isPending &&
        credit?.dueDate &&
        new Date(credit.dueDate) < new Date();

      return {
        id: getId(credit) || `credit-${index}`,
        type: "Credit",
        title: `Credit Loan #${String(credit._id || index).slice(-6).toUpperCase()}`,
        rawId: credit?._id,
        amount: getNumber(credit?.borrowedAmount, credit?.creditAmount),
        paidAmount: getNumber(credit?.paidAmount),
        pendingAmount: getNumber(credit?.pendingAmount),
        date: credit?.borrowDate || credit?.createdAt,
        dueDate: credit?.dueDate,
        extensionCount: credit?.extensionCount || 0,
        extension: credit?.extension,
        isOverdue,
        status:
          !isPending
            ? "Paid"
            : isOverdue
            ? "Overdue"
            : "Active",
        creditDoc: credit,
      };
    });

    const paymentHistory = payments.map((payment, index) => ({
      id: getId(payment) || `pay-${index}`,
      type: "Payment",
      title: payment.note || `Repayment via ${(payment.paymentMethod || "cash").toUpperCase()}`,
      rawId: payment?._id,
      amount: getNumber(payment?.amount),
      date: payment?.paidAt || payment?.createdAt,
      method: payment?.paymentMethod?.toUpperCase(),
      status: payment?.status === "approved" ? "Approved" : payment?.status || "Approved",
    }));

    const returnHistory = returns.map((ret, index) => ({
      id: getId(ret) || `ret-${index}`,
      type: "Return",
      title: ret.reason || "Product Return",
      rawId: ret?._id,
      amount: getNumber(ret?.returnAmount, ret?.totalAmount),
      date: ret?.returnedAt || ret?.createdAt,
      status: ret?.refundStatus || "Completed",
    }));

    return [...saleHistory, ...creditHistory, ...paymentHistory, ...returnHistory].sort(
      (a, b) => new Date(b.date) - new Date(a.date)
    );
  }, [sales, credits, payments, returns]);

  const filteredHistory = useMemo(() => {
    return history.filter((item) => {
      const typeMatch =
        historyType === "All" ||
        item.type.toLowerCase() === historyType.toLowerCase();

      const query = historySearch.toLowerCase().trim();
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

  // Re-calculate Trust Score on Demand
  const handleRecalculateTrust = async () => {
    if (!customerId || recalculatingTrust) return;

    try {
      setRecalculatingTrust(true);
      setError("");
      setSuccessMsg("");

      const res = await customersApi.recalculateTrust(customerId);
      const msg = res?.message || "Trust score and auto credit limit recalculated!";
      setSuccessMsg(msg);
      toast.success(msg);
      await loadCustomer(true);
    } catch (err) {
      console.error("Recalculate trust error:", err);
      toast.error(getErrorMessage(err, "Failed to recalculate trust score."));
      await loadCustomer(true);
    } finally {
      setRecalculatingTrust(false);
    }
  };

  // Instant 1-Click Limit Mode Switch (Auto vs Manual) with 0ms Optimistic UI
  const handleQuickSwitchMode = async (targetMode) => {
    if (!customerId || savingLimit) return;

    if (targetMode === "manual" && manualBorrowLimit <= 0) {
      setLimitModalOpen(true);
      return;
    }

    const previousData = customerData;

    // 1. Instant optimistic update (0ms UI latency)
    setCustomerData((prev) => {
      if (!prev) return prev;
      const prevSummary = prev.summary || {};
      const prevProfile = prev.profile || {};
      const prevCustomer = prev.customer || {};

      return {
        ...prev,
        summary: {
          ...prevSummary,
          creditLimitMode: targetMode,
          isManualOverride: targetMode === "manual",
        },
        profile: {
          ...prevProfile,
          creditLimitMode: targetMode,
        },
        customer: {
          ...prevCustomer,
          creditLimitMode: targetMode,
        },
      };
    });

    setError("");
    const switchMsg =
      targetMode === "manual"
        ? `Switched to Manual Limit Mode (${money(manualBorrowLimit)})`
        : `Switched to Automatic Limit Mode (${money(autoCreditLimit)})`;
    setSuccessMsg(switchMsg);
    toast.success(switchMsg);

    // 2. Persist to MongoDB in background
    try {
      setSavingLimit(true);
      await customersApi.updateBorrowLimit(customerId, {
        creditLimitMode: targetMode,
      });
    } catch (err) {
      console.error("Switch limit mode error:", err);
      setCustomerData(previousData);
      const errMsg = getErrorMessage(err, "Failed to switch credit limit mode.");
      setError(errMsg);
      toast.error(errMsg);
      setSuccessMsg("");
    } finally {
      setSavingLimit(false);
    }
  };

  // Save/Update Manual Credit Limit Amount with Instant Optimistic UI
  const handleSaveManualLimit = async (e) => {
    e.preventDefault();
    if (!customerId || savingLimit) return;
    setFieldErrors({});

    const amount = Number(manualInput);
    if (!Number.isFinite(amount) || amount < 0) {
      const msg = "Please enter a valid credit limit of ₹0 or more.";
      setError(msg);
      setFieldErrors({ manualInput: msg });
      toast.error(msg);
      return;
    }

    const previousData = customerData;

    // Instant optimistic update (0ms)
    setCustomerData((prev) => {
      if (!prev) return prev;
      const prevSummary = prev.summary || {};
      const prevCustomer = prev.customer || {};

      return {
        ...prev,
        summary: {
          ...prevSummary,
          manualBorrowLimit: amount,
          ...(activateOnSave ? { creditLimitMode: "manual", isManualOverride: true } : {}),
        },
        customer: {
          ...prevCustomer,
          manualBorrowLimit: amount,
          ...(activateOnSave ? { creditLimitMode: "manual" } : {}),
        },
      };
    });

    setLimitModalOpen(false);
    setError("");
    const saveMsg = `Manual credit limit set to ${money(amount)}${
      activateOnSave ? " and activated for sales." : "."
    }`;
    setSuccessMsg(saveMsg);
    toast.success(saveMsg);

    try {
      setSavingLimit(true);
      const payload = {
        manualBorrowLimit: amount,
      };

      if (activateOnSave) {
        payload.creditLimitMode = "manual";
      }

      await customersApi.updateBorrowLimit(customerId, payload);
    } catch (err) {
      console.error("Save manual limit error:", err);
      setCustomerData(previousData);
      const errMsg = getErrorMessage(err, "Failed to update manual credit limit.");
      setError(errMsg);
      toast.error(errMsg);
      setSuccessMsg("");
    } finally {
      setSavingLimit(false);
    }
  };

  const handleOpenExtendModal = (creditItem) => {
    setExtendModalCredit(creditItem);
    setExtendDueDate("");
    setExtendReason("");
    setError("");
    setFieldErrors({});
  };

  const handleExtendSubmit = async (e) => {
    e.preventDefault();
    if (!extendModalCredit || extending) return;
    setFieldErrors({});

    const newFieldErrors = {};

    if (!extendDueDate) {
      newFieldErrors.extendDueDate = "Please select a new due date.";
    }

    if (!extendReason.trim()) {
      newFieldErrors.extendReason = "Please provide a reason for extending the due date.";
    }

    if (Object.keys(newFieldErrors).length > 0) {
      setFieldErrors(newFieldErrors);
      const firstMsg = Object.values(newFieldErrors)[0];
      setError(firstMsg);
      toast.error(firstMsg);
      return;
    }

    try {
      setExtending(true);
      setError("");
      setSuccessMsg("");

      const creditId = extendModalCredit.rawId || extendModalCredit.id;
      const res = await creditsApi.extendDueDate(creditId, {
        newDueDate: extendDueDate,
        reason: extendReason.trim(),
      });

      const msg = res?.message || "Credit due date extended successfully. Customer Trust Score updated.";
      setSuccessMsg(msg);
      toast.success(msg);
      setExtendModalCredit(null);
      await loadCustomer(true);
    } catch (err) {
      console.error("Extend due date error:", err);
      const errMsg = getErrorMessage(err, "Failed to extend credit due date.");
      setError(errMsg);
      if (err?.errors) setFieldErrors(err.errors);
      toast.error(errMsg);
    } finally {
      setExtending(false);
    }
  };

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

      const res = await customersApi.updateStatus(customerId, nextStatus);
      toast.success(res?.message || `Customer ${nextStatus ? "activated" : "deactivated"} successfully.`);
      await loadCustomer(true);
    } catch (err) {
      console.error("Update customer status error:", err);
      const errMsg = getErrorMessage(err, "Failed to update customer status.");
      setError(errMsg);
      toast.error(errMsg);
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!customerId || actionLoading) return;

    if (isActive) {
      const msg = "Please deactivate the customer account before deleting.";
      window.alert(msg);
      toast.warn(msg);
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
    <div className="w-full space-y-5">
      {/* Navigation & Actions Topbar */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Link
            to="/customers"
            className="inline-flex items-center gap-2 rounded-xl border border-zinc-800 bg-zinc-900/60 px-3.5 py-1.5 text-xs font-medium text-zinc-300 transition hover:border-[var(--app-accent-border)] hover:bg-[var(--app-accent-soft)] hover:text-white"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Back to Customers
          </Link>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={handleRecalculateTrust}
              disabled={recalculatingTrust || loading}
              className="inline-flex items-center gap-1.5 rounded-xl border border-[var(--app-accent-border)] bg-[var(--app-accent-soft)] px-3 py-1.5 text-xs font-semibold text-[var(--app-accent)] shadow transition hover:opacity-90 disabled:opacity-50"
            >
              <Sparkles
                className={`h-3.5 w-3.5 ${recalculatingTrust ? "animate-spin" : ""}`}
              />
              {recalculatingTrust ? "Evaluating..." : "Recalculate Trust"}
            </button>

            <button
              type="button"
              onClick={() => loadCustomer(true)}
              disabled={refreshing || loading}
              className="inline-flex items-center gap-1.5 rounded-xl border border-zinc-800 bg-zinc-900/60 px-3 py-1.5 text-xs font-medium text-zinc-300 transition hover:border-[var(--app-accent-border)] hover:bg-[var(--app-accent-soft)] hover:text-white disabled:opacity-50"
            >
              <RefreshCw
                className={`h-3.5 w-3.5 ${refreshing ? "animate-spin text-[var(--app-accent)]" : ""}`}
              />
              {refreshing ? "Refreshing..." : "Refresh"}
            </button>

            <button
              type="button"
              onClick={handleToggleStatus}
              disabled={actionLoading || loading}
              className={`inline-flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-semibold transition disabled:opacity-50 ${
                isActive
                  ? "border-yellow-500/30 bg-yellow-500/10 text-yellow-400 hover:bg-yellow-500/20"
                  : "border-emerald-500/30 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20"
              }`}
            >
              <Power className="h-3.5 w-3.5" />
              {isActive ? "Deactivate" : "Activate"}
            </button>

            <button
              type="button"
              onClick={handleDelete}
              disabled={actionLoading || loading}
              className="inline-flex items-center gap-1.5 rounded-xl border border-red-500/30 bg-red-500/10 px-3 py-1.5 text-xs font-semibold text-red-400 transition hover:bg-red-500/20 disabled:opacity-50"
            >
              <Trash2 className="h-3.5 w-3.5" />
              Delete
            </button>
          </div>
        </div>

        {error && (
          <div className="flex items-center gap-3 rounded-2xl border border-red-500/30 bg-red-500/10 p-3.5 text-xs text-red-300">
            <AlertCircle className="h-4 w-4 shrink-0 text-red-400" />
            <span>{error}</span>
          </div>
        )}

        {successMsg && (
          <div className="flex items-center gap-3 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-3.5 text-xs text-emerald-300">
            <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400" />
            <span>{successMsg}</span>
          </div>
        )}

        {loading ? (
          <div className="rounded-3xl border border-zinc-800 bg-zinc-900/40 p-16 text-center text-zinc-400">
            <RefreshCw className="mx-auto h-8 w-8 animate-spin text-[var(--app-accent)]" />
            <p className="mt-4 text-sm">Loading customer profile & credit metrics...</p>
          </div>
        ) : (
          <>
            {/* Header Hero Profile Card */}
            <div
              className="relative overflow-hidden rounded-3xl border p-5 sm:p-6"
              style={{
                borderColor: "var(--app-border)",
                background:
                  "radial-gradient(circle at top right, var(--app-accent-soft), transparent 60%), linear-gradient(135deg, var(--app-surface-light) 0%, var(--app-surface) 100%)",
              }}
            >
              <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
                {/* User Info */}
                <div className="flex items-start gap-4 sm:gap-5">
                  <div
                    className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl text-lg font-bold text-white shadow-xl sm:h-16 sm:w-16 sm:text-xl"
                    style={{ backgroundColor: "var(--app-accent)" }}
                  >
                    {initials}
                  </div>

                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h1 className="text-xl font-bold text-white sm:text-2xl">
                        {customerName}
                      </h1>
                      <span
                        className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${
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
                      <p className="font-mono text-xs text-zinc-400">
                        @{username}
                      </p>
                    )}

                    <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-zinc-300">
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

                {/* Trust Score & Active Enforcement Widget */}
                <div className="flex flex-wrap items-center gap-2.5">
                  <div className="rounded-2xl border border-zinc-800 bg-zinc-950/80 px-4 py-3 text-center min-w-[110px]">
                    <div className="flex items-center justify-center gap-1 text-[10px] font-semibold uppercase tracking-wider text-zinc-500">
                      <Award className="h-3 w-3 text-amber-400" />
                      <span>Trust Score</span>
                    </div>
                    <p className="mt-0.5 text-xl font-black text-white">
                      {trustScore}
                      <span className="text-[10px] font-normal text-zinc-500">/100</span>
                    </p>
                    <span
                      className={`inline-block mt-0.5 rounded px-1.5 py-0.2 text-[9px] font-bold ${
                        trustTier === "Platinum"
                          ? "bg-purple-500/20 text-purple-300 border border-purple-500/30"
                          : trustTier === "Gold"
                          ? "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                          : trustTier === "Silver"
                          ? "bg-teal-500/20 text-teal-300 border border-teal-500/30"
                          : "bg-rose-500/20 text-rose-300 border border-rose-500/30"
                      }`}
                    >
                      {trustTier}
                    </span>
                  </div>

                  <div className="rounded-2xl border border-zinc-800 bg-zinc-950/80 px-4 py-3 text-center min-w-[130px]">
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500">
                      Active In-Store Limit
                    </p>
                    <p className="mt-0.5 text-xl font-black text-white">
                      {money(effectiveLimit)}
                    </p>
                    <span
                      className={`inline-block mt-0.5 rounded px-1.5 py-0.2 text-[9px] font-bold ${
                        creditLimitMode === "manual"
                          ? "bg-blue-500/20 text-blue-300 border border-blue-500/30"
                          : "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                      }`}
                    >
                      {creditLimitMode === "manual" ? "Manual Custom" : "Auto Trust"}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* DUAL CREDIT LIMIT CONTROL BAR (Minimal, Compact & Clean) */}
            <div
              className="rounded-2xl border p-4 transition-colors"
              style={{
                borderColor: "var(--app-border)",
                backgroundColor: "var(--app-surface)",
              }}
            >
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-white/5 pb-3">
                <div>
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <span>Credit Limit Selection</span>
                    <span
                      className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                        creditLimitMode === "manual"
                          ? "bg-blue-500/20 text-blue-400 border border-blue-500/30"
                          : "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                      }`}
                    >
                      Active: {money(effectiveLimit)} ({creditLimitMode === "manual" ? "Manual Mode" : "Auto Mode"})
                    </span>
                  </h3>
                  <p className="text-[11px] text-zinc-400 mt-0.5">
                    Toggle which limit mode governs credit sales for this customer.
                  </p>
                </div>

                {/* Quick Toggle Buttons */}
                <div className="flex items-center gap-1.5 bg-zinc-950 p-1 rounded-xl border border-white/10 shrink-0">
                  <button
                    type="button"
                    onClick={() => handleQuickSwitchMode("auto")}
                    disabled={savingLimit}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                      creditLimitMode === "auto"
                        ? "bg-emerald-500 text-black shadow"
                        : "text-zinc-400 hover:text-white"
                    }`}
                  >
                    <Bot className="h-3.5 w-3.5" />
                    <span>Auto ({money(autoCreditLimit)})</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleQuickSwitchMode("manual")}
                    disabled={savingLimit}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                      creditLimitMode === "manual"
                        ? "bg-blue-600 text-white shadow"
                        : "text-zinc-400 hover:text-white"
                    }`}
                  >
                    <UserCheck className="h-3.5 w-3.5" />
                    <span>Manual ({manualBorrowLimit > 0 ? money(manualBorrowLimit) : "₹0"})</span>
                  </button>
                </div>
              </div>

              {/* Compact 2-Column Boxes */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3">
                {/* Auto Limit Card */}
                <div
                  onClick={() => creditLimitMode !== "auto" && handleQuickSwitchMode("auto")}
                  className={`cursor-pointer rounded-xl border p-3 flex items-center justify-between transition ${
                    creditLimitMode === "auto"
                      ? "border-emerald-500/50 bg-emerald-500/10 shadow-[0_0_20px_rgba(16,185,129,0.05)]"
                      : "border-white/5 bg-zinc-950/40 hover:border-white/15 opacity-75 hover:opacity-100"
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <div
                      className={`p-2 rounded-lg ${
                        creditLimitMode === "auto"
                          ? "bg-emerald-500/20 text-emerald-400"
                          : "bg-zinc-800 text-zinc-400"
                      }`}
                    >
                      <Bot className="h-4 w-4" />
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-semibold text-zinc-200">Automatic Limit</span>
                        {creditLimitMode === "auto" ? (
                          <span className="text-[9px] font-bold text-emerald-400 bg-emerald-500/20 px-1.5 py-0.2 rounded border border-emerald-500/30">
                            Active
                          </span>
                        ) : (
                          <span className="text-[9px] font-medium text-zinc-500">Standby</span>
                        )}
                      </div>
                      <p className="text-sm font-bold text-white">{money(autoCreditLimit)}</p>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="text-[10px] text-zinc-500 block">Trust: {trustScore}/100</span>
                    {creditLimitMode !== "auto" && (
                      <span className="text-[10px] font-bold text-emerald-400 hover:underline">
                        Click to Activate →
                      </span>
                    )}
                  </div>
                </div>

                {/* Manual Limit Card */}
                <div
                  className={`rounded-xl border p-3 flex items-center justify-between transition ${
                    creditLimitMode === "manual"
                      ? "border-blue-500/50 bg-blue-500/10 shadow-[0_0_20px_rgba(59,130,246,0.05)]"
                      : "border-white/5 bg-zinc-950/40 opacity-75 hover:opacity-100"
                  }`}
                >
                  <div
                    onClick={() => creditLimitMode !== "manual" && handleQuickSwitchMode("manual")}
                    className="flex items-center gap-2.5 cursor-pointer flex-1"
                  >
                    <div
                      className={`p-2 rounded-lg ${
                        creditLimitMode === "manual"
                          ? "bg-blue-500/20 text-blue-400"
                          : "bg-zinc-800 text-zinc-400"
                      }`}
                    >
                      <UserCheck className="h-4 w-4" />
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-semibold text-zinc-200">Manual Override</span>
                        {creditLimitMode === "manual" ? (
                          <span className="text-[9px] font-bold text-blue-400 bg-blue-500/20 px-1.5 py-0.2 rounded border border-blue-500/30">
                            Active
                          </span>
                        ) : (
                          <span className="text-[9px] font-medium text-zinc-500">Standby</span>
                        )}
                      </div>
                      <p className="text-sm font-bold text-white">
                        {manualBorrowLimit > 0 ? money(manualBorrowLimit) : "Not Configured"}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {creditLimitMode !== "manual" && manualBorrowLimit > 0 && (
                      <button
                        type="button"
                        onClick={() => handleQuickSwitchMode("manual")}
                        className="text-[10px] font-bold text-blue-400 hover:underline"
                      >
                        Activate →
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setManualInput(manualBorrowLimit > 0 ? String(manualBorrowLimit) : "");
                        setLimitModalOpen(true);
                      }}
                      className="text-[11px] font-semibold text-zinc-200 hover:text-white px-2 py-1 rounded border border-white/10 hover:bg-white/10 transition"
                    >
                      {manualBorrowLimit > 0 ? "Edit" : "Set Limit"}
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Financial Summary Stat Cards */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div
                className="rounded-2xl border p-4 sm:p-5"
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
                <p className="mt-2.5 text-2xl font-bold text-white">
                  {money(totalSalesAmount || totalPurchase)}
                </p>
                <p className="mt-1 text-xs text-zinc-400">
                  {sales.length} purchase orders recorded
                </p>
              </div>

              <div
                className="rounded-2xl border p-4 sm:p-5"
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
                <p className="mt-2.5 text-2xl font-bold text-white">
                  {money(totalBorrowed)}
                </p>
                <p className="mt-1 text-xs text-zinc-400">
                  {credits.length} credit transactions
                </p>
              </div>

              <div
                className="rounded-2xl border p-4 sm:p-5"
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
                <p className="mt-2.5 text-2xl font-bold" style={{ color: "var(--app-accent)" }}>
                  {money(totalPending || pendingAmount)}
                </p>
                <p className="mt-1 text-xs text-red-400">
                  Remaining balance to clear
                </p>
              </div>

              <div
                className="rounded-2xl border p-4 sm:p-5"
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
                <p className="mt-2.5 text-2xl font-bold text-emerald-400">
                  {money(totalPaid)}
                </p>
                <p className="mt-1 text-xs text-emerald-500">
                  {payments.length} payment records
                </p>
              </div>
            </div>

            {/* Purchasing & Transaction History Section */}
            <div
              className="rounded-3xl border p-5 sm:p-7"
              style={{
                borderColor: "var(--app-border)",
                backgroundColor: "var(--app-surface)",
              }}
            >
              <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className="text-lg font-bold text-white sm:text-xl">
                    Purchasing & Activity History
                  </h2>
                  <p className="text-xs text-zinc-400">
                    Live purchases, items bought, credit lines and repayments by {customerName}.
                  </p>
                </div>

                <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center">
                  {/* History Type Tabs */}
                  <div className="flex flex-wrap gap-1">
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
                        className={`rounded-lg px-2.5 py-1 text-xs font-semibold transition ${
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
                      className="w-full rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-1.5 text-xs text-white outline-none sm:w-44"
                    />
                  </div>
                </div>
              </div>

              {/* Records List */}
              {filteredHistory.length === 0 ? (
                <div className="rounded-2xl border border-zinc-800/80 bg-zinc-950/40 p-10 text-center">
                  <Receipt className="mx-auto h-7 w-7 text-zinc-600" />
                  <p className="mt-2.5 text-xs text-zinc-400">
                    No {historyType !== "All" ? historyType.toLowerCase() : ""} records found for this customer.
                  </p>
                </div>
              ) : (
                <div className="space-y-2.5">
                  {filteredHistory.map((item) => (
                    <div
                      key={item.id}
                      className="flex flex-col gap-2.5 rounded-xl border p-3.5 transition-all duration-200 hover:bg-white/[0.02] sm:flex-row sm:items-center sm:justify-between"
                      style={{
                        borderColor: "var(--app-border)",
                        backgroundColor: "var(--app-surface-light)",
                      }}
                    >
                      <div className="flex items-start gap-3">
                        <div
                          className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-xs font-bold ${
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
                          <div className="flex flex-wrap items-center gap-1.5">
                            <span className="text-xs font-bold text-white">
                              {item.type}
                            </span>
                            <span className="rounded-full bg-zinc-800 px-2 py-0.2 text-[9px] font-medium text-zinc-300">
                              {item.status}
                            </span>
                            {item.paymentType && (
                              <span className="rounded-full border border-zinc-700 px-2 py-0.2 text-[9px] text-zinc-400">
                                {item.paymentType}
                              </span>
                            )}
                            {item.method && (
                              <span className="rounded-full border border-zinc-700 px-2 py-0.2 text-[9px] text-zinc-400">
                                {item.method}
                              </span>
                            )}
                          </div>

                          <p className="mt-0.5 text-xs text-zinc-300 font-medium">
                            {item.title}
                          </p>

                          {/* Items Breakdown if Sale */}
                          {item.items && item.items.length > 0 && (
                            <div className="mt-1.5 flex flex-wrap gap-1">
                              {item.items.map((prod, idx) => (
                                <span
                                  key={idx}
                                  className="rounded border border-zinc-800 bg-zinc-950/80 px-1.5 py-0.5 text-[10px] text-zinc-400"
                                >
                                  {prod.productName || "Item"} {prod.quantity ? `(Qty: ${prod.quantity})` : ""} {prod.price ? `- ₹${prod.price}` : ""}
                                </span>
                              ))}
                            </div>
                          )}

                          {item.dueDate && (
                            <div className="mt-1 flex flex-wrap items-center gap-2">
                              <p className={`text-[11px] font-semibold ${item.isOverdue ? "text-red-400" : "text-amber-400"}`}>
                                Due Date: {formatDate(item.dueDate)} {item.isOverdue ? "(OVERDUE)" : ""}
                              </p>

                              {item.extensionCount >= 1 && (
                                <span className="rounded bg-yellow-500/10 border border-yellow-500/30 px-1.5 py-0.2 text-[10px] text-yellow-400">
                                  Extension Used
                                </span>
                              )}

                              {item.type === "Credit" && item.status !== "Paid" && item.extensionCount < 1 && (
                                <button
                                  type="button"
                                  onClick={() => handleOpenExtendModal(item)}
                                  className="rounded border border-amber-500/40 bg-amber-500/10 px-2 py-0.5 text-[10px] font-bold text-amber-300 transition hover:bg-amber-500/20"
                                >
                                  Extend Due (1-Time)
                                </button>
                              )}
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center justify-between border-t border-zinc-800/60 pt-2 sm:flex-col sm:items-end sm:border-0 sm:pt-0">
                        <p
                          className="text-sm font-bold sm:text-base"
                          style={{
                            color:
                              item.type === "Payment"
                                ? "#4ade80"
                                : item.type === "Return"
                                ? "#c084fc"
                                : item.isOverdue
                                ? "#f87171"
                                : "var(--app-accent)",
                          }}
                        >
                          {money(item.amount)}
                        </p>
                        <p className="text-[11px] text-zinc-500 font-mono">
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

        {/* Edit Manual Limit Modal */}
        {limitModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
            <div
              className="relative w-full max-w-md overflow-hidden rounded-2xl border p-5 shadow-2xl"
              style={{
                borderColor: "var(--app-border)",
                backgroundColor: "var(--app-surface)",
              }}
            >
              <div className="mb-4 flex items-start justify-between border-b pb-3" style={{ borderColor: "var(--app-border)" }}>
                <div>
                  <h3 className="text-base font-bold text-white">Configure Manual Credit Limit</h3>
                  <p className="text-xs text-zinc-400">Custom credit ceiling for {customerName}</p>
                </div>
                <button
                  type="button"
                  onClick={() => setLimitModalOpen(false)}
                  className="rounded p-1 text-zinc-400 hover:text-white"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <form onSubmit={handleSaveManualLimit} className="space-y-3.5">
                <div>
                  <label className="mb-1 block text-xs font-semibold text-zinc-300">
                    Manual Limit Amount (₹)
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-zinc-500 font-bold">₹</span>
                    <input
                      type="number"
                      min="0"
                      step="100"
                      placeholder="e.g. 10000"
                      value={manualInput}
                      onChange={(e) => {
                        setManualInput(e.target.value);
                        if (fieldErrors.manualInput) setFieldErrors((prev) => ({ ...prev, manualInput: "" }));
                      }}
                      required
                      className={`w-full rounded-xl border bg-zinc-950 pl-8 pr-4 py-2 text-sm text-white outline-none ${
                        fieldErrors.manualInput ? "border-red-500 ring-1 ring-red-500" : "border-white/10 focus:border-blue-500"
                      }`}
                    />
                  </div>
                  {fieldErrors.manualInput ? (
                    <p className="mt-1 text-xs text-red-500 font-medium">{fieldErrors.manualInput}</p>
                  ) : (
                    <p className="mt-1 text-[11px] text-zinc-500">
                      This custom amount will remain saved independently in the customer record.
                    </p>
                  )}
                </div>

                <label className="flex items-center gap-2 cursor-pointer pt-1">
                  <input
                    type="checkbox"
                    checked={activateOnSave}
                    onChange={(e) => setActivateOnSave(e.target.checked)}
                    className="rounded accent-blue-500"
                  />
                  <span className="text-xs text-zinc-300 font-medium">
                    Immediately activate Manual Mode for this customer
                  </span>
                </label>

                <div className="rounded-xl border border-white/10 bg-zinc-950/80 p-3 text-xs text-zinc-400">
                  <div className="flex justify-between">
                    <span>Auto Limit (Calculated):</span>
                    <strong className="text-emerald-400">{money(autoCreditLimit)}</strong>
                  </div>
                  <div className="flex justify-between mt-1">
                    <span>Configured Manual Limit:</span>
                    <strong className="text-blue-400">
                      {Number(manualInput) > 0 ? money(Number(manualInput)) : "₹0"}
                    </strong>
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2.5 pt-2.5 border-t border-white/10">
                  <button
                    type="button"
                    onClick={() => setLimitModalOpen(false)}
                    className="rounded-xl border border-white/10 px-3.5 py-2 text-xs font-semibold text-zinc-400 hover:text-white"
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    disabled={savingLimit}
                    className="rounded-xl bg-blue-600 px-4 py-2 text-xs font-bold text-white shadow-lg transition hover:bg-blue-500 disabled:opacity-50"
                  >
                    {savingLimit ? "Saving..." : "Save Manual Limit"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* 1-Time Extend Due Date Modal */}
        {extendModalCredit && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
            <div
              className="relative w-full max-w-md overflow-hidden rounded-2xl border p-5 sm:p-6 shadow-2xl"
              style={{
                borderColor: "var(--app-border)",
                backgroundColor: "var(--app-surface)",
              }}
            >
              <div className="mb-4 flex items-start justify-between border-b pb-3" style={{ borderColor: "var(--app-border)" }}>
                <div>
                  <h3 className="text-base font-bold text-white">Extend Repayment Due Date</h3>
                  <p className="mt-0.5 text-xs text-amber-400">
                    1-Time Emergency Extension for {customerName}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setExtendModalCredit(null)}
                  className="rounded p-1 text-zinc-400 hover:text-white"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <form onSubmit={handleExtendSubmit} className="space-y-4">
                <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-3 text-xs text-amber-300/90 leading-relaxed">
                  <p>
                    <strong>Credit Balance:</strong> {money(extendModalCredit.pendingAmount)}
                  </p>
                  <p className="mt-1">
                    <strong>Current Due Date:</strong> {formatDate(extendModalCredit.dueDate)}
                  </p>
                  <p className="mt-1 text-[11px] text-zinc-400">
                    ⚠️ Note: Each credit record can be extended only <strong>once</strong>.
                  </p>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-semibold text-zinc-300">
                      New Due Date
                    </label>
                    {extendDueDate && (
                      <span className="text-[11px] font-bold text-amber-300">
                        {formatDate(extendDueDate)}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => {
                        const cur = extendDueDate ? new Date(extendDueDate) : new Date();
                        cur.setDate(cur.getDate() - 1);
                        setExtendDueDate(getLocalDateString(cur));
                        if (fieldErrors.extendDueDate) setFieldErrors((prev) => ({ ...prev, extendDueDate: "" }));
                      }}
                      className="rounded-lg border border-zinc-800 bg-zinc-900 px-2.5 py-2 text-xs font-bold text-zinc-300 hover:border-zinc-700 hover:text-white"
                    >
                      -1d
                    </button>

                    <input
                      type="date"
                      required
                      value={extendDueDate}
                      min={addDaysToDate(extendModalCredit?.dueDate || new Date(), 1)}
                      max={addDaysToDate(new Date(), 365)}
                      onChange={(e) => {
                        setExtendDueDate(e.target.value);
                        if (fieldErrors.extendDueDate) setFieldErrors((prev) => ({ ...prev, extendDueDate: "" }));
                      }}
                      onClick={(e) => {
                        try {
                          e.target.showPicker?.();
                        } catch {}
                      }}
                      className={`w-full rounded-xl border bg-zinc-950 px-3.5 py-2 text-sm font-semibold text-white outline-none cursor-pointer ${
                        fieldErrors.extendDueDate ? "border-red-500 ring-1 ring-red-500" : "border-zinc-700 focus:border-amber-500"
                      }`}
                      style={{ colorScheme: "dark" }}
                    />

                    <button
                      type="button"
                      onClick={() => {
                        const cur = extendDueDate ? new Date(extendDueDate) : new Date();
                        cur.setDate(cur.getDate() + 1);
                        setExtendDueDate(getLocalDateString(cur));
                        if (fieldErrors.extendDueDate) setFieldErrors((prev) => ({ ...prev, extendDueDate: "" }));
                      }}
                      className="rounded-lg border border-zinc-800 bg-zinc-900 px-2.5 py-2 text-xs font-bold text-zinc-300 hover:border-zinc-700 hover:text-white"
                    >
                      +1d
                    </button>
                  </div>
                  {fieldErrors.extendDueDate && (
                    <p className="mt-1 text-xs text-red-500 font-medium">{fieldErrors.extendDueDate}</p>
                  )}

                  {/* Quick Extension Chips */}
                  <div className="flex flex-wrap items-center gap-1 mt-2">
                    <span className="text-[10px] text-zinc-500 mr-1">Extend By:</span>
                    {[
                      { label: "+7 Days", days: 7 },
                      { label: "+15 Days", days: 15 },
                      { label: "+30 Days", days: 30 },
                      { label: "+45 Days", days: 45 },
                      { label: "+60 Days", days: 60 },
                    ].map((chip) => (
                      <button
                        key={chip.days}
                        type="button"
                        onClick={() => {
                          const base = extendModalCredit?.dueDate
                            ? new Date(extendModalCredit.dueDate)
                            : new Date();
                          setExtendDueDate(addDaysToDate(base, chip.days));
                          if (fieldErrors.extendDueDate) setFieldErrors((prev) => ({ ...prev, extendDueDate: "" }));
                        }}
                        className="rounded border border-zinc-800 bg-zinc-900 px-2 py-0.5 text-[10px] text-zinc-300 hover:border-amber-500/40 hover:text-amber-300"
                      >
                        {chip.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="mb-1 block text-xs font-semibold text-zinc-300">
                    Reason for Extension
                  </label>
                  <textarea
                    rows={3}
                    required
                    placeholder="e.g. Customer requested extra time due to salary delay / medical emergency..."
                    value={extendReason}
                    onChange={(e) => {
                      setExtendReason(e.target.value);
                      if (fieldErrors.extendReason) setFieldErrors((prev) => ({ ...prev, extendReason: "" }));
                    }}
                    className={`w-full rounded-xl border bg-zinc-950 px-3.5 py-2 text-xs text-white outline-none ${
                      fieldErrors.extendReason ? "border-red-500 ring-1 ring-red-500" : "border-zinc-700 focus:border-amber-500"
                    }`}
                  />
                  {fieldErrors.extendReason && (
                    <p className="mt-1 text-xs text-red-500 font-medium">{fieldErrors.extendReason}</p>
                  )}
                </div>

                <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-white/10">
                  <button
                    type="button"
                    onClick={() => setExtendModalCredit(null)}
                    className="rounded-xl border border-white/10 px-3.5 py-2 text-xs font-semibold text-zinc-400 hover:text-white"
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    disabled={extending}
                    className="rounded-xl bg-amber-600 px-4 py-2 text-xs font-bold text-white shadow-lg transition hover:bg-amber-500 disabled:opacity-50"
                  >
                    {extending ? "Extending..." : "Confirm 1-Time Extension"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
  );
};

export default CustomerProfile;