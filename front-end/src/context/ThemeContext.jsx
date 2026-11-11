import { createContext, useContext, useEffect, useMemo, useState } from "react";

const ThemeContext = createContext(null);
const STORAGE_KEY = "bag-store-theme";
const THEMES = new Set(["dark", "light"]);

const readStoredTheme = () => {
  try {
    const value = window.localStorage.getItem(STORAGE_KEY);
    return THEMES.has(value) ? value : "dark";
  } catch {
    return "dark";
  }
};

export const applyTheme = (theme) => {
  const nextTheme = THEMES.has(theme) ? theme : "dark";
  document.documentElement.dataset.theme = nextTheme;
  document.documentElement.style.colorScheme = nextTheme;
  return nextTheme;
};

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(readStoredTheme);

  useEffect(() => {
    applyTheme(theme);
    try {
      window.localStorage.setItem(STORAGE_KEY, theme);
    } catch {
      // Theme still works for the current session when storage is unavailable.
    }
  }, [theme]);

  const value = useMemo(
    () => ({
      theme,
      isDark: theme === "dark",
      toggleTheme: () => setTheme((current) => current === "dark" ? "light" : "dark"),
      setTheme: (next) => setTheme(THEMES.has(next) ? next : "dark"),
    }),
    [theme],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const value = useContext(ThemeContext);
  if (!value) throw new Error("useTheme must be used inside ThemeProvider");
  return value;
}
