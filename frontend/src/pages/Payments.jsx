import React, { useEffect, useMemo, useState } from "react";
import api from "../services/api";

const Payments = () => {
  const [credits, setCredits] = useState([]);
  const [payments, setPayments] = useState([]);

  const [paymentSettings, setPaymentSettings] = useState({
    razorpayEnabled: false,
    razorpayMessage: "In case of emergency, use Razorpay for payment.",
  });

  const [selectedCredit, setSelectedCredit] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("cash");
  const [amount, setAmount] = useState("");

  const [transactionId, setTransactionId] = useState("");
  const [paymentProof, setPaymentProof] = useState(null);
  const [claimedReceiver, setClaimedReceiver] = useState("");

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [razorpayLoading, setRazorpayLoading] = useState(false);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

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

      setCredits(creditsResponse.data?.credits || []);
      setPayments(paymentsResponse.data?.payments || []);

      setPaymentSettings(
        settingsResponse.data?.settings || {
          razorpayEnabled: false,
          razorpayMessage: "In case of emergency, use Razorpay for payment.",
        }
      );
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

  const currentCredit = useMemo(() => {
    return credits.find((credit) => String(credit._id) === String(selectedCredit));
  }, [credits, selectedCredit]);

  const totalOutstanding = useMemo(() => {
    return credits.reduce(
      (total, credit) => total + Number(credit.pendingAmount || 0),
      0
    );
  }, [credits]);

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
        return "bg-emerald-500/10 text-emerald-400";
      case "pending":
        return "bg-yellow-500/10 text-yellow-400";
      case "rejected":
        return "bg-red-500/10 text-red-400";
      default:
        return "bg-zinc-500/10 text-zinc-400";
    }
  };

  const handleCreditChange = (e) => {
    const creditId = e.target.value;
    setSelectedCredit(creditId);
    setAmount("");
  };

  const handleAmountChange = (e) => {
    const value = e.target.value;
    if (value === "") {
      setAmount("");
      return;
    }

    const numericValue = Number(value);
    if (!Number.isFinite(numericValue)) {
      return;
    }

    if (
      currentCredit &&
      numericValue > Number(currentCredit.pendingAmount || 0)
    ) {
      setAmount(String(currentCredit.pendingAmount));
      return;
    }

    setAmount(value);
  };

  const handlePaymentMethodChange = (method) => {
    setPaymentMethod(method);
    setTransactionId("");
    setPaymentProof(null);
    setClaimedReceiver("");
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) {
      setPaymentProof(null);
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
  };

  const validatePayment = () => {
    setError("");
    setSuccess("");

    if (!selectedCredit) {
      setError("Please select a credit account.");
      return false;
    }

    if (!currentCredit) {
      setError("Selected credit could not be found.");
      return false;
    }

    const paymentAmount = Number(amount);
    if (!Number.isFinite(paymentAmount) || paymentAmount <= 0) {
      setError("Please enter a valid payment amount.");
      return false;
    }

    const pendingAmount = Number(currentCredit.pendingAmount || 0);
    if (paymentAmount > pendingAmount) {
      setError(`Maximum payable amount is ₹${formatMoney(pendingAmount)}.`);
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
      if (!transactionId.trim()) {
        setError("UPI Transaction / UTR ID is required.");
        return;
      }

      if (!paymentProof) {
        setError("Please upload the UPI payment screenshot.");
        return;
      }
    }

    if (paymentMethod === "cash") {
      if (!claimedReceiver.trim()) {
        setError(
          "Please enter the name of the person who received the cash."
        );
        return;
      }
    }

    try {
      setSubmitting(true);
      setError("");
      setSuccess("");

      const payload = {
        creditId: selectedCredit,
        amount: Number(amount),
        paymentMethod,
        transactionId: paymentMethod === "upi" ? transactionId.trim() : null,
        claimedReceiver: paymentMethod === "cash" ? claimedReceiver.trim() : null,
        paymentProof: null,
        note: paymentMethod === "upi" ? "UPI payment claim" : "Cash payment claim",
      };

      const response = await api.post("/payments/claim", payload);

      setSuccess(response.data?.message || "Payment submitted successfully.");
      setAmount("");
      setTransactionId("");
      setPaymentProof(null);
      setClaimedReceiver("");

      await loadPaymentPage();
    } catch (err) {
      console.error("Payment claim error:", err);
      setError(
        err.response?.data?.message || err.message || "Unable to submit payment."
      );
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

      const orderResponse = await api.post(
        "/payments/razorpay/create-order",
        {
          creditId: selectedCredit,
          amount: Number(amount),
        }
      );

      const order = orderResponse.data?.order;
      if (!order?.id) {
        throw new Error("Razorpay order could not be created.");
      }

      const accentColor =
        getComputedStyle(document.documentElement)
          .getPropertyValue("--app-accent")
          .trim() || "#f97316";

      const options = {
        key: import.meta.env.VITE_RAZORPAY_KEY_ID,
        amount: order.amount,
        currency: order.currency || "INR",
        name: "SmartShop",
        description: "Credit payment",
        order_id: order.id,
        handler: async function (razorpayResponse) {
          try {
            setRazorpayLoading(true);

            const verifyResponse = await api.post(
              "/payments/razorpay/verify",
              {
                creditId: selectedCredit,
                razorpay_order_id: razorpayResponse.razorpay_order_id,
                razorpay_payment_id: razorpayResponse.razorpay_payment_id,
                razorpay_signature: razorpayResponse.razorpay_signature,
              }
            );

            setSuccess(
              verifyResponse.data?.message || "Payment successful."
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
            setRazorpayLoading(false);
          },
        },
        theme: {
          color: accentColor,
        },
      };

      const razorpay = new window.Razorpay(options);
      razorpay.on("payment.failed", function (response) {
        console.error("Razorpay payment failed:", response);
        setError(response.error?.description || "Razorpay payment failed.");
        setRazorpayLoading(false);
      });

      razorpay.open();
    } catch (err) {
      console.error("Razorpay error:", err);
      setError(
        err.response?.data?.message ||
          err.message ||
          "Unable to start Razorpay payment."
      );
      setRazorpayLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="mx-auto flex min-h-[60vh] w-full max-w-7xl items-center justify-center px-4">
        <div className="text-center">
          <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-2 border-zinc-700 border-t-[var(--app-accent)]" />
          <p className="text-sm text-zinc-400">Loading payments...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 md:px-10 lg:px-[50px]">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white sm:text-4xl">Payments</h1>
        <p className="mt-2 text-sm text-zinc-400 sm:text-base">
          Pay your outstanding credit and track your payment history.
        </p>
      </div>

      {error && (
        <div className="mb-6 rounded-xl border border-red-500/20 bg-red-500/5 px-4 py-3">
          <p className="text-sm text-red-400">{error}</p>
        </div>
      )}

      {success && (
        <div className="mb-6 rounded-xl border border-emerald-500/20 bg-emerald-500/5 px-4 py-3">
          <p className="text-sm text-emerald-400">{success}</p>
        </div>
      )}

      {/* Credit overview metrics */}
      <div className="mb-6 grid gap-4 sm:grid-cols-2">
        <div className="rounded-2xl border border-white/5 bg-zinc-900 p-5">
          <p className="text-sm text-zinc-500">Total Outstanding</p>
          <p className="mt-2 text-2xl font-bold text-[var(--app-accent)]">
            ₹{formatMoney(totalOutstanding)}
          </p>
        </div>

        <div className="rounded-2xl border border-white/5 bg-zinc-900 p-5">
          <p className="text-sm text-zinc-500">Payment Records</p>
          <p className="mt-2 text-2xl font-bold text-white">{payments.length}</p>
        </div>
      </div>

      <div className="grid min-w-0 gap-6 lg:grid-cols-[380px_minmax(0,1fr)]">
        {/* Payment submission pane */}
        <div className="min-w-0 rounded-2xl border border-white/5 bg-zinc-900 p-5 shadow-[0_4px_20px_rgba(0,0,0,0.3)] sm:p-6">
          <h2 className="mb-6 text-xl font-semibold text-white">Make Payment</h2>

          <div className="mb-5">
            <label className="mb-2 block text-sm font-medium text-zinc-300">
              Select Credit
            </label>

            {payableCredits.length === 0 ? (
              <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-4">
                <p className="text-sm font-medium text-emerald-400">
                  No outstanding credit
                </p>
                <p className="mt-1 text-xs text-zinc-500">
                  You currently have no pending amount to pay.
                </p>
              </div>
            ) : (
              <select
                value={selectedCredit}
                onChange={handleCreditChange}
                className="w-full rounded-lg border border-zinc-700 bg-zinc-950 px-4 py-3 text-sm text-white outline-none transition focus:border-[var(--app-accent-border)]"
              >
                <option value="">Select credit account</option>
                {payableCredits.map((credit) => (
                  <option key={credit._id} value={credit._id}>
                    ₹{formatMoney(credit.pendingAmount)} pending • Due{" "}
                    {formatDate(credit.dueDate)}
                  </option>
                ))}
              </select>
            )}
          </div>

          {currentCredit && (
            <div className="mb-5 rounded-xl border border-white/5 bg-zinc-950 p-4">
              <div className="flex items-center justify-between">
                <span className="text-xs text-zinc-500">Borrowed</span>
                <span className="text-sm font-medium text-zinc-300">
                  ₹{formatMoney(currentCredit.borrowedAmount)}
                </span>
              </div>

              <div className="mt-3 flex items-center justify-between">
                <span className="text-xs text-zinc-500">Paid</span>
                <span className="text-sm font-medium text-emerald-400">
                  ₹{formatMoney(currentCredit.paidAmount)}
                </span>
              </div>

              <div className="mt-3 flex items-center justify-between">
                <span className="text-xs text-zinc-500">Pending</span>
                <span className="text-sm font-semibold text-[var(--app-accent)]">
                  ₹{formatMoney(currentCredit.pendingAmount)}
                </span>
              </div>

              <div className="mt-3 flex items-center justify-between">
                <span className="text-xs text-zinc-500">Due Date</span>
                <span className="text-sm text-zinc-300">
                  {formatDate(currentCredit.dueDate)}
                </span>
              </div>
            </div>
          )}

          {payableCredits.length > 0 && (
            <>
              <div className="mb-5">
                <label className="mb-2 block text-sm font-medium text-zinc-300">
                  Payment Method
                </label>

                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => handlePaymentMethodChange("cash")}
                    className={`rounded-lg border px-3 py-3 text-sm font-medium transition ${
                      paymentMethod === "cash"
                        ? "border-[var(--app-accent-border)] bg-[var(--app-accent)] text-white"
                        : "border-zinc-700 bg-zinc-950 text-zinc-400 hover:border-zinc-500 hover:text-white"
                    }`}
                  >
                    💵 Cash
                  </button>

                  <button
                    type="button"
                    onClick={() => handlePaymentMethodChange("upi")}
                    className={`rounded-lg border px-3 py-3 text-sm font-medium transition ${
                      paymentMethod === "upi"
                        ? "border-[var(--app-accent-border)] bg-[var(--app-accent)] text-white"
                        : "border-zinc-700 bg-zinc-950 text-zinc-400 hover:border-zinc-500 hover:text-white"
                    }`}
                  >
                    📱 UPI
                  </button>
                </div>
              </div>

              <form onSubmit={handleClaimPayment}>
                <div className="mb-5">
                  <label className="mb-2 block text-sm font-medium text-zinc-300">
                    Payment Amount
                  </label>

                  <input
                    type="number"
                    min="1"
                    max={currentCredit ? currentCredit.pendingAmount : undefined}
                    step="0.01"
                    value={amount}
                    onChange={handleAmountChange}
                    placeholder="Enter amount"
                    className="w-full rounded-lg border border-zinc-700 bg-zinc-950 px-4 py-3 text-sm text-white outline-none transition focus:border-[var(--app-accent-border)]"
                  />

                  {currentCredit && (
                    <p className="mt-2 text-xs text-zinc-500">
                      Maximum: ₹{formatMoney(currentCredit.pendingAmount)}
                    </p>
                  )}
                </div>

                {paymentMethod === "cash" && (
                  <>
                    <div className="mb-5">
                      <label className="mb-2 block text-sm font-medium text-zinc-300">
                        Cash Received By
                      </label>

                      <input
                        type="text"
                        value={claimedReceiver}
                        onChange={(e) => setClaimedReceiver(e.target.value)}
                        placeholder="Enter receiver name"
                        className="w-full rounded-lg border border-zinc-700 bg-zinc-950 px-4 py-3 text-sm text-white outline-none transition focus:border-[var(--app-accent-border)]"
                      />
                    </div>

                    <div className="mb-5 rounded-lg border border-yellow-500/20 bg-yellow-500/5 p-4">
                      <p className="text-sm font-medium text-yellow-400">
                        💵 Cash Payment
                      </p>
                      <p className="mt-1 text-xs leading-5 text-zinc-400">
                        Your cash payment claim will remain Pending until it is verified by the administrator.
                      </p>
                    </div>

                    <button
                      type="submit"
                      disabled={submitting}
                      className="w-full rounded-lg bg-[var(--app-accent)] px-5 py-3 font-semibold text-white transition hover:bg-[var(--app-accent-hover)] disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {submitting ? "Submitting..." : "Submit Cash Payment"}
                    </button>
                  </>
                )}

                {paymentMethod === "upi" && (
                  <>
                    <div className="mb-5">
                      <label className="mb-2 block text-sm font-medium text-zinc-300">
                        UPI Transaction / UTR ID
                      </label>

                      <input
                        type="text"
                        value={transactionId}
                        onChange={(e) => setTransactionId(e.target.value)}
                        placeholder="Enter UTR / transaction ID"
                        className="w-full rounded-lg border border-zinc-700 bg-zinc-950 px-4 py-3 text-sm text-white outline-none transition focus:border-[var(--app-accent-border)]"
                      />
                    </div>

                    <div className="mb-5">
                      <label className="mb-2 block text-sm font-medium text-zinc-300">
                        Payment Screenshot
                      </label>

                      <input
                        type="file"
                        accept="image/png,image/jpeg,image/jpg,image/webp"
                        onChange={handleFileChange}
                        className="w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-3 text-sm text-zinc-400 file:mr-4 file:rounded-md file:border-0 file:bg-[var(--app-accent)] file:px-4 file:py-2 file:font-medium file:text-white hover:file:bg-[var(--app-accent-hover)]"
                      />

                      {paymentProof && (
                        <p className="mt-2 truncate text-xs text-emerald-400">
                          ✓ {paymentProof.name}
                        </p>
                      )}
                    </div>

                    <div className="mb-5 rounded-lg border border-[var(--app-accent-border)] bg-[var(--app-accent-soft)] p-4">
                      <p className="text-sm font-medium text-[var(--app-accent)]">
                        📱 UPI Verification
                      </p>
                      <p className="mt-1 text-xs leading-5 text-zinc-400">
                        UTR and screenshot are required. Your payment will remain Pending until verified by the administrator.
                      </p>
                    </div>

                    <button
                      type="submit"
                      disabled={submitting}
                      className="w-full rounded-lg bg-[var(--app-accent)] px-5 py-3 font-semibold text-white transition hover:bg-[var(--app-accent-hover)] disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {submitting ? "Submitting..." : "Submit UPI Payment"}
                    </button>
                  </>
                )}
              </form>

              {paymentSettings.razorpayEnabled && (
                <>
                  <div className="my-6 flex items-center gap-3">
                    <div className="h-px flex-1 bg-white/5" />
                    <span className="text-xs text-zinc-600">OR</span>
                    <div className="h-px flex-1 bg-white/5" />
                  </div>

                  <div className="rounded-xl border border-white/5 bg-zinc-950 p-5">
                    <div className="mb-4 flex items-center justify-between">
                      <div>
                        <h3 className="font-semibold text-white">Razorpay</h3>
                        <p className="mt-1 text-xs text-zinc-500">
                          Instant online payment
                        </p>
                      </div>
                      <span className="rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-400">
                        Available
                      </span>
                    </div>

                    <div className="mb-4 rounded-lg border border-[var(--app-accent-border)] bg-[var(--app-accent-soft)] p-4">
                      <p className="text-sm font-medium text-[var(--app-accent)]">
                        Online Payment
                      </p>
                      <p className="mt-1 text-xs leading-5 text-zinc-400">
                        {paymentSettings.razorpayMessage}
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={handleRazorpayPayment}
                      disabled={razorpayLoading}
                      className="w-full rounded-lg border border-[var(--app-accent)] bg-[var(--app-accent-soft)] px-5 py-3 font-semibold text-[var(--app-accent)] transition hover:bg-[var(--app-accent)] hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {razorpayLoading ? "Processing..." : "Pay with Razorpay"}
                    </button>
                  </div>
                </>
              )}
            </>
          )}
        </div>

        {/* Customer payment history table */}
        <div className="min-w-0 rounded-2xl border border-white/5 bg-zinc-900 p-5 shadow-[0_4px_20px_rgba(0,0,0,0.3)] sm:p-6">
          <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h2 className="text-xl font-semibold text-white">Payment History</h2>
              <p className="mt-1 text-xs text-zinc-500">
                Your cash, UPI and online payments
              </p>
            </div>

            <div className="flex w-full flex-col gap-3 sm:flex-row lg:w-auto">
              <input
                type="search"
                placeholder="Search payments..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full rounded-lg border border-zinc-700 bg-zinc-950 px-4 py-2.5 text-sm text-white outline-none transition focus:border-[var(--app-accent-border)] sm:w-56"
              />

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full rounded-lg border border-zinc-700 bg-zinc-950 px-4 py-2.5 text-sm text-zinc-300 outline-none focus:border-[var(--app-accent-border)] sm:w-auto"
              >
                <option value="all">All Status</option>
                <option value="pending">Pending</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
              </select>
            </div>
          </div>

          <div className="hidden overflow-x-auto lg:block">
            <table className="w-full min-w-[700px] text-left">
              <thead>
                <tr className="border-b border-white/5 text-sm text-zinc-500">
                  <th className="px-3 py-4">Payment ID</th>
                  <th className="px-3 py-4">Amount</th>
                  <th className="px-3 py-4">Method</th>
                  <th className="px-3 py-4">Status</th>
                  <th className="px-3 py-4">Transaction</th>
                  <th className="px-3 py-4">Date</th>
                </tr>
              </thead>

              <tbody>
                {filteredPayments.map((payment) => (
                  <tr
                    key={payment._id}
                    className="border-b border-white/5 transition hover:bg-white/[0.02]"
                  >
                    <td className="px-3 py-4 font-medium text-white">
                      #{String(payment._id).slice(-8)}
                    </td>

                    <td className="px-3 py-4 font-semibold text-[var(--app-accent)]">
                      ₹{formatMoney(payment.amount)}
                    </td>

                    <td className="px-3 py-4 text-sm uppercase text-zinc-300">
                      {payment.paymentMethod}
                    </td>

                    <td className="px-3 py-4">
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-semibold ${getStatusClass(
                          payment.status
                        )}`}
                      >
                        {payment.status}
                      </span>
                    </td>

                    <td className="max-w-[180px] truncate px-3 py-4 text-sm text-zinc-400">
                      {payment.transactionId ||
                        payment.razorpayPaymentId ||
                        "-"}
                    </td>

                    <td className="px-3 py-4 text-sm text-zinc-500">
                      {formatDate(payment.paidAt)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:hidden">
            {filteredPayments.map((payment) => (
              <div
                key={payment._id}
                className="rounded-xl border border-white/5 bg-zinc-950 p-4"
              >
                <div className="mb-4 flex items-center justify-between gap-3">
                  <span className="font-semibold text-white">
                    #{String(payment._id).slice(-8)}
                  </span>
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-semibold ${getStatusClass(
                      payment.status
                    )}`}
                  >
                    {payment.status}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-zinc-500">Amount</p>
                    <p className="mt-1 font-semibold text-[var(--app-accent)]">
                      ₹{formatMoney(payment.amount)}
                    </p>
                  </div>

                  <div>
                    <p className="text-zinc-500">Method</p>
                    <p className="mt-1 uppercase text-zinc-300">
                      {payment.paymentMethod}
                    </p>
                  </div>

                  <div>
                    <p className="text-zinc-500">Date</p>
                    <p className="mt-1 text-zinc-400">
                      {formatDate(payment.paidAt)}
                    </p>
                  </div>

                  <div>
                    <p className="text-zinc-500">Transaction</p>
                    <p className="mt-1 truncate text-zinc-300">
                      {payment.transactionId ||
                        payment.razorpayPaymentId ||
                        "-"}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {filteredPayments.length === 0 && (
            <div className="py-12 text-center">
              <p className="text-zinc-500">No payment records found.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Payments;