import { FiMoon, FiSun } from "react-icons/fi";
import { useTheme } from "../context/ThemeContext";

export default function ThemeToggle({ className = "" }) {
  const { isDark, toggleTheme } = useTheme();

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={isDark ? "فعال‌کردن تم روشن" : "فعال‌کردن تم تاریک"}
      aria-pressed={!isDark}
      title={isDark ? "تم روشن" : "تم تاریک"}
      className={`theme-toggle-control inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/[0.06] text-zinc-200 transition hover:bg-white/10 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 ${className}`}
    >
      {isDark ? <FiSun size={19} aria-hidden="true" /> : <FiMoon size={19} aria-hidden="true" />}
    </button>
  );
}
