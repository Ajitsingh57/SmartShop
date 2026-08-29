import React, {
  createContext,
  useContext,
  useEffect,
  useState,
} from "react";

// Curated color themes for application UI
const themes = [
  {
    name: "orange",
    accent: "#f97316",
    accentHover: "#ea580c",
    accentSoft: "rgba(249, 115, 22, 0.10)",
    accentBorder: "rgba(249, 115, 22, 0.20)",
    bg: "#050811",
    surface: "#09090b",
    surfaceLight: "#18181b",
    border: "#27272a",
  },
  {
    name: "blue",
    accent: "#3b82f6",
    accentHover: "#2563eb",
    accentSoft: "rgba(59, 130, 246, 0.10)",
    accentBorder: "rgba(59, 130, 246, 0.20)",
    bg: "#050912",
    surface: "#080b12",
    surfaceLight: "#111827",
    border: "#1e293b",
  },
  {
    name: "cyan",
    accent: "#06b6d4",
    accentHover: "#0891b2",
    accentSoft: "rgba(6, 182, 212, 0.10)",
    accentBorder: "rgba(6, 182, 212, 0.20)",
    bg: "#040a0d",
    surface: "#071013",
    surfaceLight: "#0f1b20",
    border: "#1e3036",
  },
  {
    name: "purple",
    accent: "#a855f7",
    accentHover: "#9333ea",
    accentSoft: "rgba(168, 85, 247, 0.10)",
    accentBorder: "rgba(168, 85, 247, 0.20)",
    bg: "#08060d",
    surface: "#0d0912",
    surfaceLight: "#1a1024",
    border: "#30203d",
  },
  {
    name: "green",
    accent: "#22c55e",
    accentHover: "#16a34a",
    accentSoft: "rgba(34, 197, 94, 0.10)",
    accentBorder: "rgba(34, 197, 94, 0.20)",
    bg: "#040a07",
    surface: "#07100b",
    surfaceLight: "#102017",
    border: "#1d3526",
  },
];

const ThemeContext = createContext(null);

const getRandomTheme = () => {
  const index = Math.floor(Math.random() * themes.length);
  return themes[index];
};

export const ThemeProvider = ({ children }) => {
  const [theme, setTheme] = useState(() => getRandomTheme());

  // Inject CSS variables for active theme into document root
  useEffect(() => {
    const root = document.documentElement;

    root.style.setProperty("--app-bg", theme.bg);
    root.style.setProperty("--app-text", "#f1f5f9");
    root.style.setProperty("--app-accent", theme.accent);
    root.style.setProperty("--app-accent-hover", theme.accentHover);
    root.style.setProperty("--app-accent-soft", theme.accentSoft);
    root.style.setProperty("--app-accent-border", theme.accentBorder);
    root.style.setProperty("--app-surface", theme.surface);
    root.style.setProperty("--app-surface-light", theme.surfaceLight);
    root.style.setProperty("--app-border", theme.border);
    root.setAttribute("data-theme", theme.name);
  }, [theme]);

  // Switch to an alternative theme palette
  const randomizeTheme = () => {
    setTheme((currentTheme) => {
      const availableThemes = themes.filter((item) => item.name !== currentTheme.name);
      const randomIndex = Math.floor(Math.random() * availableThemes.length);
      return availableThemes[randomIndex];
    });
  };

  const value = {
    theme,
    themes,
    setTheme,
    randomizeTheme,
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used inside ThemeProvider");
  }
  return context;
};

export default ThemeContext;
