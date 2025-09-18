import React from "react";
import { Sun, Moon } from "lucide-react";

export default function ThemeToggleButton({ isDarkMode, onToggle }) {
  return (
    <button
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        if (onToggle) onToggle();
      }}
      className="scv-icon-btn"
      aria-label={isDarkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
      type="button"
      title={isDarkMode ? "Light mode" : "Dark mode"}
    >
      {isDarkMode ? <Sun size={16} /> : <Moon size={16} />}
    </button>
  );
}
