import React, { useEffect, useMemo, useState } from "react";
import { FileSpreadsheet, Printer, Search } from "lucide-react";
import { toast } from "react-toastify";
import { creditsApi, paymentsApi } from "../services/api";
import { exportToCSV, printReportPDF } from "../utils/exportReports";

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

const Credits = () => {
  const [activeTab, setActiveTab] = useState("outstanding");
  const [search, setSearch] = useState("");
  const [selectedCredit, setSelectedCredit] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});

  const [extendModal, setExtendModal] = useState(false);
  const [extendDueDate, setExtendDueDate] = useState("");
  const [extendReason, setExtendReason] = useState("");
  const [extending, setExtending] = useState(false);

  const [credits, setCredits] = useState([]);
  const [payments, setPayments] = useState([]);

  // Load all credit records and payment ledger entries from backend
  const loadCreditsData = async () => {
    try {
      setLoading(true);
      setError("");

      const [creditsRes, paymentsRes] = await Promise.allSettled([
        creditsApi.getAll(),
        paymentsApi.getAll(),
      ]);

      let paymentsList = [];
      if (paymentsRes.status === "fulfilled") {
        paymentsList = Array.isArray(paymentsRes.value?.payments)
          ? paymentsRes.value.payments
          : Array.isArray(paymentsRes.value)
          ? paymentsRes.value
          : [];
        setPayments(paymentsList);
      }

      if (creditsRes.status === "fulfilled") {
        const rawCredits = Array.isArray(creditsRes.value?.credits)
          ? creditsRes.value.credits
          : Array.isArray(creditsRes.value)
          ? creditsRes.value
          : [];

        const formatted = rawCredits.map((c) => {
          const user = c.userId || c.customerId?.userId || {};
          const customerName = user.name || c.customerId?.name || "Customer";
          const customerPhone = user.phone || c.customerId?.phone || "";

          const isOverdue =
            Number(c.pendingAmount || 0) > 0 &&
            new Date(c.dueDate) < new Date();

          let statusDisplay = "Outstanding";
          if (Number(c.pendingAmount || 0) <= 0 || c.status === "paid") {
            statusDisplay = "Cleared";
          } else if (isOverdue || c.status === "overdue") {
            statusDisplay = "Overdue";
          }

          const creditPayments = paymentsList.filter(
            (p) => String(p.creditId?._id || p.creditId) === String(c._id)
          );

          return {
            id: c._id,
            customer: customerName,
            phone: customerPhone,
            saleId: c.saleId ? `SALE-${String(c.saleId).slice(-6).toUpperCase()}` : "DIRECT-CREDIT",
            saleDate: new Date(c.borrowDate || c.createdAt).toLocaleDateString("en-IN", {
              day: "2-digit",
              month: "short",
              year: "numeric",
            }),
            dueDate: new Date(c.dueDate).toLocaleDateString("en-IN", {
              day: "2-digit",
              month: "short",
              year: "numeric",
            }),
            rawDueDate: c.dueDate,
            totalAmount: Number(c.borrowedAmount || 0),
            paidAmount: Number(c.paidAmount || 0),
            creditAmount: Number(c.pendingAmount || 0),
            extensionCount: c.extensionCount || 0,
            extension: c.extension,
            status: statusDisplay,
            payments: creditPayments.map((p) => ({
              id: p._id,
              amount: Number(p.amount || 0),
              method: (p.paymentMethod || "cash").toUpperCase(),
              date: new Date(p.paidAt || p.createdAt).toLocaleString("en-IN", {
                day: "2-digit",
                month: "short",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              }),
              status: p.status === "approved" ? "Approved" : p.status === "rejected" ? "Rejected" : "Pending",
            })),
          };
        });

        setCredits(formatted);
      }
    } catch (err) {
      console.error("Failed to load credits:", err);
      setError(err?.message || "Failed to load credits.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCreditsData();
  }, []);

  const filteredCredits = useMemo(() => {
    return credits.filter((credit) => {
      const matchesTab =
        activeTab === "outstanding"
          ? credit.status === "Outstanding" || credit.status === "Overdue"
          : activeTab === "overdue"
          ? credit.status === "Overdue"
          : activeTab === "cleared"
          ? credit.status === "Cleared"
          : true;

      const searchText = search.toLowerCase().trim();

      const matchesSearch =
        !searchText ||
        credit.customer.toLowerCase().includes(searchText) ||
        credit.phone.includes(searchText) ||
        credit.saleId.toLowerCase().includes(searchText);

      return matchesTab && matchesSearch;
    });
  }, [credits, activeTab, search]);

  const totalOutstanding = useMemo(() => {
    return credits
      .filter((c) => c.status !== "Cleared")
      .reduce((sum, c) => sum + c.creditAmount, 0);
  }, [credits]);

  const totalCleared = useMemo(() => {
    return credits.reduce((sum, c) => sum + c.paidAmount, 0);
  }, [credits]);

  const handleOpenExtendModal = (credit) => {
    setSelectedCredit(credit);
    const base = credit?.rawDueDate ? new Date(credit.rawDueDate) : new Date();
    setExtendDueDate(addDaysToDate(base, 15));
    setExtendReason("");
    setFieldErrors({});
    setError("");
    setExtendModal(true);
  };

  const handleExtendSubmit = async (e) => {
    e.preventDefault();
    if (!selectedCredit) return;
    setFieldErrors({});

    const newFieldErrors = {};

    if (!extendDueDate) {
      newFieldErrors.extendDueDate = "Please select a new due date.";
    }

    if (!extendReason.trim()) {
      newFieldErrors.extendReason = "Please provide a reason for the extension.";
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
      setSuccess("");

      const res = await creditsApi.extendDueDate(selectedCredit.id, {
        newDueDate: extendDueDate,
        reason: extendReason.trim(),
      });

      const msg = res?.message || "Credit due date extended successfully.";
      setSuccess(msg);
      toast.success(msg);
      setExtendModal(false);
      setSelectedCredit(null);
      await loadCreditsData();
    } catch (err) {
      console.error("Extend due date error:", err);
      const msg = err?.message || "Failed to extend due date.";
      setError(msg);
      if (err?.errors) setFieldErrors(err.errors);
      toast.error(msg);
    } finally {
      setExtending(false);
    }
  };

  const formatAmount = (amount) => `₹${Number(amount || 0).toLocaleString("en-IN")}`;

  const handleExportExcel = () => {
    const columns = [
      { key: "customer", label: "Customer Name" },
      { key: "phone", label: "Phone Number" },
      { key: "saleId", label: "Invoice Ref" },
      { key: "totalAmount", label: "Credit Borrowed (₹)", formatter: (v) => v || 0 },
      { key: "paidAmount", label: "Repaid Amount (₹)", formatter: (v) => v || 0 },
      { key: "pendingAmount", label: "Pending Due (₹)", formatter: (v) => v || 0 },
      { key: "status", label: "Credit Status" },
      { key: "saleDate", label: "Borrow Date" },
      { key: "dueDate", label: "Due Date" },
    ];

    exportToCSV(filteredCredits, columns, `SmartShop_Credit_Ledger_${activeTab}`);
  };

  const handleExportPDF = () => {
    const columns = [
      { key: "customer", label: "Customer" },
      { key: "phone", label: "Phone" },
      { key: "pendingAmount", label: "Pending (₹)", align: "right", formatter: (v) => `₹${Number(v || 0).toLocaleString("en-IN")}` },
      { key: "status", label: "Status" },
      { key: "dueDate", label: "Due Date" },
    ];

    const summary = [
      { label: "Active Credit Accounts", value: `${filteredCredits.length}` },
      { label: "Total Outstanding Due", value: formatAmount(totalOutstanding) },
      { label: "Total Cleared", value: formatAmount(totalCleared) },
    ];

    printReportPDF({
      title: `Store Credit Ledger (${activeTab.toUpperCase()})`,
      subtitle: `Export of ${filteredCredits.length} credit account records`,
      columns,
      data: filteredCredits,
      summary,
    });
  };

  return (
    <div
      className="min-h-screen w-full px-4 py-6 sm:px-6 md:px-10 lg:px-12"
      style={{
        backgroundColor: "var(--app-bg)",
        color: "var(--app-text)",
      }}
    >
      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <div className="mb-7 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white sm:text-3xl">Credit Ledger</h1>
            <p className="mt-1 text-sm text-zinc-400">
              Track customer credit lines, repayment histories and extend due dates.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={handleExportExcel}
              className="inline-flex items-center gap-1.5 rounded-xl border border-white/10 bg-zinc-900 px-3.5 py-2 text-xs font-semibold text-zinc-200 shadow transition hover:border-emerald-500/40 hover:bg-emerald-950/30 hover:text-emerald-400"
            >
              <FileSpreadsheet className="h-4 w-4 text-emerald-400" />
              <span>Export Excel</span>
            </button>

            <button
              type="button"
              onClick={handleExportPDF}
              className="inline-flex items-center gap-1.5 rounded-xl border border-white/10 bg-zinc-900 px-3.5 py-2 text-xs font-semibold text-zinc-200 shadow transition hover:border-[var(--app-accent-border)] hover:bg-[var(--app-accent-soft)] hover:text-[var(--app-accent)]"
            >
              <Printer className="h-4 w-4" style={{ color: "var(--app-accent)" }} />
              <span>Print PDF Report</span>
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

        {/* Metrics */}
        <div className="mb-7 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="rounded-xl border p-5" style={{ borderColor: "var(--app-border)", backgroundColor: "var(--app-surface)" }}>
            <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500">Total Outstanding Credit</p>
            <p className="mt-2 text-2xl font-bold sm:text-3xl" style={{ color: "var(--app-accent)" }}>{formatAmount(totalOutstanding)}</p>
            <p className="mt-1 text-xs text-zinc-500">Active pending debt</p>
          </div>

          <div className="rounded-xl border p-5" style={{ borderColor: "var(--app-border)", backgroundColor: "var(--app-surface)" }}>
            <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500">Total Collected Repayments</p>
            <p className="mt-2 text-2xl font-bold text-white sm:text-3xl">{formatAmount(totalCleared)}</p>
            <p className="mt-1 text-xs text-emerald-400">Cleared through payments</p>
          </div>

          <div className="rounded-xl border p-5" style={{ borderColor: "var(--app-border)", backgroundColor: "var(--app-surface)" }}>
            <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500">Credit Accounts</p>
            <p className="mt-2 text-2xl font-bold text-white sm:text-3xl">{credits.length}</p>
            <p className="mt-1 text-xs text-zinc-400">{filteredCredits.length} matching current filter</p>
          </div>
        </div>

        {/* Filters & Search */}
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex gap-2">
            {[
              { key: "outstanding", label: "Outstanding" },
              { key: "overdue", label: "Overdue" },
              { key: "cleared", label: "Cleared" },
              { key: "all", label: "All Credits" },
            ].map((tab) => (
              <button
                key={tab.key}
                type="button"
                onClick={() => setActiveTab(tab.key)}
                className={`rounded-lg px-4 py-2 text-xs font-semibold transition ${
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

          <input
            type="search"
            placeholder="Search customer, phone or sale ID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-lg border px-4 py-2 text-sm text-white outline-none sm:w-72"
            style={{
              borderColor: "var(--app-border)",
              backgroundColor: "var(--app-surface)",
            }}
          />
        </div>

        {/* Credits Table */}
        {loading ? (
          <div className="py-20 text-center text-zinc-500">Loading credit ledger...</div>
        ) : filteredCredits.length === 0 ? (
          <div className="rounded-xl border p-12 text-center" style={{ borderColor: "var(--app-border)", backgroundColor: "var(--app-surface)" }}>
            <p className="text-zinc-500">No credit records matching criteria.</p>
          </div>
        ) : (
          <div className="overflow-hidden rounded-xl border" style={{ borderColor: "var(--app-border)", backgroundColor: "var(--app-surface)" }}>
            {/* Desktop Table View */}
            <div className="hidden overflow-x-auto md:block">
              <table className="w-full min-w-[800px] text-left text-sm">
                <thead>
                  <tr className="border-b text-xs uppercase tracking-wider text-zinc-500" style={{ borderColor: "var(--app-border)" }}>
                    <th className="px-5 py-4">Customer</th>
                    <th className="px-5 py-4">Sale ID</th>
                    <th className="px-5 py-4">Borrowed</th>
                    <th className="px-5 py-4">Paid</th>
                    <th className="px-5 py-4">Pending</th>
                    <th className="px-5 py-4">Due Date</th>
                    <th className="px-5 py-4">Status</th>
                    <th className="px-5 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredCredits.map((credit) => (
                    <tr
                      key={credit.id}
                      className="border-b transition hover:bg-white/[0.02]"
                      style={{ borderColor: "var(--app-border)" }}
                    >
                      <td className="px-5 py-4">
                        <p className="font-semibold text-white">{credit.customer}</p>
                        {credit.phone && <p className="text-xs text-zinc-500">{credit.phone}</p>}
                      </td>
                      <td className="px-5 py-4 font-mono text-xs text-zinc-400">{credit.saleId}</td>
                      <td className="px-5 py-4 text-zinc-300">{formatAmount(credit.totalAmount)}</td>
                      <td className="px-5 py-4 text-emerald-400">{formatAmount(credit.paidAmount)}</td>
                      <td className="px-5 py-4 font-bold" style={{ color: "var(--app-accent)" }}>
                        {formatAmount(credit.creditAmount)}
                      </td>
                      <td className="px-5 py-4 text-xs text-zinc-400">
                        {credit.dueDate}
                        {credit.extensionCount > 0 && (
                          <span className="ml-1 rounded bg-yellow-500/10 px-1 py-0.5 text-[10px] text-yellow-400">
                            Ext
                          </span>
                        )}
                      </td>
                      <td className="px-5 py-4">
                        <span
                          className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                            credit.status === "Cleared"
                              ? "bg-emerald-500/10 text-emerald-400"
                              : credit.status === "Overdue"
                              ? "bg-red-500/10 text-red-400"
                              : "bg-yellow-500/10 text-yellow-400"
                          }`}
                        >
                          {credit.status}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-right">
                        <div className="flex justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => setSelectedCredit(credit)}
                            className="rounded-lg border px-3 py-1.5 text-xs font-semibold text-zinc-300 transition hover:bg-white/5 hover:text-white"
                            style={{ borderColor: "var(--app-border)" }}
                          >
                            Details
                          </button>
                          {credit.status !== "Cleared" && credit.extensionCount < 1 && (
                            <button
                              type="button"
                              onClick={() => handleOpenExtendModal(credit)}
                              className="rounded-lg border px-2.5 py-1.5 text-xs font-semibold transition"
                              style={{
                                borderColor: "var(--app-accent-border)",
                                backgroundColor: "var(--app-accent-soft)",
                                color: "var(--app-accent)",
                              }}
                            >
                              Extend
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Desktop Table View */}
            <div className="hidden overflow-x-auto lg:block">
              <table className="w-full min-w-[800px] text-left text-sm">
                <thead>
                  <tr className="border-b text-xs uppercase tracking-wider text-zinc-500" style={{ borderColor: "var(--app-border)" }}>
                    <th className="px-5 py-4">Customer</th>
                    <th className="px-5 py-4">Sale Ref</th>
                    <th className="px-5 py-4">Total Amount</th>
                    <th className="px-5 py-4">Paid</th>
                    <th className="px-5 py-4">Pending Due</th>
                    <th className="px-5 py-4">Due Date</th>
                    <th className="px-5 py-4">Status</th>
                    <th className="px-5 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredCredits.map((credit) => (
                    <tr
                      key={credit.id}
                      className="border-b transition hover:bg-white/[0.02]"
                      style={{ borderColor: "var(--app-border)" }}
                    >
                      <td className="px-5 py-4">
                        <p className="font-semibold text-white">{credit.customer}</p>
                        {credit.phone && <p className="text-xs text-zinc-500">{credit.phone}</p>}
                      </td>
                      <td className="px-5 py-4 font-mono text-xs text-zinc-400">{credit.saleId}</td>
                      <td className="px-5 py-4 text-zinc-300">{formatAmount(credit.totalAmount)}</td>
                      <td className="px-5 py-4 text-emerald-400">{formatAmount(credit.paidAmount)}</td>
                      <td className="px-5 py-4 font-bold" style={{ color: "var(--app-accent)" }}>
                        {formatAmount(credit.creditAmount)}
                      </td>
                      <td className="px-5 py-4 text-xs text-zinc-400">
                        {credit.dueDate}
                        {credit.extensionCount > 0 && (
                          <span className="ml-1 rounded bg-yellow-500/10 px-1 py-0.5 text-[10px] text-yellow-400">
                            Ext
                          </span>
                        )}
                      </td>
                      <td className="px-5 py-4">
                        <span
                          className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                            credit.status === "Cleared"
                              ? "bg-emerald-500/10 text-emerald-400"
                              : credit.status === "Overdue"
                              ? "bg-red-500/10 text-red-400"
                              : "bg-yellow-500/10 text-yellow-400"
                          }`}
                        >
                          {credit.status}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-right">
                        <div className="flex justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => setSelectedCredit(credit)}
                            className="rounded-lg border px-3 py-1.5 text-xs font-semibold text-zinc-300 transition hover:bg-white/5 hover:text-white"
                            style={{ borderColor: "var(--app-border)" }}
                          >
                            Details
                          </button>
                          {credit.status !== "Cleared" && credit.extensionCount < 1 && (
                            <button
                              type="button"
                              onClick={() => handleOpenExtendModal(credit)}
                              className="rounded-lg border px-2.5 py-1.5 text-xs font-semibold transition"
                              style={{
                                borderColor: "var(--app-accent-border)",
                                backgroundColor: "var(--app-accent-soft)",
                                color: "var(--app-accent)",
                              }}
                            >
                              Extend
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile & Tablet Cards View */}
            <div className="grid grid-cols-1 gap-3 p-3 sm:grid-cols-2 sm:p-4 lg:hidden">
              {filteredCredits.map((credit) => (
                <div
                  key={credit.id}
                  className="rounded-xl border p-4 flex flex-col justify-between"
                  style={{
                    borderColor: "var(--app-border)",
                    backgroundColor: "var(--app-surface-light)",
                  }}
                >
                  <div>
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="font-semibold text-white text-base">{credit.customer}</p>
                        <p className="text-xs font-mono text-zinc-400 mt-0.5">{credit.saleId}</p>
                      </div>
                      <span
                        className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                          credit.status === "Cleared"
                            ? "bg-emerald-500/10 text-emerald-400"
                            : credit.status === "Overdue"
                            ? "bg-red-500/10 text-red-400"
                            : "bg-yellow-500/10 text-yellow-400"
                        }`}
                      >
                        {credit.status}
                      </span>
                    </div>

                    <div className="mt-3 grid grid-cols-2 gap-2 border-t pt-3" style={{ borderColor: "var(--app-border)" }}>
                      <div>
                        <p className="text-[11px] text-zinc-500 uppercase">Borrowed / Paid</p>
                        <p className="text-xs text-zinc-300 font-medium">
                          {formatAmount(credit.totalAmount)} /{" "}
                          <span className="text-emerald-400">{formatAmount(credit.paidAmount)}</span>
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-[11px] text-zinc-500 uppercase">Pending Due</p>
                        <p className="text-base font-bold" style={{ color: "var(--app-accent)" }}>
                          {formatAmount(credit.creditAmount)}
                        </p>
                      </div>
                    </div>

                    <div className="mt-2 flex items-center justify-between text-xs text-zinc-400">
                      <span>Due: {credit.dueDate}</span>
                      {credit.phone && <span>{credit.phone}</span>}
                    </div>
                  </div>

                  <div className="mt-3 flex gap-2 border-t pt-3" style={{ borderColor: "var(--app-border)" }}>
                    <button
                      type="button"
                      onClick={() => setSelectedCredit(credit)}
                      className="flex-1 rounded-lg border py-2 text-xs font-semibold text-zinc-300 transition hover:bg-white/5"
                      style={{ borderColor: "var(--app-border)" }}
                    >
                      Details
                    </button>
                    {credit.status !== "Cleared" && credit.extensionCount < 1 && (
                      <button
                        type="button"
                        onClick={() => handleOpenExtendModal(credit)}
                        className="flex-1 rounded-lg py-2 text-xs font-semibold text-white transition"
                        style={{ backgroundColor: "var(--app-accent)" }}
                      >
                        Extend Due
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Credit Details Modal */}
        {selectedCredit && !extendModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
            <div className="w-full max-w-lg rounded-2xl border p-5 sm:p-6 shadow-2xl max-h-[90vh] overflow-y-auto" style={{ borderColor: "var(--app-border)", backgroundColor: "var(--app-surface)" }}>
              <div className="mb-4 flex items-center justify-between">
                <h3 className="text-lg font-bold text-white">Credit Record Details</h3>
                <button type="button" onClick={() => setSelectedCredit(null)} className="text-zinc-400 hover:text-white">✕</button>
              </div>

              <div className="space-y-3 text-sm">
                <div className="flex justify-between border-b pb-2" style={{ borderColor: "var(--app-border)" }}>
                  <span className="text-zinc-500">Customer</span>
                  <span className="font-semibold text-white">{selectedCredit.customer} ({selectedCredit.phone || "No phone"})</span>
                </div>
                <div className="flex justify-between border-b pb-2" style={{ borderColor: "var(--app-border)" }}>
                  <span className="text-zinc-500">Sale Record</span>
                  <span className="font-mono text-zinc-300">{selectedCredit.saleId}</span>
                </div>
                <div className="flex justify-between border-b pb-2" style={{ borderColor: "var(--app-border)" }}>
                  <span className="text-zinc-500">Borrowed Amount</span>
                  <span className="font-semibold text-white">{formatAmount(selectedCredit.totalAmount)}</span>
                </div>
                <div className="flex justify-between border-b pb-2" style={{ borderColor: "var(--app-border)" }}>
                  <span className="text-zinc-500">Paid Amount</span>
                  <span className="font-semibold text-emerald-400">{formatAmount(selectedCredit.paidAmount)}</span>
                </div>
                <div className="flex justify-between border-b pb-2" style={{ borderColor: "var(--app-border)" }}>
                  <span className="text-zinc-500">Pending Balance</span>
                  <span className="text-base font-bold" style={{ color: "var(--app-accent)" }}>{formatAmount(selectedCredit.creditAmount)}</span>
                </div>
                <div className="flex justify-between border-b pb-2" style={{ borderColor: "var(--app-border)" }}>
                  <span className="text-zinc-500">Due Date</span>
                  <span className="text-zinc-300">{selectedCredit.dueDate}</span>
                </div>

                {selectedCredit.extension && (
                  <div className="rounded-lg border p-3" style={{ borderColor: "var(--app-border)", backgroundColor: "var(--app-surface-light)" }}>
                    <p className="text-xs font-semibold text-yellow-400">Due Date Extension Applied</p>
                    <p className="mt-1 text-xs text-zinc-400">Reason: {selectedCredit.extension.reason}</p>
                  </div>
                )}

                <div>
                  <p className="mb-2 font-semibold text-white">Payment History for this Credit</p>
                  {selectedCredit.payments && selectedCredit.payments.length > 0 ? (
                    <div className="space-y-2 max-h-40 overflow-y-auto">
                      {selectedCredit.payments.map((p) => (
                        <div key={p.id} className="flex justify-between rounded-lg border p-2 text-xs" style={{ borderColor: "var(--app-border)", backgroundColor: "var(--app-surface-light)" }}>
                          <span>{p.date} ({p.method})</span>
                          <span className="font-bold text-emerald-400">{formatAmount(p.amount)} - {p.status}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-zinc-500">No payment payments recorded yet.</p>
                  )}
                </div>
              </div>

              <div className="mt-6 flex gap-3">
                {selectedCredit.status !== "Cleared" && selectedCredit.extensionCount < 1 && (
                  <button
                    type="button"
                    onClick={() => handleOpenExtendModal(selectedCredit)}
                    className="flex-1 rounded-lg py-2.5 font-semibold text-white"
                    style={{ backgroundColor: "var(--app-accent)" }}
                  >
                    Extend Due Date
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setSelectedCredit(null)}
                  className="flex-1 rounded-lg border py-2.5 font-semibold text-zinc-300"
                  style={{ borderColor: "var(--app-border)" }}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Extend Due Date Modal */}
        {extendModal && selectedCredit && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
            <div className="w-full max-w-md rounded-2xl border p-6 shadow-2xl" style={{ borderColor: "var(--app-border)", backgroundColor: "var(--app-surface)" }}>
              <h3 className="text-lg font-bold text-white">Extend Due Date</h3>
              <p className="mt-1 text-xs text-zinc-400">
                Extend due date for {selectedCredit.customer} (Pending: {formatAmount(selectedCredit.creditAmount)}).
              </p>

              <form onSubmit={handleExtendSubmit} className="mt-5 space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-semibold text-zinc-300">New Due Date</label>
                    {extendDueDate && (
                      <span className="text-[11px] font-bold text-amber-300">
                        {new Date(extendDueDate).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}
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
                      min={addDaysToDate(selectedCredit?.rawDueDate || new Date(), 1)}
                      max={addDaysToDate(new Date(), 365)}
                      value={extendDueDate}
                      onChange={(e) => {
                        setExtendDueDate(e.target.value);
                        if (fieldErrors.extendDueDate) setFieldErrors((prev) => ({ ...prev, extendDueDate: "" }));
                      }}
                      onClick={(e) => {
                        try {
                          e.target.showPicker?.();
                        } catch {}
                      }}
                      className={`w-full rounded-lg border bg-zinc-900 px-3 py-2 text-xs font-semibold text-white outline-none cursor-pointer ${
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

                  {/* Quick Jump Chips */}
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
                          const base = selectedCredit?.rawDueDate
                            ? new Date(selectedCredit.rawDueDate)
                            : new Date();
                          setExtendDueDate(addDaysToDate(base, chip.days));
                          if (fieldErrors.extendDueDate) setFieldErrors((prev) => ({ ...prev, extendDueDate: "" }));
                        }}
                        className="rounded border border-zinc-800 bg-zinc-900 px-2 py-0.5 text-[10px] text-zinc-400 hover:border-amber-500/40 hover:text-amber-300"
                      >
                        {chip.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="mb-1 block text-xs font-semibold text-zinc-300">Extension Reason</label>
                  <textarea
                    rows={3}
                    required
                    placeholder="Reason for extending credit due date..."
                    value={extendReason}
                    onChange={(e) => {
                      setExtendReason(e.target.value);
                      if (fieldErrors.extendReason) setFieldErrors((prev) => ({ ...prev, extendReason: "" }));
                    }}
                    className={`w-full rounded-lg border bg-zinc-900 p-2.5 text-xs text-white outline-none ${
                      fieldErrors.extendReason ? "border-red-500 ring-1 ring-red-500" : "border-zinc-700 focus:border-amber-500"
                    }`}
                  />
                  {fieldErrors.extendReason && (
                    <p className="mt-1 text-xs text-red-500 font-medium">{fieldErrors.extendReason}</p>
                  )}
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    type="submit"
                    disabled={extending}
                    className="flex-1 rounded-lg py-2.5 font-semibold text-white disabled:opacity-50"
                    style={{ backgroundColor: "var(--app-accent)" }}
                  >
                    {extending ? "Extending..." : "Confirm Extension"}
                  </button>
                  <button
                    type="button"
                    onClick={() => setExtendModal(false)}
                    className="flex-1 rounded-lg border py-2.5 font-semibold text-zinc-300"
                    style={{ borderColor: "var(--app-border)" }}
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Credits;