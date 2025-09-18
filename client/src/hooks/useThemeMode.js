import { useEffect, useState } from "react";

/**
 * useThemeMode
 * Centralizes theme selection and application for the app.
 * - themeMode: 'light' | 'dark' | 'system' (persisted)
 * - effectiveDark: boolean derived from themeMode and OS preference
 * - setThemeMode: set explicit mode
 * - toggleDarkMode: convenience toggle (light<->dark)
 */
export default function useThemeMode() {
  // Explicit selection persisted for clarity
  const [themeMode, setThemeModeState] = useState(() => {
    try {
      const saved = localStorage.getItem("quantumchat_theme_mode");
      if (saved === "light" || saved === "dark" || saved === "system") return saved;
      // Migrate from legacy boolean if present
      const legacy = localStorage.getItem("quantumchat_theme");
      if (legacy != null) {
        const val = JSON.parse(legacy);
        return val ? "dark" : "light";
      }
    } catch {
      /* ignore */
    }
    return "light";
  });

  // Track OS preference for system mode
  const [systemPrefersDark, setSystemPrefersDark] = useState(() => {
    try {
      return window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches;
    } catch {
      return false;
    }
  });

  const effectiveDark = themeMode === "dark" || (themeMode === "system" && systemPrefersDark);

  // Apply theme to DOM (html/body classes + backgrounds) whenever it changes
  useEffect(() => {
    const html = document.documentElement;
    const body = document.body;
    if (effectiveDark) {
      html.classList.add("dark");
      body.classList.add("dark");
      html.style.background = "#0E1114";
      body.style.background = "#0E1114";
    } else {
      html.classList.remove("dark");
      body.classList.remove("dark");
      html.style.background = "#F5F6FA";
      body.style.background = "#F5F6FA";
    }
  }, [effectiveDark]);

  // Live-update for system mode
  useEffect(() => {
    const mql = window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)");
    if (!mql) return;
    const handler = (e) => setSystemPrefersDark(e.matches);
    if (mql.addEventListener) mql.addEventListener("change", handler);
    else if (mql.addListener) mql.addListener(handler);
    return () => {
      if (mql.removeEventListener) mql.removeEventListener("change", handler);
      else if (mql.removeListener) mql.removeListener(handler);
    };
  }, []);

  const setThemeMode = (mode) => {
    const normalized = mode === "dark" || mode === "light" || mode === "system" ? mode : "light";
    setThemeModeState(normalized);
    try {
      localStorage.setItem("quantumchat_theme_mode", normalized);
      // Sync legacy boolean for older code paths
      const legacyBool = normalized === "dark" || (normalized === "system" && systemPrefersDark);
      localStorage.setItem("quantumchat_theme", JSON.stringify(legacyBool));
    } catch (e) {
      console.warn("Failed to save theme mode preference:", e);
    }
  };

  const toggleDarkMode = () => {
    setThemeMode(themeMode === "dark" ? "light" : "dark");
  };

  return { themeMode, setThemeMode, effectiveDark, toggleDarkMode };
}
