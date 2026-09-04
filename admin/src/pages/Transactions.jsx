import React, { useEffect, useMemo, useState } from "react";
import {
  Search,
  Download,
  Printer,
  FileSpreadsheet,
  Receipt,
  RotateCcw,
  CreditCard,
  ShoppingBag,
  X,
  FileText,
} from "lucide-react";
import { salesApi, paymentsApi, returnsApi } from "../services/api";
import { exportToCSV, printReportPDF, printTransactionReceiptPDF } from "../utils/exportReports";

const Transactions = () => {
  const [activeTab, setActiveTab] = useState("all");
  const [search, setSearch] = useState("");
  const [selectedTransaction, setSelectedTransaction] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [transactions, setTransactions] = useState([]);

  // Fetch sales, payments and return records and merge into unified ledger
  const loadLedger = async () => {
    try {
      setLoading(true);
      setError("");

      const [salesRes, paymentsRes, returnsRes] = await Promise.allSettled([
        salesApi.getAll(),
        paymentsApi.getAll(),
        returnsApi.getAll(),
      ]);

      const items = [];

      if (salesRes.status === "fulfilled") {
        const sales = Array.isArray(salesRes.value?.sales)
          ? salesRes.value.sales
          : Array.isArray(salesRes.value)
          ? salesRes.value
          : [];

        sales.forEach((s) => {
          const user = s.customerId?.userId || {};
          const customerName = s.customerId?.name || user.name || "Walk-in Customer";
          const customerPhone = user.phone || s.customerId?.phone || "";

          items.push({
            id: `SALE-${String(s._id).slice(-6).toUpperCase()}`,
            rawId: s._id,
            type: "Sale",
            customer: customerName,
            phone: customerPhone,
            saleId: `SALE-${String(s._id).slice(-6).toUpperCase()}`,
            date: new Date(s.createdAt).toLocaleString("en-IN", {
              day: "2-digit",
              month: "short",
              year: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            }),
            rawDate: s.createdAt,
            amount: Number(s.totalAmount || 0),
            paidAmount: Number(s.paidAmount || 0),
            pendingAmount: Number(s.pendingAmount || 0),
            method: (s.paymentType || "cash").toUpperCase(),
            status: s.status === "completed" ? "Completed" : s.status || "Completed",
            description: `Sale of ${s.items?.length || 0} product(s) - Paid: ₹${Number(s.paidAmount || 0).toLocaleString("en-IN")}, Pending: ₹${Number(s.pendingAmount || 0).toLocaleString("en-IN")}`,
            products: s.items?.length || 0,
            items: s.items || [],
          });
        });
      }

      if (paymentsRes.status === "fulfilled") {
        const payments = Array.isArray(paymentsRes.value?.payments)
          ? paymentsRes.value.payments
          : Array.isArray(paymentsRes.value)
          ? paymentsRes.value
          : [];

        payments.forEach((p) => {
          const user = p.userId || p.customerId?.userId || {};
          const customerName = user.name || p.customerId?.name || "Customer";
          const customerPhone = user.phone || p.customerId?.phone || "";

          items.push({
            id: `PAY-${String(p._id).slice(-6).toUpperCase()}`,
            rawId: p._id,
            type: "Payment",
            customer: customerName,
            phone: customerPhone,
            saleId: p.creditId ? `CREDIT-${String(p.creditId).slice(-6).toUpperCase()}` : "DIRECT",
            date: new Date(p.paidAt || p.createdAt).toLocaleString("en-IN", {
              day: "2-digit",
              month: "short",
              year: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            }),
            rawDate: p.paidAt || p.createdAt,
            amount: Number(p.amount || 0),
            paidAmount: Number(p.amount || 0),
            pendingAmount: 0,
            method: (p.paymentMethod || "cash").toUpperCase(),
            status: p.status === "approved" ? "Approved" : p.status === "rejected" ? "Rejected" : "Pending",
            description: p.note || `Payment claim via ${p.paymentMethod?.toUpperCase()}`,
            transactionId: p.transactionId || p.razorpayPaymentId || null,
          });
        });
      }

      if (returnsRes.status === "fulfilled") {
        const returns = Array.isArray(returnsRes.value?.returns)
          ? returnsRes.value.returns
          : Array.isArray(returnsRes.value)
          ? returnsRes.value
          : [];

        returns.forEach((r) => {
          const customer = r.customerId?.userId || r.customerId || {};
          const customerName = r.saleId?.customerId?.userId?.name || r.saleId?.customerId?.name || customer.name || "Customer";
          const customerPhone = r.saleId?.customerId?.userId?.phone || r.saleId?.customerId?.phone || customer.phone || "";

          items.push({
            id: `RET-${String(r._id).slice(-6).toUpperCase()}`,
            rawId: r._id,
            type: "Return",
            customer: customerName,
            phone: customerPhone,
            saleId: r.saleId ? `SALE-${String(r.saleId._id || r.saleId).slice(-6).toUpperCase()}` : "DIRECT",
            date: new Date(r.returnedAt || r.createdAt).toLocaleString("en-IN", {
              day: "2-digit",
              month: "short",
              year: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            }),
            rawDate: r.returnedAt || r.createdAt,
            amount: Number(r.returnAmount || 0),
            paidAmount: Number(r.returnAmount || 0),
            pendingAmount: 0,
            method: (r.refundMethod || "cash").toUpperCase(),
            status: r.refundStatus === "completed" ? "Completed" : "Pending",
            description: r.reason || `Returned items from ${r.saleId ? `Sale #${String(r.saleId._id || r.saleId).slice(-6).toUpperCase()}` : "order"}`,
            items: r.items || [],
          });
        });
      }

      items.sort((a, b) => new Date(b.rawDate) - new Date(a.rawDate));
      setTransactions(items);
    } catch (err) {
      console.error("Ledger load error:", err);
      setError("Unable to load transaction records.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLedger();
  }, []);

  const filteredTransactions = useMemo(() => {
    return transactions.filter((tx) => {
      const matchesTab =
        activeTab === "sales"
          ? tx.type === "Sale"
          : activeTab === "payments"
          ? tx.type === "Payment"
          : activeTab === "returns"
          ? tx.type === "Return"
          : true;

      const q = search.toLowerCase().trim();
      const matchesSearch =
        !q ||
        tx.id.toLowerCase().includes(q) ||
        tx.customer.toLowerCase().includes(q) ||
        tx.phone.includes(q) ||
        (tx.saleId && tx.saleId.toLowerCase().includes(q)) ||
        (tx.transactionId && tx.transactionId.toLowerCase().includes(q));

      return matchesTab && matchesSearch;
    });
  }, [transactions, activeTab, search]);

  const totalSalesAmount = useMemo(
    () =>
      transactions
        .filter((t) => t.type === "Sale")
        .reduce((sum, t) => sum + t.amount, 0),
    [transactions]
  );

  const totalPaymentsAmount = useMemo(
    () =>
      transactions
        .filter((t) => t.type === "Payment" && t.status === "Approved")
        .reduce((sum, t) => sum + t.amount, 0),
    [transactions]
  );

  const formatAmount = (amount) => `₹${Number(amount || 0).toLocaleString("en-IN")}`;

  // Export handlers
  const handleExportExcel = () => {
    const columns = [
      { key: "id", label: "Transaction ID" },
      { key: "type", label: "Type" },
      { key: "customer", label: "Customer" },
      { key: "phone", label: "Phone" },
      { key: "amount", label: "Amount (₹)", formatter: (v) => v || 0 },
      { key: "method", label: "Payment Method" },
      { key: "status", label: "Status" },
      { key: "date", label: "Date & Time" },
      { key: "description", label: "Notes / Description" },
    ];

    exportToCSV(filteredTransactions, columns, `SmartShop_Transactions_${activeTab}`);
  };

  const handleExportPDF = () => {
    const columns = [
      { key: "id", label: "ID" },
      { key: "type", label: "Type" },
      { key: "customer", label: "Customer" },
      { key: "amount", label: "Amount", align: "right", formatter: (v) => `₹${Number(v || 0).toLocaleString("en-IN")}` },
      { key: "method", label: "Method" },
      { key: "status", label: "Status" },
      { key: "date", label: "Date" },
    ];

    const summary = [
      { label: "Total Transactions", value: `${filteredTransactions.length}` },
      { label: "Total Sales", value: formatAmount(totalSalesAmount) },
      { label: "Cleared Payments", value: formatAmount(totalPaymentsAmount) },
    ];

    printReportPDF({
      title: `Transactions Ledger (${activeTab.toUpperCase()})`,
      subtitle: `Filtered view containing ${filteredTransactions.length} transaction entries`,
      columns,
      data: filteredTransactions,
      summary,
    });
  };

  return (
    <div className="w-full space-y-6">
      {/* Header */}
        <div className="mb-7 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white sm:text-3xl">Transactions</h1>
            <p className="mt-1 text-sm text-zinc-400">
              Real-time unified audit ledger for all sales, payments, credits and refunds.
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

        {/* Metrics Cards */}
        <div className="mb-7 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="rounded-xl border p-5" style={{ borderColor: "var(--app-border)", backgroundColor: "var(--app-surface)" }}>
            <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500">Gross Sales Volume</p>
            <p className="mt-2 text-2xl font-bold sm:text-3xl text-white">{formatAmount(totalSalesAmount)}</p>
            <p className="mt-1 text-xs text-zinc-500">{transactions.filter((t) => t.type === "Sale").length} sales invoices</p>
          </div>

          <div className="rounded-xl border p-5" style={{ borderColor: "var(--app-border)", backgroundColor: "var(--app-surface)" }}>
            <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500">Cleared Collections</p>
            <p className="mt-2 text-2xl font-bold sm:text-3xl text-emerald-400">{formatAmount(totalPaymentsAmount)}</p>
            <p className="mt-1 text-xs text-emerald-500">Verified cash & UPI payments</p>
          </div>

          <div className="rounded-xl border p-5" style={{ borderColor: "var(--app-border)", backgroundColor: "var(--app-surface)" }}>
            <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500">Total Ledger Entries</p>
            <p className="mt-2 text-2xl font-bold sm:text-3xl" style={{ color: "var(--app-accent)" }}>{transactions.length}</p>
            <p className="mt-1 text-xs text-zinc-400">{filteredTransactions.length} records matching filter</p>
          </div>
        </div>

        {/* Tabs and Search */}
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex gap-2">
            {[
              { key: "all", label: "All Transactions" },
              { key: "sales", label: "Sales" },
              { key: "payments", label: "Payments" },
              { key: "returns", label: "Returns" },
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

          <div className="relative w-full sm:w-80">
            <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
            <input
              type="search"
              placeholder="Search ID, customer, phone, UTR..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-xl border border-white/10 bg-zinc-950 pl-9 pr-4 py-2.5 text-xs text-white outline-none focus:border-[var(--app-accent-border)]"
            />
          </div>
        </div>

        {/* Transactions Table */}
        {loading ? (
          <div className="py-20 text-center text-zinc-500">Loading transaction ledger...</div>
        ) : filteredTransactions.length === 0 ? (
          <div className="rounded-xl border p-12 text-center" style={{ borderColor: "var(--app-border)", backgroundColor: "var(--app-surface)" }}>
            <p className="text-zinc-500">No transactions found.</p>
          </div>
        ) : (
          <div className="overflow-hidden rounded-xl border" style={{ borderColor: "var(--app-border)", backgroundColor: "var(--app-surface)" }}>
            {/* Desktop Table View */}
            <div className="hidden overflow-x-auto lg:block">
              <table className="w-full min-w-[850px] text-left text-sm">
                <thead>
                  <tr className="border-b text-xs uppercase tracking-wider text-zinc-500" style={{ borderColor: "var(--app-border)" }}>
                    <th className="px-5 py-4">Transaction ID</th>
                    <th className="px-5 py-4">Type</th>
                    <th className="px-5 py-4">Customer</th>
                    <th className="px-5 py-4">Amount</th>
                    <th className="px-5 py-4">Method</th>
                    <th className="px-5 py-4">Date</th>
                    <th className="px-5 py-4">Status</th>
                    <th className="px-5 py-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredTransactions.map((tx) => (
                    <tr
                      key={tx.id}
                      className="border-b transition hover:bg-white/[0.02]"
                      style={{ borderColor: "var(--app-border)" }}
                    >
                      <td className="px-5 py-4">
                        <span className="font-mono font-medium text-zinc-200">{tx.id}</span>
                        {tx.transactionId && (
                          <p className="text-[11px] font-mono text-zinc-500">Ref: {tx.transactionId}</p>
                        )}
                      </td>
                      <td className="px-5 py-4">
                        <span
                          className={`rounded-md px-2.5 py-1 text-xs font-semibold ${
                            tx.type === "Sale"
                              ? "bg-amber-500/10 text-amber-400"
                              : tx.type === "Payment"
                              ? "bg-emerald-500/10 text-emerald-400"
                              : "bg-blue-500/10 text-blue-400"
                          }`}
                        >
                          {tx.type}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <p className="font-semibold text-white">{tx.customer}</p>
                        {tx.phone && <p className="text-xs text-zinc-500">{tx.phone}</p>}
                      </td>
                      <td className="px-5 py-4 font-bold" style={{ color: tx.type === "Payment" ? "#4ade80" : "var(--app-accent)" }}>
                        {formatAmount(tx.amount)}
                      </td>
                      <td className="px-5 py-4 text-zinc-300 font-mono text-xs">{tx.method}</td>
                      <td className="px-5 py-4 text-xs text-zinc-400">{tx.date}</td>
                      <td className="px-5 py-4">
                        <span
                          className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                            tx.status === "Completed" || tx.status === "Approved"
                              ? "bg-emerald-500/10 text-emerald-400"
                              : tx.status === "Rejected"
                              ? "bg-red-500/10 text-red-400"
                              : "bg-amber-500/10 text-amber-400"
                          }`}
                        >
                          {tx.status}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-right">
                        <button
                          type="button"
                          onClick={() => setSelectedTransaction(tx)}
                          className="rounded-lg border px-3 py-1.5 text-xs font-semibold text-zinc-300 transition hover:border-[var(--app-accent-border)] hover:bg-[var(--app-accent-soft)] hover:text-[var(--app-accent)]"
                          style={{ borderColor: "var(--app-border)" }}
                        >
                          Receipt / Details
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile & Tablet Cards View */}
            <div className="grid grid-cols-1 gap-3 p-3 sm:grid-cols-2 sm:p-4 lg:hidden">
              {filteredTransactions.map((tx) => (
                <div
                  key={tx.id}
                  className="rounded-xl border p-4 flex flex-col justify-between"
                  style={{
                    borderColor: "var(--app-border)",
                    backgroundColor: "var(--app-surface-light)",
                  }}
                >
                  <div>
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <span className="font-mono text-xs text-zinc-400">{tx.id}</span>
                        <p className="font-semibold text-white text-base mt-0.5">{tx.customer}</p>
                        {tx.phone && <p className="text-xs text-zinc-500">{tx.phone}</p>}
                      </div>
                      <span
                        className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                          tx.status === "Completed" || tx.status === "Approved"
                            ? "bg-emerald-500/10 text-emerald-400"
                            : tx.status === "Rejected"
                            ? "bg-red-500/10 text-red-400"
                            : "bg-amber-500/10 text-amber-400"
                        }`}
                      >
                        {tx.status}
                      </span>
                    </div>

                    <div className="mt-3 flex items-center justify-between border-t pt-3" style={{ borderColor: "var(--app-border)" }}>
                      <div>
                        <p className="text-[11px] text-zinc-500 uppercase">{tx.method}</p>
                        <p className="text-xs text-zinc-400">{tx.date}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-bold" style={{ color: tx.type === "Payment" ? "#4ade80" : "var(--app-accent)" }}>
                          {formatAmount(tx.amount)}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="mt-3 border-t pt-3" style={{ borderColor: "var(--app-border)" }}>
                    <button
                      type="button"
                      onClick={() => setSelectedTransaction(tx)}
                      className="w-full rounded-lg border py-2 text-xs font-semibold text-zinc-300 transition hover:bg-white/5"
                      style={{ borderColor: "var(--app-border)" }}
                    >
                      View Receipt / Details
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Transaction Detail & Print Modal */}
        {selectedTransaction && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
            <div
              className="w-full max-w-lg rounded-2xl border p-5 sm:p-6 shadow-2xl max-h-[90vh] overflow-y-auto"
              style={{
                borderColor: "var(--app-accent-border)",
                backgroundColor: "var(--app-surface)",
              }}
            >
              <div className="mb-4 flex items-center justify-between border-b pb-3" style={{ borderColor: "var(--app-border)" }}>
                <div>
                  <h3 className="text-lg font-bold text-white">SmartShop Bill / Receipt</h3>
                  <p className="font-mono text-xs text-zinc-400">{selectedTransaction.id}</p>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedTransaction(null)}
                  className="rounded p-1 text-zinc-400 hover:text-white"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="space-y-3 text-xs">
                <div className="grid grid-cols-2 gap-2 border-b pb-2" style={{ borderColor: "var(--app-border)" }}>
                  <div>
                    <span className="text-zinc-500">Customer:</span>
                    <p className="font-semibold text-white">{selectedTransaction.customer}</p>
                    {selectedTransaction.phone && <p className="text-zinc-400">{selectedTransaction.phone}</p>}
                  </div>
                  <div>
                    <span className="text-zinc-500">Date & Time:</span>
                    <p className="text-zinc-300">{selectedTransaction.date}</p>
                  </div>
                </div>

                <div className="flex justify-between border-b pb-2" style={{ borderColor: "var(--app-border)" }}>
                  <span className="text-zinc-500">Type</span>
                  <span className="font-semibold text-zinc-300">{selectedTransaction.type}</span>
                </div>

                <div className="flex justify-between border-b pb-2" style={{ borderColor: "var(--app-border)" }}>
                  <span className="text-zinc-500">Payment Channel</span>
                  <span className="font-semibold text-emerald-400 font-mono">{selectedTransaction.method}</span>
                </div>

                {selectedTransaction.transactionId && (
                  <div className="flex justify-between border-b pb-2" style={{ borderColor: "var(--app-border)" }}>
                    <span className="text-zinc-500">UTR / Reference ID</span>
                    <span className="font-mono text-zinc-300">{selectedTransaction.transactionId}</span>
                  </div>
                )}

                {/* Purchased items table if available */}
                {selectedTransaction.items && selectedTransaction.items.length > 0 && (
                  <div className="border-b pb-3" style={{ borderColor: "var(--app-border)" }}>
                    <p className="mb-2 font-bold text-white uppercase text-[10px] tracking-wider text-zinc-400">
                      Itemized Products ({selectedTransaction.items.length})
                    </p>
                    <div className="space-y-1.5 max-h-40 overflow-y-auto rounded-lg border p-2.5" style={{ borderColor: "var(--app-border)", backgroundColor: "var(--app-surface-light)" }}>
                      {selectedTransaction.items.map((it, idx) => (
                        <div key={idx} className="flex justify-between text-xs text-zinc-300">
                          <span>
                            {it.productName || it.productId?.name || "Product"} × {it.quantity || 1} {it.unit || ""}
                          </span>
                          <span className="font-mono font-semibold text-white">
                            ₹{it.total ? it.total.toLocaleString("en-IN") : it.price ? (it.price * (it.quantity || 1)).toLocaleString("en-IN") : "—"}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex justify-between text-sm font-bold text-white pt-1">
                  <span>Total Amount</span>
                  <span style={{ color: "var(--app-accent)" }}>{formatAmount(selectedTransaction.amount)}</span>
                </div>
              </div>

              <div className="mt-6 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => printTransactionReceiptPDF(selectedTransaction)}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-xs font-semibold text-white transition hover:bg-white/10 cursor-pointer"
                >
                  <Printer className="h-3.5 w-3.5" />
                  Print Receipt / PDF
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedTransaction(null)}
                  className="rounded-xl px-5 py-2 text-xs font-bold text-white shadow"
                  style={{ backgroundColor: "var(--app-accent)" }}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
  );
};

export default Transactions;