import React from "react";

const Logo = ({
  size = "md",
  showText = true,
  showBadge = false,
  badgeText = "Store",
  className = "",
  animate = true,
}) => {
  // Dimensions and scale mappings
  const sizeMap = {
    xs: {
      box: "h-7 w-7",
      svg: 28,
      textSize: "text-base",
      badgeSize: "text-[9px] px-1.5 py-0.5",
      dotSize: "h-1.5 w-1.5",
    },
    sm: {
      box: "h-8 w-8 sm:h-9 sm:w-9",
      svg: 34,
      textSize: "text-lg sm:text-xl",
      badgeSize: "text-[10px] px-2 py-0.5",
      dotSize: "h-2 w-2",
    },
    md: {
      box: "h-9 w-9 sm:h-10 sm:w-10",
      svg: 40,
      textSize: "text-xl sm:text-2xl",
      badgeSize: "text-[10px] sm:text-[11px] px-2 py-0.5",
      dotSize: "h-2 w-2",
    },
    lg: {
      box: "h-12 w-12 sm:h-14 sm:w-14",
      svg: 56,
      textSize: "text-2xl sm:text-3xl",
      badgeSize: "text-xs px-2.5 py-1",
      dotSize: "h-2.5 w-2.5",
    },
    xl: {
      box: "h-16 w-16 sm:h-20 sm:w-20",
      svg: 80,
      textSize: "text-3xl sm:text-4xl lg:text-5xl",
      badgeSize: "text-xs sm:text-sm px-3 py-1",
      dotSize: "h-3 w-3",
    },
    hero: {
      box: "h-20 w-20 sm:h-24 sm:w-24",
      svg: 96,
      textSize: "text-4xl sm:text-5xl",
      badgeSize: "text-sm px-3.5 py-1.5",
      dotSize: "h-3.5 w-3.5",
    },
  };

  const currentSize = sizeMap[size] || sizeMap.md;

  return (
    <div className={`inline-flex items-center gap-2.5 sm:gap-3 select-none group ${className}`}>
      {/* Dynamic Brand SVG Icon Badge */}
      <div
        className={`relative flex ${currentSize.box} shrink-0 items-center justify-center rounded-2xl p-1 transition-transform duration-300 ${
          animate ? "group-hover:scale-105 group-hover:rotate-1" : ""
        }`}
        style={{
          background: "linear-gradient(135deg, rgba(249, 115, 22, 0.22) 0%, rgba(15, 23, 42, 0.9) 60%, rgba(234, 88, 12, 0.25) 100%)",
          border: "1px solid rgba(249, 115, 22, 0.35)",
          boxShadow: "0 8px 24px -4px rgba(249, 115, 22, 0.3), inset 0 1px 1px rgba(255, 255, 255, 0.15)",
        }}
      >
        <svg
          viewBox="0 0 100 100"
          className="h-full w-full drop-shadow-md"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <linearGradient id="bagGradientFront" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#ff8c37" />
              <stop offset="50%" stopColor="#f97316" />
              <stop offset="100%" stopColor="#ea580c" />
            </linearGradient>

            <linearGradient id="sparkGradientFront" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#ffffff" />
              <stop offset="70%" stopColor="#fed7aa" />
              <stop offset="100%" stopColor="#fdba74" />
            </linearGradient>

            <filter id="sparkGlowFront" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="2" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>

          {/* Bag Handle */}
          <path
            d="M38 33 C38 23, 62 23, 62 33"
            stroke="url(#sparkGradientFront)"
            strokeWidth="5.5"
            strokeLinecap="round"
          />

          {/* Bag Body */}
          <path
            d="M26 35 L74 35 C77.5 35, 80.2 38, 79 42.5 L72.5 78.5 C71.5 83, 67.8 86, 63 86 L37 86 C32.2 86, 28.5 83, 27.5 78.5 L21 42.5 C19.8 38, 22.5 35, 26 35 Z"
            fill="url(#bagGradientFront)"
          />

          {/* Lightning Monogram / S Emblem */}
          <path
            d="M57 43 L40 57 L48.5 57 L43 77 L60 62 L51.5 62 Z"
            fill="url(#sparkGradientFront)"
            filter="url(#sparkGlowFront)"
          />
        </svg>

        {/* Ambient Corner Flare */}
        <div className="pointer-events-none absolute -top-1 -right-1 h-2.5 w-2.5 rounded-full bg-orange-400 blur-[2px] opacity-70" />
      </div>

      {/* Brand Typography */}
      {showText && (
        <div className="flex flex-col min-w-0">
          <div className="flex items-center gap-1.5 leading-none">
            <span className={`font-display font-black tracking-tight text-white ${currentSize.textSize}`}>
              Smart
              <span className="bg-gradient-to-r from-orange-400 via-amber-400 to-orange-500 bg-clip-text text-transparent">
                Shop
              </span>
            </span>
            <span
              className={`rounded-full bg-[var(--app-accent)] animate-pulse ${currentSize.dotSize}`}
              style={{ boxShadow: "0 0 8px var(--app-accent)" }}
            />
            {showBadge && (
              <span
                className={`ml-1 inline-flex items-center rounded-md font-display font-bold uppercase tracking-wider border ${currentSize.badgeSize}`}
                style={{
                  backgroundColor: "rgba(249, 115, 22, 0.15)",
                  borderColor: "rgba(249, 115, 22, 0.35)",
                  color: "#fb923c",
                }}
              >
                {badgeText}
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Logo;
