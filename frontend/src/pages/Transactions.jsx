import React, { useEffect, useMemo, useState } from "react";
import {
  salesApi,
  paymentsApi,
  returnsApi,
} from "../services/api";
import {
  Receipt,
  Search,
  Package,
  CheckCircle2,
  X,
  Printer,
  ShoppingBag,
  CreditCard,
  RotateCcw,
  Calendar,
  Layers,
} from "lucide-react";

const Transactions = () => {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [paymentFilter, setPaymentFilter] = useState("All");
  const [typeFilter, setTypeFilter] = useState("All");

  // Receipt Modal State
  const [activeReceipt, setActiveReceipt] = useState(null);

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

            const rawItems = Array.isArray(s.items) ? s.items : [];
            const formattedItems = rawItems.map((item) => {
              const name =
                item.productName ||
                item.productId?.name ||
                "Unknown item";
              const qty = item.quantity ?? 1;
              const unit = item.unit || item.productId?.unit || "";
              const price = item.price ?? item.productId?.price ?? 0;
              const total = item.total ?? price * qty;

              return {
                name,
                quantity: qty,
                unit,
                price,
                total,
              };
            });

            const itemsSummary = formattedItems
              .map((it) => `${it.name} (${it.quantity}${it.unit ? ` ${it.unit}` : ""})`)
              .join(", ");

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
              items: formattedItems,
              itemsSummary: itemsSummary || "Purchased Items",
              note: itemsSummary || `Purchased ${formattedItems.length} product(s)`,
              adminName: s.adminId?.name || "Store Admin",
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
              items: [],
              itemsSummary: "Credit Account Repayment",
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
            const rawItems = Array.isArray(r.items) ? r.items : [];
            const formattedItems = rawItems.map((item) => ({
              name: item.productName || item.productId?.name || "Returned item",
              quantity: item.quantity ?? 1,
              unit: item.unit || "",
              price: item.price ?? 0,
              total: item.total ?? 0,
            }));

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
              items: formattedItems,
              itemsSummary: r.reason || "Product Return & Refund",
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
      return "border-rose-500/20 bg-rose-500/10 text-rose-400";
    }

    return "border-amber-500/20 bg-amber-500/10 text-amber-400";
  };

  // Filter transactions by search, status, and payment channel
  const filteredTransactions = useMemo(() => {
    const searchValue = search.trim().toLowerCase();

    return transactions.filter((transaction) => {
      const transactionId = String(transaction.id).toLowerCase();
      const customerName = String(transaction.customerName).toLowerCase();
      const note = String(transaction.note || "").toLowerCase();
      const itemsSummary = String(transaction.itemsSummary || "").toLowerCase();
      const itemNames = (transaction.items || [])
        .map((it) => it.name)
        .join(" ")
        .toLowerCase();

      const matchesSearch =
        !searchValue ||
        transactionId.includes(searchValue) ||
        customerName.includes(searchValue) ||
        note.includes(searchValue) ||
        itemsSummary.includes(searchValue) ||
        itemNames.includes(searchValue);

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
    <div className="w-full px-4 sm:px-6 md:px-[50px] pb-16">
      {/* Page Header */}
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span
              className="flex h-2 w-2 rounded-full"
              style={{ backgroundColor: "var(--app-accent)" }}
            />
            <p className="text-xs font-bold uppercase tracking-widest text-zinc-400">
              Account Ledger
            </p>
          </div>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-white sm:text-3xl lg:text-4xl">
            My Transactions
          </h1>
          <p className="mt-1 text-xs text-zinc-400 sm:text-sm">
            View your purchase history with itemized products, payment settlements, and refunds.
          </p>
        </div>

        {!loading && (
          <p className="text-xs font-medium text-zinc-500">
            Showing <strong className="text-zinc-200">{filteredTransactions.length}</strong> of{" "}
            {transactions.length} records
          </p>
        )}
      </div>

      {/* Filter toolbar */}
      <div className="mb-8 rounded-2xl border border-white/5 bg-zinc-900/70 p-4 sm:p-5 shadow-[0_4px_20px_rgba(0,0,0,0.3)]">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="relative w-full lg:max-w-[380px]">
            <div className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500">
              <Search className="h-4 w-4" />
            </div>
            <input
              type="search"
              placeholder="Search by product name, ID, or note..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-10 w-full rounded-xl border border-white/10 bg-zinc-950 pl-10 pr-4 text-xs font-medium text-zinc-100 outline-none transition-all placeholder:text-zinc-500 focus:border-[var(--app-accent-border)] focus:bg-zinc-950"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="h-10 rounded-xl border border-white/10 bg-zinc-950 px-3.5 text-xs font-medium text-zinc-300 outline-none transition-all focus:border-[var(--app-accent-border)]"
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
              className="h-10 rounded-xl border border-white/10 bg-zinc-950 px-3.5 text-xs font-medium text-zinc-300 outline-none transition-all focus:border-[var(--app-accent-border)]"
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
              className="h-10 rounded-xl border border-white/10 bg-zinc-950 px-3.5 text-xs font-medium text-zinc-300 outline-none transition-all focus:border-[var(--app-accent-border)]"
            >
              {paymentOptions.map((method) => (
                <option key={method} value={method}>
                  {method === "All" ? "All Methods" : method}
                </option>
              ))}
            </select>

            {(search || statusFilter !== "All" || paymentFilter !== "All" || typeFilter !== "All") && (
              <button
                type="button"
                onClick={() => {
                  setSearch("");
                  setStatusFilter("All");
                  setPaymentFilter("All");
                  setTypeFilter("All");
                }}
                className="h-10 rounded-xl border border-white/10 bg-white/5 px-3 text-xs font-semibold text-[var(--app-accent)] transition hover:bg-white/10"
              >
                Reset
              </button>
            )}
          </div>
        </div>
      </div>

      {loading && (
        <div className="rounded-2xl border border-white/5 bg-zinc-900 p-12 text-center">
          <div className="mx-auto mb-3 h-8 w-8 animate-spin rounded-full border-2 border-zinc-700 border-t-[var(--app-accent)]" />
          <p className="text-sm font-medium text-zinc-400">Loading your transactions & products...</p>
        </div>
      )}

      {!loading && error && (
        <div
          className="rounded-2xl border border-rose-500/20 bg-rose-500/5 p-10 text-center"
          role="alert"
        >
          <p className="text-sm font-medium text-rose-400">{error}</p>
        </div>
      )}

      {!loading && !error && filteredTransactions.length === 0 && (
        <div className="rounded-2xl border border-white/5 bg-zinc-900/60 p-12 text-center">
          <Package className="mx-auto mb-3 h-10 w-10 text-zinc-600" />
          <p className="text-sm font-medium text-zinc-400">No transactions found.</p>
          <p className="mt-1 text-xs text-zinc-600">Your purchases and payments will appear here automatically.</p>
        </div>
      )}

      {/* Desktop transactions table */}
      {!loading && !error && filteredTransactions.length > 0 && (
        <div className="hidden overflow-hidden rounded-2xl border border-white/[0.08] bg-zinc-900 shadow-[0_4px_24px_rgba(0,0,0,0.35)] lg:block">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px]">
              <thead>
                <tr className="border-b border-white/5 bg-zinc-950/80">
                  <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-zinc-500">
                    Transaction
                  </th>
                  <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-zinc-500">
                    Purchased Products / Items
                  </th>
                  <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-zinc-500">
                    Amount
                  </th>
                  <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-zinc-500">
                    Payment
                  </th>
                  <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-zinc-500">
                    Date
                  </th>
                  <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-zinc-500">
                    Status
                  </th>
                  <th className="px-5 py-3.5 text-right text-xs font-semibold uppercase tracking-wider text-zinc-500">
                    Receipt
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-white/5">
                {filteredTransactions.map((transaction) => {
                  const status = transaction.status;
                  const isSale = transaction.type.includes("Order");

                  return (
                    <tr
                      key={transaction.id}
                      className="transition-colors hover:bg-white/[0.02]"
                    >
                      {/* Transaction ID & Type */}
                      <td className="px-5 py-4 align-top">
                        <span className="font-mono text-xs font-bold text-zinc-200">
                          {transaction.id}
                        </span>
                        <div className="mt-1 flex items-center gap-1.5 text-xs text-zinc-400">
                          {isSale ? (
                            <ShoppingBag className="h-3.5 w-3.5 text-amber-400" />
                          ) : transaction.type.includes("Payment") ? (
                            <CreditCard className="h-3.5 w-3.5 text-emerald-400" />
                          ) : (
                            <RotateCcw className="h-3.5 w-3.5 text-blue-400" />
                          )}
                          <span>{transaction.type}</span>
                        </div>
                      </td>

                      {/* Products / Items List */}
                      <td className="px-5 py-4 align-top">
                        {transaction.items && transaction.items.length > 0 ? (
                          <div className="flex flex-wrap gap-1.5 max-w-sm">
                            {transaction.items.map((item, idx) => (
                              <span
                                key={idx}
                                className="inline-flex items-center gap-1 rounded-md border border-white/10 bg-zinc-950/80 px-2 py-0.5 text-xs text-zinc-300"
                              >
                                <span className="font-medium text-white">{item.name}</span>
                                <span className="text-zinc-500 font-mono">
                                  ×{item.quantity}
                                  {item.unit ? ` ${item.unit}` : ""}
                                </span>
                                {item.total ? (
                                  <span className="font-semibold text-amber-400/90 ml-0.5">
                                    (₹{item.total})
                                  </span>
                                ) : null}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <p className="text-xs text-zinc-400 font-medium">
                            {transaction.itemsSummary || transaction.note}
                          </p>
                        )}
                      </td>

                      {/* Amount */}
                      <td className="px-5 py-4 align-top font-bold">
                        <span
                          className="text-sm font-extrabold"
                          style={{
                            color: transaction.type.includes("Payment")
                              ? "#34d399"
                              : "var(--app-accent)",
                          }}
                        >
                          ₹{Number(transaction.amount || 0).toLocaleString("en-IN")}
                        </span>
                        {transaction.pendingAmount > 0 && (
                          <p className="text-[10px] font-semibold text-rose-400">
                            Due: ₹{transaction.pendingAmount}
                          </p>
                        )}
                      </td>

                      {/* Payment Method */}
                      <td className="px-5 py-4 align-top text-xs text-zinc-300">
                        <span className="rounded bg-white/5 border border-white/10 px-2 py-1 font-mono text-[11px]">
                          {transaction.paymentMethod}
                        </span>
                      </td>

                      {/* Date */}
                      <td className="px-5 py-4 align-top text-xs text-zinc-400">
                        {formatDate(transaction.date)}
                      </td>

                      {/* Status */}
                      <td className="px-5 py-4 align-top">
                        <span
                          className={`inline-flex rounded-full border px-2.5 py-0.5 text-[11px] font-semibold ${getStatusStyle(
                            status
                          )}`}
                        >
                          {formatStatus(status)}
                        </span>
                      </td>

                      {/* Receipt Button */}
                      <td className="px-5 py-4 align-top text-right">
                        <button
                          type="button"
                          onClick={() => setActiveReceipt(transaction)}
                          className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/[0.04] px-2.5 py-1 text-xs font-semibold text-zinc-200 transition hover:border-[var(--app-accent-border)] hover:bg-[var(--app-accent-soft)] hover:text-[var(--app-accent)]"
                        >
                          <Receipt className="h-3.5 w-3.5" />
                          <span>Receipt</span>
                        </button>
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
            const isSale = transaction.type.includes("Order");

            return (
              <div
                key={transaction.id}
                className="rounded-2xl border border-white/[0.08] bg-zinc-900/90 p-4 sm:p-5 shadow-[0_4px_20px_rgba(0,0,0,0.35)] backdrop-blur-xl flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <span className="font-mono text-xs font-bold text-zinc-200">
                        {transaction.id}
                      </span>
                      <div className="mt-0.5 flex items-center gap-1.5 text-xs text-zinc-400">
                        {isSale ? (
                          <ShoppingBag className="h-3.5 w-3.5 text-amber-400" />
                        ) : (
                          <CreditCard className="h-3.5 w-3.5 text-emerald-400" />
                        )}
                        <span>{transaction.type}</span>
                      </div>
                    </div>

                    <span
                      className={`shrink-0 rounded-full border px-2.5 py-0.5 text-[11px] font-semibold ${getStatusStyle(
                        status
                      )}`}
                    >
                      {formatStatus(status)}
                    </span>
                  </div>

                  {/* Purchased items pills */}
                  <div className="mt-3 border-t border-white/5 pt-3">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 mb-1.5">
                      Items & Details:
                    </p>
                    {transaction.items && transaction.items.length > 0 ? (
                      <div className="flex flex-wrap gap-1.5">
                        {transaction.items.map((item, idx) => (
                          <span
                            key={idx}
                            className="inline-flex items-center gap-1 rounded-md border border-white/10 bg-zinc-950 px-2 py-0.5 text-xs text-zinc-200"
                          >
                            <span className="font-semibold text-white">{item.name}</span>
                            <span className="text-zinc-500 font-mono">
                              ×{item.quantity}
                              {item.unit ? ` ${item.unit}` : ""}
                            </span>
                            {item.total ? (
                              <span className="font-semibold text-amber-400/90">
                                (₹{item.total})
                              </span>
                            ) : null}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-zinc-300">
                        {transaction.itemsSummary || transaction.note}
                      </p>
                    )}
                  </div>
                </div>

                {/* Card Footer */}
                <div className="mt-4 border-t border-white/5 pt-3 flex items-center justify-between">
                  <div>
                    <p className="text-[10px] uppercase font-bold text-zinc-500">
                      Amount ({transaction.paymentMethod})
                    </p>
                    <p
                      className="text-base font-extrabold"
                      style={{
                        color: transaction.type.includes("Payment")
                          ? "#34d399"
                          : "var(--app-accent)",
                      }}
                    >
                      ₹{Number(transaction.amount || 0).toLocaleString("en-IN")}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => setActiveReceipt(transaction)}
                    className="inline-flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/[0.04] px-3 py-1.5 text-xs font-semibold text-zinc-200 transition hover:border-[var(--app-accent-border)] hover:bg-[var(--app-accent-soft)] hover:text-[var(--app-accent)]"
                  >
                    <Receipt className="h-3.5 w-3.5" />
                    <span>View Bill</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Itemized Receipt Modal */}
      {activeReceipt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="relative w-full max-w-lg overflow-hidden rounded-2xl border border-white/10 bg-zinc-950 p-6 shadow-2xl">
            {/* Modal Header */}
            <div className="flex items-start justify-between border-b border-white/10 pb-4">
              <div className="flex items-center gap-3">
                <div
                  className="flex h-10 w-10 items-center justify-center rounded-xl font-bold text-white shadow"
                  style={{ backgroundColor: "var(--app-accent)" }}
                >
                  S
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">SmartShop Receipt</h3>
                  <p className="font-mono text-xs text-zinc-400">
                    ID: {activeReceipt.id}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setActiveReceipt(null)}
                className="rounded-lg p-1.5 text-zinc-400 transition hover:bg-white/10 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Receipt Meta */}
            <div className="my-4 grid grid-cols-2 gap-3 text-xs">
              <div>
                <span className="text-zinc-500">Date:</span>
                <p className="font-medium text-zinc-200">{formatDate(activeReceipt.date)}</p>
              </div>
              <div>
                <span className="text-zinc-500">Payment Type:</span>
                <p className="font-medium text-zinc-200">{activeReceipt.paymentMethod}</p>
              </div>
              <div>
                <span className="text-zinc-500">Transaction Type:</span>
                <p className="font-medium text-zinc-200">{activeReceipt.type}</p>
              </div>
              <div>
                <span className="text-zinc-500">Status:</span>
                <p className="font-semibold text-emerald-400">{activeReceipt.status}</p>
              </div>
            </div>

            {/* Purchased Items Table */}
            <div className="my-4 max-h-56 overflow-y-auto rounded-xl border border-white/10 bg-zinc-900/60 p-3">
              {activeReceipt.items && activeReceipt.items.length > 0 ? (
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-white/10 text-zinc-500">
                      <th className="pb-2">Product Name</th>
                      <th className="pb-2 text-center">Qty</th>
                      <th className="pb-2 text-right">Price</th>
                      <th className="pb-2 text-right">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {activeReceipt.items.map((item, index) => (
                      <tr key={index} className="text-zinc-300">
                        <td className="py-2 font-medium text-white">{item.name}</td>
                        <td className="py-2 text-center text-zinc-400">
                          {item.quantity} {item.unit}
                        </td>
                        <td className="py-2 text-right font-mono text-zinc-400">
                          ₹{item.price || 0}
                        </td>
                        <td className="py-2 text-right font-bold text-white font-mono">
                          ₹{item.total || 0}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <div className="py-3 text-center text-xs text-zinc-400">
                  <p className="font-medium">{activeReceipt.itemsSummary || activeReceipt.note}</p>
                </div>
              )}
            </div>

            {/* Total summary */}
            <div className="space-y-1.5 border-t border-white/10 pt-3 text-xs">
              <div className="flex justify-between font-bold text-white text-sm">
                <span>Total Amount:</span>
                <span style={{ color: "var(--app-accent)" }}>
                  ₹{Number(activeReceipt.amount || 0).toLocaleString("en-IN")}
                </span>
              </div>
              {activeReceipt.paidAmount > 0 && activeReceipt.paidAmount !== activeReceipt.amount && (
                <div className="flex justify-between text-zinc-400">
                  <span>Paid:</span>
                  <span className="text-emerald-400">₹{activeReceipt.paidAmount}</span>
                </div>
              )}
              {activeReceipt.pendingAmount > 0 && (
                <div className="flex justify-between text-zinc-400">
                  <span>Balance Due:</span>
                  <span className="text-rose-400">₹{activeReceipt.pendingAmount}</span>
                </div>
              )}
            </div>

            {/* Modal Actions */}
            <div className="mt-5 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => window.print()}
                className="inline-flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-xs font-semibold text-white transition hover:bg-white/10"
              >
                <Printer className="h-3.5 w-3.5" />
                Print
              </button>
              <button
                type="button"
                onClick={() => setActiveReceipt(null)}
                className="rounded-xl px-5 py-2 text-xs font-bold text-white transition hover:opacity-90"
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