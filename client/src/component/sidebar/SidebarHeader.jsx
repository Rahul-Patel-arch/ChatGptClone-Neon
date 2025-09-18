import React from "react";
import { ChevronLeft, Menu } from "lucide-react";
import quantumIcon from "../../assets/quantum-chat-icon.png";

export default function SidebarHeader({
  onToggle,
  onNewChat,
  isMobile,
  shouldShowFull,
  handleNewChatClick,
}) {
  const handleLogoClick = () => {
    // Only trigger new chat when sidebar is expanded (full)
    if (!shouldShowFull) return;
    if (onNewChat) onNewChat();
    if (handleNewChatClick) handleNewChatClick();
  };

  return (
    <div className="sidebar-header">
      {shouldShowFull ? (
        <>
          <img
            src={quantumIcon}
            alt="QuantumChat Logo"
            className="sidebar-logo"
            onClick={handleLogoClick}
            style={{ cursor: "pointer" }}
          />
          <h2 className="sidebar-title">QuantumChat</h2>
          {/* Always show toggle button on mobile, desktop collapse button when not mobile */}
          {isMobile ? (
            <button onClick={onToggle} className="btn ghost ms-auto" aria-label="Close Sidebar">
              <ChevronLeft size={20} />
            </button>
          ) : (
            <button onClick={onToggle} className="btn ghost ms-auto" aria-label="Collapse Sidebar">
              <ChevronLeft size={20} />
            </button>
          )}
        </>
      ) : (
        <button
          onClick={onToggle}
          className="btn ghost expand-btn"
          title="Expand Sidebar"
          aria-label="Expand Sidebar"
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "8px",
          }}
        >
          <img
            src={quantumIcon}
            alt="QuantumChat Logo"
            style={{
              width: "24px",
              height: "24px",
              cursor: "pointer",
            }}
          />
        </button>
      )}
    </div>
  );
}
