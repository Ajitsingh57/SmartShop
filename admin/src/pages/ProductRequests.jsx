import React, { useEffect, useState, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Package,
  Sparkles,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  Truck,
  AlertCircle,
  XCircle,
  Phone,
  User,
  Mail,
  PlusCircle,
  RotateCcw,
  RefreshCw,
  ExternalLink,
  Trash2,
  Edit3,
  X,
  Eye,
  SlidersHorizontal,
} from "lucide-react";
import { toast } from "react-toastify";
import { productRequestsApi } from "../services/api";

const ProductRequests = () => {
  const navigate = useNavigate();

  const [requests, setRequests] = useState([]);
  const [counts, setCounts] = useState({
    total: 0,
    pending: 0,
    approved: 0,
    inProcurement: 0,
    available: 0,
    rejected: 0,
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");

  // Status Change Modal State
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [newStatus, setNewStatus] = useState("");
  const [adminNote, setAdminNote] = useState("");
  const [updating, setUpdating] = useState(false);

  // Image Preview Modal
  const [previewImage, setPreviewImage] = useState(null);

  const fetchRequests = async () => {
    try {
      setLoading(true);
      setError("");

      const params = {};
      if (statusFilter !== "all") params.status = statusFilter;
      if (typeFilter !== "all") params.requestType = typeFilter;
      if (search.trim()) params.search = search.trim();

      const response = await productRequestsApi.getAll(params);
      if (response?.success) {
        setRequests(response.requests || []);
        if (response.counts) {
          setCounts(response.counts);
        }
      }
    } catch (err) {
      console.error("Fetch product requests error:", err);
      setError(err?.message || "Failed to load product requests.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, [statusFilter, typeFilter]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchRequests();
  };

  const handleOpenStatusModal = (req) => {
    setSelectedRequest(req);
    setNewStatus(req.status);
    setAdminNote(req.adminNote || "");
    setError("");
  };

  const handleStatusUpdate = async (e) => {
    e.preventDefault();
    if (!selectedRequest || updating) return;

    try {
      setUpdating(true);
      setError("");
      setSuccess("");

      const res = await productRequestsApi.updateStatus(selectedRequest._id, {
        status: newStatus,
        adminNote: adminNote.trim(),
      });

      const msg = res?.message || `Request for "${selectedRequest.productName}" updated to ${newStatus}.`;
      setSuccess(msg);
      toast.success(msg);
      setSelectedRequest(null);
      await fetchRequests();
    } catch (err) {
      console.error("Update request status error:", err);
      const msg = err?.message || "Failed to update request status.";
      setError(msg);
      toast.error(msg);
    } finally {
      setUpdating(false);
    }
  };

  const handleDelete = async (id, name) => {
    const confirmed = window.confirm(
      `Delete product request for "${name}"?\nThis action cannot be undone.`
    );
    if (!confirmed) return;

    try {
      setError("");
      const res = await productRequestsApi.delete(id);
      const msg = res?.message || "Product request deleted successfully.";
      setSuccess(msg);
      toast.success(msg);
      await fetchRequests();
    } catch (err) {
      console.error("Delete request error:", err);
      const msg = err?.message || "Failed to delete product request.";
      setError(msg);
      toast.error(msg);
    }
  };

  const handleAddProductFromRequest = (req) => {
    // Navigate to Add Product page with pre-filled state
    navigate("/products/add", {
      state: {
        name: req.productName,
        category: req.category,
        unit: req.unit,
        price: req.targetPrice || "",
        description: req.description,
        image: req.image,
      },
    });
  };

  const getStatusConfig = (status) => {
    switch (status) {
      case "approved":
        return {
          label: "Approved",
          icon: CheckCircle2,
          badge: "border-blue-500/30 bg-blue-500/10 text-blue-400",
        };
      case "in_procurement":
        return {
          label: "In Procurement (Stocking)",
          icon: Truck,
          badge: "border-amber-500/30 bg-amber-500/10 text-amber-300",
        };
      case "available":
        return {
          label: "Available in Shop 🎉",
          icon: Sparkles,
          badge: "border-emerald-500/30 bg-emerald-500/10 text-emerald-300",
        };
      case "rejected":
        return {
          label: "Rejected / Unavailable",
          icon: XCircle,
          badge: "border-rose-500/30 bg-rose-500/10 text-rose-400",
        };
      case "pending":
      default:
        return {
          label: "Pending Review",
          icon: Clock,
          badge: "border-zinc-700 bg-zinc-800 text-zinc-300",
        };
    }
  };

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <Sparkles className="h-4 w-4" />
            </span>
            <h1 className="text-2xl font-bold text-white">Customer Product Requests</h1>
          </div>
          <p className="mt-1 text-xs text-zinc-400">
            View out-of-stock restock requests and new item requests submitted by customers.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Link
            to="/products"
            className="flex items-center gap-1.5 rounded-xl border border-white/10 bg-zinc-900 px-3.5 py-2 text-xs font-semibold text-zinc-300 hover:text-white transition"
          >
            <Package className="h-3.5 w-3.5" />
            <span>Store Products</span>
          </Link>

          <Link
            to="/products/add"
            className="flex items-center gap-1.5 rounded-xl bg-[var(--app-accent)] px-4 py-2 text-xs font-bold text-white shadow-lg transition hover:opacity-90"
          >
            <PlusCircle className="h-3.5 w-3.5" />
            <span>Add New Product</span>
          </Link>
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {[
          { label: "All Requests", count: counts.total, color: "text-white", bg: "bg-zinc-900/60" },
          { label: "Pending", count: counts.pending, color: "text-amber-400", bg: "bg-amber-500/5 border-amber-500/20" },
          { label: "Approved", count: counts.approved, color: "text-blue-400", bg: "bg-blue-500/5 border-blue-500/20" },
          { label: "Procuring", count: counts.inProcurement, color: "text-purple-400", bg: "bg-purple-500/5 border-purple-500/20" },
          { label: "Available", count: counts.available, color: "text-emerald-400", bg: "bg-emerald-500/5 border-emerald-500/20" },
          { label: "Rejected", count: counts.rejected, color: "text-rose-400", bg: "bg-rose-500/5 border-rose-500/20" },
        ].map((stat, i) => (
          <div
            key={i}
            className={`rounded-2xl border p-3.5 ${stat.bg}`}
            style={{ borderColor: stat.bg.includes("border") ? undefined : "var(--app-border)" }}
          >
            <span className="text-[11px] font-medium text-zinc-400">{stat.label}</span>
            <p className={`mt-1 text-xl sm:text-2xl font-extrabold ${stat.color}`}>
              {stat.count}
            </p>
          </div>
        ))}
      </div>

      {/* Alerts */}
      {error && (
        <div className="flex items-center justify-between rounded-xl border border-red-500/30 bg-red-500/10 p-3.5 text-xs text-red-300">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4 text-red-400 shrink-0" />
            <span>{error}</span>
          </div>
          <button onClick={() => setError("")} className="text-zinc-400 hover:text-white">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {success && (
        <div className="flex items-center justify-between rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3.5 text-xs text-emerald-300">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
            <span>{success}</span>
          </div>
          <button onClick={() => setSuccess("")} className="text-zinc-400 hover:text-white">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Filters and Search Bar */}
      <div
        className="rounded-2xl border p-4 space-y-3"
        style={{ borderColor: "var(--app-border)", backgroundColor: "var(--app-surface)" }}
      >
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Status Tabs */}
          <div className="flex flex-wrap items-center gap-1.5">
            {[
              { key: "all", label: "All" },
              { key: "pending", label: "Pending" },
              { key: "approved", label: "Approved" },
              { key: "in_procurement", label: "Procuring" },
              { key: "available", label: "Available" },
              { key: "rejected", label: "Rejected" },
            ].map((tab) => (
              <button
                key={tab.key}
                type="button"
                onClick={() => setStatusFilter(tab.key)}
                className={`rounded-xl px-3 py-1.5 text-xs font-semibold transition ${
                  statusFilter === tab.key
                    ? "bg-[var(--app-accent)] text-white shadow-sm"
                    : "bg-zinc-900 text-zinc-400 hover:text-white"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Type Filter & Search Form */}
          <div className="flex flex-wrap items-center gap-2">
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="h-9 rounded-xl border border-zinc-700 bg-zinc-900 px-3 text-xs font-semibold text-zinc-300 outline-none focus:border-amber-500"
            >
              <option value="all">Type: All</option>
              <option value="restock">Restock Existing</option>
              <option value="new_product">New Product</option>
            </select>

            <form onSubmit={handleSearchSubmit} className="relative flex-1 sm:w-60">
              <input
                type="text"
                placeholder="Search product or customer..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="h-9 w-full rounded-xl border border-zinc-700 bg-zinc-900 pl-8 pr-8 text-xs text-white placeholder:text-zinc-500 outline-none focus:border-amber-500"
              />
              <Search className="h-3.5 w-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-zinc-500" />
              {search && (
                <button
                  type="button"
                  onClick={() => {
                    setSearch("");
                    fetchRequests();
                  }}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </form>

            <button
              type="button"
              onClick={fetchRequests}
              title="Refresh"
              className="rounded-xl border border-zinc-700 bg-zinc-900 p-2 text-zinc-400 hover:text-white"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            </button>
          </div>
        </div>
      </div>

      {/* Requests Content */}
      {loading ? (
        <div className="py-16 text-center text-zinc-500">
          <RefreshCw className="mx-auto mb-2 h-8 w-8 animate-spin text-[var(--app-accent)]" />
          <p className="text-xs font-medium">Loading customer requests...</p>
        </div>
      ) : requests.length === 0 ? (
        <div
          className="rounded-2xl border border-dashed py-16 text-center"
          style={{ borderColor: "var(--app-border)" }}
        >
          <Package className="h-10 w-10 mx-auto mb-2 text-zinc-600" />
          <p className="text-sm font-semibold text-zinc-300">No product requests found</p>
          <p className="mt-1 text-xs text-zinc-500">
            {search || statusFilter !== "all" || typeFilter !== "all"
              ? "No requests match the selected filters."
              : "When customers request out-of-stock items or new products, they will appear here."}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {requests.map((req) => {
            const statusConfig = getStatusConfig(req.status);
            const StatusIcon = statusConfig.icon;

            return (
              <div
                key={req._id}
                className="flex flex-col justify-between rounded-2xl border p-4 sm:p-5 transition hover:bg-white/[0.01]"
                style={{
                  borderColor: "var(--app-border)",
                  backgroundColor: "var(--app-surface)",
                }}
              >
                <div>
                  {/* Top Header: Image, Title, Type Badge */}
                  <div className="flex items-start gap-3.5">
                    {/* Image / Thumbnail */}
                    {req.image ? (
                      <button
                        type="button"
                        onClick={() => setPreviewImage(req.image)}
                        className="group relative h-16 w-16 shrink-0 overflow-hidden rounded-xl border border-white/10 bg-zinc-950 p-1 cursor-zoom-in"
                      >
                        <img
                          src={req.image}
                          alt={req.productName}
                          className="h-full w-full object-contain transition group-hover:scale-110"
                        />
                        <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition">
                          <Eye className="h-4 w-4 text-white" />
                        </div>
                      </button>
                    ) : (
                      <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-zinc-950 text-zinc-600">
                        <Package className="h-8 w-8" />
                      </div>
                    )}

                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span
                          className={`rounded-full px-2 py-0.2 text-[10px] font-bold ${
                            req.requestType === "restock"
                              ? "bg-amber-500/10 text-amber-400 border border-amber-500/30"
                              : "bg-blue-500/10 text-blue-400 border border-blue-500/30"
                          }`}
                        >
                          {req.requestType === "restock" ? "Restock Request" : "New Item Request"}
                        </span>

                        <span className="rounded-full border border-zinc-700 bg-zinc-900 px-2 py-0.2 text-[10px] text-zinc-400">
                          {req.category}
                        </span>

                        {/* Status badge */}
                        <span
                          className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.2 text-[10px] font-bold ml-auto ${statusConfig.badge}`}
                        >
                          <StatusIcon className="h-3 w-3" />
                          {statusConfig.label}
                        </span>
                      </div>

                      <h3 className="mt-1 text-base font-bold text-white truncate" title={req.productName}>
                        {req.productName}
                      </h3>

                      <p className="mt-0.5 text-xs text-amber-300 font-semibold">
                        Needed: <span className="text-white font-bold">{req.requestedQuantity} {req.unit}</span>
                        {req.targetPrice && ` • Target Price: ₹${req.targetPrice}`}
                      </p>
                    </div>
                  </div>

                  {/* Customer Notes */}
                  {req.description && (
                    <div className="mt-3 rounded-xl border border-white/5 bg-zinc-950/60 p-2.5 text-xs text-zinc-300">
                      <span className="font-semibold text-zinc-400">Customer Note: </span>
                      <span>"{req.description}"</span>
                    </div>
                  )}

                  {/* Customer Info Card */}
                  <div className="mt-3 flex flex-wrap items-center justify-between gap-2 rounded-xl border border-white/5 bg-zinc-900/60 p-2.5 text-xs">
                    <div className="flex items-center gap-2">
                      <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-zinc-800 text-zinc-300">
                        <User className="h-3.5 w-3.5" />
                      </span>
                      <div>
                        <p className="font-semibold text-white">{req.customerName}</p>
                        <p className="text-[10px] text-zinc-500">
                          {req.customer ? "Registered Customer" : "Guest Customer"}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <a
                        href={`tel:${req.customerPhone}`}
                        className="inline-flex items-center gap-1 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-1 text-xs font-bold text-emerald-400 hover:bg-emerald-500/20"
                      >
                        <Phone className="h-3 w-3" />
                        {req.customerPhone}
                      </a>
                    </div>
                  </div>

                  {/* Admin Note if present */}
                  {req.adminNote && (
                    <div className="mt-3 rounded-xl border border-amber-500/20 bg-amber-500/5 p-2.5 text-xs text-amber-200">
                      <span className="font-bold">Your Response Note: </span>
                      <span>{req.adminNote}</span>
                    </div>
                  )}
                </div>

                {/* Card Actions Footer */}
                <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-white/5 pt-3">
                  <span className="text-[10px] text-zinc-500 font-mono">
                    Requested on {new Date(req.createdAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                  </span>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleOpenStatusModal(req)}
                      className="inline-flex items-center gap-1 rounded-xl border border-zinc-700 bg-zinc-900 px-3 py-1.5 text-xs font-semibold text-zinc-300 hover:text-white hover:border-zinc-600 transition"
                    >
                      <Edit3 className="h-3.5 w-3.5" />
                      <span>Update Status</span>
                    </button>

                    {req.requestType === "new_product" && (
                      <button
                        type="button"
                        onClick={() => handleAddProductFromRequest(req)}
                        title="Add this product to shop catalog"
                        className="inline-flex items-center gap-1 rounded-xl bg-amber-500 px-3 py-1.5 text-xs font-bold text-black hover:bg-amber-400 transition"
                      >
                        <PlusCircle className="h-3.5 w-3.5" />
                        <span>Add to Catalog</span>
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => handleDelete(req._id, req.productName)}
                      title="Delete request"
                      className="rounded-xl border border-zinc-800 p-1.5 text-zinc-500 hover:text-rose-400 hover:border-rose-500/30"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Status Update Modal */}
      {selectedRequest && (
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
                <h3 className="text-base font-bold text-white">Update Request Status</h3>
                <p className="text-xs text-zinc-400">
                  {selectedRequest.productName} (Customer: {selectedRequest.customerName})
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedRequest(null)}
                className="rounded p-1 text-zinc-400 hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleStatusUpdate} className="space-y-3.5">
              <div>
                <label className="mb-1 block text-xs font-semibold text-zinc-300">
                  Select Status
                </label>
                <select
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value)}
                  className="w-full rounded-xl border border-zinc-700 bg-zinc-950 px-3.5 py-2 text-xs text-white outline-none focus:border-amber-500"
                >
                  <option value="pending">⏳ Pending Review</option>
                  <option value="approved">✅ Approved (Will Procure)</option>
                  <option value="in_procurement">🚚 In Procurement / On the Way</option>
                  <option value="available">🎉 Available in Shop</option>
                  <option value="rejected">❌ Rejected / Not Available</option>
                </select>
              </div>

              <div>
                <label className="mb-1 block text-xs font-semibold text-zinc-300">
                  Note to Customer <span className="text-zinc-500 font-normal">(Visible to customer)</span>
                </label>
                <textarea
                  rows={3}
                  placeholder="e.g. Stock will arrive by Friday evening, or item is now available in rack #2..."
                  value={adminNote}
                  onChange={(e) => setAdminNote(e.target.value)}
                  className="w-full rounded-xl border border-zinc-700 bg-zinc-950 px-3.5 py-2 text-xs text-white outline-none focus:border-amber-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setSelectedRequest(null)}
                  className="rounded-xl border border-zinc-700 px-3.5 py-2 text-xs font-semibold text-zinc-400 hover:text-white"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={updating}
                  className="rounded-xl bg-[var(--app-accent)] px-4 py-2 text-xs font-bold text-white shadow-lg transition hover:opacity-90 disabled:opacity-50"
                >
                  {updating ? "Saving..." : "Save Status"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Image Preview Zoom Modal */}
      {previewImage && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4 backdrop-blur-md"
          onClick={() => setPreviewImage(null)}
        >
          <div className="relative max-h-[85vh] max-w-xl overflow-hidden rounded-2xl border border-white/10 bg-zinc-950 p-2">
            <button
              type="button"
              onClick={() => setPreviewImage(null)}
              className="absolute right-3 top-3 rounded-full bg-black/70 p-1.5 text-white hover:bg-black"
            >
              <X className="h-5 w-5" />
            </button>
            <img
              src={previewImage}
              alt="Enlarged reference"
              className="max-h-[80vh] w-full object-contain rounded-xl"
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductRequests;
