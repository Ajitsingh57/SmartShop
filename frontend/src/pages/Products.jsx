import React, { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
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

  // Filter products by category and title query
  const filteredProducts = products.filter((product) => {
    const productName = String(product?.name || "").toLowerCase();
    const productCategory = String(product?.category || "");
    const searchText = submittedSearch.toLowerCase();

    const matchesSearch = productName.includes(searchText);
    const matchesCategory =
      selectedCategory === "All" || productCategory === selectedCategory;

    return matchesSearch && matchesCategory;
  });

  return (
    <div className="w-full px-5 sm:px-6 md:px-[50px]">
      <h2 className="mb-8 text-2xl font-bold text-white">All Products</h2>

      {/* Catalog filtering toolbar */}
      <div className="mb-10 flex flex-wrap items-center justify-between gap-5">
        <div className="flex flex-wrap gap-2.5">
          {[
            "All",
            "Grocery",
            "Snacks",
            "Beverages",
            "Dairy",
            "Bakery",
            "Personal Care",
          ].map((category) => (
            <button
              key={category}
              type="button"
              onClick={() => handleCategorySelect(category)}
              className={`rounded-full border px-5 py-2.5 text-sm font-medium transition-all duration-300 ${
                selectedCategory === category
                  ? "border-[var(--app-accent-border)] bg-[var(--app-accent)] text-white shadow-lg"
                  : "border-zinc-800 bg-zinc-900 text-zinc-400 hover:border-zinc-700 hover:bg-zinc-800 hover:text-white"
              }`}
            >
              {category}
            </button>
          ))}
        </div>

        <form
          onSubmit={handleSearch}
          className="flex w-full max-w-[640px] gap-3 md:w-auto md:flex-1 md:justify-end"
        >
          <input
            type="search"
            placeholder="Search products..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            aria-label="Search products"
            className="min-w-0 flex-1 rounded-lg border border-zinc-800 bg-zinc-900 px-5 py-[15px] text-base text-zinc-100 outline-none transition-all duration-300 placeholder:text-zinc-500 focus:border-[var(--app-accent-border)] focus:ring-4 focus:ring-[var(--app-accent-soft)] md:max-w-[500px]"
          />

          <button
            type="submit"
            className="min-w-[100px] rounded-md border border-[var(--app-accent-border)] bg-[var(--app-accent)] px-5 font-bold text-white transition-all duration-300 hover:bg-[var(--app-accent-hover)]"
          >
            Search
          </button>
        </form>
      </div>

      {loading && (
        <p className="py-10 text-center text-zinc-400">Loading products...</p>
      )}

      {!loading && error && (
        <div className="py-10 text-center">
          <p className="mb-4 text-red-400" role="alert">
            {error}
          </p>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="rounded-md bg-[var(--app-accent)] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[var(--app-accent-hover)]"
          >
            Try Again
          </button>
        </div>
      )}

      {!loading && !error && products.length === 0 && (
        <p className="py-10 text-center text-zinc-400">
          No products are available yet.
        </p>
      )}

      {!loading && !error && products.length > 0 && filteredProducts.length === 0 && (
        <div className="py-10 text-center">
          <p className="text-zinc-400">No products found.</p>
          {submittedSearch && (
            <p className="mt-2 text-sm text-zinc-600">
              Try a different search term or category.
            </p>
          )}
        </div>
      )}

      {!loading && !error && filteredProducts.length > 0 && (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 xl:gap-[30px]">
          {filteredProducts.map((product) => (
            <ProductCard key={product._id} product={product} />
          ))}
        </div>
      )}
    </div>
  );
};

export default Products;