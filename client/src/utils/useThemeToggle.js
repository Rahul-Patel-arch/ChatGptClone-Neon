import { useState, useEffect } from 'react';

/**
 * Custom React hook for theme management
 * Handles theme toggling, system preference detection, and persistence
 * 
 * @param {boolean} initialDarkMode - Initial dark mode state
 * @returns {Object} Object containing darkMode state, toggleTheme function, themePreference, and setTheme function
 */
export default function useThemeToggle(initialDarkMode = false) {
  const [darkMode, setDarkMode] = useState(initialDarkMode);
  const [themePreference, setThemePreference] = useState(() => {
    // Check if there's a stored preference
    const storedTheme = localStorage.getItem('theme');
    return storedTheme || 'system';
  });
  
  /**
   * Toggles between light and dark themes
   */
  const toggleTheme = () => {
    // Update state using the functional form to ensure we get the latest value
    setDarkMode(prevMode => {
      const newMode = !prevMode;
      
      // Store the preference
      if (themePreference === 'system') {
        // If we're in system mode and manually toggle, switch to explicit light/dark
        setThemePreference(newMode ? 'dark' : 'light');
        localStorage.setItem('theme', newMode ? 'dark' : 'light');
      }
      
      // Apply theme directly to DOM
      applyThemeToDom(newMode);
      
      return newMode;
    });
  };
  
  /**
   * Sets the theme preference (light, dark, system)
   * @param {string} preference - The theme preference ('light', 'dark', or 'system')
   */
  const setTheme = (preference) => {
    setThemePreference(preference);
    localStorage.setItem('theme', preference);
    
    if (preference === 'system') {
      // Check system preference
      const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      setDarkMode(systemPrefersDark);
      applyThemeToDom(systemPrefersDark);
    } else {
      // Apply explicit preference
      const isDark = preference === 'dark';
      setDarkMode(isDark);
      applyThemeToDom(isDark);
    }
  };
  
  /**
   * Applies the theme to the DOM
   * @param {boolean} isDark - Whether to apply dark mode
   */
  const applyThemeToDom = (isDark) => {
    const themeValue = isDark ? 'dark' : 'light';
    
    // Update document attributes
    document.documentElement.setAttribute('data-theme', themeValue);
    
    // Update classes
    document.documentElement.classList.remove('dark', 'light');
    document.documentElement.classList.add(themeValue);
    document.body.classList.remove('dark', 'light');
    document.body.classList.add(themeValue);
    
    // Apply to sidebar directly
    const sidebar = document.querySelector('.d-flex.flex-column.shadow');
    if (sidebar) {
      sidebar.style.backgroundColor = isDark ? '#4a5568' : '#B7B1F2';
    }
  };
  
  // Initialize theme based on system preference or stored preference on mount
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    
    const handleSystemThemeChange = () => {
      if (themePreference === 'system') {
        const systemDarkMode = mediaQuery.matches;
        setDarkMode(systemDarkMode);
        applyThemeToDom(systemDarkMode);
      }
    };
    
    // Apply initial theme
    if (themePreference === 'system') {
      const systemDarkMode = mediaQuery.matches;
      setDarkMode(systemDarkMode);
      applyThemeToDom(systemDarkMode);
    } else {
      const isDark = themePreference === 'dark';
      setDarkMode(isDark);
      applyThemeToDom(isDark);
    }
    
    // Listen for system preference changes
    mediaQuery.addEventListener('change', handleSystemThemeChange);
    
    // Listen for theme change events from other components
    window.addEventListener('themechange', () => {
      const storedTheme = localStorage.getItem('theme');
      if (storedTheme !== themePreference) {
        setThemePreference(storedTheme || 'system');
      }
    });
    
    // Cleanup
    return () => {
      mediaQuery.removeEventListener('change', handleSystemThemeChange);
    };
  }, [themePreference]);
  
  return { darkMode, toggleTheme, themePreference, setTheme };
}