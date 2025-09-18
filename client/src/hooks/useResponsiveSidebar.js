import { useEffect, useState } from "react";

/**
 * useResponsiveSidebar
 * Encapsulates responsive flags and collapse behavior.
 */
export default function useResponsiveSidebar() {
  const [isMobile, setIsMobile] = useState(() => window.innerWidth <= 768);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => window.innerWidth <= 768);

  useEffect(() => {
    const handleResize = () => {
      const newIsMobile = window.innerWidth <= 768;
      setIsMobile((wasMobile) => {
        // manage sidebar only when moving across breakpoints
        if (!wasMobile && newIsMobile) {
          setSidebarCollapsed(true);
        } else if (wasMobile && !newIsMobile && window.innerWidth > 1024) {
          setSidebarCollapsed(false);
        }
        return newIsMobile;
      });
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const toggleSidebar = () => setSidebarCollapsed((prev) => !prev);

  const getSidebarWidth = () => {
    if (isMobile) return 0; // overlay
    if (window.innerWidth <= 768) return sidebarCollapsed ? 60 : 240; // phone
    if (window.innerWidth <= 1024) return sidebarCollapsed ? 60 : 260; // tablet
    return sidebarCollapsed ? 60 : 280; // desktop
  };

  return { isMobile, sidebarCollapsed, toggleSidebar, sidebarWidth: getSidebarWidth() };
}
