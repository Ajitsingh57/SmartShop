import React from "react";
import { Sun, Moon, Sparkles } from "lucide-react";
import { useTheme } from "../context/ThemeContext";

const ThemeToggle = ({ compact = false, showPaletteRoll = true, className = "" }) => {
  const { mode, isDark, toggleMode, palette, randomizePalette } = useTheme();

  return (
    <div className={`inline-flex items-center gap-1.5 ${className}`}>
      {/* Mode Switcher Button (Sun / Moon) */}
      <button
        type="button"
        onClick={toggleMode}
        className={`relative flex items-center justify-center rounded-xl border border-white/10 bg-zinc-900/80 text-zinc-300 transition-all duration-300 hover:border-[var(--app-accent-border)] hover:bg-zinc-800 hover:text-white active:scale-95 shadow-sm group ${
          compact ? "h-8 w-8 text-xs" : "h-9 w-9 text-sm"
        }`}
        title={`Current: ${isDark ? "Dark Mode" : "Light Mode"} (${palette.label}). Click to switch to ${isDark ? "Light Mode" : "Dark Mode"}`}
        aria-label={`Toggle ${isDark ? "light" : "dark"} mode`}
      >
        {isDark ? (
          <Sun className="h-4 w-4 text-amber-400 transition-transform duration-500 group-hover:rotate-90 group-hover:scale-110" />
        ) : (
          <Moon className="h-4 w-4 text-indigo-400 transition-transform duration-500 group-hover:-rotate-12 group-hover:scale-110" />
        )}
      </button>

      {/* Optional Random Color Palette Roller Button */}
      {showPaletteRoll && (
        <button
          type="button"
          onClick={randomizePalette}
          className={`flex items-center justify-center rounded-xl border border-white/10 bg-zinc-900/80 text-zinc-400 transition-all duration-300 hover:border-[var(--app-accent-border)] hover:bg-zinc-800 hover:text-[var(--app-accent)] active:scale-90 shadow-sm group ${
            compact ? "h-8 w-8" : "h-9 w-9"
          }`}
          title={`Color: ${palette.label} (Click to shuffle fresh look)`}
          aria-label="Shuffle theme color palette"
        >
          <Sparkles className="h-3.5 w-3.5 transition-transform duration-500 group-hover:rotate-45 group-hover:scale-110 text-[var(--app-accent)]" />
        </button>
      )}
    </div>
  );
};

export default ThemeToggle;
