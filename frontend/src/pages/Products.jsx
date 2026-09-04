import React, { useEffect, useState, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import {
  Search,
  X,
  Package,
  SlidersHorizontal,
  RefreshCw,
  CheckCircle2,
  Sparkles,
  PlusCircle,
  Tag,
} from "lucide-react";
import ProductCard from "../components/ProductCard";
import ProductRequestModal from "../components/ProductRequestModal";
import { productsApi } from "../services/api";

const Products = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [error, setError] = useState("");

  const [sortBy, setSortBy] = useState("featured"); // "featured", "price-low", "price-high", "name-asc"
  const [inStockOnly, setInStockOnly] = useState(false);

  const [searchParams, setSearchParams] = useSearchParams();
  const initialCategory = searchParams.get("category") || "All";
  const [selectedCategory, setSelectedCategory] = useState(initialCategory);

  // Product request modal state
  const [requestModalOpen, setRequestModalOpen] = useState(false);
  const [selectedRequestProduct, setSelectedRequestProduct] = useState(null);

  // Live debounced search (250ms)
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search.trim());
    }, 250);
    return () => clearTimeout(timer);
  }, [search]);

  // Fetch full inventory catalog from backend
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);
        setError("");

        const data = await productsApi.list();

        const productList = Array.isArray(data)
          ? data
          : Array.isArray(data?.products)
          ? data.products
          : [];

        setProducts(productList);
      } catch (requestError) {
        console.error("Failed to fetch products:", requestError);
        setError(
          requestError?.message ||
            "Products are unavailable right now. Please try again shortly."
        );
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  // Sync state category when query params update
  useEffect(() => {
    const category = searchParams.get("category") || "All";
    setSelectedCategory(category);
  }, [searchParams]);

  // Compute active categories that actually contain products in the database
  const availableCategories = useMemo(() => {
    const counts = {};
    products.forEach((p) => {
      const cat = String(p?.category || "").trim();
      if (cat) {
        counts[cat] = (counts[cat] || 0) + 1;
      }
    });

    const sortedCats = Object.entries(counts)
      .sort((a, b) => b[1] - a[1]) // Highest count first
      .map(([name, count]) => ({ name, count }));

    return [{ name: "All", count: products.length }, ...sortedCats];
  }, [products]);

  const handleCategorySelect = (category) => {
    setSelectedCategory(category);

    const newParams = new URLSearchParams(searchParams);
    if (category === "All") {
      newParams.delete("category");
    } else {
      newParams.set("category", category);
    }
    setSearchParams(newParams);
  };

  const clearFilters = () => {
    setSearch("");
    setDebouncedSearch("");
    setSortBy("featured");
    setInStockOnly(false);
    handleCategorySelect("All");
  };

  // Filter products by category, stock status, search, and sort order
  const filteredProducts = useMemo(() => {
    const list = products.filter((product) => {
      const productName = String(product?.name || "").toLowerCase();
      const productCategory = String(product?.category || "");
      const searchText = debouncedSearch.toLowerCase();

      const matchesSearch =
        !searchText || productName.includes(searchText);
      const matchesCategory =
        selectedCategory === "All" || productCategory === selectedCategory;

      const stock = Number(product?.stock ?? 0);
      const matchesStock =
        !inStockOnly || (product?.available !== false && stock > 0);

      return matchesSearch && matchesCategory && matchesStock;
    });

    // Apply sorting logic
    return [...list].sort((a, b) => {
      if (sortBy === "price-low") {
        return Number(a?.price || 0) - Number(b?.price || 0);
      }
      if (sortBy === "price-high") {
        return Number(b?.price || 0) - Number(a?.price || 0);
      }
      if (sortBy === "name-asc") {
        return String(a?.name || "").localeCompare(String(b?.name || ""));
      }
      // Default: featured (in-stock first, then newest)
      const stockA = Number(a?.stock ?? 0) > 0 ? 1 : 0;
      const stockB = Number(b?.stock ?? 0) > 0 ? 1 : 0;
      if (stockA !== stockB) return stockB - stockA;
      return new Date(b?.createdAt || 0) - new Date(a?.createdAt || 0);
    });
  }, [products, debouncedSearch, selectedCategory, inStockOnly, sortBy]);

  const handleOpenNewRequest = (defaultName = "") => {
    setSelectedRequestProduct(defaultName ? { name: defaultName } : null);
    setRequestModalOpen(true);
  };

  const handleRestockProduct = (product) => {
    setSelectedRequestProduct(product);
    setRequestModalOpen(true);
  };

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6">
      {/* Top Banner & Request Action */}
      <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-r from-zinc-900 via-zinc-900/90 to-zinc-950 p-5 sm:p-7 shadow-xl">
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-amber-500/30 bg-amber-500/10 px-3 py-1 text-xs font-bold text-amber-300 backdrop-blur-md mb-2">
              <Sparkles className="h-3.5 w-3.5" />
              <span>Smart Inventory & Customer Requests</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white font-display">
              Shop Catalog & Availability
            </h1>
            <p className="mt-1 text-xs sm:text-sm text-zinc-400 max-w-xl">
              Check live shop stock in real-time. If an item is out of stock or you need something new, send a direct request to the shopkeeper!
            </p>
          </div>

          <button
            type="button"
            onClick={() => handleOpenNewRequest()}
            className="inline-flex items-center justify-center gap-2 rounded-2xl btn-primary px-5 py-3 text-xs sm:text-sm font-bold shadow-lg transition active:scale-95 shrink-0"
          >
            <PlusCircle className="h-4 w-4" />
            <span>Request a Product</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar Controls */}
      <div className="space-y-4 rounded-2xl border border-white/[0.08] bg-zinc-900/40 p-4 backdrop-blur-md">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Category Pill Navigation */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 max-w-full no-scrollbar">
            {availableCategories.map((cat) => (
              <button
                key={cat.name}
                type="button"
                onClick={() => handleCategorySelect(cat.name)}
                className={`shrink-0 rounded-xl px-3.5 py-1.5 text-xs font-semibold transition ${
                  selectedCategory === cat.name
                    ? "bg-[var(--app-accent)] text-white shadow-md"
                    : "bg-zinc-900/80 text-zinc-400 hover:bg-zinc-800 hover:text-white border border-white/5"
                }`}
              >
                {cat.name} ({cat.count})
              </button>
            ))}
          </div>

          {/* Search and Sort Dropdowns */}
          <div className="flex flex-wrap items-center gap-2.5">
            {/* In-Stock Toggle */}
            <button
              type="button"
              onClick={() => setInStockOnly((prev) => !prev)}
              className={`inline-flex items-center gap-1.5 rounded-xl border px-3.5 py-2 text-xs font-semibold transition ${
                inStockOnly
                  ? "border-emerald-500/30 bg-emerald-950/50 text-emerald-400"
                  : "border-white/10 bg-zinc-900 text-zinc-400 hover:text-white"
              }`}
            >
              <CheckCircle2 className="h-3.5 w-3.5" />
              <span>In Stock Only</span>
            </button>

            {/* Sort Dropdown */}
            <div className="relative">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="h-10 rounded-xl border border-white/10 bg-zinc-900 px-3 pr-8 text-xs font-semibold text-zinc-300 outline-none transition focus:border-[var(--app-accent-border)]"
              >
                <option value="featured">Sort: Featured</option>
                <option value="price-low">Price: Low to High</option>
                <option value="price-high">Price: High to Low</option>
                <option value="name-asc">Name: A to Z</option>
              </select>
            </div>

            {/* Search Input */}
            <div className="relative flex w-full sm:w-64 items-center">
              <div className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500">
                <Search className="h-4 w-4" />
              </div>

              <input
                type="text"
                placeholder="Search products..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="h-10 w-full rounded-xl border border-white/10 bg-zinc-900/90 pl-10 pr-10 text-xs font-medium text-white placeholder:text-zinc-500 outline-none transition-all focus:border-[var(--app-accent-border)] focus:bg-zinc-900"
              />

              {search && (
                <button
                  type="button"
                  onClick={() => {
                    setSearch("");
                    setDebouncedSearch("");
                  }}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Active Filter Tags & Reset */}
        {(selectedCategory !== "All" || debouncedSearch || inStockOnly || sortBy !== "featured") && (
          <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-white/5">
            <span className="text-xs text-zinc-400 font-medium">Active filters:</span>
            {selectedCategory !== "All" && (
              <span className="inline-flex items-center gap-1 rounded-lg border border-[var(--app-accent-border)] bg-[var(--app-accent-soft)] px-2.5 py-1 text-xs font-medium text-[var(--app-accent)]">
                Category: {selectedCategory}
                <button
                  type="button"
                  onClick={() => handleCategorySelect("All")}
                  className="hover:opacity-75"
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            )}
            {debouncedSearch && (
              <span className="inline-flex items-center gap-1 rounded-lg border border-white/10 bg-zinc-800 px-2.5 py-1 text-xs font-medium text-zinc-300">
                Search: "{debouncedSearch}"
                <button
                  type="button"
                  onClick={() => {
                    setSearch("");
                    setDebouncedSearch("");
                  }}
                  className="hover:text-white"
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            )}
            {inStockOnly && (
              <span className="inline-flex items-center gap-1 rounded-lg border border-emerald-500/30 bg-emerald-950/30 px-2.5 py-1 text-xs font-medium text-emerald-400">
                In Stock Only
                <button
                  type="button"
                  onClick={() => setInStockOnly(false)}
                  className="hover:text-white"
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            )}
            <button
              type="button"
              onClick={clearFilters}
              className="text-xs font-semibold text-[var(--app-accent)] hover:underline ml-1"
            >
              Reset all
            </button>
          </div>
        )}
      </div>

      {/* Loading state */}
      {loading && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 sm:gap-6 py-4">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => (
            <div
              key={n}
              className="h-80 animate-pulse rounded-2xl border border-white/5 bg-zinc-900/60 p-4"
            />
          ))}
        </div>
      )}

      {/* Error state */}
      {!loading && error && (
        <div className="rounded-2xl border border-red-500/20 bg-red-500/5 py-12 text-center">
          <p className="mb-3 text-sm text-red-400" role="alert">
            {error}
          </p>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="rounded-lg bg-[var(--app-accent)] px-5 py-2 text-xs font-semibold text-white transition hover:opacity-90"
          >
            Try Again
          </button>
        </div>
      )}

      {/* Empty catalog */}
      {!loading && !error && products.length === 0 && (
        <div className="rounded-2xl border border-dashed border-zinc-800 py-16 text-center">
          <Package className="mx-auto mb-2 h-10 w-10 text-zinc-600" />
          <p className="text-sm font-medium text-zinc-400">No products are available yet</p>
          <p className="mt-1 text-xs text-zinc-600">Please check back later or request a product.</p>
          <button
            type="button"
            onClick={() => handleOpenNewRequest()}
            className="mt-4 rounded-xl btn-primary px-4 py-2 text-xs font-bold"
          >
            Request a Product
          </button>
        </div>
      )}

      {/* No search/filter match */}
      {!loading && !error && products.length > 0 && filteredProducts.length === 0 && (
        <div className="rounded-2xl border border-white/5 bg-zinc-900/40 py-16 text-center">
          <SlidersHorizontal className="mx-auto mb-2 h-8 w-8 text-zinc-600" />
          <p className="text-sm font-semibold text-zinc-300">No matching products found</p>
          <p className="mt-1 text-xs text-zinc-400">
            {debouncedSearch
              ? `No products match "${debouncedSearch}" in our catalog.`
              : "Try switching filters or selecting a different category."}
          </p>
          <div className="mt-4 flex items-center justify-center gap-3">
            <button
              type="button"
              onClick={clearFilters}
              className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-xs font-semibold text-white transition hover:bg-white/10"
            >
              Clear Filters
            </button>
            <button
              type="button"
              onClick={() => handleOpenNewRequest(debouncedSearch || "")}
              className="rounded-xl btn-primary px-4 py-2 text-xs font-bold"
            >
              Request "{debouncedSearch || "This Product"}"
            </button>
          </div>
        </div>
      )}

      {/* Products Grid */}
      {!loading && !error && filteredProducts.length > 0 && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 sm:gap-6">
          {filteredProducts.map((product) => (
            <ProductCard
              key={product._id}
              product={product}
              onRequestRestock={handleRestockProduct}
            />
          ))}
        </div>
      )}

      {/* Product Request Modal */}
      <ProductRequestModal
        isOpen={requestModalOpen}
        onClose={() => {
          setRequestModalOpen(false);
          setSelectedRequestProduct(null);
        }}
        initialProduct={selectedRequestProduct}
      />
    </div>
  );
};

export default Products;