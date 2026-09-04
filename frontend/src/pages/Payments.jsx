import React, { useEffect, useMemo, useState } from "react";
import {
  CreditCard,
  Wallet,
  Smartphone,
  Banknote,
  CheckCircle2,
  AlertCircle,
  Clock,
  XCircle,
  FileText,
  Upload,
  Calendar,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Percent,
  Check,
  Eye,
  X,
  RefreshCw,
} from "lucide-react";
import { toast } from "react-toastify";
import api from "../services/api";

const Payments = () => {
  const [credits, setCredits] = useState([]);
  const [payments, setPayments] = useState([]);

  const [paymentSettings, setPaymentSettings] = useState({
    razorpayEnabled: false,
    razorpayMessage: "In case of emergency, use Razorpay for payment.",
  });

  // Credit target selection: specific credit ID or "auto" (General Account)
  const [selectedCredit, setSelectedCredit] = useState("auto");

  // Payment type mode: "full" or "partial"
  const [paymentTypeMode, setPaymentTypeMode] = useState("full");
  const [amount, setAmount] = useState("");

  const [paymentMethod, setPaymentMethod] = useState("upi"); // "upi", "cash", "razorpay"
  const [transactionId, setTransactionId] = useState("");
  const [paymentProof, setPaymentProof] = useState(null);
  const [paymentProofPreview, setPaymentProofPreview] = useState(null);
  const [claimedReceiver, setClaimedReceiver] = useState("");
  const [note, setNote] = useState("");

  // Preview modal for screenshot in payment history
  const [previewImage, setPreviewImage] = useState(null);

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [razorpayLoading, setRazorpayLoading] = useState(false);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});

  // Load customer pending credits, payment history, and gateway settings
  useEffect(() => {
    loadPaymentPage();
  }, []);

  const loadPaymentPage = async () => {
    try {
      setLoading(true);
      setError("");

      const [creditsResponse, paymentsResponse, settingsResponse] =
        await Promise.all([
          api.get("/credits/my"),
          api.get("/payments/my"),
          api.get("/payments/settings"),
        ]);

      const loadedCredits = creditsResponse.data?.credits || [];
      setCredits(loadedCredits);
      setPayments(paymentsResponse.data?.payments || []);

      setPaymentSettings(
        settingsResponse.data?.settings || {
          razorpayEnabled: false,
          razorpayMessage: "In case of emergency, use Razorpay for payment.",
        }
      );

      // Auto-set default selected credit
      const pending = loadedCredits.filter(
        (c) => Number(c.pendingAmount || 0) > 0
      );
      if (pending.length > 0) {
        setSelectedCredit("auto");
      }
    } catch (err) {
      console.error("Payment page load error:", err);
      setError(
        err.response?.data?.message ||
          err.message ||
          "Unable to load payment information."
      );
    } finally {
      setLoading(false);
    }
  };

  const payableCredits = useMemo(() => {
    return credits.filter((credit) => Number(credit.pendingAmount || 0) > 0);
  }, [credits]);

  const totalOutstanding = useMemo(() => {
    return credits.reduce(
      (total, credit) => total + Number(credit.pendingAmount || 0),
      0
    );
  }, [credits]);

  const currentCredit = useMemo(() => {
    if (selectedCredit === "auto" || !selectedCredit) {
      return payableCredits[0] || null;
    }
    return credits.find((credit) => String(credit._id) === String(selectedCredit));
  }, [credits, payableCredits, selectedCredit]);

  // Max payable target amount
  const targetMaxAmount = useMemo(() => {
    if (selectedCredit === "auto" || !selectedCredit) {
      return totalOutstanding;
    }
    return Number(currentCredit?.pendingAmount || 0);
  }, [selectedCredit, totalOutstanding, currentCredit]);

  // Auto update amount when switching to Full Mode or changing credit
  useEffect(() => {
    if (paymentTypeMode === "full") {
      setAmount(targetMaxAmount > 0 ? String(targetMaxAmount) : "");
    }
  }, [paymentTypeMode, targetMaxAmount, selectedCredit]);

  // Quick percentage shortcuts for Partial Payment
  const handlePercentageSelect = (percent) => {
    setPaymentTypeMode("partial");
    if (targetMaxAmount <= 0) return;
    const calculated = Math.round((targetMaxAmount * (percent / 100)) * 100) / 100;
    setAmount(String(calculated));
  };

  // Quick fixed amount shortcut
  const handleFixedAmountSelect = (fixedVal) => {
    setPaymentTypeMode("partial");
    if (targetMaxAmount <= 0) return;
    const finalVal = Math.min(fixedVal, targetMaxAmount);
    setAmount(String(finalVal));
  };

  // Handle amount change with validation
  const handleAmountChange = (e) => {
    const value = e.target.value;
    if (value === "") {
      setAmount("");
      return;
    }

    const numericValue = Number(value);
    if (!Number.isFinite(numericValue)) return;

    if (numericValue > targetMaxAmount && targetMaxAmount > 0) {
      setAmount(String(targetMaxAmount));
      return;
    }

    setAmount(value);
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) {
      setPaymentProof(null);
      setPaymentProofPreview(null);
      return;
    }

    const allowedTypes = [
      "image/jpeg",
      "image/jpg",
      "image/png",
      "image/webp",
    ];

    if (!allowedTypes.includes(file.type)) {
      setError("Only JPG, JPEG, PNG and WEBP images are allowed.");
      e.target.value = "";
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError("Payment screenshot must be below 5 MB.");
      e.target.value = "";
      return;
    }

    setError("");
    setPaymentProof(file);
    setPaymentProofPreview(URL.createObjectURL(file));
  };

  const clearProofFile = () => {
    setPaymentProof(null);
    setPaymentProofPreview(null);
  };

  // Filter payments by search terms and verification status
  const filteredPayments = useMemo(() => {
    const searchValue = search.toLowerCase().trim();

    return payments.filter((payment) => {
      const paymentId = String(payment._id || "").toLowerCase();
      const method = String(payment.paymentMethod || "").toLowerCase();
      const status = String(payment.status || "").toLowerCase();
      const transaction = String(payment.transactionId || "").toLowerCase();

      const matchesSearch =
        !searchValue ||
        paymentId.includes(searchValue) ||
        method.includes(searchValue) ||
        status.includes(searchValue) ||
        transaction.includes(searchValue);

      const matchesStatus =
        statusFilter === "all" || status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [payments, search, statusFilter]);

  const formatMoney = (value) => {
    return Number(value || 0).toLocaleString("en-IN", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  const formatDate = (date) => {
    if (!date) return "-";
    return new Date(date).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const getStatusClass = (status) => {
    switch (status) {
      case "approved":
        return "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30";
      case "pending":
        return "bg-amber-500/15 text-amber-400 border border-amber-500/30";
      case "rejected":
        return "bg-rose-500/15 text-rose-400 border border-rose-500/30";
      default:
        return "bg-zinc-500/15 text-zinc-400 border border-zinc-500/30";
    }
  };

  const validatePayment = () => {
    setError("");
    setSuccess("");
    setFieldErrors({});

    if (targetMaxAmount <= 0) {
      const msg = "You currently have no outstanding credit debt.";
      setError(msg);
      toast.info(msg);
      return false;
    }

    const paymentAmount = Number(amount);
    if (!Number.isFinite(paymentAmount) || paymentAmount <= 0) {
      const msg = "Please enter a valid payment amount greater than ₹0.";
      setError(msg);
      setFieldErrors({ amount: msg });
      toast.error(msg);
      return false;
    }

    if (paymentAmount > targetMaxAmount) {
      const msg = `Maximum payable amount is ₹${formatMoney(targetMaxAmount)}.`;
      setError(msg);
      setFieldErrors({ amount: msg });
      toast.error(msg);
      return false;
    }

    return true;
  };

  // Submit cash or UPI offline payment claim for verification
  const handleClaimPayment = async (e) => {
    e.preventDefault();

    if (!validatePayment()) {
      return;
    }

    if (paymentMethod === "upi") {
      if (!transactionId.trim() && !paymentProof) {
        const msg = "Please enter UPI UTR / Transaction ID or upload a payment screenshot.";
        setError(msg);
        setFieldErrors({ transactionId: msg });
        toast.error(msg);
        return;
      }
    }

    try {
      setSubmitting(true);
      setError("");
      setSuccess("");
      setFieldErrors({});

      const targetCreditId =
        selectedCredit === "auto" || !selectedCredit
          ? payableCredits[0]?._id || "auto"
          : selectedCredit;

      // Use FormData to support multipart image upload
      const formData = new FormData();
      formData.append("creditId", targetCreditId);
      formData.append("amount", String(Number(amount)));
      formData.append("paymentMethod", paymentMethod);

      if (transactionId.trim()) {
        formData.append("transactionId", transactionId.trim());
      }
      if (claimedReceiver.trim()) {
        formData.append("claimedReceiver", claimedReceiver.trim());
      }
      if (note.trim()) {
        formData.append("note", note.trim());
      }
      if (paymentProof) {
        formData.append("paymentProof", paymentProof);
      }

      const response = await api.post("/payments/claim", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      const isPartial = Number(amount) < targetMaxAmount;
      const successMsg =
        response.data?.message ||
        `${isPartial ? "Partial" : "Full"} payment claim of ₹${formatMoney(
          amount
        )} submitted for verification!`;
      setSuccess(successMsg);
      toast.success(successMsg);

      setAmount("");
      setTransactionId("");
      setPaymentProof(null);
      setPaymentProofPreview(null);
      setClaimedReceiver("");
      setNote("");

      await loadPaymentPage();
    } catch (err) {
      console.error("Payment claim error:", err);
      const msg = err.response?.data?.message || err.message || "Unable to submit payment.";
      setError(msg);
      if (err.response?.data?.errors) {
        setFieldErrors(err.response.data.errors);
      } else if (err.errors) {
        setFieldErrors(err.errors);
      }
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const loadRazorpayScript = () => {
    return new Promise((resolve) => {
      if (window.Razorpay) {
        resolve(true);
        return;
      }

      const script = document.createElement("script");
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  // Initialize Razorpay order and verify payment signature
  const handleRazorpayPayment = async () => {
    if (!validatePayment()) {
      return;
    }

    if (!paymentSettings.razorpayEnabled) {
      setError("Razorpay payment is currently disabled.");
      return;
    }

    try {
      setRazorpayLoading(true);
      setError("");
      setSuccess("");

      const loaded = await loadRazorpayScript();
      if (!loaded) {
        throw new Error("Unable to load Razorpay checkout.");
      }

      const targetCreditId =
        selectedCredit === "auto" || !selectedCredit
          ? payableCredits[0]?._id || "auto"
          : selectedCredit;

      const orderResponse = await api.post("/payments/razorpay/create-order", {
        creditId: targetCreditId,
        amount: Number(amount),
      });

      const order = orderResponse.data?.order;
      if (!order?.id) {
        throw new Error("Razorpay order could not be created.");
      }

      // Dynamically resolve the client key ID from backend order response or settings or env
      const razorpayKey =
        order.key ||
        orderResponse.data?.keyId ||
        paymentSettings.keyId ||
        import.meta.env.VITE_RAZORPAY_KEY_ID;

      if (!razorpayKey) {
        throw new Error(
          "Razorpay Key ID is not configured. Please ensure RAZORPAY_KEY_ID is configured or use UPI / Cash claim."
        );
      }

      const accentColor =
        getComputedStyle(document.documentElement)
          .getPropertyValue("--app-accent")
          .trim() || "#f97316";

      const options = {
        key: razorpayKey,
        amount: order.amount,
        currency: order.currency || "INR",
        name: "SmartShop",
        description: `Credit payment of ₹${formatMoney(amount)}`,
        order_id: order.id,
        handler: async function (razorpayResponse) {
          try {
            setRazorpayLoading(true);

            const verifyResponse = await api.post(
              "/payments/razorpay/verify",
              {
                creditId: targetCreditId,
                razorpay_order_id: razorpayResponse.razorpay_order_id,
                razorpay_payment_id: razorpayResponse.razorpay_payment_id,
                razorpay_signature: razorpayResponse.razorpay_signature,
              }
            );

            setSuccess(
              verifyResponse.data?.message ||
                `Online payment of ₹${formatMoney(amount)} verified successfully!`
            );
            setAmount("");
            await loadPaymentPage();
          } catch (err) {
            console.error("Razorpay verification error:", err);
            setError(
              err.response?.data?.message ||
                err.message ||
                "Payment verification failed."
            );
          } finally {
            setRazorpayLoading(false);
          }
        },
        modal: {
          ondismiss: function () {
            console.log("Razorpay checkout closed by user");
            setRazorpayLoading(false);
          },
          escape: true,
          backdropclose: true,
        },
        theme: {
          color: accentColor,
        },
      };

      try {
        const razorpay = new window.Razorpay(options);
        razorpay.on("payment.failed", function (response) {
          console.error("Razorpay payment failed:", response);
          setError(response.error?.description || "Razorpay payment failed or cancelled.");
          setRazorpayLoading(false);
        });

        razorpay.open();
      } catch (openErr) {
        console.error("Razorpay instance open error:", openErr);
        setRazorpayLoading(false);
        throw openErr;
      }
    } catch (err) {
      console.error("Razorpay error:", err);
      setError(
        err.response?.data?.message ||
          err.message ||
          "Unable to start Razorpay payment."
      );
      setRazorpayLoading(false);
    } finally {
      // Safety reset to ensure button is never permanently frozen
      setTimeout(() => {
        setRazorpayLoading(false);
      }, 1500);
    }
  };

  const parsedAmount = Number(amount) || 0;
  const remainingAfterPayment = Math.max(0, targetMaxAmount - parsedAmount);
  const isPayingFull = parsedAmount >= targetMaxAmount && targetMaxAmount > 0;

  if (loading) {
    return (
      <div className="mx-auto flex min-h-[60vh] w-full max-w-7xl items-center justify-center px-4">
        <div className="text-center">
          <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-2 border-zinc-700 border-t-[var(--app-accent)]" />
          <p className="text-sm text-zinc-400">Loading your payment portal...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white sm:text-4xl">Repayments & Claims</h1>
          <p className="mt-1 text-sm text-zinc-400">
            Choose full settlement or flexible partial payments via UPI, Cash claim, or Online gateway.
          </p>
        </div>

        <button
          type="button"
          onClick={() => loadPaymentPage()}
          className="inline-flex items-center gap-2 rounded-xl border border-zinc-800 bg-zinc-900/60 px-4 py-2 text-xs font-medium text-zinc-300 transition hover:border-[var(--app-accent-border)] hover:text-white self-start"
        >
          <RefreshCw className="h-3.5 w-3.5" />
          <span>Refresh Records</span>
        </button>
      </div>

      {error && (
        <div className="mb-6 flex items-center gap-3 rounded-2xl border border-red-500/20 bg-red-500/5 p-4 text-sm text-red-400">
          <AlertCircle className="h-5 w-5 shrink-0 text-red-400" />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="mb-6 flex items-center gap-3 rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-4 text-sm text-emerald-400">
          <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-400" />
          <span>{success}</span>
        </div>
      )}

      {/* Financial Overview Metrics */}
      <div className="mb-8 grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-white/5 bg-zinc-900 p-5 shadow-lg">
          <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
            Total Outstanding Debt
          </p>
          <p className="mt-2 text-3xl font-black" style={{ color: "var(--app-accent)" }}>
            ₹{formatMoney(totalOutstanding)}
          </p>
          <p className="mt-1 text-xs text-zinc-500">
            {payableCredits.length} active credit bill(s) pending
          </p>
        </div>

        <div className="rounded-2xl border border-white/5 bg-zinc-900 p-5 shadow-lg">
          <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
            Payment Records
          </p>
          <p className="mt-2 text-3xl font-black text-white">{payments.length}</p>
          <p className="mt-1 text-xs text-emerald-400">
            {payments.filter((p) => p.status === "approved").length} approved payments
          </p>
        </div>

        <div className="rounded-2xl border border-white/5 bg-zinc-900 p-5 shadow-lg">
          <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
            Pending Claims Under Review
          </p>
          <p className="mt-2 text-3xl font-black text-amber-400">
            {payments.filter((p) => p.status === "pending").length}
          </p>
          <p className="mt-1 text-xs text-zinc-500">
            Awaiting store admin verification
          </p>
        </div>
      </div>

      <div className="grid min-w-0 gap-6 lg:grid-cols-[430px_minmax(0,1fr)]">
        {/* Payment Submission Interactive Form */}
        <div className="min-w-0 rounded-3xl border border-white/5 bg-zinc-900 p-5 shadow-2xl sm:p-6 space-y-5">
          <div className="border-b border-white/5 pb-4">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Wallet className="h-5 w-5 text-[var(--app-accent)]" />
              <span>Make Repayment / Claim</span>
            </h2>
            <p className="text-xs text-zinc-400 mt-0.5">
              Full or partial repayments with multi-channel support.
            </p>
          </div>

          {totalOutstanding <= 0 ? (
            <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-6 text-center">
              <CheckCircle2 className="mx-auto h-10 w-10 text-emerald-400" />
              <p className="mt-3 text-base font-bold text-emerald-400">
                All Credits Fully Paid!
              </p>
              <p className="mt-1 text-xs text-zinc-400">
                You have zero pending amount. Your trust score is in good standing!
              </p>
            </div>
          ) : (
            <>
              {/* Step 1: Select Repayment Target */}
              <div>
                <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-zinc-400">
                  1. Select Credit Account
                </label>

                <select
                  value={selectedCredit}
                  onChange={(e) => setSelectedCredit(e.target.value)}
                  className="w-full rounded-xl border border-zinc-700 bg-zinc-950 px-3.5 py-3 text-xs sm:text-sm text-white outline-none transition focus:border-[var(--app-accent)]"
                >
                  <option value="auto">
                    🌟 All Outstanding Debt (Total: ₹{formatMoney(totalOutstanding)})
                  </option>
                  {payableCredits.map((credit, idx) => (
                    <option key={credit._id} value={credit._id}>
                      Bill #{String(credit._id).slice(-6).toUpperCase()} • Pending: ₹{formatMoney(credit.pendingAmount)} (Due {formatDate(credit.dueDate)})
                    </option>
                  ))}
                </select>
              </div>

              {/* Step 2: Choose Payment Mode (Full vs Partial) */}
              <div>
                <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-zinc-400">
                  2. Choose Payment Type
                </label>

                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setPaymentTypeMode("full");
                      setAmount(String(targetMaxAmount));
                    }}
                    className={`rounded-xl border p-3 text-left transition ${
                      paymentTypeMode === "full"
                        ? "border-emerald-500/50 bg-emerald-500/10 shadow"
                        : "border-white/5 bg-zinc-950/60 hover:border-white/10"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-white">Full Settlement</span>
                      {paymentTypeMode === "full" && (
                        <Check className="h-3.5 w-3.5 text-emerald-400" />
                      )}
                    </div>
                    <p className="mt-1 text-sm font-black text-emerald-400">
                      ₹{formatMoney(targetMaxAmount)}
                    </p>
                    <p className="text-[10px] text-zinc-500">Clears 100% balance</p>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPaymentTypeMode("partial")}
                    className={`rounded-xl border p-3 text-left transition ${
                      paymentTypeMode === "partial"
                        ? "border-[var(--app-accent-border)] bg-[var(--app-accent-soft)] shadow"
                        : "border-white/5 bg-zinc-950/60 hover:border-white/10"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-white">Partial Payment</span>
                      {paymentTypeMode === "partial" && (
                        <Check className="h-3.5 w-3.5 text-[var(--app-accent)]" />
                      )}
                    </div>
                    <p className="mt-1 text-sm font-black text-[var(--app-accent)]">
                      Flexible Custom
                    </p>
                    <p className="text-[10px] text-zinc-500">Pay any partial amount</p>
                  </button>
                </div>
              </div>

              {/* Step 3: Enter Amount & Shortcuts */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-zinc-400">
                    3. Repayment Amount (₹)
                  </label>
                  {paymentTypeMode === "partial" && (
                    <span className="text-[11px] text-zinc-400">
                      Max: ₹{formatMoney(targetMaxAmount)}
                    </span>
                  )}
                </div>

                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-bold text-zinc-500">
                    ₹
                  </span>
                  <input
                    type="number"
                    min="1"
                    max={targetMaxAmount}
                    step="1"
                    value={amount}
                    onChange={(e) => {
                      handleAmountChange(e);
                      if (fieldErrors.amount) setFieldErrors((prev) => ({ ...prev, amount: "" }));
                    }}
                    placeholder="Enter amount to pay"
                    className={`w-full rounded-xl border bg-zinc-950 pl-8 pr-4 py-2.5 text-sm font-bold text-white outline-none transition ${
                      fieldErrors.amount ? "border-red-500 ring-1 ring-red-500" : "border-zinc-700 focus:border-[var(--app-accent)]"
                    }`}
                  />
                </div>
                {fieldErrors.amount && (
                  <p className="mt-1 text-xs text-red-500 font-medium">
                    {fieldErrors.amount}
                  </p>
                )}

                {/* Quick Percentage Chips */}
                <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
                  {[25, 50, 75].map((pct) => (
                    <button
                      key={pct}
                      type="button"
                      onClick={() => handlePercentageSelect(pct)}
                      className="rounded-lg border border-white/10 bg-zinc-950 px-2.5 py-1 text-[11px] font-semibold text-zinc-300 hover:border-[var(--app-accent-border)] hover:bg-[var(--app-accent-soft)] hover:text-white transition"
                    >
                      {pct}%
                    </button>
                  ))}
                  {targetMaxAmount >= 500 && (
                    <button
                      type="button"
                      onClick={() => handleFixedAmountSelect(500)}
                      className="rounded-lg border border-white/10 bg-zinc-950 px-2.5 py-1 text-[11px] font-semibold text-zinc-300 hover:border-[var(--app-accent-border)] hover:text-white transition"
                    >
                      ₹500
                    </button>
                  )}
                  {targetMaxAmount >= 1000 && (
                    <button
                      type="button"
                      onClick={() => handleFixedAmountSelect(1000)}
                      className="rounded-lg border border-white/10 bg-zinc-950 px-2.5 py-1 text-[11px] font-semibold text-zinc-300 hover:border-[var(--app-accent-border)] hover:text-white transition"
                    >
                      ₹1,000
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => {
                      setPaymentTypeMode("full");
                      setAmount(String(targetMaxAmount));
                    }}
                    className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-1 text-[11px] font-bold text-emerald-400 hover:bg-emerald-500/20 transition"
                  >
                    100% Full
                  </button>
                </div>
              </div>

              {/* Step 4: Live Debt Calculation Summary */}
              <div className="rounded-2xl border border-white/10 bg-zinc-950/80 p-3.5 text-xs text-zinc-400 space-y-1.5">
                <div className="flex justify-between">
                  <span>Current Outstanding:</span>
                  <span className="font-semibold text-white">₹{formatMoney(targetMaxAmount)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Paying in this claim:</span>
                  <span className="font-bold text-emerald-400">
                    ₹{formatMoney(parsedAmount)} {isPayingFull ? "(Full Settlement)" : "(Partial Claim)"}
                  </span>
                </div>
                <div className="flex justify-between border-t border-white/5 pt-1.5">
                  <span>Remaining Debt Balance:</span>
                  <span className={`font-black ${remainingAfterPayment === 0 ? "text-emerald-400" : "text-rose-400"}`}>
                    ₹{formatMoney(remainingAfterPayment)}
                  </span>
                </div>
              </div>

              {/* Step 5: Select Payment Channel / Method */}
              <div>
                <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-zinc-400">
                  4. Select Payment Channel
                </label>

                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setPaymentMethod("upi")}
                    className={`rounded-xl border p-2.5 text-center transition ${
                      paymentMethod === "upi"
                        ? "border-[var(--app-accent-border)] bg-[var(--app-accent-soft)] text-white shadow"
                        : "border-white/5 bg-zinc-950 text-zinc-400 hover:border-white/10 hover:text-white"
                    }`}
                  >
                    <Smartphone className="mx-auto h-4 w-4 mb-1" />
                    <span className="text-xs font-bold block">UPI / QR</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPaymentMethod("cash")}
                    className={`rounded-xl border p-2.5 text-center transition ${
                      paymentMethod === "cash"
                        ? "border-[var(--app-accent-border)] bg-[var(--app-accent-soft)] text-white shadow"
                        : "border-white/5 bg-zinc-950 text-zinc-400 hover:border-white/10 hover:text-white"
                    }`}
                  >
                    <Banknote className="mx-auto h-4 w-4 mb-1" />
                    <span className="text-xs font-bold block">Cash Claim</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPaymentMethod("razorpay")}
                    disabled={!paymentSettings.razorpayEnabled}
                    className={`rounded-xl border p-2.5 text-center transition disabled:opacity-30 disabled:cursor-not-allowed ${
                      paymentMethod === "razorpay"
                        ? "border-emerald-500/50 bg-emerald-500/10 text-emerald-400 shadow"
                        : "border-white/5 bg-zinc-950 text-zinc-400 hover:border-white/10 hover:text-white"
                    }`}
                  >
                    <CreditCard className="mx-auto h-4 w-4 mb-1" />
                    <span className="text-xs font-bold block">Online Gateway</span>
                  </button>
                </div>
              </div>

              {/* Method Specific Fields */}
              <form onSubmit={handleClaimPayment} className="space-y-4 pt-1">
                {paymentMethod === "upi" && (
                  <div className="space-y-3.5 rounded-2xl border border-white/5 bg-zinc-950/60 p-4">
                    <div>
                      <label className="mb-1 block text-xs font-semibold text-zinc-300">
                        UPI Transaction / UTR ID
                      </label>
                      <input
                        type="text"
                        value={transactionId}
                        onChange={(e) => {
                          setTransactionId(e.target.value);
                          if (fieldErrors.transactionId) setFieldErrors((prev) => ({ ...prev, transactionId: "" }));
                        }}
                        placeholder="e.g. 324109823412"
                        className={`w-full rounded-xl border bg-zinc-950 px-3.5 py-2 text-xs text-white outline-none ${
                          fieldErrors.transactionId ? "border-red-500 ring-1 ring-red-500" : "border-zinc-700 focus:border-[var(--app-accent)]"
                        }`}
                      />
                      {fieldErrors.transactionId && (
                        <p className="mt-1 text-xs text-red-500 font-medium">
                          {fieldErrors.transactionId}
                        </p>
                      )}
                    </div>

                    <div>
                      <label className="mb-1 block text-xs font-semibold text-zinc-300">
                        Payment Screenshot Proof (Optional / Recommended)
                      </label>
                      <input
                        type="file"
                        accept="image/png,image/jpeg,image/jpg,image/webp"
                        onChange={handleFileChange}
                        className="w-full rounded-xl border border-zinc-700 bg-zinc-950 px-3 py-2 text-xs text-zinc-400 file:mr-3 file:rounded-lg file:border-0 file:bg-[var(--app-accent)] file:px-3 file:py-1 file:text-xs file:font-semibold file:text-white hover:file:opacity-90 cursor-pointer"
                      />

                      {paymentProofPreview && (
                        <div className="mt-2 flex items-center gap-2 rounded-xl border border-emerald-500/30 bg-emerald-950/30 p-2">
                          <img
                            src={paymentProofPreview}
                            alt="Screenshot Preview"
                            className="h-10 w-10 object-cover rounded-lg"
                          />
                          <div className="flex-1 min-w-0">
                            <p className="text-xs text-emerald-400 font-medium truncate">
                              ✓ {paymentProof?.name}
                            </p>
                            <p className="text-[10px] text-zinc-400">
                              {(paymentProof?.size / 1024).toFixed(1)} KB
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={clearProofFile}
                            className="p-1 text-zinc-400 hover:text-red-400"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                      )}
                    </div>

                    <button
                      type="submit"
                      disabled={submitting || parsedAmount <= 0}
                      className="w-full rounded-xl px-5 py-3 text-xs sm:text-sm font-bold text-white shadow-lg transition hover:opacity-90 disabled:opacity-50"
                      style={{ backgroundColor: "var(--app-accent)" }}
                    >
                      {submitting
                        ? "Submitting UPI Claim..."
                        : `Submit UPI Claim (₹${formatMoney(parsedAmount)})`}
                    </button>
                  </div>
                )}

                {paymentMethod === "cash" && (
                  <div className="space-y-3.5 rounded-2xl border border-white/5 bg-zinc-950/60 p-4">
                    <div>
                      <label className="mb-1 block text-xs font-semibold text-zinc-300">
                        Cash Given To (Staff / Owner Name)
                      </label>
                      <input
                        type="text"
                        value={claimedReceiver}
                        onChange={(e) => setClaimedReceiver(e.target.value)}
                        placeholder="e.g. Counter Cashier / Store Owner"
                        className="w-full rounded-xl border border-zinc-700 bg-zinc-950 px-3.5 py-2 text-xs text-white outline-none focus:border-[var(--app-accent)]"
                      />
                    </div>

                    <div>
                      <label className="mb-1 block text-xs font-semibold text-zinc-300">
                        Note / Remarks (Optional)
                      </label>
                      <input
                        type="text"
                        value={note}
                        onChange={(e) => setNote(e.target.value)}
                        placeholder="e.g. Handed cash in morning"
                        className="w-full rounded-xl border border-zinc-700 bg-zinc-950 px-3.5 py-2 text-xs text-white outline-none focus:border-[var(--app-accent)]"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={submitting || parsedAmount <= 0}
                      className="w-full rounded-xl bg-amber-500 hover:bg-amber-400 px-5 py-3 text-xs sm:text-sm font-bold text-black shadow-lg transition disabled:opacity-50"
                    >
                      {submitting
                        ? "Submitting Cash Claim..."
                        : `Submit Cash Claim (₹${formatMoney(parsedAmount)})`}
                    </button>
                  </div>
                )}

                {paymentMethod === "razorpay" && (
                  <div className="space-y-3.5 rounded-2xl border border-emerald-500/20 bg-emerald-950/20 p-4">
                    <p className="text-xs text-zinc-300">
                      {paymentSettings.razorpayMessage ||
                        "Instant online payment via UPI, Debit/Credit Card, or NetBanking."}
                    </p>
                    <button
                      type="button"
                      onClick={handleRazorpayPayment}
                      disabled={razorpayLoading || parsedAmount <= 0}
                      className="w-full rounded-xl bg-emerald-500 hover:bg-emerald-400 px-5 py-3 text-xs sm:text-sm font-bold text-black shadow-lg transition disabled:opacity-50"
                    >
                      {razorpayLoading
                        ? "Processing Gateway..."
                        : `Pay ₹${formatMoney(parsedAmount)} Online Now`}
                    </button>
                  </div>
                )}
              </form>
            </>
          )}
        </div>

        {/* Customer Payment History Table */}
        <div className="min-w-0 rounded-3xl border border-white/5 bg-zinc-900 p-5 shadow-2xl sm:p-6">
          <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-lg font-bold text-white sm:text-xl">Payment History & Claims</h2>
              <p className="mt-0.5 text-xs text-zinc-400">
                Track verification status of all your repayments.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <input
                type="search"
                placeholder="Search by ID, UTR, method..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="rounded-xl border border-zinc-800 bg-zinc-950 px-3 py-1.5 text-xs text-white outline-none focus:border-[var(--app-accent)] w-full sm:w-48"
              />

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="rounded-xl border border-zinc-800 bg-zinc-950 px-3 py-1.5 text-xs text-zinc-300 outline-none focus:border-[var(--app-accent)]"
              >
                <option value="all">All Status</option>
                <option value="pending">Pending</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
              </select>
            </div>
          </div>

          {filteredPayments.length === 0 ? (
            <div className="rounded-2xl border border-white/5 bg-zinc-950/40 p-12 text-center text-zinc-500">
              <FileText className="mx-auto h-8 w-8 text-zinc-600 mb-2" />
              <p className="text-sm">No payment records match your filters.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredPayments.map((payment) => (
                <div
                  key={payment._id}
                  className="rounded-2xl border border-white/5 bg-zinc-950 p-4 transition hover:bg-white/[0.02]"
                >
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-start gap-3">
                      <div
                        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-sm font-bold ${
                          payment.paymentMethod === "upi"
                            ? "bg-blue-500/10 text-blue-400 border border-blue-500/20"
                            : payment.paymentMethod === "cash"
                            ? "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                            : "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                        }`}
                      >
                        {payment.paymentMethod === "cash" ? (
                          <Banknote className="h-4 w-4" />
                        ) : payment.paymentMethod === "upi" ? (
                          <Smartphone className="h-4 w-4" />
                        ) : (
                          <CreditCard className="h-4 w-4" />
                        )}
                      </div>

                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-sm font-bold text-white">
                            ₹{formatMoney(payment.amount)}
                          </span>
                          <span
                            className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase ${getStatusClass(
                              payment.status
                            )}`}
                          >
                            {payment.status}
                          </span>
                          <span className="rounded border border-zinc-800 bg-zinc-900 px-2 py-0.5 text-[10px] font-mono text-zinc-400 uppercase">
                            {payment.paymentMethod}
                          </span>
                        </div>

                        <p className="mt-1 text-xs text-zinc-400">
                          {payment.note ||
                            (payment.transactionId
                              ? `UTR: ${payment.transactionId}`
                              : payment.claimedReceiver
                              ? `Given to: ${payment.claimedReceiver?.name || payment.claimedReceiver}`
                              : "Payment claim")}
                        </p>

                        {payment.paymentProof && (
                          <button
                            type="button"
                            onClick={() => setPreviewImage(payment.paymentProof)}
                            className="mt-1.5 inline-flex items-center gap-1 text-[11px] font-semibold text-blue-400 hover:underline"
                          >
                            <Eye className="h-3 w-3" />
                            <span>View Uploaded Screenshot</span>
                          </button>
                        )}
                      </div>
                    </div>

                    <div className="text-right text-xs text-zinc-500 font-mono border-t border-white/5 pt-2 sm:border-0 sm:pt-0">
                      <p>{formatDate(payment.paidAt || payment.createdAt)}</p>
                      <p className="text-[10px] text-zinc-600">
                        ID: #{String(payment._id).slice(-8)}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Screenshot Preview Modal */}
      {previewImage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4 backdrop-blur-sm">
          <div className="relative max-w-lg w-full overflow-hidden rounded-2xl border border-white/10 bg-zinc-950 p-4 shadow-2xl">
            <div className="flex items-center justify-between mb-3 border-b border-white/10 pb-2">
              <h3 className="text-sm font-bold text-white">Payment Screenshot Proof</h3>
              <button
                type="button"
                onClick={() => setPreviewImage(null)}
                className="p-1 text-zinc-400 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="max-h-[70vh] overflow-auto rounded-xl">
              <img
                src={previewImage}
                alt="Payment Proof"
                className="w-full object-contain rounded-lg"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Payments;