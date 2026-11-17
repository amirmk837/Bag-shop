import { useEffect, useMemo, useState } from "react";
import {
  applyTheme,
  normalizeTheme,
  readStoredTheme,
  ThemeContext,
} from "./themeContextValue";

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(readStoredTheme);

  useEffect(() => {
    applyTheme(theme);
    try {
      window.localStorage.setItem("bag-store-theme", theme);
    } catch {
      // Theme still works for the current session when storage is unavailable.
    }
  }, [theme]);

  const value = useMemo(
    () => ({
      theme,
      isDark: theme === "dark",
      toggleTheme: () => setTheme((current) => current === "dark" ? "light" : "dark"),
      setTheme: (next) => setTheme(normalizeTheme(next)),
    }),
    [theme],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}
