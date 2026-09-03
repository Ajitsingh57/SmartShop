import React, { useState, useEffect } from "react";
import {
  X,
  PlusCircle,
  RotateCcw,
  Sparkles,
  Upload,
  Image as ImageIcon,
  CheckCircle2,
  Clock,
  Truck,
  AlertCircle,
  Package,
  Phone,
  User,
  Mail,
  HelpCircle,
} from "lucide-react";
import { toast } from "react-toastify";
import { productRequestsApi, authApi } from "../services/api";
import {
  isValidName,
  isValidPhone,
  sanitizeNameInput,
  sanitizePhoneInput,
} from "../utils/validators";

const UNIT_OPTIONS = [
  "kg",
  "g",
  "litre",
  "ml",
  "packet",
  "pcs",
  "bottle",
  "box",
  "dozen",
  "can",
  "bag",
];

const CATEGORY_OPTIONS = [
  "General",
  "Grocery & Kirana",
  "Grains & Pulses",
  "Dairy & Bakery",
  "Beverages & Drinks",
  "Snacks & Biscuits",
  "Personal Care",
  "Household & Cleaning",
  "Spices & Oils",
];

const ProductRequestModal = ({ isOpen, onClose, initialProduct = null }) => {
  const [activeTab, setActiveTab] = useState("form"); // "form" | "history"

  // Form State
  const [requestType, setRequestType] = useState(
    initialProduct ? "restock" : "new_product"
  );
  const [productName, setProductName] = useState(initialProduct?.name || "");
  const [category, setCategory] = useState(initialProduct?.category || "General");
  const [requestedQuantity, setRequestedQuantity] = useState("");
  const [unit, setUnit] = useState(initialProduct?.unit || "kg");
  const [targetPrice, setTargetPrice] = useState("");
  const [description, setDescription] = useState("");

  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");

  const [selectedFile, setSelectedFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);

  // Status & List state
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});
  const [successMsg, setSuccessMsg] = useState("");
  const [myRequests, setMyRequests] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  // Preload customer profile info if logged in
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const token =
          localStorage.getItem("customerAuthToken") ||
          localStorage.getItem("authToken");
        if (token) {
          const profile = await authApi.getMyProfile();
          const user = profile?.user || profile?.data || profile;
          if (user) {
            setCustomerName(user.name || user.username || "");
            setCustomerPhone(user.phone || "");
            setCustomerEmail(user.email || "");
          }
        }
      } catch (err) {
        // Guest user fallback
      }
    };

    if (isOpen) {
      fetchUser();
    }
  }, [isOpen]);

  // Sync initialProduct if passed
  useEffect(() => {
    if (initialProduct) {
      setRequestType("restock");
      setProductName(initialProduct.name || "");
      setCategory(initialProduct.category || "General");
      setUnit(initialProduct.unit || "kg");
      if (initialProduct.image || initialProduct.imageUrl) {
        setImagePreview(initialProduct.image || initialProduct.imageUrl);
      }
    } else {
      setRequestType("new_product");
    }
  }, [initialProduct]);

  // Fetch customer's request history
  const loadMyRequests = async () => {
    try {
      setLoadingHistory(true);
      const res = await productRequestsApi.getMyRequests();
      const list = Array.isArray(res?.requests) ? res.requests : [];
      setMyRequests(list);
    } catch (err) {
      console.error("Failed to load request history:", err);
    } finally {
      setLoadingHistory(false);
    }
  };

  useEffect(() => {
    if (isOpen && activeTab === "history") {
      loadMyRequests();
    }
  }, [isOpen, activeTab]);

  if (!isOpen) return null;

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      const url = URL.createObjectURL(file);
      setImagePreview(url);
    }
  };

  const handleRemoveImage = () => {
    setSelectedFile(null);
    setImagePreview(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (submitting) return;

    setError("");
    setSuccessMsg("");
    setFieldErrors({});

    const newFieldErrors = {};

    if (!productName.trim()) {
      newFieldErrors.productName = "Please enter the product name.";
    }

    const qty = Number(requestedQuantity);
    if (!Number.isFinite(qty) || qty <= 0) {
      newFieldErrors.requestedQuantity = "Please enter a valid quantity greater than 0.";
    }

    if (!customerName.trim() || !isValidName(customerName)) {
      newFieldErrors.customerName = "Please enter your valid name (letters and spaces only).";
    }

    if (!customerPhone.trim() || !isValidPhone(customerPhone)) {
      newFieldErrors.customerPhone = "Please enter a valid 10-digit mobile number.";
    }

    if (Object.keys(newFieldErrors).length > 0) {
      setFieldErrors(newFieldErrors);
      const firstMsg = Object.values(newFieldErrors)[0];
      setError(firstMsg);
      toast.error(firstMsg);
      return;
    }

    try {
      setSubmitting(true);

      const formData = new FormData();
      formData.append("requestType", requestType);
      if (initialProduct?._id) {
        formData.append("productId", initialProduct._id);
      }
      formData.append("productName", productName.trim());
      formData.append("category", category);
      formData.append("requestedQuantity", qty);
      formData.append("unit", unit);
      if (targetPrice) {
        formData.append("targetPrice", Number(targetPrice));
      }
      formData.append("description", description.trim());
      formData.append("customerName", customerName.trim());
      formData.append("customerPhone", customerPhone.trim());
      if (customerEmail) {
        formData.append("customerEmail", customerEmail.trim());
      }
      if (selectedFile) {
        formData.append("image", selectedFile);
      }

      const response = await productRequestsApi.create(formData);

      const msg = response?.message || "Your product request has been received! The shopkeeper will review it soon.";
      setSuccessMsg(msg);
      toast.success(msg);

      // Reset form
      if (!initialProduct) {
        setProductName("");
        setRequestedQuantity("");
        setTargetPrice("");
        setDescription("");
        setSelectedFile(null);
        setImagePreview(null);
      }

      setTimeout(() => {
        setActiveTab("history");
        loadMyRequests();
      }, 1500);
    } catch (err) {
      console.error("Submit product request error:", err);
      const msg = err?.message || "Failed to submit request. Please try again.";
      setError(msg);
      if (err?.errors) setFieldErrors(err.errors);
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case "approved":
        return {
          label: "Approved",
          icon: CheckCircle2,
          color: "border-blue-500/30 bg-blue-500/10 text-blue-400",
        };
      case "in_procurement":
        return {
          label: "In Procurement (Stocking)",
          icon: Truck,
          color: "border-amber-500/30 bg-amber-500/10 text-amber-300",
        };
      case "available":
        return {
          label: "Available in Shop 🎉",
          icon: Sparkles,
          color: "border-emerald-500/30 bg-emerald-500/10 text-emerald-300",
        };
      case "rejected":
        return {
          label: "Not Available / Rejected",
          icon: AlertCircle,
          color: "border-rose-500/30 bg-rose-500/10 text-rose-400",
        };
      case "pending":
      default:
        return {
          label: "Pending Review",
          icon: Clock,
          color: "border-zinc-700 bg-zinc-800 text-zinc-300",
        };
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-3 sm:p-4 backdrop-blur-md overflow-y-auto">
      <div className="relative my-auto w-full max-w-2xl overflow-hidden rounded-2xl border border-white/10 bg-zinc-950 p-5 sm:p-7 shadow-2xl">
        {/* Modal Header */}
        <div className="flex items-start justify-between border-b border-white/10 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
                <Sparkles className="h-4 w-4" />
              </span>
              <h2 className="text-lg sm:text-xl font-bold text-white">
                {initialProduct ? "Request Restock / Bulk Stock" : "Request a Product"}
              </h2>
            </div>
            <p className="mt-1 text-xs text-zinc-400">
              {initialProduct
                ? `Notify the shopkeeper that you need more stock of "${initialProduct.name}".`
                : "Tell the shopkeeper what you need, whether it's an out-of-stock item or a new product!"}
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-zinc-400 hover:bg-zinc-900 hover:text-white transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="mt-4 flex gap-2 border-b border-white/5 pb-3">
          <button
            type="button"
            onClick={() => setActiveTab("form")}
            className={`flex items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-bold transition ${
              activeTab === "form"
                ? "bg-[var(--app-accent)] text-white shadow-lg"
                : "bg-zinc-900 text-zinc-400 hover:text-white"
            }`}
          >
            <PlusCircle className="h-3.5 w-3.5" />
            Submit Request
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("history")}
            className={`flex items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-bold transition ${
              activeTab === "history"
                ? "bg-[var(--app-accent)] text-white shadow-lg"
                : "bg-zinc-900 text-zinc-400 hover:text-white"
            }`}
          >
            <Clock className="h-3.5 w-3.5" />
            Track My Requests
          </button>
        </div>

        {/* Alerts */}
        {error && (
          <div className="mt-3.5 flex items-center gap-2 rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-xs text-red-300">
            <AlertCircle className="h-4 w-4 shrink-0 text-red-400" />
            <span>{error}</span>
          </div>
        )}

        {successMsg && (
          <div className="mt-3.5 flex items-center gap-2 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3 text-xs text-emerald-300">
            <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Tab 1: Request Form */}
        {activeTab === "form" && (
          <form onSubmit={handleSubmit} className="mt-4 space-y-4">
            {/* Request Type Toggle */}
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-zinc-300">
                Request Type
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setRequestType("restock")}
                  className={`flex items-center justify-center gap-2 rounded-xl border p-2.5 text-xs font-bold transition ${
                    requestType === "restock"
                      ? "border-amber-500 bg-amber-500/15 text-amber-300 shadow-sm ring-1 ring-amber-500/30"
                      : "border-zinc-800 bg-zinc-900/60 text-zinc-400 hover:border-zinc-700 hover:text-white"
                  }`}
                >
                  <RotateCcw className="h-4 w-4" />
                  Restock Existing Item
                </button>

                <button
                  type="button"
                  onClick={() => setRequestType("new_product")}
                  className={`flex items-center justify-center gap-2 rounded-xl border p-2.5 text-xs font-bold transition ${
                    requestType === "new_product"
                      ? "border-blue-500 bg-blue-500/15 text-blue-300 shadow-sm ring-1 ring-blue-500/30"
                      : "border-zinc-800 bg-zinc-900/60 text-zinc-400 hover:border-zinc-700 hover:text-white"
                  }`}
                >
                  <PlusCircle className="h-4 w-4" />
                  Request Brand New Item
                </button>
              </div>
            </div>

            {/* Product Details Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <label className="mb-1 block text-xs font-semibold text-zinc-300">
                  Product Name <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Basmati Rice, Tata Salt, Dove Soap..."
                  value={productName}
                  onChange={(e) => {
                    setProductName(e.target.value);
                    if (fieldErrors.productName) setFieldErrors((prev) => ({ ...prev, productName: "" }));
                  }}
                  className={`w-full rounded-xl border bg-zinc-900 px-3.5 py-2 text-xs text-white outline-none ${
                    fieldErrors.productName ? "border-red-500 ring-1 ring-red-500" : "border-zinc-700 focus:border-amber-500"
                  }`}
                />
                {fieldErrors.productName && (
                  <p className="mt-1 text-[11px] text-red-400 font-medium">
                    {fieldErrors.productName}
                  </p>
                )}
              </div>

              <div>
                <label className="mb-1 block text-xs font-semibold text-zinc-300">
                  Category
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full rounded-xl border border-zinc-700 bg-zinc-900 px-3 py-2 text-xs text-white outline-none focus:border-amber-500"
                >
                  {CATEGORY_OPTIONS.map((c) => (
                    <option key={c} value={c} className="bg-zinc-950">
                      {c}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Quantity and Unit */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
              <div className="sm:col-span-2">
                <label className="mb-1 block text-xs font-semibold text-zinc-300">
                  Requested Quantity <span className="text-red-400">*</span>
                </label>
                <div className="flex gap-2">
                  <input
                    type="number"
                    min="0.1"
                    step="any"
                    required
                    placeholder="e.g. 10 or 25"
                    value={requestedQuantity}
                    onChange={(e) => {
                      setRequestedQuantity(e.target.value);
                      if (fieldErrors.requestedQuantity) setFieldErrors((prev) => ({ ...prev, requestedQuantity: "" }));
                    }}
                    className={`w-full rounded-xl border bg-zinc-900 px-3.5 py-2 text-xs text-white outline-none ${
                      fieldErrors.requestedQuantity ? "border-red-500 ring-1 ring-red-500" : "border-zinc-700 focus:border-amber-500"
                    }`}
                  />
                  <select
                    value={unit}
                    onChange={(e) => setUnit(e.target.value)}
                    className="w-32 rounded-xl border border-zinc-700 bg-zinc-900 px-2.5 py-2 text-xs text-white outline-none focus:border-amber-500"
                  >
                    {UNIT_OPTIONS.map((u) => (
                      <option key={u} value={u} className="bg-zinc-950">
                        {u}
                      </option>
                    ))}
                  </select>
                </div>
                {fieldErrors.requestedQuantity && (
                  <p className="mt-1 text-[11px] text-red-400 font-medium">
                    {fieldErrors.requestedQuantity}
                  </p>
                )}
              </div>

              <div>
                <label className="mb-1 block text-xs font-semibold text-zinc-300">
                  Target Price (₹) <span className="text-zinc-500 font-normal">(Optional)</span>
                </label>
                <input
                  type="number"
                  min="0"
                  placeholder="Expected Price"
                  value={targetPrice}
                  onChange={(e) => setTargetPrice(e.target.value)}
                  className="w-full rounded-xl border border-zinc-700 bg-zinc-900 px-3.5 py-2 text-xs text-white outline-none focus:border-amber-500"
                />
              </div>
            </div>

            {/* Notes / Description */}
            <div>
              <label className="mb-1 block text-xs font-semibold text-zinc-300">
                Additional Notes / Brand Preference <span className="text-zinc-500 font-normal">(Optional)</span>
              </label>
              <textarea
                rows={2}
                placeholder="e.g. Prefer Fortune brand, need urgently before next Monday..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full rounded-xl border border-zinc-700 bg-zinc-900 px-3.5 py-2 text-xs text-white outline-none focus:border-amber-500"
              />
            </div>

            {/* Optional Image Upload */}
            <div>
              <label className="mb-1 flex items-center justify-between text-xs font-semibold text-zinc-300">
                <span>Product Photo / Reference Image <span className="text-zinc-500 font-normal">(Optional)</span></span>
                {imagePreview && (
                  <button
                    type="button"
                    onClick={handleRemoveImage}
                    className="text-[11px] font-medium text-rose-400 hover:underline"
                  >
                    Remove Image
                  </button>
                )}
              </label>

              {imagePreview ? (
                <div className="relative flex items-center gap-3 rounded-xl border border-zinc-800 bg-zinc-900 p-2.5">
                  <img
                    src={imagePreview}
                    alt="Preview"
                    className="h-16 w-16 rounded-lg object-contain bg-zinc-950 p-1 border border-white/10"
                  />
                  <div className="text-xs text-zinc-300">
                    <p className="font-semibold">{selectedFile?.name || "Product Image Attached"}</p>
                    <p className="text-[11px] text-zinc-500">
                      {selectedFile ? `${Math.round(selectedFile.size / 1024)} KB` : "Attached preview"}
                    </p>
                  </div>
                </div>
              ) : (
                <label className="flex cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed border-zinc-700 bg-zinc-900/50 p-4 transition hover:border-amber-500/50 hover:bg-zinc-900">
                  <Upload className="h-5 w-5 text-zinc-500 mb-1" />
                  <span className="text-xs font-medium text-zinc-300">
                    Click to attach product photo or reference
                  </span>
                  <span className="text-[10px] text-zinc-500">
                    (PNG, JPG, WebP up to 5MB)
                  </span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                </label>
              )}
            </div>

            {/* Customer Contact Info */}
            <div className="rounded-xl border border-white/5 bg-zinc-900/80 p-3.5 space-y-3">
              <span className="block text-xs font-bold text-zinc-300">
                Your Contact Information (For Notification)
              </span>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 flex items-center gap-1 text-[11px] text-zinc-400">
                    <User className="h-3 w-3" /> Full Name <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Your Name (letters only)"
                    value={customerName}
                    onChange={(e) => {
                      setCustomerName(sanitizeNameInput(e.target.value));
                      if (fieldErrors.customerName) setFieldErrors((prev) => ({ ...prev, customerName: "" }));
                    }}
                    className={`w-full rounded-lg border bg-zinc-950 px-3 py-1.5 text-xs text-white outline-none ${
                      fieldErrors.customerName ? "border-red-500 ring-1 ring-red-500" : "border-zinc-700 focus:border-amber-500"
                    }`}
                  />
                  {fieldErrors.customerName && (
                    <p className="mt-1 text-[11px] text-red-400 font-medium">
                      {fieldErrors.customerName}
                    </p>
                  )}
                </div>

                <div>
                  <label className="mb-1 flex items-center gap-1 text-[11px] text-zinc-400">
                    <Phone className="h-3 w-3" /> Phone Number <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="tel"
                    maxLength={10}
                    required
                    placeholder="10-digit mobile number"
                    value={customerPhone}
                    onChange={(e) => {
                      setCustomerPhone(sanitizePhoneInput(e.target.value));
                      if (fieldErrors.customerPhone) setFieldErrors((prev) => ({ ...prev, customerPhone: "" }));
                    }}
                    className={`w-full rounded-lg border bg-zinc-950 px-3 py-1.5 text-xs text-white outline-none ${
                      fieldErrors.customerPhone ? "border-red-500 ring-1 ring-red-500" : "border-zinc-700 focus:border-amber-500"
                    }`}
                  />
                  {fieldErrors.customerPhone && (
                    <p className="mt-1 text-[11px] text-red-400 font-medium">
                      {fieldErrors.customerPhone}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-3 pt-2 border-t border-white/10">
              <button
                type="button"
                onClick={onClose}
                className="rounded-xl border border-zinc-700 px-4 py-2 text-xs font-semibold text-zinc-400 hover:text-white transition"
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={submitting}
                className="flex items-center gap-2 rounded-xl bg-[var(--app-accent)] px-5 py-2.5 text-xs font-bold text-white shadow-lg transition hover:opacity-90 disabled:opacity-50"
              >
                {submitting ? (
                  "Submitting..."
                ) : (
                  <>
                    <Sparkles className="h-4 w-4" />
                    Submit Product Request
                  </>
                )}
              </button>
            </div>
          </form>
        )}

        {/* Tab 2: Track My Requests */}
        {activeTab === "history" && (
          <div className="mt-4 space-y-3">
            {loadingHistory ? (
              <div className="py-12 text-center text-xs text-zinc-500">
                Loading your request history...
              </div>
            ) : myRequests.length === 0 ? (
              <div className="rounded-xl border border-dashed border-zinc-800 p-8 text-center text-zinc-500">
                <Package className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p className="text-xs font-semibold text-zinc-400">No product requests submitted yet</p>
                <p className="mt-1 text-[11px]">
                  Submit a request in the "Submit Request" tab to let the shopkeeper know what you need!
                </p>
              </div>
            ) : (
              <div className="max-h-[380px] space-y-2.5 overflow-y-auto pr-1">
                {myRequests.map((req) => {
                  const statusInfo = getStatusBadge(req.status);
                  const StatusIcon = statusInfo.icon;

                  return (
                    <div
                      key={req._id}
                      className="rounded-xl border border-white/5 bg-zinc-900/60 p-3.5 transition hover:bg-zinc-900/90"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-start gap-3">
                          {req.image ? (
                            <img
                              src={req.image}
                              alt={req.productName}
                              className="h-12 w-12 rounded-lg object-contain bg-zinc-950 p-1 border border-white/10"
                            />
                          ) : (
                            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-zinc-950 border border-white/10 text-zinc-600">
                              <Package className="h-6 w-6" />
                            </div>
                          )}

                          <div>
                            <div className="flex items-center gap-2">
                              <h4 className="text-sm font-bold text-white">
                                {req.productName}
                              </h4>
                              <span className="rounded bg-zinc-800 px-1.5 py-0.2 text-[10px] text-zinc-400">
                                {req.category}
                              </span>
                            </div>

                            <p className="mt-0.5 text-xs text-amber-300 font-semibold">
                              Needed: {req.requestedQuantity} {req.unit}
                              {req.targetPrice ? ` • Target: ₹${req.targetPrice}` : ""}
                            </p>

                            {req.description && (
                              <p className="mt-1 text-[11px] text-zinc-400">
                                Note: {req.description}
                              </p>
                            )}
                          </div>
                        </div>

                        {/* Status Badge */}
                        <span
                          className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[10px] font-bold ${statusInfo.color}`}
                        >
                          <StatusIcon className="h-3 w-3" />
                          {statusInfo.label}
                        </span>
                      </div>

                      {/* Shopkeeper Response / Admin Note */}
                      {req.adminNote && (
                        <div className="mt-2.5 rounded-lg border border-amber-500/20 bg-amber-500/10 p-2 text-xs text-amber-200">
                          <span className="font-bold">Shopkeeper Note: </span>
                          <span>{req.adminNote}</span>
                        </div>
                      )}

                      <div className="mt-2 text-right text-[10px] text-zinc-500 font-mono">
                        Requested on {new Date(req.createdAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ProductRequestModal;
