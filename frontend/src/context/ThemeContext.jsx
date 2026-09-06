import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
} from "react";

// Curated dynamic accent palettes with dark and light variants
const themePalettes = [
  {
    name: "orange",
    label: "Amber Glow",
    accent: "#f97316",
    accentHover: "#ea580c",
    accentSoft: "rgba(249, 115, 22, 0.14)",
    accentBorder: "rgba(249, 115, 22, 0.28)",
    accentGlow: "rgba(249, 115, 22, 0.35)",
    dark: {
      bg: "#050811",
      surface: "#09090b",
      surfaceLight: "#13151b",
      surfaceElevated: "#181b24",
      border: "#27272a",
      borderLight: "rgba(255, 255, 255, 0.08)",
      text: "#f1f5f9",
      textMuted: "#94a3b8",
    },
    light: {
      bg: "#f8fafc",
      surface: "#ffffff",
      surfaceLight: "#f1f5f9",
      surfaceElevated: "#ffffff",
      border: "#e2e8f0",
      borderLight: "rgba(0, 0, 0, 0.07)",
      text: "#0f172a",
      textMuted: "#64748b",
    },
  },
  {
    name: "blue",
    label: "Cyber Blue",
    accent: "#3b82f6",
    accentHover: "#2563eb",
    accentSoft: "rgba(59, 130, 246, 0.14)",
    accentBorder: "rgba(59, 130, 246, 0.28)",
    accentGlow: "rgba(59, 130, 246, 0.35)",
    dark: {
      bg: "#050912",
      surface: "#080b12",
      surfaceLight: "#101624",
      surfaceElevated: "#151e30",
      border: "#1e293b",
      borderLight: "rgba(255, 255, 255, 0.08)",
      text: "#f1f5f9",
      textMuted: "#94a3b8",
    },
    light: {
      bg: "#f8fafc",
      surface: "#ffffff",
      surfaceLight: "#f1f5f9",
      surfaceElevated: "#ffffff",
      border: "#e2e8f0",
      borderLight: "rgba(0, 0, 0, 0.07)",
      text: "#0f172a",
      textMuted: "#64748b",
    },
  },
  {
    name: "cyan",
    label: "Neon Cyan",
    accent: "#06b6d4",
    accentHover: "#0891b2",
    accentSoft: "rgba(6, 182, 212, 0.14)",
    accentBorder: "rgba(6, 182, 212, 0.28)",
    accentGlow: "rgba(6, 182, 212, 0.35)",
    dark: {
      bg: "#040a0d",
      surface: "#071013",
      surfaceLight: "#0f1b20",
      surfaceElevated: "#14252c",
      border: "#1e3036",
      borderLight: "rgba(255, 255, 255, 0.08)",
      text: "#f1f5f9",
      textMuted: "#94a3b8",
    },
    light: {
      bg: "#f8fafc",
      surface: "#ffffff",
      surfaceLight: "#f1f5f9",
      surfaceElevated: "#ffffff",
      border: "#e2e8f0",
      borderLight: "rgba(0, 0, 0, 0.07)",
      text: "#0f172a",
      textMuted: "#64748b",
    },
  },
  {
    name: "purple",
    label: "Electric Violet",
    accent: "#a855f7",
    accentHover: "#9333ea",
    accentSoft: "rgba(168, 85, 247, 0.14)",
    accentBorder: "rgba(168, 85, 247, 0.28)",
    accentGlow: "rgba(168, 85, 247, 0.35)",
    dark: {
      bg: "#08060d",
      surface: "#0d0912",
      surfaceLight: "#181122",
      surfaceElevated: "#211630",
      border: "#30203d",
      borderLight: "rgba(255, 255, 255, 0.08)",
      text: "#f1f5f9",
      textMuted: "#94a3b8",
    },
    light: {
      bg: "#f8fafc",
      surface: "#ffffff",
      surfaceLight: "#f1f5f9",
      surfaceElevated: "#ffffff",
      border: "#e2e8f0",
      borderLight: "rgba(0, 0, 0, 0.07)",
      text: "#0f172a",
      textMuted: "#64748b",
    },
  },
  {
    name: "green",
    label: "Emerald Mint",
    accent: "#22c55e",
    accentHover: "#16a34a",
    accentSoft: "rgba(34, 197, 94, 0.14)",
    accentBorder: "rgba(34, 197, 94, 0.28)",
    accentGlow: "rgba(34, 197, 94, 0.35)",
    dark: {
      bg: "#040a07",
      surface: "#07100b",
      surfaceLight: "#0e1c14",
      surfaceElevated: "#14261c",
      border: "#1d3526",
      borderLight: "rgba(255, 255, 255, 0.08)",
      text: "#f1f5f9",
      textMuted: "#94a3b8",
    },
    light: {
      bg: "#f8fafc",
      surface: "#ffffff",
      surfaceLight: "#f1f5f9",
      surfaceElevated: "#ffffff",
      border: "#e2e8f0",
      borderLight: "rgba(0, 0, 0, 0.07)",
      text: "#0f172a",
      textMuted: "#64748b",
    },
  },
];

