import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { productsApi, categoriesApi } from "../services/api";
import { Plus, X, RefreshCw, AlertTriangle } from "lucide-react";

const EditProduct = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  // Dynamic categories list
  const [categories, setCategories] = useState([]);
  const [loadingCategories, setLoadingCategories] = useState(true);

  // Inline category creation modal
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [newCatName, setNewCatName] = useState("");
  const [newCatDesc, setNewCatDesc] = useState("");
  const [creatingCat, setCreatingCat] = useState(false);
  const [catModalError, setCatModalError] = useState("");

  const [form, setForm] = useState({
    name: "",
    category: "",
    price: "",
    stock: "",
    unit: "",
    lowStockLimit: "",
    description: "",
    available: true,
  });

  const [currentImage, setCurrentImage] = useState("");
  const [image, setImage] = useState(null);
  const [preview, setPreview] = useState("");

  // Load existing product details
  useEffect(() => {
    const fetchProduct = async () => {
      try {
        setLoading(true);
        setError("");

        const response = await productsApi.getById(id);
        const product =
          response?.product ||
          response?.data?.product ||
          response?.data ||
          response;

        if (!product) {
          throw new Error("Product not found");
        }

        const stock = Number(product.stock || 0);

        setForm({
          name: product.name || "",
          category: product.category || "",
          price: product.price ?? "",
          stock: product.stock ?? "",
          unit: product.unit || "",
          lowStockLimit: product.lowStockLimit ?? "",
          description: product.description || "",
          available: stock === 0 ? false : product.available === true,
        });

        setCurrentImage(product.image || "");
      } catch (err) {
        console.error("Fetch product error:", err);
        setError(err?.message || "Unable to load product.");
      } finally {
        setLoading(false);
      }
    };

    const fetchCategories = async () => {
      try {
        setLoadingCategories(true);
        const res = await categoriesApi.getAll();
        if (res?.success && Array.isArray(res.categories)) {
          const names = res.categories.map((c) => c.name).filter(Boolean);
          setCategories(names);
        }
      } catch (err) {
        console.error("Fetch categories error:", err);
      } finally {
        setLoadingCategories(false);
      }
    };

    if (id) {
      fetchProduct();
    }
    fetchCategories();
  }, [id]);

  const handleCreateCategory = async (e) => {
    e.preventDefault();
    if (!newCatName.trim()) {
      setCatModalError("Please enter a category name");
      return;
    }

    try {
      setCreatingCat(true);
      setCatModalError("");

      const res = await categoriesApi.create({
        name: newCatName.trim(),
        description: newCatDesc.trim(),
      });

      if (res?.success) {
        const createdName = res.category?.name || newCatName.trim();
        setCategories((prev) => {
          if (!prev.includes(createdName)) {
            return [...prev, createdName].sort();
          }
          return prev;
        });
        setForm((prev) => ({ ...prev, category: createdName }));
        setShowCategoryModal(false);
        setNewCatName("");
        setNewCatDesc("");
      } else {
        throw new Error(res?.message || "Failed to create category");
      }
    } catch (err) {
      console.error("Inline category create error:", err);
      setCatModalError(err?.message || "Failed to create category");
    } finally {
      setCreatingCat(false);
    }
  };

  // Handle inputs and dynamic availability on stock changes
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;

    setForm((prev) => {
      if (name === "stock") {
        const numericStock = value === "" ? "" : Number(value);

        if (numericStock !== "" && numericStock === 0) {
          return {
            ...prev,
            stock: value,
            available: false,
          };
        }

        if (numericStock !== "" && numericStock > 0) {
          return {
            ...prev,
            stock: value,
            available: Number(prev.stock || 0) === 0 ? true : prev.available,
          };
        }

        return {
          ...prev,
          stock: value,
        };
      }

      if (name === "available") {
        const stock = Number(prev.stock || 0);
        if (stock === 0) {
          return {
            ...prev,
            available: false,
          };
        }

        return {
          ...prev,
          available: checked,
        };
      }

      return {
        ...prev,
        [name]: type === "checkbox" ? checked : value,
      };
    });
  };

  const handleImageChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImage(file);
    if (preview) {
      URL.revokeObjectURL(preview);
    }
    const imageUrl = URL.createObjectURL(file);
    setPreview(imageUrl);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!form.name.trim()) {
      setError("Product name is required.");
      return;
    }

    if (
      form.price === "" ||
      Number.isNaN(Number(form.price)) ||
      Number(form.price) < 0
    ) {
      setError("Please enter a valid price.");
      return;
    }

    if (
      form.stock === "" ||
      Number.isNaN(Number(form.stock)) ||
      Number(form.stock) < 0
    ) {
      setError("Please enter a valid stock.");
      return;
    }

    if (!form.unit.trim()) {
      setError("Unit is required.");
      return;
    }

    if (
      form.lowStockLimit !== "" &&
      (Number.isNaN(Number(form.lowStockLimit)) || Number(form.lowStockLimit) < 0)
    ) {
      setError("Low stock limit cannot be negative.");
      return;
    }

    try {
      setSaving(true);
      const stock = Number(form.stock);
      const finalAvailable = stock === 0 ? false : form.available;

      const formData = new FormData();
      formData.append("name", form.name.trim());
      formData.append("category", form.category.trim() || "General");
      formData.append("price", String(Number(form.price)));
      formData.append("stock", String(stock));
      formData.append("unit", form.unit.trim());

      if (form.lowStockLimit !== "") {
        formData.append("lowStockLimit", String(Number(form.lowStockLimit)));
      }

      formData.append("description", form.description.trim());
      formData.append("available", String(finalAvailable));

      if (image) {
        formData.append("image", image);
      }

      const response = await productsApi.update(id, formData);
      if (response && response.success === false) {
        throw new Error(response.message || "Unable to update product.");
      }

      navigate("/products");
    } catch (err) {
      console.error("Update product error:", err);
      setError(err?.message || "Unable to update product. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div
        className="min-h-[calc(100vh-73px)] px-4 py-8"
        style={{
          backgroundColor: "var(--app-bg)",
          color: "var(--app-text)",
        }}
      >
        <div className="mx-auto max-w-3xl text-center">
          <p className="text-sm text-zinc-500">Loading product...</p>
        </div>
      </div>
    );
  }

  if (error && !form.name) {
    return (
      <div
        className="min-h-[calc(100vh-73px)] px-4 py-8"
        style={{ backgroundColor: "var(--app-bg)" }}
      >
        <div className="mx-auto max-w-3xl">
          <div
            className="rounded-2xl border p-8 text-center"
            style={{
              borderColor: "var(--app-border)",
              backgroundColor: "var(--app-surface)",
            }}
          >
            <div className="mb-3 text-3xl">⚠️</div>
            <p className="text-sm text-red-400">{error}</p>
            <button
              type="button"
              onClick={() => navigate("/products")}
              className="mt-5 rounded-lg px-5 py-2.5 text-sm font-semibold text-white"
              style={{ backgroundColor: "var(--app-accent)" }}
            >
              Back to Products
            </button>
          </div>
        </div>
      </div>
    );
  }

  const currentStock = Number(form.stock || 0);
  const stockZero = currentStock === 0;

  return (
    <div
      className="min-h-[calc(100vh-73px)] w-full px-4 py-5 sm:px-6 lg:px-8"
      style={{
        backgroundColor: "var(--app-bg)",
        color: "var(--app-text)",
      }}
    >
      <div className="mx-auto max-w-3xl">
        <div className="mb-5">
          <button
            type="button"
            onClick={() => navigate("/products")}
            className="mb-3 text-xs font-medium text-zinc-500 transition hover:text-white"
          >
            ← Back to Products
          </button>

          <div className="flex items-end justify-between gap-4">
            <div>
              <p
                className="mb-1 text-xs font-semibold uppercase tracking-wider"
                style={{ color: "var(--app-accent)" }}
              >
                Inventory Management
              </p>
              <h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">
                Edit Product
              </h1>
              <p className="mt-1 text-xs text-zinc-500">
                Update product details, pricing and stock.
              </p>
            </div>

            <div
              className="hidden rounded-lg border px-3 py-2 text-right sm:block"
              style={{
                borderColor: "var(--app-border)",
                backgroundColor: "var(--app-surface)",
              }}
            >
              <p className="text-[10px] uppercase tracking-wider text-zinc-600">Product ID</p>
              <p className="mt-0.5 max-w-[160px] truncate text-[11px] text-zinc-400">{id}</p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          <div
            className="overflow-hidden rounded-2xl border"
            style={{
              borderColor: "var(--app-border)",
              backgroundColor: "var(--app-surface)",
              boxShadow: "0 15px 45px rgba(0,0,0,0.20)",
            }}
          >
            <SectionHeader
              title="Product Information"
              description="Basic information about this product."
            />

            <div className="grid gap-4 p-4 sm:grid-cols-2">
              <FormField label="Product Name" required>
                <Input
                  type="text"
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  placeholder="e.g. Basmati Rice"
                />
              </FormField>

              <div>
                <div className="mb-1.5 flex items-center justify-between">
                  <label className="block text-[11px] font-semibold text-zinc-400">
                    Category <span className="text-red-400">*</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setCatModalError("");
                      setNewCatName("");
                      setNewCatDesc("");
                      setShowCategoryModal(true);
                    }}
                    className="inline-flex items-center gap-1 text-[11px] font-semibold text-[var(--app-accent)] hover:underline"
                  >
                    <Plus className="h-3 w-3" />
                    <span>New Category</span>
                  </button>
                </div>

                <select
                  name="category"
                  value={form.category}
                  onChange={handleChange}
                  disabled={saving || loadingCategories}
                  className="h-10 w-full rounded-xl border bg-zinc-950/60 px-3 text-sm text-zinc-200 outline-none transition focus:border-[var(--app-accent)] focus:ring-1 focus:ring-[var(--app-accent)]"
                  style={{ borderColor: "var(--app-border)" }}
                >
                  <option value="">
                    {loadingCategories ? "Loading categories..." : "Select category"}
                  </option>
                  {Array.from(new Set([...(form.category ? [form.category] : []), ...categories])).map((item) => (
                    <option key={item} value={item}>
                      {item}
                    </option>
                  ))}
                </select>
              </div>

              <FormField label="Price" required>
                <div className="relative">
                  <span
                    className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-medium"
                    style={{ color: "var(--app-accent)" }}
                  >
                    ₹
                  </span>
                  <Input
                    type="number"
                    name="price"
                    min="0"
                    step="0.01"
                    value={form.price}
                    onChange={handleChange}
                    placeholder="0.00"
                    className="pl-8"
                  />
                </div>
              </FormField>

              <FormField label="Stock" required>
                <Input
                  type="number"
                  name="stock"
                  min="0"
                  step="1"
                  value={form.stock}
                  onChange={handleChange}
                  placeholder="0"
                />
                <p className="mt-1.5 text-[10px] text-zinc-600">
                  Stock 0 automatically marks the product unavailable.
                </p>
              </FormField>

              <FormField label="Unit" required>
                <Input
                  type="text"
                  name="unit"
                  value={form.unit}
                  onChange={handleChange}
                  placeholder="pcs, kg, litre..."
                />
              </FormField>

              <FormField label="Low Stock Limit">
                <Input
                  type="number"
                  name="lowStockLimit"
                  min="0"
                  step="1"
                  value={form.lowStockLimit}
                  onChange={handleChange}
                  placeholder="e.g. 5"
                />
              </FormField>

              <div className="sm:col-span-2">
                <FormField label="Description">
                  <textarea
                    name="description"
                    value={form.description}
                    onChange={handleChange}
                    rows={3}
                    placeholder="Enter a short product description..."
                    className="w-full resize-none rounded-xl border bg-zinc-950/60 px-3.5 py-3 text-sm text-zinc-200 outline-none transition placeholder:text-zinc-700 focus:bg-zinc-950 focus:ring-1"
                    style={{
                      borderColor: "var(--app-border)",
                      "--tw-ring-color": "var(--app-accent)",
                    }}
                  />
                </FormField>
              </div>
            </div>

            <SectionHeader
              title="Product Image"
              description="Replace the current image if required."
            />

            <div className="p-4">
              <div
                className="flex flex-col gap-4 rounded-xl border p-3 sm:flex-row sm:items-center"
                style={{
                  borderColor: "var(--app-border)",
                  backgroundColor: "var(--app-surface-light)",
                }}
              >
                <div
                  className="h-24 w-24 shrink-0 overflow-hidden rounded-xl border bg-zinc-950"
                  style={{ borderColor: "var(--app-border)" }}
                >
                  <img
                    src={preview || currentImage || "/logo.jpg"}
                    alt={form.name}
                    className="h-full w-full object-cover"
                    onError={(e) => {
                      e.currentTarget.onerror = null;
                      e.currentTarget.src = "/logo.jpg";
                    }}
                  />
                </div>

                <div className="min-w-0 flex-1">
                  <p className="mb-1 text-xs font-semibold text-zinc-300">Change Product Image</p>
                  <p className="mb-3 text-[11px] text-zinc-600">
                    Leave unchanged to keep the current image.
                  </p>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="block w-full cursor-pointer rounded-lg border bg-zinc-950 p-1.5 text-xs text-zinc-500 file:mr-3 file:rounded-md file:border-0 file:bg-zinc-800 file:px-3 file:py-1.5 file:text-[11px] file:font-medium file:text-zinc-300"
                    style={{ borderColor: "var(--app-border)" }}
                  />
                  {image && (
                    <p className="mt-2 truncate text-[11px]" style={{ color: "var(--app-accent)" }}>
                      Selected: {image.name}
                    </p>
                  )}
                </div>
              </div>
            </div>

            <SectionHeader
              title="Availability"
              description="Control whether this product is available for your shop operations."
            />

            <div className="p-4">
              <label
                className={`flex items-center justify-between gap-4 rounded-xl border p-3.5 transition ${
                  stockZero ? "cursor-not-allowed opacity-80" : "cursor-pointer"
                }`}
                style={{
                  borderColor: stockZero ? "rgba(239,68,68,0.25)" : "var(--app-border)",
                  backgroundColor: "var(--app-surface-light)",
                }}
              >
                <div className="flex min-w-0 items-center gap-3">
                  <div
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-sm"
                    style={
                      stockZero
                        ? { backgroundColor: "rgba(239,68,68,0.10)", color: "#f87171" }
                        : form.available
                        ? { backgroundColor: "rgba(34,197,94,0.10)", color: "#4ade80" }
                        : { backgroundColor: "rgba(239,68,68,0.10)", color: "#f87171" }
                    }
                  >
                    {stockZero ? "×" : form.available ? "✓" : "×"}
                  </div>

                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-zinc-200">
                      {stockZero ? "Unavailable — Out of Stock" : "Available for shop operations"}
                    </p>
                    <p className="mt-0.5 text-[11px] text-zinc-600">
                      {stockZero
                        ? "Stock is 0, so this product cannot be marked available."
                        : form.available
                        ? "Product is currently available."
                        : "Product is manually marked unavailable."}
                    </p>
                  </div>
                </div>

                <input
                  type="checkbox"
                  name="available"
                  checked={stockZero ? false : form.available}
                  onChange={handleChange}
                  disabled={stockZero}
                  className={`h-5 w-5 shrink-0 ${stockZero ? "cursor-not-allowed opacity-50" : "cursor-pointer"}`}
                  style={{ accentColor: "var(--app-accent)" }}
                />
              </label>

              <div
                className="mt-3 rounded-lg border px-3 py-2.5"
                style={{
                  borderColor: "var(--app-border)",
                  backgroundColor: "var(--app-surface-light)",
                }}
              >
                <p className="text-[10px] leading-5 text-zinc-600">
                  <span className="font-semibold text-zinc-400">Availability rule:</span> Stock 0 automatically marks item unavailable. Stock greater than 0 defaults to available, with manual override.
                </p>
              </div>
            </div>

            {error && (
              <div className="px-4 pb-3">
                <div className="rounded-lg border border-red-500/20 bg-red-500/10 px-3 py-2.5">
                  <p className="text-xs text-red-400">{error}</p>
                </div>
              </div>
            )}

            <div
              className="flex flex-col-reverse gap-2.5 border-t p-4 sm:flex-row sm:justify-end"
              style={{
                borderColor: "var(--app-border)",
                backgroundColor: "var(--app-surface-light)",
              }}
            >
              <button
                type="button"
                onClick={() => navigate("/products")}
                disabled={saving}
                className="rounded-xl border px-5 py-2.5 text-xs font-semibold text-zinc-400 transition hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
                style={{ borderColor: "var(--app-border)" }}
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={saving}
                className="rounded-xl px-6 py-2.5 text-xs font-semibold text-white transition hover:-translate-y-[1px] disabled:cursor-not-allowed disabled:opacity-50"
                style={{
                  backgroundColor: "var(--app-accent)",
                  boxShadow: "0 8px 20px var(--app-accent-soft)",
                }}
              >
                {saving ? "Updating..." : "Update Product"}
              </button>
            </div>
          </div>
        </form>
      </div>

      {/* Quick Add Category Modal */}
      {showCategoryModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm animate-in fade-in">
          <div
            className="w-full max-w-md rounded-2xl border p-6 shadow-2xl"
            style={{
              borderColor: "var(--app-border)",
              backgroundColor: "var(--app-surface)",
            }}
          >
            <div className="flex items-center justify-between pb-4 border-b border-zinc-800">
              <div className="flex items-center gap-2.5">
                <div
                  className="flex h-9 w-9 items-center justify-center rounded-lg"
                  style={{
                    backgroundColor: "var(--app-accent-soft)",
                    color: "var(--app-accent)",
                  }}
                >
                  <Plus className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-white">Create New Category</h2>
                  <p className="text-xs text-zinc-400">Instantly add and select this category</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowCategoryModal(false)}
                className="text-zinc-400 hover:text-white text-lg"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {catModalError && (
              <div className="mt-4 flex items-center gap-2 rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-xs text-red-300">
                <AlertTriangle className="h-4 w-4 shrink-0 text-red-400" />
                <span>{catModalError}</span>
              </div>
            )}

            <form onSubmit={handleCreateCategory} className="mt-4 space-y-4">
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-zinc-300">
                  Category Name <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  value={newCatName}
                  onChange={(e) => setNewCatName(e.target.value)}
                  placeholder="e.g. Beverages, Dairy, Snacks"
                  autoFocus
                  disabled={creatingCat}
                  className="w-full rounded-lg border px-3.5 py-2.5 text-sm text-white placeholder-zinc-600 outline-none transition focus:border-[var(--app-accent)] focus:ring-1 focus:ring-[var(--app-accent)] disabled:opacity-50"
                  style={{
                    borderColor: "var(--app-border)",
                    backgroundColor: "var(--app-surface-light)",
                  }}
                />
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-semibold text-zinc-300">
                  Description <span className="text-zinc-500 font-normal">(Optional)</span>
                </label>
                <textarea
                  rows={2}
                  value={newCatDesc}
                  onChange={(e) => setNewCatDesc(e.target.value)}
                  placeholder="Optional notes or details..."
                  disabled={creatingCat}
                  className="w-full resize-none rounded-lg border px-3.5 py-2 text-sm text-white placeholder-zinc-600 outline-none transition focus:border-[var(--app-accent)] focus:ring-1 focus:ring-[var(--app-accent)] disabled:opacity-50"
                  style={{
                    borderColor: "var(--app-border)",
                    backgroundColor: "var(--app-surface-light)",
                  }}
                />
              </div>

              <div className="mt-6 flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCategoryModal(false)}
                  disabled={creatingCat}
                  className="rounded-lg border border-zinc-700 bg-zinc-800/60 px-4 py-2 text-xs font-semibold text-zinc-300 hover:bg-zinc-800 hover:text-white transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creatingCat}
                  className="inline-flex items-center gap-2 rounded-lg px-5 py-2 text-xs font-semibold text-white transition hover:opacity-90 disabled:opacity-50"
                  style={{ backgroundColor: "var(--app-accent)" }}
                >
                  {creatingCat && <RefreshCw className="h-3.5 w-3.5 animate-spin" />}
                  <span>{creatingCat ? "Creating..." : "Create & Select"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

const SectionHeader = ({ title, description }) => {
  return (
    <div
      className="border-b px-4 py-3"
      style={{
        borderColor: "var(--app-border)",
        backgroundColor: "var(--app-surface-light)",
      }}
    >
      <h2 className="text-xs font-bold uppercase tracking-wider text-zinc-300">
        {title}
      </h2>
      <p className="mt-0.5 text-[11px] text-zinc-600">{description}</p>
    </div>
  );
};

const FormField = ({ label, required = false, children }) => {
  return (
    <div>
      <label className="mb-1.5 block text-[11px] font-semibold text-zinc-400">
        {label}
        {required && <span className="ml-1 text-red-400">*</span>}
      </label>
      {children}
    </div>
  );
};

const Input = ({ className = "", ...props }) => {
  return (
    <input
      {...props}
      className={`h-10 w-full rounded-xl border bg-zinc-950/60 px-3.5 text-sm text-zinc-200 outline-none transition placeholder:text-zinc-700 focus:bg-zinc-950 ${className}`}
      style={{ borderColor: "var(--app-border)" }}
      onFocus={(e) => {
        e.currentTarget.style.borderColor = "var(--app-accent)";
        e.currentTarget.style.boxShadow = "0 0 0 2px var(--app-accent-soft)";
      }}
      onBlur={(e) => {
        e.currentTarget.style.borderColor = "var(--app-border)";
        e.currentTarget.style.boxShadow = "none";
      }}
    />
  );
};

export default EditProduct;