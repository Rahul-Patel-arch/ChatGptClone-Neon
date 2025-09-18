import React, { useState, useEffect } from "react";
import SidebarHeader from "./sidebar/SidebarHeader";
import SidebarActions from "./sidebar/SidebarActions";
import SidebarNav from "./sidebar/SidebarNav";
import ChatList from "./sidebar/ChatList";
import UserProfile from "./sidebar/UserProfile";
import SearchModal from "./SearchModal";
import "../styles/sidebar-enhanced.css";

export default function Sidebar({
  darkMode,
  chats = [],
  onNewChat,
  onLogout,
  isCollapsed,
  onToggle,
  onNotify,
  currentUser,
  onSelectChat,
  activeChatId,
  onSettings,
  isMobile,
  onArchive,
  onRename,
  onDelete,
  onShare,
}) {
  const [showSearchModal, setShowSearchModal] = useState(false);
  const shouldShowFull = !isCollapsed;
  const activeChats = chats.filter((c) => !c.archived);

  // Debug logging
  useEffect(() => {
    console.log("🔄 Sidebar received chats:", chats.length, "total chats");
    console.log("🎯 Active chats (non-archived):", activeChats.length);
    console.log("📝 Chats data:", chats);
  }, [chats, activeChats]);

  // Handle mobile overlay click to close sidebar
  const handleOverlayClick = () => {
    if (isMobile && !isCollapsed) {
      onToggle();
    }
  };

  return (
    <>
      {/* Mobile overlay */}
      {isMobile && !isCollapsed && (
        <div
          className="sidebar-overlay"
          onClick={handleOverlayClick}
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: "rgba(0, 0, 0, 0.3)",
            zIndex: 999,
            backdropFilter: "blur(2px)",
          }}
        />
      )}

      <div
        className={`sidebar ${isMobile ? "mobile" : ""} ${isCollapsed ? "collapsed" : ""}`}
        style={{
          width: isMobile
            ? isCollapsed
              ? "0px"
              : "280px"
            : shouldShowFull
              ? "var(--sidebar-width)"
              : "60px",
          left: 0,
          transform: isMobile
            ? isCollapsed
              ? "translateX(-100%)"
              : "translateX(0)"
            : "translateX(0)",
        }}
        data-theme={darkMode ? "dark" : "light"}
      >
        <SidebarHeader
          isCollapsed={isCollapsed}
          onToggle={onToggle}
          isMobile={isMobile}
          onNewChat={onNewChat}
          shouldShowFull={shouldShowFull}
        />
        <div className="sidebar-content">
          <SidebarActions
            isCollapsed={isCollapsed}
            onNewChat={onNewChat}
            onSearchClick={() => setShowSearchModal(true)}
            shouldShowFull={shouldShowFull}
            onToggle={onToggle}
            onNotify={onNotify}
          />

          <SidebarNav
            isCollapsed={isCollapsed}
            shouldShowFull={shouldShowFull}
            onSearchClick={() => setShowSearchModal(true)}
          />
          <ChatList
            chats={activeChats}
            activeChatId={activeChatId}
            onSelectChat={onSelectChat}
            isCollapsed={isCollapsed}
            shouldShowFull={shouldShowFull}
            onArchive={onArchive}
            onRename={onRename}
            onDelete={onDelete}
            onShare={onShare}
          />
        </div>
        <UserProfile
          currentUser={currentUser}
          isCollapsed={isCollapsed}
          shouldShowFull={shouldShowFull}
          onLogout={onLogout}
          onSettings={onSettings}
        />
      </div>
      <SearchModal
        show={showSearchModal}
        onClose={() => setShowSearchModal(false)}
        chats={chats}
        onSelectChat={onSelectChat}
        darkMode={darkMode}
      />
    </>
  );
}
