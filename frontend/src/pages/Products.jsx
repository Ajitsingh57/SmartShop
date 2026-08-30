import React, { useEffect, useState, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { Search, X, Package, SlidersHorizontal, RefreshCw } from "lucide-react";
import ProductCard from "../components/ProductCard";
import { productsApi } from "../services/api";

const Products = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [submittedSearch, setSubmittedSearch] = useState("");
  const [error, setError] = useState("");

  const [searchParams, setSearchParams] = useSearchParams();
  const initialCategory = searchParams.get("category") || "All";
  const [selectedCategory, setSelectedCategory] = useState(initialCategory);

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

  const handleSearch = (event) => {
    event.preventDefault();
    setSubmittedSearch(search.trim());
  };

  const clearFilters = () => {
    setSearch("");
    setSubmittedSearch("");
    handleCategorySelect("All");
  };

  // Filter products by category and title query
  const filteredProducts = useMemo(() => {
    return products.filter((product) => {
      const productName = String(product?.name || "").toLowerCase();
      const productCategory = String(product?.category || "");
      const searchText = submittedSearch.toLowerCase();

      const matchesSearch =
        !searchText || productName.includes(searchText);
      const matchesCategory =
        selectedCategory === "All" || productCategory === selectedCategory;

      return matchesSearch && matchesCategory;
    });
  }, [products, submittedSearch, selectedCategory]);

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
              Live Inventory Catalog
            </p>
          </div>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-white sm:text-3xl lg:text-4xl">
            All Products
          </h1>
        </div>

        {!loading && (
          <p className="text-xs font-medium text-zinc-500">
            Showing <strong className="text-zinc-200">{filteredProducts.length}</strong> of{" "}
            {products.length} products
          </p>
        )}
      </div>

      {/* Filter and Search Bar */}
      <div className="mb-8 space-y-4">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          {/* Dynamic Categories Scrollable Bar */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 max-w-full">
            {availableCategories.map((cat) => {
              const isSelected = selectedCategory === cat.name;

              return (
                <button
                  key={cat.name}
                  type="button"
                  onClick={() => handleCategorySelect(cat.name)}
                  className={`inline-flex shrink-0 items-center gap-1.5 rounded-xl border px-3.5 py-2 text-xs font-semibold transition-all duration-200 ${
                    isSelected
                      ? "border-[var(--app-accent-border)] bg-[var(--app-accent)] text-white shadow-lg"
                      : "border-white/10 bg-zinc-900/80 text-zinc-400 hover:border-white/20 hover:bg-zinc-800 hover:text-white"
                  }`}
                >
                  <span>{cat.name}</span>
                  <span
                    className={`rounded-full px-1.5 py-0.5 text-[10px] font-bold ${
                      isSelected
                        ? "bg-white/25 text-white"
                        : "bg-white/5 text-zinc-500"
                    }`}
                  >
                    {cat.count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Search Form */}
          <form
            onSubmit={handleSearch}
            className="relative flex w-full items-center lg:w-80"
          >
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
                  setSubmittedSearch("");
                }}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </form>
        </div>

        {/* Active Filter Tags & Reset */}
        {(selectedCategory !== "All" || submittedSearch) && (
          <div className="flex flex-wrap items-center gap-2 pt-1">
            <span className="text-xs text-zinc-500 font-medium">Active filters:</span>
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
            {submittedSearch && (
              <span className="inline-flex items-center gap-1 rounded-lg border border-white/10 bg-zinc-800 px-2.5 py-1 text-xs font-medium text-zinc-300">
                Search: "{submittedSearch}"
                <button
                  type="button"
                  onClick={() => {
                    setSearch("");
                    setSubmittedSearch("");
                  }}
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
        <div className="py-16 text-center text-zinc-500">
          <RefreshCw className="mx-auto mb-2 h-8 w-8 animate-spin text-[var(--app-accent)]" />
          <p className="text-sm font-medium">Loading inventory...</p>
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
          <p className="mt-1 text-xs text-zinc-600">Please check back later.</p>
        </div>
      )}

      {/* No search/filter match */}
      {!loading && !error && products.length > 0 && filteredProducts.length === 0 && (
        <div className="rounded-2xl border border-white/5 bg-zinc-900/40 py-16 text-center">
          <SlidersHorizontal className="mx-auto mb-2 h-8 w-8 text-zinc-600" />
          <p className="text-sm font-semibold text-zinc-300">No matching products found</p>
          <p className="mt-1 text-xs text-zinc-500">
            {submittedSearch
              ? `No products match "${submittedSearch}" in ${selectedCategory} category.`
              : "Try switching to another category."}
          </p>
          <button
            type="button"
            onClick={clearFilters}
            className="mt-4 rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-xs font-semibold text-white transition hover:bg-white/10"
          >
            Clear Filters
          </button>
        </div>
      )}

      {/* Products Grid */}
      {!loading && !error && filteredProducts.length > 0 && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 sm:gap-6">
          {filteredProducts.map((product) => (
            <ProductCard key={product._id} product={product} />
          ))}
        </div>
      )}
    </div>
  );
};

export default Products;