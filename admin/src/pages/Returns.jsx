import React, { useEffect, useMemo, useState } from "react";
import { returnsApi, salesApi } from "../services/api";

const Returns = () => {
  const [activeTab, setActiveTab] = useState("all");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [returnsList, setReturnsList] = useState([]);
  const [salesList, setSalesList] = useState([]);

  // Create Return Modal State
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedSale, setSelectedSale] = useState(null);
  const [saleSearch, setSaleSearch] = useState("");
  const [returnMode, setReturnMode] = useState("full"); // "full" or "partial"
  const [returnItems, setReturnItems] = useState([]);
  const [refundMethod, setRefundMethod] = useState("credit_adjustment");
  const [reason, setReason] = useState("");
  const [transactionId, setTransactionId] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Return Details Modal State
  const [selectedReturn, setSelectedReturn] = useState(null);

  // Load all returns and sales
  const loadData = async () => {
    try {
      setLoading(true);
      setError("");

      const [returnsRes, salesRes] = await Promise.allSettled([
        returnsApi.getAll(),
        salesApi.getAll(),
      ]);

      if (returnsRes.status === "fulfilled") {
        const rawReturns = Array.isArray(returnsRes.value?.returns)
          ? returnsRes.value.returns
          : Array.isArray(returnsRes.value)
          ? returnsRes.value
          : [];

        const formattedReturns = rawReturns.map((r) => {
          const customer = r.customerId?.userId || r.customerId || {};
          const customerName =
            r.saleId?.customerId?.userId?.name ||
            r.saleId?.customerId?.name ||
            customer.name ||
            "Customer";
          const customerPhone =
            r.saleId?.customerId?.userId?.phone ||
            r.saleId?.customerId?.phone ||
            customer.phone ||
            "";

          return {
            id: r._id,
            displayId: `RET-${String(r._id).slice(-6).toUpperCase()}`,
            saleId: r.saleId?._id || r.saleId,
            displaySaleId: r.saleId
              ? `SALE-${String(r.saleId._id || r.saleId).slice(-6).toUpperCase()}`
              : "DIRECT",
            customerName,
            customerPhone,
            returnAmount: Number(r.returnAmount || 0),
            refundMethod: r.refundMethod || "cash",
            refundStatus: r.refundStatus || "completed",
            reason: r.reason || "Product Return",
            transactionId: r.transactionId || null,
            adminName: r.adminId?.name || "Admin",
            items: r.items || [],
            date: new Date(r.returnedAt || r.createdAt).toLocaleString("en-IN", {
              day: "2-digit",
              month: "short",
              year: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            }),
            rawDate: r.returnedAt || r.createdAt,
          };
        });

        formattedReturns.sort((a, b) => new Date(b.rawDate) - new Date(a.rawDate));
        setReturnsList(formattedReturns);
      }

      if (salesRes.status === "fulfilled") {
        const rawSales = Array.isArray(salesRes.value?.sales)
          ? salesRes.value.sales
          : Array.isArray(salesRes.value)
          ? salesRes.value
          : [];

        setSalesList(rawSales.filter((s) => s.status !== "cancelled" && s.status !== "returned"));
      }
    } catch (err) {
      console.error("Failed to load returns data:", err);
      setError(err?.message || "Failed to load returns.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Filter sales for the Create Return selection
  const selectableSales = useMemo(() => {
    const q = saleSearch.toLowerCase().trim();
    if (!q) return salesList.slice(0, 10);

    return salesList.filter((s) => {
      const saleId = String(s._id).toLowerCase();
      const customerName = (
        s.customerId?.name ||
        s.customerId?.userId?.name ||
        ""
      ).toLowerCase();
      const phone = (
        s.customerId?.phone ||
        s.customerId?.userId?.phone ||
        ""
      ).toLowerCase();

      return saleId.includes(q) || customerName.includes(q) || phone.includes(q);
    });
  }, [salesList, saleSearch]);

  // When a sale is selected, initialize return items
  const handleSelectSale = (sale) => {
    setSelectedSale(sale);
    const items = (sale.items || []).map((it) => ({
      productId: it.productId?._id || it.productId || null,
      productName: it.productName || "Item",
      soldQuantity: Number(it.quantity || 1),
      unit: it.unit || "unit",
      price: Number(it.price || 0),
      returnQuantity: Number(it.quantity || 1),
      total: Number(it.total || it.price * (it.quantity || 1) || 0),
    }));

    setReturnItems(items);

    // Default refund method based on sale payment type
    if (sale.paymentType === "credit" || sale.paymentType === "partial") {
      setRefundMethod("credit_adjustment");
    } else {
      setRefundMethod("cash");
    }
  };

  // Update quantity on partial return
  const handleItemQuantityChange = (index, newQty) => {
    const updated = [...returnItems];
    const qty = Math.max(0, Math.min(updated[index].soldQuantity, Number(newQty) || 0));
    updated[index].returnQuantity = qty;
    updated[index].total = qty * updated[index].price;
    setReturnItems(updated);
  };

  // Calculate total return amount
  const calculatedReturnTotal = useMemo(() => {
    if (!selectedSale) return 0;
    if (returnMode === "full") {
      return returnItems.reduce(
        (sum, it) => sum + (it.soldQuantity * it.price || it.total || 0),
        0
      );
    }
    return returnItems.reduce(
      (sum, it) => sum + (it.returnQuantity * it.price || 0),
      0
    );
  }, [selectedSale, returnMode, returnItems]);

  // Submit return to backend
  const handleSubmitReturn = async (e) => {
    e.preventDefault();
    if (!selectedSale) {
      setError("Please select a sale to return.");
      return;
    }

    const itemsToReturn =
      returnMode === "full"
        ? returnItems.map((it) => ({
            productId: it.productId,
            productName: it.productName,
            quantity: it.soldQuantity,
            unit: it.unit,
            price: it.price,
            total: it.soldQuantity * it.price || it.total,
          }))
        : returnItems
            .filter((it) => it.returnQuantity > 0)
            .map((it) => ({
              productId: it.productId,
              productName: it.productName,
              quantity: it.returnQuantity,
              unit: it.unit,
              price: it.price,
              total: it.returnQuantity * it.price,
            }));

    if (itemsToReturn.length === 0) {
      setError("Please select at least one item quantity to return.");
      return;
    }

    if (!reason.trim()) {
      setError("Please provide a reason for the return.");
      return;
    }

    try {
      setSubmitting(true);
      setError("");
      setSuccess("");

      await returnsApi.create({
        saleId: selectedSale._id,
        items: itemsToReturn,
        refundMethod,
        reason: reason.trim(),
        transactionId: transactionId.trim() || null,
      });

      setSuccess(
        `Return processed successfully! ${
          refundMethod === "credit_adjustment"
            ? "₹" + calculatedReturnTotal.toLocaleString("en-IN") + " deducted from customer's credit balance."
            : "Refund of ₹" + calculatedReturnTotal.toLocaleString("en-IN") + " processed."
        }`
      );

      setShowCreateModal(false);
      setSelectedSale(null);
      setReturnItems([]);
      setReason("");
      setTransactionId("");
      await loadData();
    } catch (err) {
      console.error("Process return error:", err);
      setError(err?.message || "Failed to process return.");
    } finally {
      setSubmitting(false);
    }
  };

  // Filter returns
  const filteredReturns = useMemo(() => {
    return returnsList.filter((r) => {
      const matchesTab =
        activeTab === "all"
          ? true
          : activeTab === "credit_adjustment"
          ? r.refundMethod === "credit_adjustment"
          : activeTab === "cash"
          ? r.refundMethod === "cash"
          : r.refundMethod === "upi";

      const q = search.toLowerCase().trim();
      const matchesSearch =
        !q ||
        r.displayId.toLowerCase().includes(q) ||
        r.displaySaleId.toLowerCase().includes(q) ||
        r.customerName.toLowerCase().includes(q) ||
        r.customerPhone.includes(q) ||
        r.reason.toLowerCase().includes(q);

      return matchesTab && matchesSearch;
    });
  }, [returnsList, activeTab, search]);

  const totalReturnVolume = useMemo(
    () => returnsList.reduce((sum, r) => sum + r.returnAmount, 0),
    [returnsList]
  );

  const totalCreditDeducted = useMemo(
    () =>
      returnsList
        .filter((r) => r.refundMethod === "credit_adjustment")
        .reduce((sum, r) => sum + r.returnAmount, 0),
    [returnsList]
  );

  const formatMoney = (val) => `₹${Number(val || 0).toLocaleString("en-IN")}`;

  const getMethodBadge = (method) => {
    switch (method) {
      case "credit_adjustment":
        return "bg-yellow-500/10 text-yellow-400 border border-yellow-500/20";
      case "cash":
        return "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20";
      case "upi":
        return "bg-purple-500/10 text-purple-400 border border-purple-500/20";
      default:
        return "bg-zinc-500/10 text-zinc-400 border border-zinc-500/20";
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
      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <div className="mb-7 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white sm:text-3xl">Returns & Refunds</h1>
            <p className="mt-1 text-sm text-zinc-400">
              Process customer product returns, restock inventory and deduct refunds from credit balances.
            </p>
          </div>

          <button
            type="button"
            onClick={() => {
              setSelectedSale(null);
              setSaleSearch("");
              setReturnItems([]);
              setReturnMode("full");
              setReason("");
              setTransactionId("");
              setShowCreateModal(true);
            }}
            className="flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold text-white transition hover:opacity-90 shadow-lg"
            style={{ backgroundColor: "var(--app-accent)" }}
          >
            ＋ Process New Return
          </button>
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

        {/* Metrics Overview Cards */}
        <div className="mb-7 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div
            className="rounded-xl border p-5"
            style={{ borderColor: "var(--app-border)", backgroundColor: "var(--app-surface)" }}
          >
            <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
              Total Returns Processed
            </p>
            <p className="mt-2 text-2xl font-bold text-white sm:text-3xl">
              {returnsList.length} Invoices
            </p>
            <p className="mt-1 text-xs text-zinc-400">
              Total Value: <span className="font-semibold text-white">{formatMoney(totalReturnVolume)}</span>
            </p>
          </div>

          <div
            className="rounded-xl border p-5"
            style={{ borderColor: "var(--app-border)", backgroundColor: "var(--app-surface)" }}
          >
            <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
              Credit Balance Deductions
            </p>
            <p className="mt-2 text-2xl font-bold text-yellow-400 sm:text-3xl">
              {formatMoney(totalCreditDeducted)}
            </p>
            <p className="mt-1 text-xs text-yellow-500/80">
              Automatically deducted from customer credit debts
            </p>
          </div>

          <div
            className="rounded-xl border p-5"
            style={{ borderColor: "var(--app-border)", backgroundColor: "var(--app-surface)" }}
          >
            <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
              Cash & UPI Refunds
            </p>
            <p className="mt-2 text-2xl font-bold text-emerald-400 sm:text-3xl">
              {formatMoney(totalReturnVolume - totalCreditDeducted)}
            </p>
            <p className="mt-1 text-xs text-emerald-500/80">Direct repayments handed to customers</p>
          </div>
        </div>

        {/* Tab Filters and Search */}
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex gap-2">
            {[
              { key: "all", label: `All Returns (${returnsList.length})` },
              {
                key: "credit_adjustment",
                label: `Credit Deductions (${
                  returnsList.filter((r) => r.refundMethod === "credit_adjustment").length
                })`,
              },
              {
                key: "cash",
                label: `Cash (${returnsList.filter((r) => r.refundMethod === "cash").length})`,
              },
              {
                key: "upi",
                label: `UPI (${returnsList.filter((r) => r.refundMethod === "upi").length})`,
              },
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
            placeholder="Search return ID, sale ID, customer..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-lg border px-4 py-2 text-sm text-white outline-none sm:w-72"
            style={{
              borderColor: "var(--app-border)",
              backgroundColor: "var(--app-surface)",
            }}
          />
        </div>

        {/* Returns Table */}
        {loading ? (
          <div className="py-20 text-center text-zinc-500">Loading returns ledger...</div>
        ) : filteredReturns.length === 0 ? (
          <div
            className="rounded-xl border p-12 text-center"
            style={{ borderColor: "var(--app-border)", backgroundColor: "var(--app-surface)" }}
          >
            <p className="text-zinc-500">No return records found matching criteria.</p>
          </div>
        ) : (
          <div
            className="overflow-hidden rounded-xl border"
            style={{ borderColor: "var(--app-border)", backgroundColor: "var(--app-surface)" }}
          >
            {/* Desktop Table View */}
            <div className="hidden overflow-x-auto lg:block">
              <table className="w-full min-w-[800px] text-left text-sm">
                <thead>
                  <tr
                    className="border-b text-xs uppercase tracking-wider text-zinc-500"
                    style={{ borderColor: "var(--app-border)" }}
                  >
                    <th className="px-5 py-4">Return ID</th>
                    <th className="px-5 py-4">Original Sale</th>
                    <th className="px-5 py-4">Customer</th>
                    <th className="px-5 py-4">Refund Amount</th>
                    <th className="px-5 py-4">Refund Method</th>
                    <th className="px-5 py-4">Reason</th>
                    <th className="px-5 py-4">Date</th>
                    <th className="px-5 py-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredReturns.map((ret) => (
                    <tr
                      key={ret.id}
                      className="border-b transition hover:bg-white/[0.02]"
                      style={{ borderColor: "var(--app-border)" }}
                    >
                      <td className="px-5 py-4 font-mono text-xs font-semibold text-zinc-300">
                        {ret.displayId}
                      </td>
                      <td className="px-5 py-4 font-mono text-xs text-zinc-400">
                        {ret.displaySaleId}
                      </td>
                      <td className="px-5 py-4">
                        <p className="font-semibold text-white">{ret.customerName}</p>
                        {ret.customerPhone && (
                          <p className="text-xs text-zinc-500">{ret.customerPhone}</p>
                        )}
                      </td>
                      <td
                        className="px-5 py-4 font-bold"
                        style={{
                          color:
                            ret.refundMethod === "credit_adjustment"
                              ? "#facc15"
                              : "var(--app-accent)",
                        }}
                      >
                        {formatMoney(ret.returnAmount)}
                      </td>
                      <td className="px-5 py-4">
                        <span
                          className={`rounded-md px-2.5 py-1 text-xs font-semibold ${getMethodBadge(
                            ret.refundMethod
                          )}`}
                        >
                          {ret.refundMethod === "credit_adjustment"
                            ? "Credit Balance Min"
                            : ret.refundMethod.toUpperCase()}
                        </span>
                      </td>
                      <td className="max-w-[180px] truncate px-5 py-4 text-xs text-zinc-400">
                        {ret.reason}
                      </td>
                      <td className="px-5 py-4 text-xs text-zinc-400">{ret.date}</td>
                      <td className="px-5 py-4 text-right">
                        <button
                          type="button"
                          onClick={() => setSelectedReturn(ret)}
                          className="rounded-lg border px-3 py-1.5 text-xs font-semibold text-zinc-300 transition hover:bg-white/5 hover:text-white"
                          style={{ borderColor: "var(--app-border)" }}
                        >
                          Details
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile & Tablet Cards View */}
            <div className="grid grid-cols-1 gap-3 p-3 sm:grid-cols-2 sm:p-4 lg:hidden">
              {filteredReturns.map((ret) => (
                <div
                  key={ret.id}
                  className="rounded-xl border p-4"
                  style={{
                    borderColor: "var(--app-border)",
                    backgroundColor: "var(--app-surface-light)",
                  }}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="font-semibold text-white text-base">{ret.customerName}</p>
                      <p className="text-xs font-mono text-zinc-400 mt-0.5">{ret.displayId} • {ret.displaySaleId}</p>
                    </div>
                    <span
                      className={`rounded-md px-2 py-0.5 text-[11px] font-semibold ${getMethodBadge(
                        ret.refundMethod
                      )}`}
                    >
                      {ret.refundMethod === "credit_adjustment"
                        ? "Credit Min"
                        : ret.refundMethod.toUpperCase()}
                    </span>
                  </div>

                  <div className="mt-3 flex items-center justify-between border-t pt-3" style={{ borderColor: "var(--app-border)" }}>
                    <div>
                      <p className="text-[11px] text-zinc-500 uppercase">Refund Value</p>
                      <p
                        className="text-lg font-bold"
                        style={{
                          color:
                            ret.refundMethod === "credit_adjustment"
                              ? "#facc15"
                              : "var(--app-accent)",
                        }}
                      >
                        {formatMoney(ret.returnAmount)}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-[11px] text-zinc-500">{ret.date}</p>
                    </div>
                  </div>

                  {ret.reason && (
                    <p className="mt-2 text-xs text-zinc-400 line-clamp-2">Reason: {ret.reason}</p>
                  )}

                  <div className="mt-3 border-t pt-3" style={{ borderColor: "var(--app-border)" }}>
                    <button
                      type="button"
                      onClick={() => setSelectedReturn(ret)}
                      className="w-full rounded-lg border py-2 text-xs font-semibold text-zinc-300 transition hover:bg-white/5"
                      style={{ borderColor: "var(--app-border)" }}
                    >
                      View Return Details
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Process New Return Modal */}
        {showCreateModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
            <div
              className="w-full max-w-2xl rounded-2xl border p-6 shadow-2xl max-h-[90vh] overflow-y-auto"
              style={{ borderColor: "var(--app-border)", backgroundColor: "var(--app-surface)" }}
            >
              <div className="mb-4 flex items-center justify-between border-b pb-3" style={{ borderColor: "var(--app-border)" }}>
                <div>
                  <h3 className="text-lg font-bold text-white">Process Product Return</h3>
                  <p className="text-xs text-zinc-400">Select the customer sale invoice, items and refund method.</p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="text-zinc-400 hover:text-white"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleSubmitReturn} className="space-y-4">
                {/* Step 1: Select Sale */}
                {!selectedSale ? (
                  <div>
                    <label className="mb-1 block text-xs font-semibold text-zinc-300">
                      Step 1: Search & Select Sale Invoice
                    </label>
                    <input
                      type="search"
                      placeholder="Search customer name, phone or sale ID..."
                      value={saleSearch}
                      onChange={(e) => setSaleSearch(e.target.value)}
                      className="w-full rounded-lg border p-3 text-sm text-white outline-none mb-3"
                      style={{
                        borderColor: "var(--app-border)",
                        backgroundColor: "var(--app-surface-light)",
                      }}
                    />

                    <div className="max-h-60 overflow-y-auto space-y-2">
                      {selectableSales.length === 0 ? (
                        <p className="text-center py-6 text-xs text-zinc-500">
                          No eligible sale invoices found.
                        </p>
                      ) : (
                        selectableSales.map((sale) => {
                          const customerName =
                            sale.customerId?.name ||
                            sale.customerId?.userId?.name ||
                            "Walk-in Customer";
                          const customerPhone =
                            sale.customerId?.phone ||
                            sale.customerId?.userId?.phone ||
                            "";

                          return (
                            <div
                              key={sale._id}
                              onClick={() => handleSelectSale(sale)}
                              className="flex items-center justify-between p-3 rounded-xl border cursor-pointer transition hover:border-[var(--app-accent-border)] hover:bg-[var(--app-accent-soft)]"
                              style={{
                                borderColor: "var(--app-border)",
                                backgroundColor: "var(--app-surface-light)",
                              }}
                            >
                              <div>
                                <p className="text-sm font-semibold text-white">
                                  SALE-#{String(sale._id).slice(-6).toUpperCase()} • {customerName}
                                </p>
                                <p className="text-xs text-zinc-400">
                                  {customerPhone} • {new Date(sale.createdAt).toLocaleDateString("en-IN")} •{" "}
                                  <span className="uppercase text-zinc-300 font-medium">
                                    {sale.paymentType}
                                  </span>
                                </p>
                              </div>
                              <div className="text-right">
                                <p className="font-bold text-white text-sm">
                                  {formatMoney(sale.totalAmount)}
                                </p>
                                <span className="text-[11px] text-[var(--app-accent)] font-semibold">
                                  Select →
                                </span>
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>
                ) : (
                  <div>
                    {/* Selected Sale Overview Banner */}
                    <div
                      className="p-3.5 rounded-xl border flex items-center justify-between mb-4"
                      style={{
                        borderColor: "var(--app-accent-border)",
                        backgroundColor: "var(--app-accent-soft)",
                      }}
                    >
                      <div>
                        <p className="text-xs text-zinc-400">Selected Invoice</p>
                        <p className="text-sm font-bold text-white">
                          SALE-#{String(selectedSale._id).slice(-6).toUpperCase()} •{" "}
                          {selectedSale.customerId?.name ||
                            selectedSale.customerId?.userId?.name ||
                            "Walk-in Customer"}
                        </p>
                        <p className="text-xs text-zinc-400">
                          Original Total: {formatMoney(selectedSale.totalAmount)} ({selectedSale.paymentType?.toUpperCase()})
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedSale(null);
                          setReturnItems([]);
                        }}
                        className="text-xs font-semibold text-zinc-400 hover:text-white underline"
                      >
                        Change Sale
                      </button>
                    </div>

                    {/* Step 2: Return Mode (Full vs Partial) */}
                    <div className="mb-4">
                      <label className="mb-1.5 block text-xs font-semibold text-zinc-300">
                        Step 2: Return Mode
                      </label>
                      <div className="grid grid-cols-2 gap-3">
                        <button
                          type="button"
                          onClick={() => setReturnMode("full")}
                          className={`p-3 rounded-xl border text-left font-semibold text-sm transition ${
                            returnMode === "full"
                              ? "border-[var(--app-accent-border)] bg-[var(--app-accent-soft)] text-white"
                              : "border-zinc-800 bg-zinc-950 text-zinc-400 hover:text-white"
                          }`}
                        >
                          <p>Full Return</p>
                          <p className="text-[11px] font-normal text-zinc-400 mt-0.5">
                            Return all items on the invoice
                          </p>
                        </button>
                        <button
                          type="button"
                          onClick={() => setReturnMode("partial")}
                          className={`p-3 rounded-xl border text-left font-semibold text-sm transition ${
                            returnMode === "partial"
                              ? "border-[var(--app-accent-border)] bg-[var(--app-accent-soft)] text-white"
                              : "border-zinc-800 bg-zinc-950 text-zinc-400 hover:text-white"
                          }`}
                        >
                          <p>Partial Return</p>
                          <p className="text-[11px] font-normal text-zinc-400 mt-0.5">
                            Select specific item quantities
                          </p>
                        </button>
                      </div>
                    </div>

                    {/* Items List */}
                    <div className="mb-4">
                      <label className="mb-1.5 block text-xs font-semibold text-zinc-300">
                        Invoice Items
                      </label>
                      <div className="space-y-2 max-h-48 overflow-y-auto">
                        {returnItems.map((it, idx) => (
                          <div
                            key={idx}
                            className="flex items-center justify-between p-3 rounded-lg border text-xs"
                            style={{
                              borderColor: "var(--app-border)",
                              backgroundColor: "var(--app-surface-light)",
                            }}
                          >
                            <div className="flex-1 pr-3">
                              <p className="font-semibold text-white">{it.productName}</p>
                              <p className="text-zinc-500">
                                Sold: {it.soldQuantity} {it.unit} @ ₹{it.price}
                              </p>
                            </div>

                            {returnMode === "partial" ? (
                              <div className="flex items-center gap-2">
                                <label className="text-zinc-400 text-[11px]">Return Qty:</label>
                                <input
                                  type="number"
                                  min={0}
                                  max={it.soldQuantity}
                                  value={it.returnQuantity}
                                  onChange={(e) => handleItemQuantityChange(idx, e.target.value)}
                                  className="w-16 rounded border border-zinc-700 bg-zinc-900 p-1.5 text-center text-white outline-none"
                                />
                                <span className="w-20 text-right font-bold text-white">
                                  ₹{it.returnQuantity * it.price}
                                </span>
                              </div>
                            ) : (
                              <span className="font-bold text-white">
                                ₹{it.soldQuantity * it.price || it.total}
                              </span>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Refund Method */}
                    <div className="mb-4">
                      <label className="mb-1.5 block text-xs font-semibold text-zinc-300">
                        Step 3: Refund Method
                      </label>
                      <div className="grid grid-cols-3 gap-2">
                        {[
                          {
                            key: "credit_adjustment",
                            label: "Credit Balance Min (Deduct Debt)",
                            desc: "Subtract from customer credit debt",
                          },
                          { key: "cash", label: "Cash Refund", desc: "Handover cash to customer" },
                          { key: "upi", label: "UPI Refund", desc: "Send online via UPI" },
                        ].map((m) => (
                          <button
                            key={m.key}
                            type="button"
                            onClick={() => setRefundMethod(m.key)}
                            className={`p-2.5 rounded-lg border text-left text-xs transition ${
                              refundMethod === m.key
                                ? "border-[var(--app-accent-border)] bg-[var(--app-accent-soft)] text-white"
                                : "border-zinc-800 bg-zinc-950 text-zinc-400"
                            }`}
                          >
                            <p className="font-bold">{m.label}</p>
                            <p className="text-[10px] text-zinc-500 mt-0.5">{m.desc}</p>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Return Reason */}
                    <div className="mb-4">
                      <label className="mb-1 block text-xs font-semibold text-zinc-300">
                        Return Reason / Notes
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Defective piece, Customer changed mind, wrong item..."
                        value={reason}
                        onChange={(e) => setReason(e.target.value)}
                        className="w-full rounded-lg border p-3 text-sm text-white outline-none"
                        style={{
                          borderColor: "var(--app-border)",
                          backgroundColor: "var(--app-surface-light)",
                        }}
                      />
                    </div>

                    {refundMethod === "upi" && (
                      <div className="mb-4">
                        <label className="mb-1 block text-xs font-semibold text-zinc-300">
                          UPI Transaction / UTR Number
                        </label>
                        <input
                          type="text"
                          placeholder="e.g. UPI81293847"
                          value={transactionId}
                          onChange={(e) => setTransactionId(e.target.value)}
                          className="w-full rounded-lg border p-3 text-sm text-white outline-none font-mono"
                          style={{
                            borderColor: "var(--app-border)",
                            backgroundColor: "var(--app-surface-light)",
                          }}
                        />
                      </div>
                    )}

                    {/* Total Refund Banner */}
                    <div className="p-3.5 rounded-xl border flex items-center justify-between mb-5 bg-zinc-950 border-zinc-800">
                      <div>
                        <p className="text-xs text-zinc-400">Total Return Refund</p>
                        <p className="text-xl font-bold text-white">
                          {formatMoney(calculatedReturnTotal)}
                        </p>
                      </div>
                      <span className="text-xs text-yellow-400 font-semibold">
                        {refundMethod === "credit_adjustment"
                          ? "✓ Will deduct from customer pending credit"
                          : "✓ Direct refund to customer"}
                      </span>
                    </div>

                    {/* Submit Actions */}
                    <div className="flex gap-3">
                      <button
                        type="submit"
                        disabled={submitting || calculatedReturnTotal <= 0}
                        className="flex-1 rounded-lg py-3 font-semibold text-white disabled:opacity-50"
                        style={{ backgroundColor: "var(--app-accent)" }}
                      >
                        {submitting
                          ? "Processing..."
                          : `Confirm Return & Process ${formatMoney(calculatedReturnTotal)}`}
                      </button>
                      <button
                        type="button"
                        onClick={() => setShowCreateModal(false)}
                        className="flex-1 rounded-lg border py-3 font-semibold text-zinc-300"
                        style={{ borderColor: "var(--app-border)" }}
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
              </form>
            </div>
          </div>
        )}

        {/* Return Details Inspection Modal */}
        {selectedReturn && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
            <div
              className="w-full max-w-lg rounded-2xl border p-6 shadow-2xl"
              style={{ borderColor: "var(--app-border)", backgroundColor: "var(--app-surface)" }}
            >
              <div className="mb-4 flex items-center justify-between border-b pb-3" style={{ borderColor: "var(--app-border)" }}>
                <div>
                  <h3 className="text-lg font-bold text-white">Return Invoice Details</h3>
                  <p className="text-xs font-mono text-zinc-400">{selectedReturn.displayId}</p>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedReturn(null)}
                  className="text-zinc-400 hover:text-white"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-3 text-sm">
                <div className="flex justify-between border-b pb-2" style={{ borderColor: "var(--app-border)" }}>
                  <span className="text-zinc-500">Customer</span>
                  <span className="font-semibold text-white">
                    {selectedReturn.customerName} ({selectedReturn.customerPhone || "No phone"})
                  </span>
                </div>
                <div className="flex justify-between border-b pb-2" style={{ borderColor: "var(--app-border)" }}>
                  <span className="text-zinc-500">Original Sale ID</span>
                  <span className="font-mono text-zinc-300">{selectedReturn.displaySaleId}</span>
                </div>
                <div className="flex justify-between border-b pb-2" style={{ borderColor: "var(--app-border)" }}>
                  <span className="text-zinc-500">Refund Amount</span>
                  <span className="text-lg font-bold" style={{ color: "var(--app-accent)" }}>
                    {formatMoney(selectedReturn.returnAmount)}
                  </span>
                </div>
                <div className="flex justify-between border-b pb-2" style={{ borderColor: "var(--app-border)" }}>
                  <span className="text-zinc-500">Refund Method</span>
                  <span className={`rounded px-2 py-0.5 text-xs font-semibold ${getMethodBadge(selectedReturn.refundMethod)}`}>
                    {selectedReturn.refundMethod === "credit_adjustment"
                      ? "Credit Balance Min (Adjusted)"
                      : selectedReturn.refundMethod.toUpperCase()}
                  </span>
                </div>
                <div className="flex justify-between border-b pb-2" style={{ borderColor: "var(--app-border)" }}>
                  <span className="text-zinc-500">Return Date</span>
                  <span className="text-zinc-300">{selectedReturn.date}</span>
                </div>
                <div className="flex justify-between border-b pb-2" style={{ borderColor: "var(--app-border)" }}>
                  <span className="text-zinc-500">Processed By</span>
                  <span className="text-zinc-300">{selectedReturn.adminName}</span>
                </div>
                {selectedReturn.reason && (
                  <div className="border-b pb-2" style={{ borderColor: "var(--app-border)" }}>
                    <p className="text-zinc-500">Reason</p>
                    <p className="mt-1 text-zinc-300">{selectedReturn.reason}</p>
                  </div>
                )}

                {selectedReturn.items && selectedReturn.items.length > 0 && (
                  <div>
                    <p className="mb-2 font-semibold text-white">Returned Items</p>
                    <div className="space-y-1.5 max-h-36 overflow-y-auto">
                      {selectedReturn.items.map((it, idx) => (
                        <div
                          key={idx}
                          className="flex justify-between rounded p-2 text-xs border"
                          style={{
                            borderColor: "var(--app-border)",
                            backgroundColor: "var(--app-surface-light)",
                          }}
                        >
                          <span>
                            {it.productName || "Product"} (Qty: {it.quantity || 1} {it.unit || ""})
                          </span>
                          <span className="font-bold text-white">
                            ₹{it.price ? (it.price * (it.quantity || 1)).toLocaleString("en-IN") : "—"}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="mt-6">
                <button
                  type="button"
                  onClick={() => setSelectedReturn(null)}
                  className="w-full rounded-lg border py-2.5 font-semibold text-zinc-300 hover:bg-white/5"
                  style={{ borderColor: "var(--app-border)" }}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Returns;
