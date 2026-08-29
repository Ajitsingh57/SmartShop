import React, { useEffect, useMemo, useState } from "react";
import { salesApi, paymentsApi, returnsApi } from "../services/api";

const Transactions = () => {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [paymentFilter, setPaymentFilter] = useState("All");
  const [typeFilter, setTypeFilter] = useState("All");

  // Fetch transaction history records for logged-in customer
  useEffect(() => {
    const fetchTransactions = async () => {
      try {
        setLoading(true);
        setError("");

        const [salesRes, paymentsRes, returnsRes] = await Promise.allSettled([
          salesApi.getMySales(),
          paymentsApi.getMyPayments(),
          returnsApi.getMyReturns(),
        ]);

        const items = [];

        if (salesRes.status === "fulfilled") {
          const sales = Array.isArray(salesRes.value?.sales)
            ? salesRes.value.sales
            : Array.isArray(salesRes.value)
            ? salesRes.value
            : [];

          sales.forEach((s) => {
            const customerName =
              s.customerId?.name ||
              s.customerId?.userId?.name ||
              "My Account";

            items.push({
              id: `SALE-${String(s._id).slice(-6).toUpperCase()}`,
              rawId: s._id,
              type: "Order / Purchase",
              customerName,
              amount: Number(s.totalAmount || 0),
              paidAmount: Number(s.paidAmount || 0),
              pendingAmount: Number(s.pendingAmount || 0),
              paymentMethod: (s.paymentType || "cash").toUpperCase(),
              status: s.status === "completed" ? "Completed" : s.status || "Completed",
              date: s.createdAt,
              items: s.items || [],
              note: `Purchased ${s.items?.length || 0} product(s)`,
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
            const customerName = p.userId?.name || "My Account";

            let displayStatus = "Pending";
            if (p.status === "approved") displayStatus = "Approved";
            if (p.status === "rejected") displayStatus = "Rejected";

            items.push({
              id: `PAY-${String(p._id).slice(-6).toUpperCase()}`,
              rawId: p._id,
              type: "Payment Settle",
              customerName,
              amount: Number(p.amount || 0),
              paidAmount: Number(p.amount || 0),
              pendingAmount: 0,
              paymentMethod: (p.paymentMethod || "cash").toUpperCase(),
              status: displayStatus,
              date: p.paidAt || p.createdAt,
              note: p.note || p.transactionId || "Credit repayment",
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
            items.push({
              id: `RET-${String(r._id).slice(-6).toUpperCase()}`,
              rawId: r._id,
              type: "Return Refund",
              customerName: "My Account",
              amount: Number(r.returnAmount || 0),
              paidAmount: Number(r.returnAmount || 0),
              pendingAmount: 0,
              paymentMethod: (r.refundMethod || "cash").toUpperCase(),
              status: r.refundStatus === "completed" ? "Completed" : "Pending",
              date: r.returnedAt || r.createdAt,
              note: r.reason || "Product refund",
            });
          });
        }

        items.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        setTransactions(items);
      } catch (requestError) {
        console.error("Failed to fetch transactions:", requestError);
        setError(
          requestError?.message ||
            "Transactions are unavailable right now. Please try again shortly."
        );
      } finally {
        setLoading(false);
      }
    };

    fetchTransactions();
  }, []);

  const formatDate = (date) => {
    if (!date) return "N/A";
    const parsedDate = new Date(date);
    if (Number.isNaN(parsedDate.getTime())) return "N/A";

    return parsedDate.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatStatus = (status) => {
    return (
      String(status).charAt(0).toUpperCase() +
      String(status).slice(1).toLowerCase()
    );
  };

  const getStatusStyle = (status) => {
    const value = String(status).toLowerCase();

    if (
      value === "completed" ||
      value === "success" ||
      value === "successful" ||
      value === "approved" ||
      value === "paid"
    ) {
      return "border-emerald-500/20 bg-emerald-500/10 text-emerald-400";
    }

    if (value === "failed" || value === "cancelled" || value === "rejected") {
      return "border-red-500/20 bg-red-500/10 text-red-400";
    }

    return "border-yellow-500/20 bg-yellow-500/10 text-yellow-400";
  };

  // Filter transactions by search, status, and payment channel
  const filteredTransactions = useMemo(() => {
    const searchValue = search.trim().toLowerCase();

    return transactions.filter((transaction) => {
      const transactionId = String(transaction.id).toLowerCase();
      const customerName = String(transaction.customerName).toLowerCase();
      const note = String(transaction.note || "").toLowerCase();

      const matchesSearch =
        !searchValue ||
        transactionId.includes(searchValue) ||
        customerName.includes(searchValue) ||
        note.includes(searchValue);

      const status = String(transaction.status).toLowerCase();
      const matchesStatus =
        statusFilter === "All" || status === statusFilter.toLowerCase();

      const paymentMethod = String(transaction.paymentMethod).toLowerCase();
      const matchesPayment =
        paymentFilter === "All" ||
        paymentMethod === paymentFilter.toLowerCase();

      const matchesType =
        typeFilter === "All" || transaction.type === typeFilter;

      return matchesSearch && matchesStatus && matchesPayment && matchesType;
    });
  }, [transactions, search, statusFilter, paymentFilter, typeFilter]);

  const statusOptions = [
    "All",
    ...new Set(transactions.map((t) => String(t.status)).filter(Boolean)),
  ];

  const paymentOptions = [
    "All",
    ...new Set(transactions.map((t) => String(t.paymentMethod)).filter(Boolean)),
  ];

  const typeOptions = [
    "All",
    ...new Set(transactions.map((t) => String(t.type)).filter(Boolean)),
  ];

  return (
    <div className="w-full px-5 sm:px-6 md:px-[50px]">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-white">All Transactions</h2>
        <p className="mt-2 text-sm text-zinc-400">
          View your purchase orders, payment settlements, and refund history.
        </p>
      </div>

      {/* Transaction filters toolbar */}
      <div className="mb-8 rounded-2xl border border-white/5 bg-zinc-900/70 p-5 shadow-[0_4px_20px_rgba(0,0,0,0.3)]">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="w-full lg:max-w-[380px]">
            <input
              type="search"
              placeholder="Search transaction ID or note..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-lg border border-zinc-800 bg-zinc-950 px-5 py-3.5 text-sm text-zinc-100 outline-none transition-all duration-300 placeholder:text-zinc-500 focus:border-[var(--app-accent-border)] focus:ring-4 focus:ring-[var(--app-accent-soft)]"
            />
          </div>

          <div className="flex flex-wrap gap-3">
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="rounded-lg border border-zinc-800 bg-zinc-950 px-4 py-3 text-sm text-zinc-300 outline-none transition-all focus:border-[var(--app-accent-border)]"
            >
              {typeOptions.map((type) => (
                <option key={type} value={type}>
                  {type === "All" ? "All Types" : type}
                </option>
              ))}
            </select>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="rounded-lg border border-zinc-800 bg-zinc-950 px-4 py-3 text-sm text-zinc-300 outline-none transition-all focus:border-[var(--app-accent-border)]"
            >
              {statusOptions.map((status) => (
                <option key={status} value={status}>
                  {status === "All" ? "All Status" : formatStatus(status)}
                </option>
              ))}
            </select>

            <select
              value={paymentFilter}
              onChange={(e) => setPaymentFilter(e.target.value)}
              className="rounded-lg border border-zinc-800 bg-zinc-950 px-4 py-3 text-sm text-zinc-300 outline-none transition-all focus:border-[var(--app-accent-border)]"
            >
              {paymentOptions.map((method) => (
                <option key={method} value={method}>
                  {method === "All" ? "All Methods" : method}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {!loading && !error && (
        <div className="mb-4 text-sm text-zinc-500">
          Showing{" "}
          <span className="font-semibold text-zinc-300">
            {filteredTransactions.length}
          </span>{" "}
          transaction
          {filteredTransactions.length !== 1 ? "s" : ""}
        </div>
      )}

      {loading && (
        <div className="rounded-xl border border-white/5 bg-zinc-900 p-10 text-center">
          <div className="mx-auto mb-3 h-8 w-8 animate-spin rounded-full border-2 border-zinc-700 border-t-[var(--app-accent)]" />
          <p className="text-zinc-400">Loading your transactions...</p>
        </div>
      )}

      {!loading && error && (
        <div
          className="rounded-xl border border-red-500/20 bg-red-500/5 p-10 text-center"
          role="alert"
        >
          <p className="text-red-400">{error}</p>
        </div>
      )}

      {!loading && !error && filteredTransactions.length === 0 && (
        <div className="rounded-xl border border-white/5 bg-zinc-900 p-10 text-center">
          <p className="text-zinc-400">No transactions recorded yet.</p>
        </div>
      )}

      {/* Desktop transactions table */}
      {!loading && !error && filteredTransactions.length > 0 && (
        <div className="hidden overflow-hidden rounded-xl border border-white/5 bg-zinc-900 shadow-[0_4px_20px_rgba(0,0,0,0.3)] lg:block">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[850px]">
              <thead>
                <tr className="border-b border-white/5 bg-zinc-950/70">
                  <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wider text-zinc-500">
                    Transaction ID
                  </th>
                  <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wider text-zinc-500">
                    Type
                  </th>
                  <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wider text-zinc-500">
                    Amount
                  </th>
                  <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wider text-zinc-500">
                    Payment
                  </th>
                  <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wider text-zinc-500">
                    Date
                  </th>
                  <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wider text-zinc-500">
                    Status
                  </th>
                </tr>
              </thead>

              <tbody>
                {filteredTransactions.map((transaction) => {
                  const status = transaction.status;

                  return (
                    <tr
                      key={transaction.id}
                      className="border-b border-white/5 transition-colors duration-200 last:border-b-0 hover:bg-white/[0.02]"
                    >
                      <td className="px-5 py-5">
                        <span className="font-mono font-medium text-zinc-200">
                          {transaction.id}
                        </span>
                        {transaction.note && (
                          <p className="text-xs text-zinc-500">{transaction.note}</p>
                        )}
                      </td>

                      <td className="px-5 py-5 text-sm text-zinc-300">
                        {transaction.type}
                      </td>

                      <td className="px-5 py-5 font-bold" style={{ color: transaction.type.includes("Payment") ? "#4ade80" : "var(--app-accent)" }}>
                        ₹{Number(transaction.amount || 0).toLocaleString("en-IN")}
                      </td>

                      <td className="px-5 py-5 text-zinc-400">
                        {transaction.paymentMethod}
                      </td>

                      <td className="px-5 py-5 text-xs text-zinc-400">
                        {formatDate(transaction.date)}
                      </td>

                      <td className="px-5 py-5">
                        <span
                          className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${getStatusStyle(
                            status
                          )}`}
                        >
                          {formatStatus(status)}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Mobile & Tablet transactions list */}
      {!loading && !error && filteredTransactions.length > 0 && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:hidden">
          {filteredTransactions.map((transaction) => {
            const status = transaction.status;

            return (
              <div
                key={transaction.id}
                className="rounded-xl border border-white/5 bg-zinc-900 p-5 shadow-[0_4px_20px_rgba(0,0,0,0.3)]"
              >
                <div className="mb-4 flex items-start justify-between gap-3">
                  <div>
                    <span className="font-mono font-medium text-zinc-200">
                      {transaction.id}
                    </span>
                    <p className="text-xs text-zinc-400">{transaction.type}</p>
                  </div>

                  <span
                    className={`shrink-0 rounded-full border px-3 py-1 text-xs font-semibold ${getStatusStyle(
                      status
                    )}`}
                  >
                    {formatStatus(status)}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <p className="text-xs text-zinc-500">Amount</p>
                    <p className="font-bold" style={{ color: "var(--app-accent)" }}>
                      ₹{Number(transaction.amount || 0).toLocaleString("en-IN")}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs text-zinc-500">Method</p>
                    <p className="text-zinc-300">{transaction.paymentMethod}</p>
                  </div>

                  <div className="col-span-2">
                    <p className="text-xs text-zinc-500">Date</p>
                    <p className="text-xs text-zinc-400">{formatDate(transaction.date)}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default Transactions;