import React from 'react';
import { Sun, Moon } from 'lucide-react';

export default function ThemeToggleButton({ isDarkMode, onToggle }) {
  return (
    <button
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        onToggle();
      }}
      className="btn ghost"
      style={{
        minWidth: '40px',
        height: '40px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}
      aria-label={isDarkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
      type="button"
    >
      {isDarkMode ? <Sun size={18} /> : <Moon size={18} />}
    </button>
  );
}