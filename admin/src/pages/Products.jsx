import React, { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { productsApi, categoriesApi } from "../services/api";
import { FolderTree, Sparkles } from "lucide-react";

const Products = () => {
  const [searchParams] = useSearchParams();
  const [products, setProducts] = useState([]);
  const [categoryList, setCategoryList] = useState([]);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState(searchParams.get("category") || "All");
  const [stockFilter, setStockFilter] = useState("All");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Load product catalog from backend and enforce zero stock unavailability rule
  const fetchProducts = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await productsApi.list();

      if (!response?.success) {
        throw new Error(response?.message || "Unable to load products.");
      }

      const list = Array.isArray(response.products) ? response.products : [];

      const normalizedList = list.map((product) => {
        const stock = Number(product.stock || 0);
        return {
          ...product,
          available: stock === 0 ? false : product.available === true,
        };
      });

      setProducts(normalizedList);
    } catch (err) {
      console.error("Fetch products error:", err);
      setError(err?.message || "Unable to load products. Please try again.");
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const res = await categoriesApi.getAll();
      if (res?.success && Array.isArray(res.categories)) {
        setCategoryList(res.categories);
      }
    } catch (err) {
      console.error("Fetch categories list error:", err);
    }
  };

  useEffect(() => {
    fetchProducts();
    fetchCategories();
  }, []);

  // Sync category state from URL search params
  useEffect(() => {
    const urlCat = searchParams.get("category");
    if (urlCat) {
      setCategory(urlCat);
    }
  }, [searchParams]);

  const categories = useMemo(() => {
    const fromApi = categoryList.map((c) => c.name).filter(Boolean);
    const fromProducts = products.map((p) => p.category).filter(Boolean);
    const combined = Array.from(new Set([...fromApi, ...fromProducts]));
    return ["All", ...combined];
  }, [categoryList, products]);

  const totalProducts = products.length;
  const activeProducts = products.filter((product) => {
    const stock = Number(product.stock || 0);
    return stock > 0 && product.available === true;
  }).length;

  const lowStockProducts = products.filter((product) => {
    const stock = Number(product.stock || 0);
    const limit = Number(product.lowStockLimit || 0);
    return stock > 0 && limit > 0 && stock <= limit;
  }).length;

  const outOfStockProducts = products.filter(
    (product) => Number(product.stock || 0) === 0
  ).length;

  // Filter products by search query, category, and stock level
  const filteredProducts = useMemo(() => {
    const value = search.trim().toLowerCase();

    return products.filter((product) => {
      const productName = String(product.name || "").toLowerCase();
      const productCategory = String(product.category || "").toLowerCase();

      const matchesSearch =
        !value || productName.includes(value) || productCategory.includes(value);

      const matchesCategory =
        category === "All" || product.category === category;

      const stock = Number(product.stock || 0);
      const lowStockLimit = Number(product.lowStockLimit || 0);

      let matchesStock = true;

      if (stockFilter === "In Stock") {
        matchesStock = stock > 0 && (lowStockLimit === 0 || stock > lowStockLimit);
      }

      if (stockFilter === "Low Stock") {
        matchesStock = stock > 0 && lowStockLimit > 0 && stock <= lowStockLimit;
      }

      if (stockFilter === "Out of Stock") {
        matchesStock = stock === 0;
      }

      return matchesSearch && matchesCategory && matchesStock;
    });
  }, [products, search, category, stockFilter]);

  // Toggle availability status unless stock is zero
  const toggleStatus = async (product) => {
    if (!product?._id) return;
    const stock = Number(product.stock || 0);

    if (stock === 0) {
      setProducts((prev) =>
        prev.map((item) =>
          item._id === product._id ? { ...item, available: false } : item
        )
      );
      return;
    }

    const newAvailable = product.available !== true;

    try {
      setProducts((prev) =>
        prev.map((item) =>
          item._id === product._id ? { ...item, available: newAvailable } : item
        )
      );

      const response = await productsApi.update(product._id, {
        available: newAvailable,
      });

      if (response && response.success === false) {
        throw new Error(response.message || "Unable to update availability.");
      }
    } catch (err) {
      console.error("Availability update error:", err);
      setProducts((prev) =>
        prev.map((item) =>
          item._id === product._id
            ? { ...item, available: product.available }
            : item
        )
      );
      alert(err?.message || "Unable to update product availability.");
    }
  };

  const handleDelete = async (product) => {
    if (!product?._id) return;

    const confirmed = window.confirm(
      `Are you sure you want to delete "${product.name}"?`
    );
    if (!confirmed) return;

    try {
      const response = await productsApi.delete(product._id);
      if (response && response.success === false) {
        throw new Error(response.message || "Unable to delete product.");
      }

      setProducts((prev) => prev.filter((item) => item._id !== product._id));
    } catch (err) {
      console.error("Delete product error:", err);
      alert(err?.message || "Unable to delete product.");
    }
  };

  const getStockStatus = (product) => {
    const stock = Number(product.stock || 0);
    const limit = Number(product.lowStockLimit || 0);

    if (stock === 0) return "out";
    if (limit > 0 && stock <= limit) return "low";
    return "normal";
  };

  const isProductAvailable = (product) => {
    const stock = Number(product.stock || 0);
    return stock > 0 && product.available === true;
  };

  return (
    <div
      className="min-h-[calc(100vh-73px)] w-full px-4 py-6 sm:px-6 md:px-10 lg:px-12"
      style={{
        backgroundColor: "var(--app-bg)",
        color: "var(--app-text)",
      }}
    >
      <div className="mx-auto max-w-7xl">
        <div className="mb-7 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="mb-1 text-sm font-medium" style={{ color: "var(--app-accent)" }}>
              Inventory Management
            </p>
            <h1 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
              Products
            </h1>
            <p className="mt-2 text-sm text-zinc-500">
              Manage your products, pricing, stock and availability.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Link
              to="/product-requests"
              className="inline-flex items-center justify-center gap-2 rounded-lg border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm font-semibold text-amber-300 shadow-md backdrop-blur-md transition-all duration-300 hover:border-amber-500/50 hover:bg-amber-500/20"
            >
              <Sparkles className="h-4 w-4 text-amber-400" />
              <span>Customer Requests</span>
            </Link>

            <Link
              to="/categories"
              className="inline-flex items-center justify-center gap-2 rounded-lg border border-zinc-700/80 bg-zinc-900/90 px-4 py-3 text-sm font-semibold text-zinc-200 shadow-md backdrop-blur-md transition-all duration-300 hover:border-orange-500/50 hover:bg-zinc-800 hover:text-white"
            >
              <FolderTree className="h-4 w-4 text-[var(--app-accent)]" />
              <span>Category Management</span>
            </Link>

            <Link
              to="/products/add"
              className="inline-flex items-center justify-center gap-2 rounded-lg px-5 py-3 text-sm font-semibold text-white shadow-lg transition-all duration-300 hover:-translate-y-[1px]"
              style={{
                backgroundColor: "var(--app-accent)",
                boxShadow: "0 10px 25px var(--app-accent-soft)",
              }}
            >
              <span className="text-xl leading-none">＋</span>
              Add Product
            </Link>
          </div>
        </div>

        {/* Stock metrics */}
        <div className="mb-7 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard title="Total Products" value={totalProducts} icon="📦" iconColor="accent" />
          <StatCard title="Available Products" value={activeProducts} icon="✓" iconColor="green" />
          <StatCard title="Low Stock" value={lowStockProducts} icon="!" iconColor="yellow" />
          <StatCard title="Out of Stock" value={outOfStockProducts} icon="×" iconColor="red" />
        </div>

        {/* Products inventory container */}
        <div
          className="overflow-hidden rounded-xl border"
          style={{
            borderColor: "var(--app-border)",
            backgroundColor: "var(--app-surface)",
            boxShadow: "0 10px 40px rgba(0,0,0,0.25)",
          }}
        >
          <div
            className="border-b p-5"
            style={{
              borderColor: "var(--app-border)",
              backgroundColor: "var(--app-surface)",
            }}
          >
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
              <div className="relative flex-1">
                <span
                  className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-lg"
                  style={{ color: "var(--app-accent)" }}
                >
                  ⌕
                </span>
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search product by name or category..."
                  className="w-full rounded-lg border bg-zinc-900 py-3 pl-11 pr-4 text-sm text-white outline-none placeholder:text-zinc-600"
                  style={{ borderColor: "var(--app-border)" }}
                />
              </div>

              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="rounded-lg border bg-zinc-900 px-4 py-3 text-sm text-zinc-300 outline-none"
                style={{ borderColor: "var(--app-border)" }}
              >
                {categories.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>

              <select
                value={stockFilter}
                onChange={(e) => setStockFilter(e.target.value)}
                className="rounded-lg border bg-zinc-900 px-4 py-3 text-sm text-zinc-300 outline-none"
                style={{ borderColor: "var(--app-border)" }}
              >
                <option value="All">All Stock</option>
                <option value="In Stock">In Stock</option>
                <option value="Low Stock">Low Stock</option>
                <option value="Out of Stock">Out of Stock</option>
              </select>
            </div>
          </div>

          {loading && (
            <div className="py-20 text-center text-sm text-zinc-500">
              Loading products...
            </div>
          )}

          {!loading && error && (
            <div className="py-20 text-center">
              <p className="mb-4 text-sm text-red-400">{error}</p>
              <button
                type="button"
                onClick={fetchProducts}
                className="rounded-lg px-5 py-2.5 text-sm font-semibold text-white"
                style={{ backgroundColor: "var(--app-accent)" }}
              >
                Try Again
              </button>
            </div>
          )}

          {!loading && !error && filteredProducts.length === 0 && (
            <div className="py-20 text-center">
              <div className="text-4xl">📦</div>
              <h3 className="mt-4 text-sm font-semibold text-zinc-300">
                {products.length === 0 ? "No products available" : "No products found"}
              </h3>
              <p className="mt-2 text-xs text-zinc-600">
                {products.length === 0
                  ? "No products were returned by the server."
                  : "Try changing your search or filters."}
              </p>
            </div>
          )}

          {!loading && !error && filteredProducts.length > 0 && (
            <>
              {/* Desktop layout */}
              <div className="hidden overflow-x-auto lg:block">
                <table className="w-full min-w-[1050px]">
                  <thead>
                    <tr
                      className="border-b text-left"
                      style={{
                        borderColor: "var(--app-border)",
                        backgroundColor: "var(--app-surface-light)",
                      }}
                    >
                      <th className="px-5 py-4 text-xs font-medium uppercase tracking-wide text-zinc-500">
                        Product
                      </th>
                      <th className="px-5 py-4 text-xs font-medium uppercase tracking-wide text-zinc-500">
                        Category
                      </th>
                      <th className="px-5 py-4 text-xs font-medium uppercase tracking-wide text-zinc-500">
                        Price
                      </th>
                      <th className="px-5 py-4 text-xs font-medium uppercase tracking-wide text-zinc-500">
                        Stock
                      </th>
                      <th className="px-5 py-4 text-xs font-medium uppercase tracking-wide text-zinc-500">
                        Unit
                      </th>
                      <th className="px-5 py-4 text-xs font-medium uppercase tracking-wide text-zinc-500">
                        Availability
                      </th>
                      <th className="px-5 py-4 text-right text-xs font-medium uppercase tracking-wide text-zinc-500">
                        Actions
                      </th>
                    </tr>
                  </thead>

                  <tbody>
                    {filteredProducts.map((product) => {
                      const stockStatus = getStockStatus(product);
                      const available = isProductAvailable(product);
                      const stock = Number(product.stock || 0);

                      return (
                        <tr
                          key={product._id}
                          className="border-b transition-colors last:border-0 hover:bg-white/[0.02]"
                          style={{ borderColor: "var(--app-border)" }}
                        >
                          <td className="px-5 py-4">
                            <div className="flex items-center gap-4">
                              <div
                                className="h-14 w-14 shrink-0 overflow-hidden rounded-xl border bg-zinc-900"
                                style={{ borderColor: "var(--app-border)" }}
                              >
                                {product.image ? (
                                  <img
                                    src={product.image}
                                    alt={product.name}
                                    className="h-full w-full object-cover"
                                    onError={(e) => {
                                      e.currentTarget.style.display = "none";
                                    }}
                                  />
                                ) : (
                                  <div className="flex h-full w-full items-center justify-center text-xl">
                                    📦
                                  </div>
                                )}
                              </div>

                              <div>
                                <p className="text-sm font-semibold text-zinc-200">
                                  {product.name}
                                </p>
                                <p className="mt-1 text-xs text-zinc-600">
                                  ID: {product._id}
                                </p>
                              </div>
                            </div>
                          </td>

                          <td className="px-5 py-4">
                            <span
                              className="rounded-md px-2.5 py-1.5 text-xs"
                              style={{
                                backgroundColor: "var(--app-accent-soft)",
                                color: "var(--app-accent)",
                              }}
                            >
                              {product.category}
                            </span>
                          </td>

                          <td className="px-5 py-4">
                            <span className="text-sm font-semibold text-white">
                              ₹{Number(product.price || 0).toLocaleString("en-IN")}
                            </span>
                          </td>

                          <td className="px-5 py-4">
                            <div className="flex items-center gap-2">
                              <span
                                className={`h-2 w-2 rounded-full ${
                                  stockStatus === "out"
                                    ? "bg-red-500"
                                    : stockStatus === "low"
                                    ? "bg-yellow-500"
                                    : "bg-green-500"
                                }`}
                              />
                              <span
                                className={`text-sm font-medium ${
                                  stockStatus === "out"
                                    ? "text-red-400"
                                    : stockStatus === "low"
                                    ? "text-yellow-400"
                                    : "text-zinc-300"
                                }`}
                              >
                                {stock}
                              </span>
                            </div>
                            {Number(product.lowStockLimit || 0) > 0 && (
                              <p className="mt-1 text-[10px] text-zinc-600">
                                Low at {product.lowStockLimit}
                              </p>
                            )}
                          </td>

                          <td className="px-5 py-4">
                            <span className="text-sm text-zinc-300">
                              {product.unit || "-"}
                            </span>
                          </td>

                          <td className="px-5 py-4">
                            <button
                              type="button"
                              disabled={stock === 0}
                              onClick={() => toggleStatus(product)}
                              title={
                                stock === 0
                                  ? "Product cannot be available because stock is zero."
                                  : "Change availability"
                              }
                              className={`rounded-full px-2.5 py-1 text-[11px] font-medium transition ${
                                stock === 0
                                  ? "cursor-not-allowed opacity-70"
                                  : "cursor-pointer hover:brightness-125"
                              }`}
                              style={
                                available
                                  ? {
                                      backgroundColor: "rgba(34,197,94,0.10)",
                                      color: "#4ade80",
                                    }
                                  : {
                                      backgroundColor: "rgba(239,68,68,0.10)",
                                      color: "#f87171",
                                    }
                              }
                            >
                              {available ? "Available" : "Unavailable"}
                            </button>
                            {stock === 0 && (
                              <p className="mt-1 text-[10px] text-red-400/70">
                                Out of stock
                              </p>
                            )}
                          </td>

                          <td className="px-5 py-4">
                            <div className="flex items-center justify-end gap-2">
                              <Link
                                to={`/products/edit/${product._id}`}
                                className="rounded-lg border bg-zinc-900 px-3 py-2 text-xs font-medium text-zinc-400 transition hover:text-white"
                                style={{ borderColor: "var(--app-border)" }}
                              >
                                Edit
                              </Link>
                              <button
                                type="button"
                                onClick={() => handleDelete(product)}
                                className="rounded-lg border bg-zinc-900 px-3 py-2 text-xs font-medium text-zinc-500 transition hover:border-red-500/30 hover:bg-red-500/10 hover:text-red-400"
                                style={{ borderColor: "var(--app-border)" }}
                              >
                                Delete
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Mobile & Tablet cards layout */}
              <div className="grid grid-cols-1 gap-3 p-3 sm:grid-cols-2 sm:p-4 lg:hidden">
                {filteredProducts.map((product) => {
                  const stockStatus = getStockStatus(product);
                  const available = isProductAvailable(product);
                  const stock = Number(product.stock || 0);

                  return (
                    <div
                      key={product._id}
                      className="rounded-xl border p-4"
                      style={{
                        borderColor: "var(--app-border)",
                        backgroundColor: "var(--app-surface-light)",
                      }}
                    >
                      <div className="flex gap-4">
                        <div
                          className="h-20 w-20 shrink-0 overflow-hidden rounded-xl border bg-zinc-900"
                          style={{ borderColor: "var(--app-border)" }}
                        >
                          {product.image ? (
                            <img
                              src={product.image}
                              alt={product.name}
                              className="h-full w-full object-cover"
                              onError={(e) => {
                                e.currentTarget.style.display = "none";
                              }}
                            />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center text-xl">
                              📦
                            </div>
                          )}
                        </div>

                        <div className="min-w-0 flex-1">
                          <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0">
                              <h3 className="truncate text-sm font-semibold text-white">
                                {product.name}
                              </h3>
                              <p className="mt-1 text-xs" style={{ color: "var(--app-accent)" }}>
                                {product.category}
                              </p>
                            </div>

                            <span
                              className="shrink-0 rounded-full px-2 py-1 text-[10px] font-medium"
                              style={
                                available
                                  ? { backgroundColor: "rgba(34,197,94,0.10)", color: "#4ade80" }
                                  : { backgroundColor: "rgba(239,68,68,0.10)", color: "#f87171" }
                              }
                            >
                              {available ? "Available" : "Unavailable"}
                            </span>
                          </div>

                          <div className="mt-3 flex items-center justify-between">
                            <span className="text-sm font-bold text-white">
                              ₹{Number(product.price || 0).toLocaleString("en-IN")}
                            </span>
                            <span
                              className={`text-xs font-medium ${
                                stockStatus === "out"
                                  ? "text-red-400"
                                  : stockStatus === "low"
                                  ? "text-yellow-400"
                                  : "text-zinc-400"
                              }`}
                            >
                              {product.stock} {product.unit}
                            </span>
                          </div>
                        </div>
                      </div>

                      {product.description && (
                        <p className="mt-3 line-clamp-2 text-xs leading-5 text-zinc-500">
                          {product.description}
                        </p>
                      )}

                      <div className="mt-3 grid grid-cols-2 gap-2">
                        <div
                          className="rounded-lg border p-2.5"
                          style={{ borderColor: "var(--app-border)" }}
                        >
                          <p className="text-[10px] text-zinc-600">Stock</p>
                          <p className="mt-1 text-xs font-medium text-zinc-300">
                            {product.stock} {product.unit}
                          </p>
                        </div>

                        <div
                          className="rounded-lg border p-2.5"
                          style={{ borderColor: "var(--app-border)" }}
                        >
                          <p className="text-[10px] text-zinc-600">Low Stock At</p>
                          <p className="mt-1 text-xs font-medium text-zinc-300">
                            {Number(product.lowStockLimit || 0) > 0
                              ? product.lowStockLimit
                              : "Not set"}
                          </p>
                        </div>
                      </div>

                      <div
                        className="mt-4 flex gap-2 border-t pt-3"
                        style={{ borderColor: "var(--app-border)" }}
                      >
                        <button
                          type="button"
                          disabled={stock === 0}
                          onClick={() => toggleStatus(product)}
                          className={`rounded-lg border px-3 py-2.5 text-xs font-medium ${
                            stock === 0 ? "cursor-not-allowed opacity-50" : ""
                          }`}
                          style={{
                            borderColor: "var(--app-border)",
                            color: available ? "#f87171" : "#4ade80",
                          }}
                        >
                          {stock === 0 ? "Out of Stock" : available ? "Disable" : "Enable"}
                        </button>

                        <Link
                          to={`/products/edit/${product._id}`}
                          className="flex-1 rounded-lg border bg-zinc-950 px-3 py-2.5 text-center text-xs font-medium text-zinc-400"
                          style={{ borderColor: "var(--app-border)" }}
                        >
                          Edit Product
                        </Link>

                        <button
                          type="button"
                          onClick={() => handleDelete(product)}
                          className="rounded-lg border bg-zinc-950 px-4 py-2.5 text-xs font-medium text-zinc-500 hover:border-red-500/30 hover:bg-red-500/10 hover:text-red-400"
                          style={{ borderColor: "var(--app-border)" }}
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}

          {!loading && !error && (
            <div className="border-t px-5 py-4" style={{ borderColor: "var(--app-border)" }}>
              <p className="text-xs text-zinc-600">
                Showing <span className="text-zinc-400">{filteredProducts.length}</span> of{" "}
                <span className="text-zinc-400">{products.length}</span> products
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const StatCard = ({ title, value, icon, iconColor }) => {
  const iconStyle =
    iconColor === "accent"
      ? {
          borderColor: "var(--app-accent-border)",
          backgroundColor: "var(--app-accent-soft)",
          color: "var(--app-accent)",
        }
      : iconColor === "green"
      ? {
          borderColor: "rgba(34,197,94,0.20)",
          backgroundColor: "rgba(34,197,94,0.10)",
          color: "#4ade80",
        }
      : iconColor === "yellow"
      ? {
          borderColor: "rgba(234,179,8,0.20)",
          backgroundColor: "rgba(234,179,8,0.10)",
          color: "#facc15",
        }
      : {
          borderColor: "rgba(239,68,68,0.20)",
          backgroundColor: "rgba(239,68,68,0.10)",
          color: "#f87171",
        };

  return (
    <div
      className="rounded-xl border p-5 transition-all duration-300 hover:-translate-y-1"
      style={{
        borderColor: "var(--app-border)",
        backgroundColor: "var(--app-surface)",
      }}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-zinc-500">{title}</p>
          <h2 className="mt-2 text-2xl font-bold text-white">{value}</h2>
        </div>
        <div className="flex h-11 w-11 items-center justify-center rounded-xl border text-lg" style={iconStyle}>
          {icon}
        </div>
      </div>
    </div>
  );
};

export default Products;