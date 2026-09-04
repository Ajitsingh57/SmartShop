import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  FolderTree,
  Plus,
  Search,
  Edit2,
  Trash2,
  Package,
  ArrowLeft,
  RefreshCw,
  AlertTriangle,
  CheckCircle2,
  Layers,
  X,
  ExternalLink,
} from "lucide-react";
import { toast } from "react-toastify";
import { categoriesApi } from "../services/api";

const Categories = () => {
  const navigate = useNavigate();

  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");

  // Modals state
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);

  // Form states
  const [formName, setFormName] = useState("");
  const [formDescription, setFormDescription] = useState("");
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [modalError, setModalError] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});

  // Fetch categories from backend
  const fetchCategories = async () => {
    try {
      setLoading(true);
      setError("");

      const res = await categoriesApi.getAll();
      if (res?.success) {
        setCategories(Array.isArray(res.categories) ? res.categories : []);
      } else {
        throw new Error(res?.message || "Failed to load categories");
      }
    } catch (err) {
      console.error("Fetch categories error:", err);
      setError(err?.message || "Unable to load categories. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  // Filtered categories
  const filteredCategories = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return categories;

    return categories.filter((cat) => {
      const name = String(cat.name || "").toLowerCase();
      const desc = String(cat.description || "").toLowerCase();
      return name.includes(q) || desc.includes(q);
    });
  }, [categories, search]);

  // Aggregate stats
  const totalCategories = categories.length;
  const totalProductsMapped = useMemo(() => {
    return categories.reduce((sum, cat) => sum + (cat.productCount || 0), 0);
  }, [categories]);

  const topCategory = useMemo(() => {
    if (!categories.length) return null;
    return [...categories].sort(
      (a, b) => (b.productCount || 0) - (a.productCount || 0)
    )[0];
  }, [categories]);

  // Open Add Modal
  const handleOpenAdd = () => {
    setFormName("");
    setFormDescription("");
    setModalError("");
    setFieldErrors({});
    setAddModalOpen(true);
  };

  // Open Edit Modal
  const handleOpenEdit = (cat) => {
    setSelectedCategory(cat);
    setFormName(cat.name || "");
    setFormDescription(cat.description || "");
    setModalError("");
    setFieldErrors({});
    setEditModalOpen(true);
  };

  // Open Delete Modal
  const handleOpenDelete = (cat) => {
    setSelectedCategory(cat);
    setModalError("");
    setDeleteModalOpen(true);
  };

  // Handle Add Category Submit
  const handleAddSubmit = async (e) => {
    e.preventDefault();
    setFieldErrors({});

    if (!formName.trim()) {
      const msg = "Please enter a category name.";
      setModalError(msg);
      setFieldErrors({ name: msg });
      toast.error(msg);
      return;
    }

    try {
      setSubmitting(true);
      setModalError("");

      const res = await categoriesApi.create({
        name: formName.trim(),
        description: formDescription.trim(),
      });

      if (res?.success) {
        setAddModalOpen(false);
        const msg = `Category "${res.category?.name || formName}" added successfully!`;
        toast.success(msg);
        fetchCategories();
      } else {
        throw new Error(res?.message || "Failed to create category");
      }
    } catch (err) {
      console.error("Create category error:", err);
      const msg = err?.message || "Failed to create category";
      setModalError(msg);
      if (err?.errors) setFieldErrors(err.errors);
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  // Handle Edit Category Submit
  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if (!selectedCategory?._id) return;
    setFieldErrors({});

    if (!formName.trim()) {
      const msg = "Please enter a category name.";
      setModalError(msg);
      setFieldErrors({ name: msg });
      toast.error(msg);
      return;
    }

    try {
      setSubmitting(true);
      setModalError("");

      const res = await categoriesApi.update(selectedCategory._id, {
        name: formName.trim(),
        description: formDescription.trim(),
      });

      if (res?.success) {
        setEditModalOpen(false);
        const msg = `Category "${res.category?.name || formName}" updated successfully!`;
        toast.success(msg);
        fetchCategories();
      } else {
        throw new Error(res?.message || "Failed to update category");
      }
    } catch (err) {
      console.error("Update category error:", err);
      const msg = err?.message || "Failed to update category";
      setModalError(msg);
      if (err?.errors) setFieldErrors(err.errors);
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  // Handle Delete Category
  const handleDeleteSubmit = async (force = false) => {
    if (!selectedCategory?._id) return;

    try {
      setSubmitting(true);
      setModalError("");

      const res = await categoriesApi.delete(selectedCategory._id, force);

      if (res?.success) {
        setDeleteModalOpen(false);
        const msg = `Category "${selectedCategory.name}" deleted successfully!`;
        toast.success(msg);
        fetchCategories();
      } else {
        throw new Error(res?.message || "Failed to delete category");
      }
    } catch (err) {
      console.error("Delete category error:", err);
      const msg = err?.message || "Failed to delete category";
      setModalError(msg);
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  // Category Icon / Color Palette Helper
  const getCategoryTheme = (index) => {
    const themes = [
      { bg: "from-amber-500/20 to-orange-500/10", border: "border-orange-500/30", text: "text-orange-400", badge: "bg-orange-500/10 text-orange-400 border-orange-500/20" },
      { bg: "from-blue-500/20 to-indigo-500/10", border: "border-blue-500/30", text: "text-blue-400", badge: "bg-blue-500/10 text-blue-400 border-blue-500/20" },
      { bg: "from-emerald-500/20 to-teal-500/10", border: "border-emerald-500/30", text: "text-emerald-400", badge: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" },
      { bg: "from-purple-500/20 to-pink-500/10", border: "border-purple-500/30", text: "text-purple-400", badge: "bg-purple-500/10 text-purple-400 border-purple-500/20" },
      { bg: "from-cyan-500/20 to-sky-500/10", border: "border-cyan-500/30", text: "text-cyan-400", badge: "bg-cyan-500/10 text-cyan-400 border-cyan-500/20" },
      { bg: "from-rose-500/20 to-red-500/10", border: "border-rose-500/30", text: "text-rose-400", badge: "bg-rose-500/10 text-rose-400 border-rose-500/20" },
    ];
    return themes[index % themes.length];
  };

  return (
    <div
      className="min-h-[calc(100vh-73px)] w-full px-3.5 py-4 sm:px-6 md:px-8 lg:px-12 sm:py-6"
      style={{
        backgroundColor: "var(--app-bg)",
        color: "var(--app-text)",
      }}
    >
      <div className="mx-auto max-w-7xl">
        {/* Breadcrumb Navigation */}
        <div className="mb-3 sm:mb-4 flex items-center gap-1.5 sm:gap-2 text-xs font-medium text-zinc-400">
          <button
            type="button"
            onClick={() => navigate("/products")}
            className="flex items-center gap-1 transition-colors hover:text-white py-1"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>Products</span>
          </button>
          <span className="text-zinc-600">/</span>
          <span className="text-[var(--app-accent)] font-semibold truncate">
            Category Management
          </span>
        </div>

        {/* Page Header */}
        <div className="mb-5 sm:mb-7 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="min-w-0">
            <div className="flex items-center gap-2 mb-1.5">
              <span
                className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] sm:text-xs font-semibold"
                style={{
                  backgroundColor: "var(--app-accent-soft)",
                  color: "var(--app-accent)",
                  border: "1px solid var(--app-accent-border)",
                }}
              >
                <FolderTree className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                Product Classification
              </span>
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl lg:text-4xl">
              Category Management
            </h1>
            <p className="mt-1 text-xs sm:text-sm text-zinc-400 max-w-2xl">
              Organize and classify products. Categories managed here are available across Add/Edit Product forms.
            </p>
          </div>

          {/* Action Buttons (Mobile & Tablet friendly full-width / inline) */}
          <div className="flex items-center gap-2 sm:gap-3 w-full sm:w-auto">
            <button
              type="button"
              onClick={fetchCategories}
              disabled={loading}
              title="Refresh categories"
              className="flex h-10 w-10 sm:h-11 sm:w-11 items-center justify-center rounded-xl border border-white/10 bg-zinc-900/70 text-zinc-300 transition-all hover:bg-zinc-800 hover:text-white disabled:opacity-50 shrink-0"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin text-orange-400" : ""}`} />
            </button>

            <button
              type="button"
              onClick={handleOpenAdd}
              className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 sm:px-5 sm:py-2.5 text-xs sm:text-sm font-semibold text-white shadow-lg transition-all duration-300 hover:-translate-y-[1px]"
              style={{
                backgroundColor: "var(--app-accent)",
                boxShadow: "0 10px 25px var(--app-accent-soft)",
              }}
            >
              <Plus className="h-4 w-4" />
              <span>Add Category</span>
            </button>
          </div>
        </div>

        {/* Metric Cards Row */}
        <div className="mb-5 sm:mb-7 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
          <div
            className="flex items-center gap-3.5 sm:gap-4 rounded-xl border p-4 sm:p-5 transition hover:border-zinc-700"
            style={{
              borderColor: "var(--app-border)",
              backgroundColor: "var(--app-surface)",
            }}
          >
            <div
              className="flex h-11 w-11 sm:h-12 sm:w-12 items-center justify-center rounded-xl shrink-0"
              style={{
                backgroundColor: "var(--app-accent-soft)",
                color: "var(--app-accent)",
                border: "1px solid var(--app-accent-border)",
              }}
            >
              <FolderTree className="h-5 w-5 sm:h-6 sm:w-6" />
            </div>
            <div>
              <p className="text-xs font-medium text-zinc-400">Total Categories</p>
              <h3 className="text-xl sm:text-2xl font-bold text-white mt-0.5">
                {totalCategories}
              </h3>
            </div>
          </div>

          <div
            className="flex items-center gap-3.5 sm:gap-4 rounded-xl border p-4 sm:p-5 transition hover:border-zinc-700"
            style={{
              borderColor: "var(--app-border)",
              backgroundColor: "var(--app-surface)",
            }}
          >
            <div className="flex h-11 w-11 sm:h-12 sm:w-12 items-center justify-center rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20 shrink-0">
              <Package className="h-5 w-5 sm:h-6 sm:w-6" />
            </div>
            <div>
              <p className="text-xs font-medium text-zinc-400">Products Classified</p>
              <h3 className="text-xl sm:text-2xl font-bold text-white mt-0.5">
                {totalProductsMapped}
              </h3>
            </div>
          </div>

          <div
            className="flex items-center gap-3.5 sm:gap-4 rounded-xl border p-4 sm:p-5 transition hover:border-zinc-700 sm:col-span-2 lg:col-span-1"
            style={{
              borderColor: "var(--app-border)",
              backgroundColor: "var(--app-surface)",
            }}
          >
            <div className="flex h-11 w-11 sm:h-12 sm:w-12 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shrink-0">
              <Layers className="h-5 w-5 sm:h-6 sm:w-6" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-medium text-zinc-400">Largest Category</p>
              <h3 className="text-base sm:text-lg font-bold text-white mt-0.5 truncate">
                {topCategory ? `${topCategory.name} (${topCategory.productCount || 0})` : "N/A"}
              </h3>
            </div>
          </div>
        </div>

        {/* Search & Filter Bar */}
        <div
          className="mb-5 sm:mb-6 rounded-xl border p-3 sm:p-4"
          style={{
            borderColor: "var(--app-border)",
            backgroundColor: "var(--app-surface)",
          }}
        >
          <div className="relative">
            <Search className="pointer-events-none absolute left-3.5 sm:left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search category by name or description..."
              className="w-full rounded-lg border py-2.5 pl-10 sm:pl-11 pr-9 sm:pr-10 text-xs sm:text-sm text-white placeholder-zinc-500 outline-none transition focus:border-[var(--app-accent)] focus:ring-1 focus:ring-[var(--app-accent)]"
              style={{
                borderColor: "var(--app-border)",
                backgroundColor: "var(--app-surface-light)",
              }}
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-white p-1 text-xs"
              >
                ✕
              </button>
            )}
          </div>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mb-5 sm:mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-xl border border-red-500/30 bg-red-950/40 p-3.5 sm:p-4 text-xs sm:text-sm text-red-300">
            <div className="flex items-center gap-2.5">
              <AlertTriangle className="h-4 w-4 sm:h-5 sm:w-5 text-red-400 shrink-0" />
              <span>{error}</span>
            </div>
            <button
              type="button"
              onClick={fetchCategories}
              className="self-start sm:self-auto rounded-lg bg-red-500/20 px-3 py-1.5 text-xs font-semibold text-red-300 hover:bg-red-500/30 transition"
            >
              Retry
            </button>
          </div>
        )}

        {/* Loading State */}
        {loading ? (
          <div
            className="flex flex-col items-center justify-center rounded-2xl border py-16 sm:py-20 text-center"
            style={{
              borderColor: "var(--app-border)",
              backgroundColor: "var(--app-surface)",
            }}
          >
            <RefreshCw className="h-7 w-7 sm:h-8 sm:w-8 animate-spin text-[var(--app-accent)] mb-3" />
            <p className="text-xs sm:text-sm text-zinc-400">Loading categories...</p>
          </div>
        ) : filteredCategories.length === 0 ? (
          /* Empty State */
          <div
            className="flex flex-col items-center justify-center rounded-2xl border p-8 sm:p-12 text-center"
            style={{
              borderColor: "var(--app-border)",
              backgroundColor: "var(--app-surface)",
            }}
          >
            <div
              className="mb-3.5 sm:mb-4 flex h-14 w-14 sm:h-16 sm:w-16 items-center justify-center rounded-2xl"
              style={{
                backgroundColor: "var(--app-accent-soft)",
                color: "var(--app-accent)",
              }}
            >
              <FolderTree className="h-7 w-7 sm:h-8 sm:w-8" />
            </div>
            <h3 className="text-base sm:text-lg font-bold text-white">
              {search ? "No categories matched your search" : "No categories found"}
            </h3>
            <p className="mt-1 max-w-md text-xs sm:text-sm text-zinc-400">
              {search
                ? `No categories matching "${search}". Try searching for something else or create a new category.`
                : "Get started by adding your first product category to organize your inventory."}
            </p>
            {search ? (
              <button
                type="button"
                onClick={() => setSearch("")}
                className="mt-4 text-xs font-semibold text-[var(--app-accent)] hover:underline"
              >
                Clear Search
              </button>
            ) : (
              <button
                type="button"
                onClick={handleOpenAdd}
                className="mt-4 sm:mt-5 inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-xs sm:text-sm font-semibold text-white shadow-lg transition hover:opacity-90"
                style={{ backgroundColor: "var(--app-accent)" }}
              >
                <Plus className="h-4 w-4" />
                Add Category
              </button>
            )}
          </div>
        ) : (
          /* Category Cards Grid (Responsive 1-col mobile, 2-col tablet, 3-col desktop) */
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5 sm:gap-4 lg:gap-5">
            {filteredCategories.map((cat, idx) => {
              const theme = getCategoryTheme(idx);
              const count = cat.productCount || 0;

              return (
                <div
                  key={cat._id || cat.name}
                  className="group relative flex flex-col justify-between rounded-2xl border p-4 sm:p-5 transition-all duration-300 hover:border-zinc-700 hover:shadow-xl"
                  style={{
                    borderColor: "var(--app-border)",
                    backgroundColor: "var(--app-surface)",
                  }}
                >
                  {/* Top Header inside Card */}
                  <div>
                    <div className="flex items-start justify-between gap-2.5 mb-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <div
                          className={`flex h-10 w-10 sm:h-11 sm:w-11 items-center justify-center rounded-xl bg-gradient-to-br ${theme.bg} border ${theme.border} ${theme.text} font-bold text-sm sm:text-base shrink-0 shadow-inner`}
                        >
                          {cat.name.charAt(0).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <h3 className="text-sm sm:text-base font-bold text-white group-hover:text-[var(--app-accent)] transition-colors truncate">
                            {cat.name}
                          </h3>
                          <span
                            className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] sm:text-[11px] font-semibold border mt-0.5 ${theme.badge}`}
                          >
                            <Package className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
                            {count} {count === 1 ? "product" : "products"}
                          </span>
                        </div>
                      </div>

                      {/* Card Action Menu (Touch-friendly tap targets) */}
                      <div className="flex items-center gap-0.5 sm:gap-1 shrink-0">
                        <button
                          type="button"
                          onClick={() => handleOpenEdit(cat)}
                          title="Edit category"
                          className="flex h-8 w-8 items-center justify-center rounded-lg text-zinc-400 hover:bg-zinc-800 hover:text-white transition active:scale-95"
                          aria-label={`Edit ${cat.name}`}
                        >
                          <Edit2 className="h-3.5 w-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleOpenDelete(cat)}
                          title="Delete category"
                          className="flex h-8 w-8 items-center justify-center rounded-lg text-zinc-400 hover:bg-red-500/10 hover:text-red-400 transition active:scale-95"
                          aria-label={`Delete ${cat.name}`}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Description */}
                    <p className="text-xs text-zinc-400 line-clamp-2 min-h-[32px] break-words">
                      {cat.description || "No description provided."}
                    </p>
                  </div>

                  {/* Card Footer with Link to Products */}
                  <div className="mt-4 pt-3 border-t border-zinc-800/80 flex flex-wrap items-center justify-between gap-2 text-xs">
                    <span className="text-[10px] sm:text-[11px] text-zinc-500">
                      {cat.createdAt ? new Date(cat.createdAt).toLocaleDateString() : "Default"}
                    </span>

                    <button
                      type="button"
                      onClick={() => navigate(`/products?category=${encodeURIComponent(cat.name)}`)}
                      className="inline-flex items-center gap-1 text-xs font-semibold text-zinc-300 hover:text-[var(--app-accent)] transition-colors py-1 px-1.5 rounded"
                    >
                      <span>View Products</span>
                      <ExternalLink className="h-3 w-3" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* ADD CATEGORY MODAL (Mobile Bottom Sheet & Tablet/Desktop Center Modal) */}
      {/* ========================================================================= */}
      {addModalOpen && (
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
                  <h2 className="text-base sm:text-lg font-bold text-white truncate">Add New Category</h2>
                  <p className="text-[11px] sm:text-xs text-zinc-400 truncate">Create a new product classification</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setAddModalOpen(false)}
                className="text-zinc-400 hover:text-white p-1 text-base shrink-0"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {modalError && (
              <div className="mt-3.5 flex items-center gap-2 rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-xs text-red-300">
                <AlertTriangle className="h-4 w-4 shrink-0 text-red-400" />
                <span>{modalError}</span>
              </div>
            )}

            <form onSubmit={handleAddSubmit} className="mt-4 space-y-4">
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-zinc-300">
                  Category Name <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  value={formName}
                  onChange={(e) => {
                    setFormName(e.target.value);
                    if (fieldErrors.name) setFieldErrors((prev) => ({ ...prev, name: "" }));
                  }}
                  placeholder="e.g. Dairy & Bakery"
                  autoFocus
                  disabled={submitting}
                  className={`w-full rounded-lg border px-3.5 py-2.5 text-sm text-white placeholder-zinc-600 outline-none transition disabled:opacity-50 ${
                    fieldErrors.name ? "border-red-500 ring-1 ring-red-500" : "focus:border-[var(--app-accent)] focus:ring-1 focus:ring-[var(--app-accent)]"
                  }`}
                  style={{
                    borderColor: fieldErrors.name ? "#ef4444" : "var(--app-border)",
                    backgroundColor: "var(--app-surface-light)",
                  }}
                />
                {fieldErrors.name && (
                  <p className="mt-1 text-xs text-red-500 font-medium">
                    {fieldErrors.name}
                  </p>
                )}
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-semibold text-zinc-300">
                  Description <span className="text-zinc-500 font-normal">(Optional)</span>
                </label>
                <textarea
                  rows={3}
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  placeholder="Short note about what items belong in this category..."
                  disabled={submitting}
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
                  onClick={() => setAddModalOpen(false)}
                  disabled={submitting}
                  className="w-full sm:w-auto rounded-lg border border-zinc-700 bg-zinc-800/60 px-4 py-2.5 sm:py-2 text-xs font-semibold text-zinc-300 hover:bg-zinc-800 hover:text-white transition text-center"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-lg px-5 py-2.5 sm:py-2 text-xs font-semibold text-white transition hover:opacity-90 disabled:opacity-50"
                  style={{ backgroundColor: "var(--app-accent)" }}
                >
                  {submitting && <RefreshCw className="h-3.5 w-3.5 animate-spin" />}
                  <span>{submitting ? "Saving..." : "Add Category"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* EDIT CATEGORY MODAL */}
      {/* ========================================================================= */}
      {editModalOpen && selectedCategory && (
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
                  <Edit2 className="h-4 w-4 sm:h-5 sm:w-5" />
                </div>
                <div className="min-w-0">
                  <h2 className="text-base sm:text-lg font-bold text-white truncate">Edit Category</h2>
                  <p className="text-[11px] sm:text-xs text-zinc-400 truncate">Update category details & sync products</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setEditModalOpen(false)}
                className="text-zinc-400 hover:text-white p-1 text-base shrink-0"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {modalError && (
              <div className="mt-3.5 flex items-center gap-2 rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-xs text-red-300">
                <AlertTriangle className="h-4 w-4 shrink-0 text-red-400" />
                <span>{modalError}</span>
              </div>
            )}

            <form onSubmit={handleEditSubmit} className="mt-4 space-y-4">
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-zinc-300">
                  Category Name <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  value={formName}
                  onChange={(e) => {
                    setFormName(e.target.value);
                    if (fieldErrors.name) setFieldErrors((prev) => ({ ...prev, name: "" }));
                  }}
                  placeholder="Category Name"
                  disabled={submitting}
                  className={`w-full rounded-lg border px-3.5 py-2.5 text-sm text-white placeholder-zinc-600 outline-none transition disabled:opacity-50 ${
                    fieldErrors.name ? "border-red-500 ring-1 ring-red-500" : "focus:border-[var(--app-accent)] focus:ring-1 focus:ring-[var(--app-accent)]"
                  }`}
                  style={{
                    borderColor: fieldErrors.name ? "#ef4444" : "var(--app-border)",
                    backgroundColor: "var(--app-surface-light)",
                  }}
                />
                {fieldErrors.name && (
                  <p className="mt-1 text-xs text-red-500 font-medium">
                    {fieldErrors.name}
                  </p>
                )}
                {selectedCategory.productCount > 0 && formName.trim() !== selectedCategory.name && (
                  <p className="mt-1.5 text-[11px] text-amber-400/90 leading-tight">
                    💡 Changing this name will automatically update all {selectedCategory.productCount} product(s) in this category.
                  </p>
                )}
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-semibold text-zinc-300">
                  Description <span className="text-zinc-500 font-normal">(Optional)</span>
                </label>
                <textarea
                  rows={3}
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  placeholder="Short note about what items belong in this category..."
                  disabled={submitting}
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
                  onClick={() => setEditModalOpen(false)}
                  disabled={submitting}
                  className="w-full sm:w-auto rounded-lg border border-zinc-700 bg-zinc-800/60 px-4 py-2.5 sm:py-2 text-xs font-semibold text-zinc-300 hover:bg-zinc-800 hover:text-white transition text-center"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-lg px-5 py-2.5 sm:py-2 text-xs font-semibold text-white transition hover:opacity-90 disabled:opacity-50"
                  style={{ backgroundColor: "var(--app-accent)" }}
                >
                  {submitting && <RefreshCw className="h-3.5 w-3.5 animate-spin" />}
                  <span>{submitting ? "Saving..." : "Save Changes"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* DELETE CONFIRMATION MODAL */}
      {/* ========================================================================= */}
      {deleteModalOpen && selectedCategory && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/75 p-0 sm:p-4 backdrop-blur-sm animate-in fade-in">
          <div
            className="w-full max-w-md rounded-t-2xl sm:rounded-2xl border border-red-500/30 p-5 sm:p-6 shadow-2xl max-h-[90vh] overflow-y-auto"
            style={{
              backgroundColor: "var(--app-surface)",
            }}
          >
            <div className="flex items-center gap-3 text-red-400 mb-3">
              <div className="flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-xl bg-red-500/10 border border-red-500/20 shrink-0">
                <Trash2 className="h-4 w-4 sm:h-5 sm:w-5" />
              </div>
              <div className="min-w-0">
                <h3 className="text-base sm:text-lg font-bold text-white truncate">Delete Category</h3>
                <p className="text-xs text-zinc-400 truncate">"{selectedCategory.name}"</p>
              </div>
            </div>

            {modalError && (
              <div className="mb-3.5 flex items-center gap-2 rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-xs text-red-300">
                <AlertTriangle className="h-4 w-4 shrink-0 text-red-400" />
                <span>{modalError}</span>
              </div>
            )}

            {selectedCategory.productCount > 0 ? (
              <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-3.5 sm:p-4 mb-5">
                <div className="flex items-start gap-2.5 text-amber-300">
                  <AlertTriangle className="h-4 w-4 sm:h-5 sm:w-5 shrink-0 mt-0.5 text-amber-400" />
                  <div className="text-xs space-y-1">
                    <p className="font-semibold text-white">Category contains active products!</p>
                    <p>
                      There are currently <strong className="text-white">{selectedCategory.productCount}</strong> product(s) assigned to "{selectedCategory.name}".
                    </p>
                    <p className="text-amber-200/80 pt-1">
                      To safely delete this category, products will be reassigned to category "Other".
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-xs sm:text-sm text-zinc-300 mb-5 sm:mb-6">
                Are you sure you want to permanently delete the category <strong className="text-white">"{selectedCategory.name}"</strong>? This action cannot be undone.
              </p>
            )}

            <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-2.5 sm:gap-3">
              <button
                type="button"
                onClick={() => setDeleteModalOpen(false)}
                disabled={submitting}
                className="w-full sm:w-auto rounded-lg border border-zinc-700 bg-zinc-800/60 px-4 py-2.5 sm:py-2 text-xs font-semibold text-zinc-300 hover:bg-zinc-800 hover:text-white transition text-center"
              >
                Cancel
              </button>

              {selectedCategory.productCount > 0 ? (
                <button
                  type="button"
                  onClick={() => handleDeleteSubmit(true)}
                  disabled={submitting}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 rounded-lg bg-amber-600 px-4 py-2.5 sm:py-2 text-xs font-semibold text-white transition hover:bg-amber-500 disabled:opacity-50"
                >
                  {submitting && <RefreshCw className="h-3.5 w-3.5 animate-spin" />}
                  <span>Reassign & Delete</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => handleDeleteSubmit(false)}
                  disabled={submitting}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 rounded-lg bg-red-600 px-4 py-2.5 sm:py-2 text-xs font-semibold text-white transition hover:bg-red-500 disabled:opacity-50"
                >
                  {submitting && <RefreshCw className="h-3.5 w-3.5 animate-spin" />}
                  <span>Delete Category</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Categories;
