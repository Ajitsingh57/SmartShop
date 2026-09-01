import React, { useState } from "react";
import {
  Package,
  Tag,
  CheckCircle2,
  AlertCircle,
  XCircle,
  Layers,
  RotateCcw,
  Sparkles,
} from "lucide-react";

const ProductCard = ({ product, onRequestRestock }) => {
  const [imageError, setImageError] = useState(false);

  const stock = Number(product?.stock ?? 0);
  const lowLimit = Number(product?.lowStockLimit ?? 5);
  const unit = product?.unit || "unit";
  const isAvailable = product?.available !== false && stock > 0;
  const isLowStock = isAvailable && stock <= lowLimit;
  const imageSrc = product?.imageUrl || product?.image;

  return (
    <div className="group relative flex flex-col overflow-hidden rounded-2xl border border-white/[0.08] bg-zinc-900/50 shadow-[0_4px_20px_rgba(0,0,0,0.35)] backdrop-blur-md transition-all duration-300 hover:-translate-y-1.5 hover:border-[var(--app-accent-border)] hover:bg-zinc-900/80 hover:shadow-[0_16px_36px_rgba(0,0,0,0.55),0_0_24px_var(--app-accent-soft)]">
      {/* Product Image Container */}
      <div className="relative h-44 sm:h-48 w-full overflow-hidden bg-gradient-to-b from-zinc-950 via-zinc-900/70 to-zinc-950/90">
        {/* Ambient background radial highlight */}
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_40%,rgba(255,255,255,0.06),transparent_70%)]" />

        {!imageError && imageSrc ? (
          <img
            src={imageSrc}
            alt={product?.name || "Product"}
            loading="lazy"
            className="h-full w-full object-contain p-3.5 transition-transform duration-500 ease-out group-hover:scale-105"
            onError={() => setImageError(true)}
          />
        ) : (
          <div className="flex h-full w-full flex-col items-center justify-center gap-2 text-zinc-600">
            <div
              className="flex h-14 w-14 items-center justify-center rounded-2xl border transition-transform duration-300 group-hover:scale-110"
              style={{
                borderColor: "var(--app-accent-border)",
                backgroundColor: "var(--app-accent-soft)",
                color: "var(--app-accent)",
              }}
            >
              <Package className="h-7 w-7" />
            </div>
            <span className="text-[11px] font-medium text-zinc-500">
              No preview
            </span>
          </div>
        )}

        {/* Top Badges (Category & Available Stock) */}
        <div className="absolute left-3 right-3 top-3 flex items-center justify-between gap-2">
          {product?.category ? (
            <span className="inline-flex max-w-[120px] items-center gap-1 truncate rounded-full border border-white/10 bg-zinc-950/80 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-zinc-300 shadow-sm backdrop-blur-md">
              <Tag className="h-2.5 w-2.5 shrink-0 opacity-70" />
              <span className="truncate">{product.category}</span>
            </span>
          ) : (
            <span />
          )}

          {/* Quick stock pill with exact quantity */}
          <span
            className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[11px] font-bold backdrop-blur-md shadow-sm ${
              !isAvailable
                ? "border-rose-500/30 bg-rose-950/80 text-rose-300"
                : isLowStock
                ? "border-amber-500/30 bg-amber-950/80 text-amber-300"
                : "border-emerald-500/30 bg-emerald-950/80 text-emerald-300"
            }`}
          >
            <span
              className={`h-1.5 w-1.5 rounded-full ${
                !isAvailable
                  ? "bg-rose-400 shadow-[0_0_8px_#f43f5e]"
                  : isLowStock
                  ? "bg-amber-400 shadow-[0_0_8px_#fbbf24]"
                  : "bg-emerald-400 shadow-[0_0_8px_#34d399]"
              }`}
            />
            {isAvailable
              ? isLowStock
                ? `Only ${stock} ${unit} left`
                : `${stock} ${unit} available`
              : `0 ${unit} (Out of Stock)`}
          </span>
        </div>
      </div>

      {/* Product Content & Details */}
      <div className="flex flex-1 flex-col justify-between p-4 sm:p-5">
        <div>
          {/* Product Title */}
          <h3
            className="text-base sm:text-lg font-bold tracking-tight text-white transition-colors duration-200 group-hover:text-[var(--app-accent)] line-clamp-1"
            title={product?.name}
          >
            {product?.name || "Unnamed Product"}
          </h3>

          {/* Short description */}
          {product?.description && (
            <p className="mt-1 truncate text-xs text-zinc-400" title={product.description}>
              {product.description}
            </p>
          )}

          {/* Available Quantity Progress & Metric Card */}
          <div className="mt-3 rounded-xl border border-white/5 bg-zinc-950/70 p-2.5">
            <div className="flex items-center justify-between text-xs">
              <span className="flex items-center gap-1.5 text-zinc-400 font-medium">
                <Layers className="h-3.5 w-3.5 text-zinc-500" />
                Available in Shop:
              </span>
              <span
                className={`font-extrabold ${
                  !isAvailable
                    ? "text-rose-400"
                    : isLowStock
                    ? "text-amber-400"
                    : "text-emerald-400"
                }`}
              >
                {stock} {unit}
              </span>
            </div>

            {/* Visual stock capacity bar */}
            <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-zinc-800">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  !isAvailable
                    ? "w-0 bg-rose-500"
                    : isLowStock
                    ? "bg-amber-400"
                    : "bg-emerald-400"
                }`}
                style={{
                  width: !isAvailable
                    ? "0%"
                    : `${Math.min(100, Math.max(12, (stock / Math.max(stock, 30)) * 100))}%`,
                }}
              />
            </div>
          </div>
        </div>

        {/* Pricing and Action Footer */}
        <div className="mt-4 border-t border-white/5 pt-3">
          <div className="flex items-end justify-between gap-2">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">
                Price
              </p>
              <div className="flex items-baseline gap-0.5">
                <span
                  className="text-sm font-bold"
                  style={{ color: "var(--app-accent)" }}
                >
                  ₹
                </span>
                <span className="text-xl sm:text-2xl font-extrabold tracking-tight text-white">
                  {Number(product?.price || 0).toLocaleString("en-IN")}
                </span>
                {unit && (
                  <span className="ml-1 text-[11px] font-normal text-zinc-400">
                    /{unit}
                  </span>
                )}
              </div>
            </div>

            {/* Availability status badge */}
            <div
              className={`inline-flex items-center gap-1 rounded-lg border px-2.5 py-1 text-xs font-semibold ${
                isAvailable
                  ? isLowStock
                    ? "border-amber-500/20 bg-amber-500/10 text-amber-300"
                    : "border-emerald-500/20 bg-emerald-500/10 text-emerald-400"
                  : "border-rose-500/20 bg-rose-500/10 text-rose-400"
              }`}
            >
              {isAvailable ? (
                isLowStock ? (
                  <>
                    <AlertCircle className="h-3.5 w-3.5" />
                    <span>Low Stock</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    <span>In Stock</span>
                  </>
                )
              ) : (
                <>
                  <XCircle className="h-3.5 w-3.5" />
                  <span>Out of Stock</span>
                </>
              )}
            </div>
          </div>

          {/* Request Restock Button for Out of Stock or Low Stock Products */}
          {(!isAvailable || isLowStock) && (
            <button
              type="button"
              onClick={() => onRequestRestock?.(product)}
              className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-xl border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs font-bold text-amber-300 transition-all duration-200 hover:border-amber-500/50 hover:bg-amber-500/20 active:scale-[0.98]"
            >
              <RotateCcw className="h-3.5 w-3.5 shrink-0 text-amber-400" />
              <span>Request Restock / Bulk Order</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProductCard;