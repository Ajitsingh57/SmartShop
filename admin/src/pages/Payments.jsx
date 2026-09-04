import React, { useEffect, useMemo, useState } from "react";
import { paymentsApi } from "../services/api";

const Payments = () => {
  const [activeTab, setActiveTab] = useState("pending");
  const [selectedClaim, setSelectedClaim] = useState(null);
  const [isImageFullView, setIsImageFullView] = useState(false);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [paymentSettings, setPaymentSettings] = useState({
    razorpayEnabled: false,
    razorpayMessage: "",
  });
  const [updatingSettings, setUpdatingSettings] = useState(false);

  const [claims, setClaims] = useState([]);

  // Fetch payments and gateway settings from backend
  const loadPaymentsData = async () => {
    try {
      setLoading(true);
      setError("");

      const [paymentsRes, settingsRes] = await Promise.allSettled([
        paymentsApi.getAll(),
        paymentsApi.getSettings(),
      ]);

      if (paymentsRes.status === "fulfilled") {
        const rawPayments = Array.isArray(paymentsRes.value?.payments)
          ? paymentsRes.value.payments
          : Array.isArray(paymentsRes.value)
          ? paymentsRes.value
          : [];

        const formatted = rawPayments.map((p) => {
          const user = p.userId || p.customerId?.userId || {};
          const customerName = user.name || p.customerId?.name || "Walk-in Customer";
          const customerPhone = user.phone || p.customerId?.phone || "";

          let displayStatus = "Pending";
          if (p.status === "approved") displayStatus = "Approved";
          if (p.status === "rejected") displayStatus = "Rejected";

          return {
            id: p._id,
            customer: customerName,
            phone: customerPhone,
            amount: Number(p.amount || 0),
            method: (p.paymentMethod || "cash").toUpperCase(),
            transactionId: p.transactionId || p.razorpayPaymentId || null,
            saleId: p.creditId ? `CREDIT-${String(p.creditId).slice(-6).toUpperCase()}` : null,
            date: new Date(p.paidAt || p.createdAt).toLocaleString("en-IN", {
              day: "2-digit",
              month: "short",
              year: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            }),
            proof: p.paymentProof || null,
            note: p.note || (p.claimedReceiver ? `Received by: ${p.claimedReceiver}` : ""),
            status: displayStatus,
          };
        });

        setClaims(formatted);
      }

      if (settingsRes.status === "fulfilled") {
        setPaymentSettings(
          settingsRes.value?.settings || {
            razorpayEnabled: false,
            razorpayMessage: "In case of emergency, use Razorpay for payment.",
          }
        );
      }
    } catch (err) {
      console.error("Failed to load payments:", err);
      setError(err?.message || "Failed to load payments.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPaymentsData();
  }, []);

  const pendingClaims = useMemo(
    () => claims.filter((claim) => claim.status === "Pending"),
    [claims]
  );
  const approvedClaims = useMemo(
    () => claims.filter((claim) => claim.status === "Approved"),
    [claims]
  );
  const rejectedClaims = useMemo(
    () => claims.filter((claim) => claim.status === "Rejected"),
    [claims]
  );

  const displayedClaims =
    activeTab === "pending"
      ? pendingClaims
      : activeTab === "approved"
      ? approvedClaims
      : rejectedClaims;

  const totalPending = pendingClaims.reduce((sum, claim) => sum + claim.amount, 0);
  const totalApproved = approvedClaims.reduce((sum, claim) => sum + claim.amount, 0);
  const totalRejected = rejectedClaims.reduce((sum, claim) => sum + claim.amount, 0);

  const handleApprove = async (id) => {
    try {
      setActionLoading(true);
      setError("");
      setSuccess("");

      await paymentsApi.approve(id);
      setSuccess("Payment approved successfully.");
      setSelectedClaim(null);
      setIsImageFullView(false);
      await loadPaymentsData();
    } catch (err) {
      console.error("Approve payment error:", err);
      setError(err?.message || "Failed to approve payment.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async (id) => {
    try {
      setActionLoading(true);
      setError("");
      setSuccess("");

      await paymentsApi.reject(id);
      setSuccess("Payment rejected.");
      setSelectedClaim(null);
      setIsImageFullView(false);
      await loadPaymentsData();
    } catch (err) {
      console.error("Reject payment error:", err);
      setError(err?.message || "Failed to reject payment.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleToggleRazorpay = async () => {
    try {
      setUpdatingSettings(true);
      setError("");
      setSuccess("");

      const updated = await paymentsApi.updateSettings({
        enabled: !paymentSettings.razorpayEnabled,
        message: paymentSettings.razorpayMessage,
      });

      setPaymentSettings(
        updated.settings || {
          ...paymentSettings,
          razorpayEnabled: !paymentSettings.razorpayEnabled,
        }
      );
      setSuccess(
        `Razorpay ${!paymentSettings.razorpayEnabled ? "enabled" : "disabled"} successfully.`
      );
    } catch (err) {
      console.error("Toggle Razorpay error:", err);
      setError(err?.message || "Failed to update Razorpay setting.");
    } finally {
      setUpdatingSettings(false);
    }
  };

  const handleCloseModal = () => {
    setSelectedClaim(null);
    setIsImageFullView(false);
  };

  const handleOpenFullImage = () => {
    setIsImageFullView(true);
  };

  const handleCloseFullImage = () => {
    setIsImageFullView(false);
  };

  const formatAmount = (amount) => `₹${amount.toLocaleString("en-IN")}`;

  const getMethodStyle = (method) => {
    if (method === "UPI") {
      return {
        backgroundColor: "rgba(168,85,247,0.10)",
        color: "#c084fc",
        borderColor: "rgba(168,85,247,0.10)",
      };
    }
    if (method === "CASH") {
      return {
        backgroundColor: "rgba(34,197,94,0.10)",
        color: "#4ade80",
        borderColor: "rgba(34,197,94,0.10)",
      };
    }
    return {
      backgroundColor: "rgba(59,130,246,0.10)",
      color: "#60a5fa",
      borderColor: "rgba(59,130,246,0.10)",
    };
  };

  const getStatusStyle = (status) => {
    if (status === "Pending") {
      return {
        backgroundColor: "var(--app-accent-soft)",
        color: "var(--app-accent)",
      };
    }
    if (status === "Approved") {
      return {
        backgroundColor: "rgba(34,197,94,0.10)",
        color: "#4ade80",
      };
    }
    return {
      backgroundColor: "rgba(239,68,68,0.10)",
      color: "#f87171",
    };
  };

  return (
    <div className="w-full space-y-6">
      {/* Header toolbar */}
        <div className="mb-7 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white sm:text-3xl">Payments</h1>
            <p className="mt-1 text-sm text-zinc-400">
              Verify and manage customer payment claims (Cash, UPI & Razorpay).
            </p>
          </div>

          {/* Razorpay Toggle Controls */}
          <div className="flex items-center gap-3 rounded-xl border p-3" style={{ borderColor: "var(--app-border)", backgroundColor: "var(--app-surface)" }}>
            <div className="text-right">
              <p className="text-xs font-semibold text-white">Online Razorpay Gateway</p>
              <p className="text-[11px] text-zinc-500">
                {paymentSettings.razorpayEnabled ? "Active for customers" : "Disabled"}
              </p>
            </div>
            <button
              type="button"
              onClick={handleToggleRazorpay}
              disabled={updatingSettings}
              className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                paymentSettings.razorpayEnabled
                  ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                  : "bg-zinc-800 text-zinc-400 hover:text-white"
              }`}
            >
              {updatingSettings ? "..." : paymentSettings.razorpayEnabled ? "Enabled" : "Enable"}
            </button>
          </div>
        </div>

        {error && (
          <div className="mb-5 rounded-lg border border-red-500/20 bg-red-500/5 px-4 py-3 text-sm text-red-400">
            {error}
          </div>
        )}

        {success && (
          <div className="mb-5 rounded-lg border border-emerald-500/20 bg-emerald-500/5 px-4 py-3 text-sm text-emerald-400">
            {success}
          </div>
        )}

        {/* Metrics Cards */}
        <div className="mb-7 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="rounded-xl border p-5" style={{ borderColor: "var(--app-border)", backgroundColor: "var(--app-surface)" }}>
            <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500">Pending Verification</p>
            <p className="mt-2 text-2xl font-bold text-white sm:text-3xl">{formatAmount(totalPending)}</p>
            <p className="mt-1 text-xs" style={{ color: "var(--app-accent)" }}>{pendingClaims.length} requests awaiting action</p>
          </div>

          <div className="rounded-xl border p-5" style={{ borderColor: "var(--app-border)", backgroundColor: "var(--app-surface)" }}>
            <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500">Approved Payments</p>
            <p className="mt-2 text-2xl font-bold text-white sm:text-3xl">{formatAmount(totalApproved)}</p>
            <p className="mt-1 text-xs text-emerald-400">{approvedClaims.length} cleared records</p>
          </div>

          <div className="rounded-xl border p-5" style={{ borderColor: "var(--app-border)", backgroundColor: "var(--app-surface)" }}>
            <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500">Rejected Claims</p>
            <p className="mt-2 text-2xl font-bold text-white sm:text-3xl">{formatAmount(totalRejected)}</p>
            <p className="mt-1 text-xs text-red-400">{rejectedClaims.length} rejected</p>
          </div>
        </div>

        {/* Tab Filters */}
        <div className="mb-6 flex gap-2 border-b pb-3" style={{ borderColor: "var(--app-border)" }}>
          {[
            { key: "pending", label: `Pending (${pendingClaims.length})` },
            { key: "approved", label: `Approved (${approvedClaims.length})` },
            { key: "rejected", label: `Rejected (${rejectedClaims.length})` },
          ].map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => setActiveTab(tab.key)}
              className={`rounded-lg px-4 py-2 text-sm font-semibold transition ${
                activeTab === tab.key
                  ? "text-white shadow-sm"
                  : "text-zinc-500 hover:text-zinc-300"
              }`}
              style={
                activeTab === tab.key
                  ? { backgroundColor: "var(--app-accent)", color: "#fff" }
                  : {}
              }
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Claims Table / List */}
        {loading ? (
          <div className="py-20 text-center text-zinc-500">Loading payments...</div>
        ) : displayedClaims.length === 0 ? (
          <div className="rounded-xl border p-12 text-center" style={{ borderColor: "var(--app-border)", backgroundColor: "var(--app-surface)" }}>
            <p className="text-zinc-500">No {activeTab} payment claims found.</p>
          </div>
        ) : (
          <div className="overflow-hidden rounded-xl border" style={{ borderColor: "var(--app-border)", backgroundColor: "var(--app-surface)" }}>
            {/* Desktop Table View */}
            <div className="hidden overflow-x-auto lg:block">
              <table className="w-full min-w-[750px] text-left text-sm">
                <thead>
                  <tr className="border-b text-xs uppercase tracking-wider text-zinc-500" style={{ borderColor: "var(--app-border)" }}>
                    <th className="px-5 py-4">Customer</th>
                    <th className="px-5 py-4">Amount</th>
                    <th className="px-5 py-4">Method</th>
                    <th className="px-5 py-4">Transaction / Note</th>
                    <th className="px-5 py-4">Date</th>
                    <th className="px-5 py-4">Status</th>
                    <th className="px-5 py-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {displayedClaims.map((claim) => (
                    <tr
                      key={claim.id}
                      className="border-b transition hover:bg-white/[0.02]"
                      style={{ borderColor: "var(--app-border)" }}
                    >
                      <td className="px-5 py-4">
                        <p className="font-semibold text-white">{claim.customer}</p>
                        {claim.phone && <p className="text-xs text-zinc-500">{claim.phone}</p>}
                      </td>
                      <td className="px-5 py-4 font-bold text-white">{formatAmount(claim.amount)}</td>
                      <td className="px-5 py-4">
                        <span className="rounded-md border px-2.5 py-1 text-xs font-semibold" style={getMethodStyle(claim.method)}>
                          {claim.method}
                        </span>
                      </td>
                      <td className="max-w-[200px] truncate px-5 py-4 text-zinc-400">
                        {claim.transactionId ? (
                          <span className="font-mono text-xs text-zinc-300">{claim.transactionId}</span>
                        ) : (
                          claim.note || "—"
                        )}
                      </td>
                      <td className="px-5 py-4 text-xs text-zinc-400">{claim.date}</td>
                      <td className="px-5 py-4">
                        <span className="rounded-full px-2.5 py-0.5 text-xs font-semibold" style={getStatusStyle(claim.status)}>
                          {claim.status}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-right">
                        <button
                          type="button"
                          onClick={() => setSelectedClaim(claim)}
                          className="rounded-lg border px-3 py-1.5 text-xs font-semibold text-zinc-300 transition hover:border-[var(--app-accent-border)] hover:bg-[var(--app-accent-soft)] hover:text-white"
                          style={{ borderColor: "var(--app-border)" }}
                        >
                          Review
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile & Tablet Cards View */}
            <div className="grid grid-cols-1 gap-3 p-3 sm:grid-cols-2 sm:p-4 lg:hidden">
              {displayedClaims.map((claim) => (
                <div
                  key={claim.id}
                  className="rounded-xl border p-4 flex flex-col justify-between"
                  style={{
                    borderColor: "var(--app-border)",
                    backgroundColor: "var(--app-surface-light)",
                  }}
                >
                  <div>
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="font-semibold text-white text-base">{claim.customer}</p>
                        {claim.phone && <p className="text-xs text-zinc-400">{claim.phone}</p>}
                      </div>
                      <span className="rounded-full px-2.5 py-0.5 text-xs font-semibold" style={getStatusStyle(claim.status)}>
                        {claim.status}
                      </span>
                    </div>

                    <div className="mt-3 flex items-center justify-between border-t pt-3" style={{ borderColor: "var(--app-border)" }}>
                      <div>
                        <span className="rounded-md border px-2 py-0.5 text-[11px] font-semibold" style={getMethodStyle(claim.method)}>
                          {claim.method}
                        </span>
                        <p className="mt-1 text-[11px] text-zinc-500">{claim.date}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-bold text-white">{formatAmount(claim.amount)}</p>
                      </div>
                    </div>

                    {claim.transactionId && (
                      <p className="mt-2 font-mono text-xs text-zinc-400">UTR: {claim.transactionId}</p>
                    )}
                  </div>

                  <div className="mt-3 border-t pt-3" style={{ borderColor: "var(--app-border)" }}>
                    <button
                      type="button"
                      onClick={() => setSelectedClaim(claim)}
                      className="w-full rounded-lg py-2 text-xs font-semibold text-white transition"
                      style={{ backgroundColor: "var(--app-accent)" }}
                    >
                      Review Claim
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Review Modal */}
        {selectedClaim && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
            <div className="w-full max-w-lg rounded-2xl border p-5 shadow-2xl max-h-[90vh] overflow-y-auto sm:p-6" style={{ borderColor: "var(--app-border)", backgroundColor: "var(--app-surface)" }}>
              <div className="mb-4 flex items-center justify-between">
                <h3 className="text-lg font-bold text-white">Payment Claim Details</h3>
                <button type="button" onClick={handleCloseModal} className="text-zinc-400 hover:text-white">✕</button>
              </div>

              <div className="space-y-3 text-sm">
                <div className="flex justify-between border-b pb-2" style={{ borderColor: "var(--app-border)" }}>
                  <span className="text-zinc-500">Customer</span>
                  <span className="font-semibold text-white">{selectedClaim.customer}</span>
                </div>
                <div className="flex justify-between border-b pb-2" style={{ borderColor: "var(--app-border)" }}>
                  <span className="text-zinc-500">Amount</span>
                  <span className="text-lg font-bold" style={{ color: "var(--app-accent)" }}>{formatAmount(selectedClaim.amount)}</span>
                </div>
                <div className="flex justify-between border-b pb-2" style={{ borderColor: "var(--app-border)" }}>
                  <span className="text-zinc-500">Method</span>
                  <span className="font-semibold text-zinc-300">{selectedClaim.method}</span>
                </div>
                {selectedClaim.transactionId && (
                  <div className="flex justify-between border-b pb-2" style={{ borderColor: "var(--app-border)" }}>
                    <span className="text-zinc-500">Transaction / UTR</span>
                    <span className="font-mono text-zinc-300">{selectedClaim.transactionId}</span>
                  </div>
                )}
                {selectedClaim.note && (
                  <div className="border-b pb-2" style={{ borderColor: "var(--app-border)" }}>
                    <p className="text-zinc-500">Note</p>
                    <p className="mt-1 text-zinc-300">{selectedClaim.note}</p>
                  </div>
                )}
                {selectedClaim.proof && (
                  <div>
                    <p className="mb-2 text-zinc-500">Payment Proof Screenshot</p>
                    <img
                      src={selectedClaim.proof}
                      alt="Proof"
                      onClick={handleOpenFullImage}
                      className="h-44 w-full cursor-pointer rounded-lg border object-cover transition hover:opacity-90"
                      style={{ borderColor: "var(--app-border)" }}
                    />
                  </div>
                )}
              </div>

              <div className="mt-6 flex gap-3">
                {selectedClaim.status === "Pending" ? (
                  <>
                    <button
                      type="button"
                      disabled={actionLoading}
                      onClick={() => handleApprove(selectedClaim.id)}
                      className="flex-1 rounded-lg bg-emerald-600 px-4 py-2.5 font-semibold text-white transition hover:bg-emerald-500 disabled:opacity-50"
                    >
                      {actionLoading ? "..." : "Approve Payment"}
                    </button>
                    <button
                      type="button"
                      disabled={actionLoading}
                      onClick={() => handleReject(selectedClaim.id)}
                      className="flex-1 rounded-lg bg-red-600 px-4 py-2.5 font-semibold text-white transition hover:bg-red-500 disabled:opacity-50"
                    >
                      {actionLoading ? "..." : "Reject"}
                    </button>
                  </>
                ) : (
                  <button
                    type="button"
                    onClick={handleCloseModal}
                    className="w-full rounded-lg border py-2.5 font-semibold text-zinc-300"
                    style={{ borderColor: "var(--app-border)" }}
                  >
                    Close
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Full Image Modal */}
        {isImageFullView && selectedClaim?.proof && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4" onClick={handleCloseFullImage}>
            <img src={selectedClaim.proof} alt="Full Proof" className="max-h-[90vh] max-w-[90vw] rounded-lg object-contain" />
          </div>
        )}
      </div>
  );
};

export default Payments;