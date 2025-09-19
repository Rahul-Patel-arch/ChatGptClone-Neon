import React from "react";
import { useNavigate } from "react-router-dom";
import { ChevronLeft, Menu } from "lucide-react";
import quantumIcon from "../../assets/quantum-chat-icon.png";

export default function SidebarHeader({
  onToggle,
  onNewChat,
  isMobile,
  shouldShowFull,
  handleNewChatClick,
  onSelectChat,
  activeChatId,
}) {
  const navigate = useNavigate();
  const handleLogoClick = () => {
    if (!shouldShowFull) return;
    // Navigate to root chat route
    navigate("/");
    // Prefer selecting current active chat if one exists; otherwise start a new chat
    if (activeChatId && onSelectChat) {
      onSelectChat(activeChatId);
    } else if (onNewChat) {
      const maybeId = onNewChat();
      if (maybeId && onSelectChat) onSelectChat(maybeId);
    }
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
