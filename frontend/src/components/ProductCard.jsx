import React from "react";

const ProductCard = ({ product }) => {
  const isAvailable = Number(product.stock || 0) > 0;

  return (
    <div className="group relative flex flex-col overflow-hidden rounded-xl border border-white/5 bg-zinc-900 shadow-[0_4px_20px_rgba(0,0,0,0.3)] transition-all duration-300 hover:-translate-y-2 hover:border-[var(--app-accent-border)] hover:shadow-[0_12px_30px_rgba(0,0,0,0.5)]">
      {/* Product Image */}
      <div className="relative h-60 overflow-hidden bg-zinc-950">
        <img
          src={product.imageUrl || product.image || "/logo.jpg"}
          alt={product.name || "Product"}
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          onError={(event) => {
            event.currentTarget.onerror = null;
            event.currentTarget.src = "/logo.jpg";
          }}
        />

        {/* Availability Badge */}
        <span
          className={`absolute left-3 top-3 rounded-full border px-3 py-1 text-xs font-semibold backdrop-blur-md ${
            isAvailable
              ? "border-green-500/20 bg-green-500/15 text-green-400"
              : "border-red-500/20 bg-red-500/15 text-red-400"
          }`}
        >
          {isAvailable ? "Available" : "Not Available"}
        </span>
      </div>

      {/* Product Information */}
      <div className="flex flex-1 flex-col justify-between bg-gradient-to-t from-zinc-900 to-zinc-900/95 p-5">
        <div>
          <h3 className="mb-2 truncate text-lg font-semibold text-white">
            {product.name || "Unnamed Product"}
          </h3>

          {product.category && (
            <p className="mb-3 text-sm text-zinc-500">
              {product.category}
            </p>
          )}

          <p className="mb-5 text-2xl font-bold text-[var(--app-accent)]">
            ₹{Number(product.price || 0).toLocaleString("en-IN")}
          </p>
        </div>

        {/* Availability Button */}
        <div
          className={`flex w-full items-center justify-center rounded-md px-4 py-2.5 text-sm font-semibold ${
            isAvailable
              ? "border border-green-500/30 bg-green-500/10 text-green-400"
              : "border border-red-500/30 bg-red-500/10 text-red-400"
          }`}
        >
          {isAvailable ? "Available" : "Not Available"}
        </div>
      </div>
    </div>
  );
};

export default ProductCard;