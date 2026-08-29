import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import ProductCard from "../components/ProductCard";
import { productsApi } from "../services/api";

const Home = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Load top featured products for homepage preview
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);
        setError("");

        const data = await productsApi.list();

        const productList = Array.isArray(data)
          ? data
          : Array.isArray(data.products)
          ? data.products
          : [];

        setProducts(productList.slice(0, 4));
      } catch (requestError) {
        console.error("Failed to fetch products:", requestError);
        setError(
          requestError.message ||
            "Featured products are unavailable right now. Please try again shortly."
        );
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  const categories = [
    {
      name: "Groceries",
      description: "Daily essentials & staples",
      icon: "🛒",
      path: "/products?category=Groceries",
    },
    {
      name: "Beverages",
      description: "Drinks, juices & refreshments",
      icon: "🥤",
      path: "/products?category=Beverages",
    },
    {
      name: "Snacks",
      description: "Biscuits, chips & namkeen",
      icon: "🍪",
      path: "/products?category=Snacks",
    },
    {
      name: "Personal Care",
      description: "Everyday personal essentials",
      icon: "🧴",
      path: "/products?category=Personal%20Care",
    },
    {
      name: "Household",
      description: "Cleaning & home essentials",
      icon: "🧹",
      path: "/products?category=Household",
    },
    {
      name: "Kitchen",
      description: "Kitchen essentials & utilities",
      icon: "🍳",
      path: "/products?category=Kitchen",
    },
  ];

  return (
    <div className="w-full px-4 sm:px-6 md:px-[50px]">
      {/* Hero greeting banner */}
      <div
        className="relative mb-8 overflow-hidden rounded-xl border border-white/5 px-5 py-14 text-center text-white shadow-[0_10px_40px_rgba(0,0,0,0.5)] sm:mb-[50px] sm:rounded-[16px] sm:px-[30px] sm:py-[100px]"
        style={{
          background:
            "radial-gradient(circle at top right, var(--app-accent-soft), transparent 60%), linear-gradient(135deg, var(--app-surface-light) 0%, var(--app-surface) 100%)",
        }}
      >
        <div className="pointer-events-none absolute -right-16 -top-20 h-56 w-56 rounded-full bg-[var(--app-accent-soft)] blur-3xl" />
        <div className="pointer-events-none absolute -right-5 -top-9 h-36 w-36 rounded-full border border-[var(--app-accent-border)]" />

        <h1 className="relative z-10 mb-4 text-3xl font-bold text-white sm:mb-5 sm:text-5xl md:text-[3.5rem]">
          Welcome to SmartShop
        </h1>
        <p className="relative z-10 text-sm text-zinc-300 sm:text-lg">
          Everything you need, all in one place.
        </p>
      </div>

      <div className="mt-8 sm:mt-10">
        <h2 className="text-2xl font-bold text-white">Shop by Category</h2>
        <p className="mt-2 text-sm text-zinc-500 sm:text-base">
          Find your everyday essentials quickly and easily.
        </p>
      </div>

      {/* Categories browser cards */}
      <div className="mt-5 grid grid-cols-1 gap-4 sm:mt-6 sm:grid-cols-2 sm:gap-6 lg:grid-cols-3">
        {categories.map((category) => (
          <Link
            key={category.name}
            to={category.path}
            className="group cursor-pointer rounded-xl border border-white/5 bg-gradient-to-br from-zinc-900 to-zinc-950 p-5 text-center shadow-[0_4px_20px_rgba(0,0,0,0.3)] transition-all duration-300 hover:-translate-y-1.5 hover:border-[var(--app-accent-border)] sm:rounded-[16px] sm:p-[30px]"
            style={{
              boxShadow: "0 4px 20px rgba(0,0,0,0.3)",
            }}
          >
            <div className="mb-3 text-4xl transition-transform duration-300 group-hover:scale-110 sm:mb-4 sm:text-5xl">
              {category.icon}
            </div>
            <h3 className="mb-2 text-xl font-semibold text-white transition-colors duration-300 group-hover:text-[var(--app-accent)] sm:text-[1.3rem]">
              {category.name}
            </h3>
            <p className="text-sm text-zinc-400 sm:text-[0.95rem]">
              {category.description}
            </p>
          </Link>
        ))}
      </div>

      {/* Featured product list */}
      <h2 className="mt-10 text-2xl font-bold text-white sm:mt-[50px]">
        Featured Products
      </h2>

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
          No featured products are available yet.
        </p>
      )}

      {!loading && !error && products.length > 0 && (
        <div className="mt-5 grid grid-cols-1 gap-5 sm:mt-[30px] sm:grid-cols-2 sm:gap-[30px] lg:grid-cols-3 xl:grid-cols-4">
          {products.map((product) => (
            <ProductCard key={product._id} product={product} />
          ))}
        </div>
      )}

      {!loading && !error && products.length > 0 && (
        <div className="mt-6 text-center sm:mt-7">
          <Link
            to="/products"
            className="inline-block rounded-md bg-[var(--app-accent)] px-6 py-3 font-semibold text-white transition-all duration-300 hover:-translate-y-[1px] hover:bg-[var(--app-accent-hover)]"
          >
            View All Products
          </Link>
        </div>
      )}
    </div>
  );
};

export default Home;