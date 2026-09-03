import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Plus, FolderTree, X, RefreshCw, AlertTriangle } from "lucide-react";
import { toast } from "react-toastify";
import { productsApi, categoriesApi } from "../services/api";

const AddProduct = () => {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: "",
    category: "",
    price: "",
    stock: "",
    unit: "",
    lowStockLimit: "",
    description: "",
  });

  const [image, setImage] = useState(null);
  const [preview, setPreview] = useState("");
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});
  const [saving, setSaving] = useState(false);

  // Dynamic categories from backend
  const [categories, setCategories] = useState([]);
  const [loadingCategories, setLoadingCategories] = useState(true);

  // Inline category creation modal state
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [newCatName, setNewCatName] = useState("");
  const [newCatDesc, setNewCatDesc] = useState("");
  const [creatingCat, setCreatingCat] = useState(false);
  const [catModalError, setCatModalError] = useState("");

  const fetchCategories = async () => {
    try {
      setLoadingCategories(true);
      const res = await categoriesApi.getAll();
      if (res?.success && Array.isArray(res.categories)) {
        const catNames = res.categories.map((c) => c.name).filter(Boolean);
        setCategories(catNames.length > 0 ? catNames : [
          "Electronics", "Accessories", "Groceries", "Clothing", "Home & Kitchen", "Beauty", "Stationery", "Other"
        ]);
      }
    } catch (err) {
      console.error("Failed to load categories:", err);
      setCategories([
        "Electronics", "Accessories", "Groceries", "Clothing", "Home & Kitchen", "Beauty", "Stationery", "Other"
      ]);
    } finally {
      setLoadingCategories(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

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
        setFormData((prev) => ({ ...prev, category: createdName }));
        setShowCategoryModal(false);
        setNewCatName("");
        setNewCatDesc("");
        toast.success(`Category "${createdName}" created!`);
      } else {
        throw new Error(res?.message || "Failed to create category");
      }
    } catch (err) {
      console.error("Inline category create error:", err);
      const msg = err?.message || "Failed to create category";
      setCatModalError(msg);
      toast.error(msg);
    } finally {
      setCreatingCat(false);
    }
  };

  // Revoke object URL on unmount or preview replacement
  useEffect(() => {
    return () => {
      if (preview) {
        URL.revokeObjectURL(preview);
      }
    };
  }, [preview]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    if (error) setError("");
    if (fieldErrors[name]) {
      setFieldErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const handleImageChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      const msg = "Please select a valid image file (PNG, JPG, JPEG, WebP).";
      setError(msg);
      setFieldErrors((prev) => ({ ...prev, image: msg }));
      toast.error(msg);
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      const msg = "Image size should be less than 5 MB.";
      setError(msg);
      setFieldErrors((prev) => ({ ...prev, image: msg }));
      toast.error(msg);
      return;
    }

    if (preview) {
      URL.revokeObjectURL(preview);
    }

    const imageUrl = URL.createObjectURL(file);
    setImage(file);
    setPreview(imageUrl);
    setError("");
    setFieldErrors((prev) => ({ ...prev, image: "" }));
  };

  const removeImage = () => {
    if (preview) {
      URL.revokeObjectURL(preview);
    }
    setImage(null);
    setPreview("");

    const input = document.getElementById("product-image");
    if (input) input.value = "";
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setFieldErrors({});

    const newFieldErrors = {};

    if (!formData.name.trim()) {
      newFieldErrors.name = "Please enter the product name.";
    }

    if (!formData.category) {
      newFieldErrors.category = "Please select a category.";
    }

    if (
      formData.price === "" ||
      Number.isNaN(Number(formData.price)) ||
      Number(formData.price) <= 0
    ) {
      newFieldErrors.price = "Please enter a valid product price greater than ₹0.";
    }

    if (
      formData.stock === "" ||
      Number.isNaN(Number(formData.stock)) ||
      Number(formData.stock) < 0
    ) {
      newFieldErrors.stock = "Please enter a valid stock quantity (0 or more).";
    }

    if (!formData.unit.trim()) {
      newFieldErrors.unit = "Please enter the product unit (e.g. pcs, kg, litre, packet).";
    }

    if (
      formData.lowStockLimit !== "" &&
      (Number.isNaN(Number(formData.lowStockLimit)) || Number(formData.lowStockLimit) < 0)
    ) {
      newFieldErrors.lowStockLimit = "Low stock alert limit cannot be negative.";
    }

    if (!image) {
      newFieldErrors.image = "Please select a product image.";
    }

    if (Object.keys(newFieldErrors).length > 0) {
      setFieldErrors(newFieldErrors);
      const firstMsg = Object.values(newFieldErrors)[0];
      setError(firstMsg);
      toast.error(firstMsg);
      return;
    }

    try {
      setSaving(true);
      const data = new FormData();

      data.append("name", formData.name.trim());
      data.append("category", formData.category.trim());
      data.append("price", String(Number(formData.price)));
      data.append("stock", String(Number(formData.stock)));
      data.append("unit", formData.unit.trim());

      if (formData.lowStockLimit !== "") {
        data.append("lowStockLimit", String(Number(formData.lowStockLimit)));
      }

      data.append("description", formData.description.trim());
      data.append("available", String(Number(formData.stock) > 0));
      data.append("image", image);

      const response = await productsApi.add(data);
      if (response && response.success === false) {
        throw new Error(response.message || "Unable to add product.");
      }

      toast.success(response?.message || "Product added successfully!");
      navigate("/products");
    } catch (err) {
      console.error("Add product error:", err);
      const msg = err?.message || "Unable to add product. Please try again.";
      setError(msg);
      if (err?.errors) setFieldErrors(err.errors);
      toast.error(msg);
    } finally {
      setSaving(false);
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
      <div className="mx-auto max-w-5xl">
        <div className="mb-7">
          <div className="mb-3 flex items-center gap-2 text-sm">
            <Link
              to="/products"
              className="transition"
              style={{ color: "var(--app-text-muted)" }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = "var(--app-accent)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = "var(--app-text-muted)";
              }}
            >
              Products
            </Link>
            <span style={{ color: "var(--app-border)" }}>/</span>
            <span style={{ color: "var(--app-text-secondary)" }}>Add Product</span>
          </div>

          <h1 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
            Add Product
          </h1>
          <p className="mt-2 text-sm" style={{ color: "var(--app-text-muted)" }}>
            Add a new product to your SmartShop inventory.
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
            <div className="space-y-6">
              {/* Product form details */}
              <div
                className="rounded-xl border p-5 sm:p-6"
                style={{
                  borderColor: "var(--app-border)",
                  backgroundColor: "var(--app-surface)",
                }}
              >
                <div className="mb-6">
                  <h2 className="text-base font-semibold text-white">Basic Information</h2>
                  <p className="mt-1 text-xs" style={{ color: "var(--app-text-muted)" }}>
                    Enter the basic details of the product.
                  </p>
                </div>

                <div className="space-y-5">
                  <div>
                    <label htmlFor="name" className="mb-2 block text-sm font-medium text-zinc-300">
                      Product Name <span className="text-red-400">*</span>
                    </label>
                    <input
                      id="name"
                      name="name"
                      type="text"
                      value={formData.name}
                      onChange={handleChange}
                      placeholder="Enter product name"
                      disabled={saving}
                      className={`w-full rounded-lg border px-4 py-3 text-sm text-white outline-none placeholder:text-zinc-600 transition focus:ring-1 disabled:cursor-not-allowed disabled:opacity-60 ${
                        fieldErrors.name ? "border-red-500 ring-1 ring-red-500" : ""
                      }`}
                      style={{
                        borderColor: fieldErrors.name ? "#ef4444" : "var(--app-border)",
                        backgroundColor: "var(--app-surface-light)",
                        "--tw-ring-color": "var(--app-accent-soft)",
                      }}
                    />
                    {fieldErrors.name && (
                      <p className="mt-1 text-xs text-red-500 font-medium">
                        {fieldErrors.name}
                      </p>
                    )}
                  </div>

                  <div>
                    <div className="mb-2 flex items-center justify-between">
                      <label htmlFor="category" className="block text-sm font-medium text-zinc-300">
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
                        className="inline-flex items-center gap-1 text-xs font-semibold text-[var(--app-accent)] hover:underline"
                      >
                        <Plus className="h-3.5 w-3.5" />
                        <span>New Category</span>
                      </button>
                    </div>

                    <select
                      id="category"
                      name="category"
                      value={formData.category}
                      onChange={handleChange}
                      disabled={saving || loadingCategories}
                      className={`w-full rounded-lg border px-4 py-3 text-sm text-zinc-200 outline-none transition focus:ring-1 disabled:cursor-not-allowed disabled:opacity-60 ${
                        fieldErrors.category ? "border-red-500 ring-1 ring-red-500" : ""
                      }`}
                      style={{
                        borderColor: fieldErrors.category ? "#ef4444" : "var(--app-border)",
                        backgroundColor: "var(--app-surface-light)",
                        "--tw-ring-color": "var(--app-accent-soft)",
                      }}
                    >
                      <option value="">
                        {loadingCategories ? "Loading categories..." : "Select category"}
                      </option>
                      {categories.map((item) => (
                        <option key={item} value={item}>
                          {item}
                        </option>
                      ))}
                    </select>
                    {fieldErrors.category && (
                      <p className="mt-1 text-xs text-red-500 font-medium">
                        {fieldErrors.category}
                      </p>
                    )}
                  </div>

                  <div className="grid gap-5 sm:grid-cols-2">
                    <div>
                      <label htmlFor="price" className="mb-2 block text-sm font-medium text-zinc-300">
                        Selling Price <span className="text-red-400">*</span>
                      </label>
                      <div className="relative">
                        <span
                          className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-sm"
                          style={{ color: "var(--app-text-muted)" }}
                        >
                          ₹
                        </span>
                        <input
                          id="price"
                          name="price"
                          type="number"
                          min="0"
                          step="0.01"
                          value={formData.price}
                          onChange={handleChange}
                          placeholder="0"
                          disabled={saving}
                          className={`w-full rounded-lg border py-3 pl-9 pr-4 text-sm text-white outline-none placeholder:text-zinc-600 transition focus:ring-1 disabled:cursor-not-allowed disabled:opacity-60 ${
                            fieldErrors.price ? "border-red-500 ring-1 ring-red-500" : ""
                          }`}
                          style={{
                            borderColor: fieldErrors.price ? "#ef4444" : "var(--app-border)",
                            backgroundColor: "var(--app-surface-light)",
                            "--tw-ring-color": "var(--app-accent-soft)",
                          }}
                        />
                      </div>
                      {fieldErrors.price && (
                        <p className="mt-1 text-xs text-red-500 font-medium">
                          {fieldErrors.price}
                        </p>
                      )}
                    </div>

                    <div>
                      <label htmlFor="stock" className="mb-2 block text-sm font-medium text-zinc-300">
                        Stock Quantity <span className="text-red-400">*</span>
                      </label>
                      <input
                        id="stock"
                        name="stock"
                        type="number"
                        min="0"
                        step="1"
                        value={formData.stock}
                        onChange={handleChange}
                        placeholder="0"
                        disabled={saving}
                        className={`w-full rounded-lg border px-4 py-3 text-sm text-white outline-none placeholder:text-zinc-600 transition focus:ring-1 disabled:cursor-not-allowed disabled:opacity-60 ${
                          fieldErrors.stock ? "border-red-500 ring-1 ring-red-500" : ""
                        }`}
                        style={{
                          borderColor: fieldErrors.stock ? "#ef4444" : "var(--app-border)",
                          backgroundColor: "var(--app-surface-light)",
                          "--tw-ring-color": "var(--app-accent-soft)",
                        }}
                      />
                      {fieldErrors.stock && (
                        <p className="mt-1 text-xs text-red-500 font-medium">
                          {fieldErrors.stock}
                        </p>
                      )}
                    </div>
                  </div>

                  <div>
                    <label htmlFor="unit" className="mb-2 block text-sm font-medium text-zinc-300">
                      Unit <span className="text-red-400">*</span>
                    </label>
                    <input
                      id="unit"
                      name="unit"
                      type="text"
                      value={formData.unit}
                      onChange={handleChange}
                      placeholder="e.g. pcs, kg, litre"
                      disabled={saving}
                      className={`w-full rounded-lg border px-4 py-3 text-sm text-white outline-none placeholder:text-zinc-600 transition focus:ring-1 disabled:cursor-not-allowed disabled:opacity-60 ${
                        fieldErrors.unit ? "border-red-500 ring-1 ring-red-500" : ""
                      }`}
                      style={{
                        borderColor: fieldErrors.unit ? "#ef4444" : "var(--app-border)",
                        backgroundColor: "var(--app-surface-light)",
                        "--tw-ring-color": "var(--app-accent-soft)",
                      }}
                    />
                    {fieldErrors.unit && (
                      <p className="mt-1 text-xs text-red-500 font-medium">
                        {fieldErrors.unit}
                      </p>
                    )}
                  </div>

                  <div>
                    <label htmlFor="lowStockLimit" className="mb-2 block text-sm font-medium text-zinc-300">
                      Low Stock Limit
                    </label>
                    <input
                      id="lowStockLimit"
                      name="lowStockLimit"
                      type="number"
                      min="0"
                      step="1"
                      value={formData.lowStockLimit}
                      onChange={handleChange}
                      placeholder="e.g. 5"
                      disabled={saving}
                      className={`w-full rounded-lg border px-4 py-3 text-sm text-white outline-none placeholder:text-zinc-600 transition focus:ring-1 disabled:cursor-not-allowed disabled:opacity-60 ${
                        fieldErrors.lowStockLimit ? "border-red-500 ring-1 ring-red-500" : ""
                      }`}
                      style={{
                        borderColor: fieldErrors.lowStockLimit ? "#ef4444" : "var(--app-border)",
                        backgroundColor: "var(--app-surface-light)",
                        "--tw-ring-color": "var(--app-accent-soft)",
                      }}
                    />
                    {fieldErrors.lowStockLimit && (
                      <p className="mt-1 text-xs text-red-500 font-medium">
                        {fieldErrors.lowStockLimit}
                      </p>
                    )}
                  </div>

                  <div>
                    <label htmlFor="description" className="mb-2 block text-sm font-medium text-zinc-300">
                      Description
                    </label>
                    <textarea
                      id="description"
                      name="description"
                      rows="5"
                      value={formData.description}
                      onChange={handleChange}
                      placeholder="Enter product description..."
                      disabled={saving}
                      className="w-full resize-none rounded-lg border px-4 py-3 text-sm text-white outline-none placeholder:text-zinc-600 transition focus:ring-1 disabled:cursor-not-allowed disabled:opacity-60"
                      style={{
                        borderColor: "var(--app-border)",
                        backgroundColor: "var(--app-surface-light)",
                        "--tw-ring-color": "var(--app-accent-soft)",
                      }}
                    />
                  </div>
                </div>
              </div>

              {error && (
                <div
                  className="rounded-lg border px-4 py-3 text-sm text-red-400"
                  style={{
                    borderColor: "rgba(239,68,68,0.20)",
                    backgroundColor: "rgba(239,68,68,0.05)",
                  }}
                >
                  {error}
                </div>
              )}
            </div>

            {/* Media upload and submit actions */}
            <div className="space-y-6">
              <div
                className="rounded-xl border p-5"
                style={{
                  borderColor: fieldErrors.image ? "#ef4444" : "var(--app-border)",
                  backgroundColor: "var(--app-surface)",
                }}
              >
                <div className="mb-5">
                  <h2 className="text-base font-semibold text-white">Product Image <span className="text-red-400">*</span></h2>
                  <p className="mt-1 text-xs" style={{ color: "var(--app-text-muted)" }}>
                    Upload a clear image of the product.
                  </p>
                  {fieldErrors.image && (
                    <p className="mt-2 text-xs text-red-500 font-medium">
                      {fieldErrors.image}
                    </p>
                  )}
                </div>

                {preview ? (
                  <div
                    className="relative rounded-xl border p-3"
                    style={{
                      borderColor: "var(--app-border)",
                      backgroundColor: "var(--app-surface-light)",
                    }}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className="h-20 w-20 shrink-0 overflow-hidden rounded-lg border bg-zinc-950"
                        style={{ borderColor: "var(--app-border)" }}
                      >
                        <img src={preview} alt="Product preview" className="h-full w-full object-cover" />
                      </div>

                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-zinc-300">{image?.name}</p>
                        <p className="mt-1 text-[11px] text-zinc-600">
                          {image ? `${(image.size / 1024 / 1024).toFixed(2)} MB` : ""}
                        </p>
                        <button
                          type="button"
                          onClick={removeImage}
                          disabled={saving}
                          className="mt-2 rounded-md border px-2.5 py-1.5 text-[11px] font-medium text-red-400 transition hover:bg-red-500/10 disabled:cursor-not-allowed disabled:opacity-50"
                          style={{ borderColor: "rgba(239,68,68,0.20)" }}
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <label
                    htmlFor="product-image"
                    className="flex aspect-square cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed px-5 text-center transition"
                    style={{
                      borderColor: "var(--app-border)",
                      backgroundColor: "var(--app-surface-light)",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = "var(--app-accent-border)";
                      e.currentTarget.style.backgroundColor = "var(--app-accent-soft)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = "var(--app-border)";
                      e.currentTarget.style.backgroundColor = "var(--app-surface-light)";
                    }}
                  >
                    <div
                      className="flex h-14 w-14 items-center justify-center rounded-full text-2xl"
                      style={{ backgroundColor: "var(--app-accent-soft)" }}
                    >
                      🖼️
                    </div>
                    <p className="mt-4 text-sm font-medium text-zinc-300">Upload product image</p>
                    <p className="mt-2 text-xs leading-5" style={{ color: "var(--app-text-muted)" }}>
                      PNG, JPG or WEBP<br />Maximum size 5 MB
                    </p>
                    <span
                      className="mt-4 rounded-lg border px-4 py-2 text-xs font-medium"
                      style={{
                        borderColor: "var(--app-border)",
                        backgroundColor: "var(--app-surface)",
                        color: "var(--app-text-secondary)",
                      }}
                    >
                      Choose Image
                    </span>
                    <input
                      id="product-image"
                      type="file"
                      accept="image/png,image/jpeg,image/webp"
                      onChange={handleImageChange}
                      disabled={saving}
                      className="hidden"
                    />
                  </label>
                )}
              </div>

              <div
                className="rounded-xl border p-5"
                style={{
                  borderColor: "var(--app-border)",
                  backgroundColor: "var(--app-surface)",
                }}
              >
                <button
                  type="submit"
                  disabled={saving}
                  className="w-full rounded-lg px-5 py-3 text-sm font-semibold text-white shadow-lg transition-all duration-300 hover:-translate-y-[1px] disabled:cursor-not-allowed disabled:opacity-60"
                  style={{
                    backgroundColor: "var(--app-accent)",
                    boxShadow: "0 10px 25px var(--app-accent-soft)",
                  }}
                  onMouseEnter={(e) => {
                    if (!saving) e.currentTarget.style.backgroundColor = "var(--app-accent-hover)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = "var(--app-accent)";
                  }}
                >
                  {saving ? "Adding Product..." : "Add Product"}
                </button>

                <Link
                  to="/products"
                  className="mt-3 block w-full rounded-lg border px-5 py-3 text-center text-sm font-medium transition"
                  style={{
                    borderColor: "var(--app-border)",
                    backgroundColor: "var(--app-surface-light)",
                    color: "var(--app-text-secondary)",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = "var(--app-accent-border)";
                    e.currentTarget.style.color = "var(--app-accent)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = "var(--app-border)";
                    e.currentTarget.style.color = "var(--app-text-secondary)";
                  }}
                >
                  Cancel
                </Link>
              </div>
            </div>
          </div>
        </form>
      </div>

      {/* Quick Add Category Modal */}
      {showCategoryModal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/75 p-0 sm:p-4 backdrop-blur-sm animate-in fade-in">
          <div
            className="w-full max-w-md rounded-t-2xl sm:rounded-2xl border p-5 sm:p-6 shadow-2xl max-h-[90vh] overflow-y-auto"
            style={{
              borderColor: "var(--app-border)",
              backgroundColor: "var(--app-surface)",
            }}
          >
            <div className="flex items-center justify-between pb-3.5 border-b border-zinc-800">
              <div className="flex items-center gap-2.5 min-w-0">
                <div
                  className="flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-lg shrink-0"
                  style={{
                    backgroundColor: "var(--app-accent-soft)",
                    color: "var(--app-accent)",
                  }}
                >
                  <Plus className="h-4 w-4 sm:h-5 sm:w-5" />
                </div>
                <div className="min-w-0">
                  <h2 className="text-base sm:text-lg font-bold text-white truncate">Create New Category</h2>
                  <p className="text-[11px] sm:text-xs text-zinc-400 truncate">Instantly add and select this category</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowCategoryModal(false)}
                className="text-zinc-400 hover:text-white p-1 text-base shrink-0"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {catModalError && (
              <div className="mt-3.5 flex items-center gap-2 rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-xs text-red-300">
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

              <div className="mt-5 sm:mt-6 flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-2.5 sm:gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCategoryModal(false)}
                  disabled={creatingCat}
                  className="w-full sm:w-auto rounded-lg border border-zinc-700 bg-zinc-800/60 px-4 py-2.5 sm:py-2 text-xs font-semibold text-zinc-300 hover:bg-zinc-800 hover:text-white transition text-center"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creatingCat}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-lg px-5 py-2.5 sm:py-2 text-xs font-semibold text-white transition hover:opacity-90 disabled:opacity-50"
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

export default AddProduct;