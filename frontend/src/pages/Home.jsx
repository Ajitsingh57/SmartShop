import React, { useEffect, useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Sparkles, Layers, Package } from "lucide-react";
import ProductCard from "../components/ProductCard";
import { productsApi } from "../services/api";

const getCategoryIcon = (categoryName) => {
  const name = String(categoryName || "").toLowerCase();
  if (name.includes("groc") || name.includes("kirana")) return "🛒";
  if (
    name.includes("bev") ||
    name.includes("drink") ||
    name.includes("juice") ||
    name.includes("tea") ||
    name.includes("coffee")
  )
    return "🥤";
  if (
    name.includes("snack") ||
    name.includes("bisc") ||
    name.includes("chip") ||
    name.includes("namkeen")
  )
    return "🍪";
  if (
    name.includes("dairy") ||
    name.includes("milk") ||
    name.includes("paneer") ||
    name.includes("cheese") ||
    name.includes("butter")
  )
    return "🥛";
  if (name.includes("bake") || name.includes("bread") || name.includes("cake"))
    return "🍞";
  if (name.includes("fruit") || name.includes("veg")) return "🍎";
  if (
    name.includes("person") ||
    name.includes("care") ||
    name.includes("soap") ||
    name.includes("shampoo") ||
    name.includes("beauty")
  )
    return "🧴";
  if (
    name.includes("house") ||
    name.includes("clean") ||
    name.includes("detergent")
  )
    return "🧹";
  if (name.includes("kitch") || name.includes("cook")) return "🍳";
  if (
    name.includes("sweet") ||
    name.includes("choc") ||
    name.includes("candy") ||
    name.includes("mithai")
  )
    return "🍬";
  if (
    name.includes("oil") ||
    name.includes("ghee") ||
    name.includes("masala") ||
    name.includes("spice")
  )
    return "🧂";
  if (
    name.includes("grain") ||
    name.includes("rice") ||
    name.includes("flour") ||
    name.includes("atta") ||
    name.includes("dal")
  )
    return "🌾";
  return "📦";
};

