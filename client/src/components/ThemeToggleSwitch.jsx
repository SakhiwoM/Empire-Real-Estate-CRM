import { useTheme } from "../contexts/ThemeContext";

export default function ThemeToggleSwitch({ className = "" }) {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === "dark";

  return (
    <button
      type="button"
      role="switch"
      aria-checked={isDark}
      aria-label="Toggle theme"
      onClick={toggleTheme}
      className={`inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white/90 px-2 py-1 shadow-lg backdrop-blur transition hover:-translate-y-0.5 dark:border-slate-700 dark:bg-slate-900/90 ${className}`}
    >
      <span className="text-[11px] font-semibold uppercase tracking-wide text-slate-600 dark:text-slate-300">
        {isDark ? "Dark" : "Light"}
      </span>
      <span
        className={`relative inline-flex h-6 w-11 items-center rounded-full transition ${
          isDark ? "bg-brand-600" : "bg-slate-300 dark:bg-slate-700"
        }`}
      >
        <span
          className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition ${
            isDark ? "translate-x-5" : "translate-x-0.5"
          }`}
        />
      </span>
    </button>
  );
}
