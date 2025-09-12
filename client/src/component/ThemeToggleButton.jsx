import React from 'react';
import { Sun, Moon } from 'lucide-react';

export default function ThemeToggleButton({ isDarkMode, onToggle }) {
  return (
    <button
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        console.log('ThemeToggleButton clicked, current mode:', isDarkMode);
        onToggle();
      }}
      className="btn rounded-3"
      style={{
        border: isDarkMode ? '1px solid #404040' : '1px solid #e8e7f3',
        color: isDarkMode ? '#ffffff' : '#2d2d2d',
        backgroundColor: 'transparent'
      }}
      type="button"
    >
      {isDarkMode ? <Sun size={18} /> : <Moon size={18} />}
    </button>
  );
}