const Home = () => {
  const [allProducts, setAllProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Load all products for live category extraction and featured preview
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

        setAllProducts(productList);
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

  // Dynamically extract only categories that actually have products
  const dynamicCategories = useMemo(() => {
    const counts = {};
    allProducts.forEach((product) => {
      const cat = String(product?.category || "").trim();
      if (cat) {
        counts[cat] = (counts[cat] || 0) + 1;
      }
    });

    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1]) // Highest product count first
      .map(([name, count]) => ({
        name,
        count,
        icon: getCategoryIcon(name),
        path: `/products?category=${encodeURIComponent(name)}`,
      }));
  }, [allProducts]);

  // Featured products (top 8 items)
  const featuredProducts = useMemo(() => {
    return allProducts.slice(0, 8);
  }, [allProducts]);

  return (
    <div className="w-full px-4 sm:px-6 md:px-[50px] pb-16">
      {/* Hero greeting banner */}
      <div
        className="relative mb-10 overflow-hidden rounded-2xl border border-white/5 px-6 py-12 text-center text-white shadow-[0_10px_40px_rgba(0,0,0,0.5)] sm:mb-14 sm:rounded-3xl sm:px-10 sm:py-20"
        style={{
          background:
            "radial-gradient(circle at top right, var(--app-accent-soft), transparent 60%), linear-gradient(135deg, var(--app-surface-light) 0%, var(--app-surface) 100%)",
        }}
      >
        <div className="pointer-events-none absolute -right-16 -top-20 h-56 w-56 rounded-full bg-[var(--app-accent-soft)] blur-3xl" />
        <div className="pointer-events-none absolute -right-5 -top-9 h-36 w-36 rounded-full border border-[var(--app-accent-border)]" />

        <div className="relative z-10 mx-auto max-w-3xl">
          <span
            className="mb-4 inline-flex items-center gap-1.5 rounded-full px-3.5 py-1 text-xs font-semibold uppercase tracking-wider backdrop-blur-md shadow-sm"
            style={{
              backgroundColor: "var(--app-accent-soft)",
              color: "var(--app-accent)",
              border: "1px solid var(--app-accent-border)",
            }}
          >
            <Sparkles className="h-3.5 w-3.5" />
            Smart Retail & Inventory
          </span>

          <h1 className="mb-4 text-3xl font-black tracking-tight text-white sm:text-5xl md:text-6xl">
            Welcome to SmartShop<span style={{ color: "var(--app-accent)" }}>.</span>
          </h1>

          <p className="mx-auto max-w-xl text-sm leading-relaxed text-zinc-300 sm:text-base md:text-lg">
            Explore fresh inventory, transparent pricing, and instant availability from your local favorite shop.
          </p>
        </div>
      </div>

      {/* Categories Header */}
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="flex h-2 w-2 rounded-full" style={{ backgroundColor: "var(--app-accent)" }} />
            <p className="text-xs font-bold uppercase tracking-widest text-zinc-400">
              Active Departments
            </p>
          </div>
          <h2 className="mt-1 text-2xl font-bold tracking-tight text-white sm:text-3xl">
            Shop by Category
          </h2>
        </div>

        {dynamicCategories.length > 0 && (
          <p className="text-xs font-medium text-zinc-500">
            {dynamicCategories.length} {dynamicCategories.length === 1 ? "Category" : "Categories"} available
          </p>
        )}
      </div>

      {/* Dynamic Categories Grid */}
      {loading ? (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 sm:gap-4">
          {[1, 2, 3, 4].map((n) => (
            <div
              key={n}
              className="h-24 sm:h-28 animate-pulse rounded-xl sm:rounded-2xl border border-white/5 bg-zinc-900/60 p-3 sm:p-5"
            />
          ))}
        </div>
      ) : dynamicCategories.length > 0 ? (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 sm:gap-4.5">
          {dynamicCategories.map((category) => (
            <Link
              key={category.name}
              to={category.path}
              className="group relative flex flex-col justify-between overflow-hidden rounded-xl sm:rounded-2xl border border-white/[0.08] bg-gradient-to-br from-zinc-900/80 via-zinc-900/50 to-zinc-950/90 p-3.5 sm:p-5 backdrop-blur-xl transition-all duration-300 hover:-translate-y-1 hover:border-[var(--app-accent-border)] hover:bg-zinc-900 hover:shadow-[0_12px_28px_rgba(0,0,0,0.5),0_0_20px_var(--app-accent-soft)]"
            >
              <div className="flex items-center justify-between gap-2">
                <div className="flex h-9 w-9 sm:h-11 sm:w-11 shrink-0 items-center justify-center rounded-lg sm:rounded-xl border border-white/10 bg-white/[0.04] text-lg sm:text-2xl shadow-inner transition-transform duration-300 group-hover:scale-110 group-hover:border-[var(--app-accent-border)]">
                  {category.icon}
                </div>

                <span className="rounded-full border border-white/10 bg-white/[0.03] px-2 py-0.5 text-[10px] sm:text-[11px] font-semibold text-zinc-400 transition-colors group-hover:border-[var(--app-accent-border)] group-hover:text-white">
                  {category.count} {category.count === 1 ? "Item" : "Items"}
                </span>
              </div>

              <div className="mt-3 sm:mt-4">
                <h3
                  className="truncate text-xs sm:text-base font-bold tracking-tight text-white transition-colors duration-200 group-hover:text-[var(--app-accent)]"
                  title={category.name}
                >
                  {category.name}
                </h3>
                <p className="mt-0.5 sm:mt-1 flex items-center gap-1 text-[10px] sm:text-xs font-medium text-zinc-500 transition-colors group-hover:text-zinc-300">
                  <span>View items</span>
                  <ArrowRight className="h-2.5 w-2.5 sm:h-3 sm:w-3 transition-transform duration-200 group-hover:translate-x-1" />
                </p>
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <div className="rounded-2xl border border-dashed border-zinc-800 p-8 text-center text-zinc-500">
          <Layers className="mx-auto mb-2 h-8 w-8 text-zinc-600" />
          <p className="text-sm font-medium text-zinc-400">No active categories found</p>
          <p className="mt-1 text-xs text-zinc-600">Categories will appear automatically as products are added.</p>
        </div>
      )}

      {/* Featured Products Section */}
      <div className="mt-14 sm:mt-16">
        <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="flex h-2 w-2 rounded-full" style={{ backgroundColor: "var(--app-accent)" }} />
              <p className="text-xs font-bold uppercase tracking-widest text-zinc-400">
                Fresh In Store
              </p>
            </div>
            <h2 className="mt-1 text-2xl font-bold tracking-tight text-white sm:text-3xl">
              Featured Products
            </h2>
          </div>

          <Link
            to="/products"
            className="inline-flex items-center gap-1 text-xs font-bold transition-colors hover:underline"
            style={{ color: "var(--app-accent)" }}
          >
            View All ({allProducts.length}) →
          </Link>
        </div>

        {loading && (
          <div className="py-12 text-center text-zinc-500">
            <Package className="mx-auto mb-2 h-8 w-8 animate-spin text-[var(--app-accent)]" />
            <p className="text-sm font-medium">Loading products...</p>
          </div>
        )}

        {!loading && error && (
          <div className="rounded-2xl border border-red-500/20 bg-red-500/5 py-10 text-center">
            <p className="mb-3 text-sm text-red-400" role="alert">
              {error}
            </p>
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="rounded-lg bg-[var(--app-accent)] px-4 py-2 text-xs font-semibold text-white transition hover:opacity-90"
            >
              Try Again
            </button>
          </div>
        )}

        {!loading && !error && featuredProducts.length === 0 && (
          <p className="py-12 text-center text-sm text-zinc-500">
            No featured products are available yet.
          </p>
        )}

        {!loading && !error && featuredProducts.length > 0 && (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 sm:gap-6">
            {featuredProducts.map((product) => (
              <ProductCard key={product._id} product={product} />
            ))}
          </div>
        )}

        {!loading && !error && allProducts.length > 8 && (
          <div className="mt-10 text-center">
            <Link
              to="/products"
              className="inline-flex items-center gap-2 rounded-xl px-7 py-3 text-sm font-bold text-white shadow-lg transition-all duration-300 hover:-translate-y-0.5"
              style={{ backgroundColor: "var(--app-accent)" }}
            >
              Explore All {allProducts.length} Products
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        )}
      </div>
    </div>
  );
};

export default Home;