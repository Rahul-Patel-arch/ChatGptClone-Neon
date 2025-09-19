import React, { useState } from "react";
import Sidebar from "../component/sidebar";
import { Outlet, useLocation } from "react-router-dom";
import { useEffect } from "react";
import SettingsPanel from "../component/SettingsPanel/SettingsPanel";
import useChats from "../hooks/useChats";
import useResponsiveSidebar from "../hooks/useResponsiveSidebar";
import useToast from "../hooks/useToast";

export default function MainLayout(props) {
  const { isMobile, sidebarCollapsed, toggleSidebar, sidebarWidth } = useResponsiveSidebar();
  // Toast notifications
  const { toast: notification, show: showNotification } = useToast();

  // settingsOpen is handled inside ChatApp; MainLayout will dispatch an event to open settings there

  const location = useLocation();
  const hideSidebarOn = ["/login", "/signup", "/register"];
  const shouldShowSidebar = !hideSidebarOn.includes(location.pathname);
  // Determine if the current route already mounts its own SettingsPanel (ChatApp, LibraryView)
  const routeMountsOwnSettings =
    location.pathname === "/" || location.pathname.startsWith("/library");

  // Centralized chat state via hook: keeps behavior but simplifies this component
  const {
    chats,
    setChats,
    activeChatId,
    setActiveChatId,
    onNewChat,
    onSelectChat,
    onArchive: onArchiveChat,
    onRestoreChat,
    onPermanentlyDeleteChat,
    onRename: onRenameChat,
    onDelete: onDeleteChat,
  } = useChats(props.currentUser?.email, { onInfo: showNotification });

  // sidebarWidth now provided by useResponsiveSidebar

  const [layoutSettingsOpen, setLayoutSettingsOpen] = useState(false);

  // Listen for global settings open events when child route doesn't mount its own panel
  useEffect(() => {
    if (routeMountsOwnSettings) return; // ChatApp/Library handle their own settings
    const handler = () => setLayoutSettingsOpen(true);
    window.addEventListener("open-settings", handler);
    return () => window.removeEventListener("open-settings", handler);
  }, [routeMountsOwnSettings]);

  // Chat operations not covered by hook

  // Share a chat from Sidebar (Recent Chats menu)
  const handleShareChat = async (chatId) => {
    try {
      const chat = chats.find((c) => c.id === chatId);
      if (!chat || !Array.isArray(chat.messages) || chat.messages.length === 0) {
        showNotification("Nothing to share for this chat");
        return;
      }
      const data = {
        title: chat.title || "QuantumChat Conversation",
        messages: chat.messages.map((m) => ({ role: m.role, text: m.text })),
      };
  const encoded = encodeURIComponent(btoa(JSON.stringify(data)));
  const { buildSharedChatUrl } = await import("../utils/urlHelpers");
  const shareUrl = buildSharedChatUrl(encoded);
      if (navigator.share) {
        try {
          await navigator.share({
            title: data.title,
            url: shareUrl,
            text: "Shared from QuantumChat",
          });
          showNotification("Shared successfully");
          return;
        } catch (err) {
          if (err?.name === "AbortError") return; // user cancelled
        }
      }
      await navigator.clipboard.writeText(shareUrl);
      showNotification("Link copied to clipboard");
    } catch (e) {
      console.error("Share failed:", e);
      showNotification("Failed to share this chat");
    }
  };
  return (
    <div
      className="app-container"
      style={{
        display: "flex",
        minHeight: "100vh",
        background: props.darkMode ? "#0E1114" : "#F5F6FA",
        transition: "background-color 0.3s ease",
        width: "100vw",
        margin: 0,
        padding: 0,
        overflow: "hidden",
        position: "relative",
      }}
    >
      {/* Background coverage layer - ensure no gaps */}
      <div
        className="sidebar-bg-cover"
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          width: "100vw",
          height: "100vh",
          background: props.darkMode ? "#0E1114" : "#F5F6FA",
          zIndex: -100,
          margin: 0,
          padding: 0,
          transition: "background-color 0.3s ease",
        }}
      />

      {shouldShowSidebar && (
        <Sidebar
          {...props}
          isCollapsed={sidebarCollapsed}
          isMobile={isMobile}
          onToggle={toggleSidebar}
          onNotify={showNotification}
          onSettings={() => window.dispatchEvent(new CustomEvent("open-settings"))}
          chats={chats}
          activeChatId={activeChatId}
          onNewChat={onNewChat}
          onSelectChat={onSelectChat}
          onArchive={onArchiveChat}
          onRename={onRenameChat}
          onDelete={onDeleteChat}
          onShare={handleShareChat}
        />
      )}

      {/* Mobile overlay when sidebar is open - only covers content area, not sidebar */}
      {shouldShowSidebar && isMobile && !sidebarCollapsed && (
        <div
          className="mobile-sidebar-overlay"
          onClick={toggleSidebar}
          style={{
            position: "fixed",
            top: 0,
            // On mobile the actual sidebar width is a fixed panel (~280px). Our responsive hook
            // returns 0 for mobile (overlay mode) so we hard-code the open width here to keep
            // the overlay from covering the sidebar itself.
            left: "280px",
            right: 0,
            bottom: 0,
            background: "rgba(0,0,0,0.35)",
            backdropFilter: "blur(2px)",
            zIndex: 1200, // BELOW header (which we will raise) but ABOVE main content
            pointerEvents: "auto",
            transition: "left .3s ease",
          }}
        />
      )}

      <div
        className={`main-content${shouldShowSidebar ? "" : " auth-page"} ${isMobile ? " mobile" : ""} ${sidebarCollapsed ? " sidebar-collapsed" : ""}`}
        style={{
          flex: 1,
          marginTop: 0,
          marginRight: 0,
          marginBottom: 0,
          marginLeft: shouldShowSidebar ? (isMobile ? 0 : `${sidebarWidth}px`) : 0,
          transition: "margin-left 0.3s ease, background-color 0.3s ease",
          width: "100%",
          position: "relative",
          "--sidebar-width": shouldShowSidebar ? (isMobile ? "0px" : `${sidebarWidth}px`) : "0px",
          display: "flex",
          flexDirection: "column",
          background: props.darkMode ? "#0E1114" : "#F5F6FA",
          minHeight: "100vh",
          willChange: "margin-left, background-color",
          padding: 0,
          borderLeft: "none" /* Remove border to fix gap */,
          // Ensure no gaps during transition (but allow scroll on certain routes)
          overflowX: "hidden",
          overflowY:
            location.pathname.startsWith("/checkout") ||
            location.pathname.startsWith("/update") ||
            location.pathname.startsWith("/upgrade")
              ? "auto"
              : "hidden",
          isolation: "isolate",
        }}
      >
        {/* Header will be handled by individual pages that need it */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
          <Outlet
            context={{
              currentUser: props.currentUser,
              onLogout: props.onLogout,
              chats,
              setChats,
              activeChatId,
              setActiveChatId,
              onNewChat,
              onSelectChat,
              onArchive: onArchiveChat,
              onRestoreChat: onRestoreChat,
              onPermanentlyDeleteChat,
              onRename: onRenameChat,
              onDelete: onDeleteChat,
              // Add sidebar controls for ChatApp
              sidebarCollapsed,
              onToggleSidebar: toggleSidebar,
              isMobile,
              // Theme controls
              darkMode: props.darkMode,
              toggleDarkMode: props.toggleDarkMode,
              themeMode: props.themeMode,
              setThemeMode: props.setThemeMode,
            }}
          />
        </div>
      </div>

      {/* Notification Toast */}
      {notification.show && (
        <div
          className="toast-notification"
          style={{
            position: "fixed",
            bottom: "20px",
            right: "20px",
            background: "var(--surface)",
            color: "var(--text)",
            padding: "12px 16px",
            borderRadius: "8px",
            border: "1px solid var(--border)",
            boxShadow: "0 4px 12px rgba(0, 0, 0, 0.15)",
            zIndex: 9999,
            fontSize: "14px",
            fontWeight: "500",
            maxWidth: "300px",
            animation: "fadeInUp 0.3s ease-out",
          }}
        >
          {notification.message}
        </div>
      )}

      {/* SettingsPanel is owned by ChatApp so it has access to chats and handlers; MainLayout opens it via a window event */}
      {/* Additionally, provide a layout-level SettingsPanel for routes without their own (e.g., /checkout, /update) */}
      {!routeMountsOwnSettings && (
        <SettingsPanel
          isOpen={layoutSettingsOpen}
          onClose={() => setLayoutSettingsOpen(false)}
          darkMode={props.darkMode}
          theme={props.themeMode || (props.darkMode ? "dark" : "light")}
          setTheme={props.setThemeMode}
          currentUser={props.currentUser}
          onSettingsChange={() => {}}
          chats={chats}
          onRestoreChat={onRestoreChat}
          onPermanentlyDeleteChat={onPermanentlyDeleteChat}
        />
      )}
    </div>
  );
}
