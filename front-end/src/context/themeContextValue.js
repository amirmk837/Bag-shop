import { createContext } from "react";

export const ThemeContext = createContext(null);
const STORAGE_KEY = "bag-store-theme";
const THEMES = new Set(["dark", "light"]);

export const readStoredTheme = () => {
  try {
    const value = window.localStorage.getItem(STORAGE_KEY);
    return THEMES.has(value) ? value : "dark";
  } catch {
    return "dark";
  }
};

export const normalizeTheme = (theme) => THEMES.has(theme) ? theme : "dark";

export const applyTheme = (theme) => {
  const nextTheme = normalizeTheme(theme);
  document.documentElement.dataset.theme = nextTheme;
  document.documentElement.style.colorScheme = nextTheme;
  const themeColor = document.querySelector('meta[name="theme-color"]');
  if (themeColor) {
    themeColor.setAttribute("content", nextTheme === "dark" ? "#080c13" : "#ffffff");
  }
  return nextTheme;
};