const ThemeContext = createContext(null);

const getSystemMode = () => {
  if (typeof window !== "undefined" && window.matchMedia) {
    return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  }
  return "dark";
};

const getRandomPalette = () => {
  const index = Math.floor(Math.random() * themePalettes.length);
  return themePalettes[index];
};

export const ThemeProvider = ({ children }) => {
  // Random dynamic palette on each page load/refresh
  const [palette, setPalette] = useState(() => getRandomPalette());

  // Mode follows session override if set, else system default
  const [mode, setModeState] = useState(() => {
    try {
      const sessionMode = sessionStorage.getItem("smartshop_color_mode");
      if (sessionMode === "light" || sessionMode === "dark") {
        return sessionMode;
      }
    } catch {
      // ignore storage errors
    }
    return getSystemMode();
  });

  const [hasManualOverride, setHasManualOverride] = useState(() => {
    try {
      return Boolean(sessionStorage.getItem("smartshop_color_mode"));
    } catch {
      return false;
    }
  });

  // Listen to OS system theme changes if user has not set a manual session override
  useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) return;

    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const handleSystemChange = (e) => {
      if (!hasManualOverride) {
        setModeState(e.matches ? "dark" : "light");
      }
    };

    mediaQuery.addEventListener("change", handleSystemChange);
    return () => mediaQuery.removeEventListener("change", handleSystemChange);
  }, [hasManualOverride]);

  // Set mode manually (saved in sessionStorage, auto-resets when browser closes)
  const setMode = useCallback((newMode) => {
    setModeState(newMode);
    setHasManualOverride(true);
    try {
      sessionStorage.setItem("smartshop_color_mode", newMode);
    } catch (e) {
      console.error(e);
    }
  }, []);

  const toggleMode = useCallback(() => {
    setModeState((prev) => {
      const next = prev === "dark" ? "light" : "dark";
      setHasManualOverride(true);
      try {
        sessionStorage.setItem("smartshop_color_mode", next);
      } catch (e) {
        console.error(e);
      }
      return next;
    });
  }, []);

  const resetToSystem = useCallback(() => {
    setHasManualOverride(false);
    try {
      sessionStorage.removeItem("smartshop_color_mode");
    } catch (e) {
      console.error(e);
    }
    setModeState(getSystemMode());
  }, []);

  const randomizePalette = useCallback(() => {
    setPalette((current) => {
      const available = themePalettes.filter((p) => p.name !== current.name);
      const randomIndex = Math.floor(Math.random() * available.length);
      return available[randomIndex];
    });
  }, []);

  // Inject CSS variables dynamically into document root based on active palette + mode
  useEffect(() => {
    const root = document.documentElement;
    const modeTokens = mode === "light" ? palette.light : palette.dark;

    root.style.setProperty("--app-bg", modeTokens.bg);
    root.style.setProperty("--app-surface", modeTokens.surface);
    root.style.setProperty("--app-surface-light", modeTokens.surfaceLight);
    root.style.setProperty("--app-surface-elevated", modeTokens.surfaceElevated);
    root.style.setProperty("--app-border", modeTokens.border);
    root.style.setProperty("--app-border-light", modeTokens.borderLight);
    root.style.setProperty("--app-text", modeTokens.text);
    root.style.setProperty("--app-text-muted", modeTokens.textMuted);

    root.style.setProperty("--app-accent", palette.accent);
    root.style.setProperty("--app-accent-hover", palette.accentHover);
    root.style.setProperty("--app-accent-soft", palette.accentSoft);
    root.style.setProperty("--app-accent-border", palette.accentBorder);
    root.style.setProperty("--app-accent-glow", palette.accentGlow);

    root.setAttribute("data-theme", palette.name);
    root.setAttribute("data-mode", mode);

    if (mode === "dark") {
      root.classList.add("dark");
      root.classList.remove("light");
    } else {
      root.classList.add("light");
      root.classList.remove("dark");
    }
  }, [palette, mode]);

  const value = {
    palette,
    palettes: themePalettes,
    theme: palette,
    mode,
    isDark: mode === "dark",
    isLight: mode === "light",
    hasManualOverride,
    setMode,
    toggleMode,
    resetToSystem,
    randomizePalette,
    randomizeTheme: randomizePalette,
  };

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used inside ThemeProvider");
  }
  return context;
};

export default ThemeContext;
