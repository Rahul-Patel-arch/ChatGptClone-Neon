/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useContext, useMemo } from "react";
import useThemeMode from "../hooks/useThemeMode";

const ThemeContext = createContext(null);

export function ThemeProvider({ children }) {
  const value = useThemeMode();
  const memo = useMemo(() => value, [value]);
  return <ThemeContext.Provider value={memo}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    throw new Error("useTheme must be used within ThemeProvider");
  }
  return ctx;
}
