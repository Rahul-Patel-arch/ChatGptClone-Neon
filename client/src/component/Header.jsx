import React from "react";
import { Sun, Moon, X } from "lucide-react";
import quantumIcon from "../assets/quantum-chat-icon.png";

export default function Header({
  darkMode,
  toggleDarkMode,
  onToggleSidebar,
  isMobile,
  sidebarCollapsed,
  activeChat,
  messages = [],
  onShareClick,
  showShareModal,
  setShowShareModal,
  shareBtnRef,
  sharePopoverRef,
  handleShare,
  showExportMenu = true,
  proMode = false,
  onUpgradeClick,
}) {
  // Calculate z-index based on mobile state and sidebar state
  const headerZIndex = isMobile && !sidebarCollapsed ? 500 : 1100;

  return (
    <div
      className="chat-header"
      style={{
        padding: "12px 16px",
        borderBottom: "1px solid var(--border)",
        background: "var(--surface)",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        minHeight: "60px",
        position: "sticky",
        top: 0,
        zIndex: headerZIndex,
      }}
    >
      {proMode && (
        <div
          aria-hidden
          style={{
            position: "absolute",
            left: "50%",
            top: "50%",
            transform: "translate(-50%, -50%)",
            pointerEvents: "none",
            zIndex: headerZIndex + 1,
            display: "flex",
            alignItems: "center",
            gap: 6,
          }}
        >
          <span
            style={{
              padding: "2px 10px",
              borderRadius: 999,
              fontSize: 11,
              fontWeight: 700,
              letterSpacing: 0.6,
              background: "linear-gradient(135deg,#f59e0b,#f97316)",
              color: "#fff",
              border: "1px solid rgba(255,255,255,0.18)",
              boxShadow: "0 1px 2px rgba(0,0,0,0.15) inset, 0 1px 2px rgba(0,0,0,0.2)",
            }}
          >
            PRO
          </span>
        </div>
      )}
      <div style={{ display: "flex", alignItems: "center", gap: "12px", flex: 1, minWidth: 0 }}>
        {/* Mobile toggle button - always visible on mobile, positioned at start */}
        {isMobile && (
          <button
            className="btn ghost me-2 mobile-logo-btn"
            onClick={onToggleSidebar}
            aria-label="Toggle Sidebar"
            style={{
              padding: "6px",
              borderRadius: "8px",
              display: "flex",
              alignItems: "center",
              background: "transparent",
              border: "none",
              position: "relative",
              zIndex: 1100, // Ensure logo is always above sidebar for interaction
              flexShrink: 0, // Prevent logo from shrinking
            }}
          >
            <img
              src={quantumIcon}
              alt="QuantumChat"
              style={{
                width: "28px",
                height: "28px",
                borderRadius: "6px",
              }}
            />
          </button>
        )}

        {/* Active Chat Title - Left side for better UX, or default title when no active chat */}
        <div
          className="chat-header-title"
          style={{ flexGrow: 1, minWidth: 0, display: "flex", alignItems: "center", gap: 8 }}
        >
          <h6
            style={{
              margin: 0,
              fontSize: "16px",
              fontWeight: "500",
              color: "var(--text)",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
              maxWidth: isMobile ? "180px" : "300px",
            }}
          >
            {activeChat ? activeChat.title : ""}
          </h6>
          {/* PRO badge moved to centered overlay */}
        </div>
      </div>

      {/* Spacer to push action buttons to the right */}
      <div style={{ flex: 1 }}></div>

      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
        {!proMode && (
          <button
            className="btn ghost"
            onClick={onUpgradeClick}
            title="Upgrade to Pro"
            aria-label="Upgrade to Pro"
            style={{ display: "flex", alignItems: "center", gap: 6 }}
          >
            {/* crown icon */}
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M3 7l4 4 5-6 5 6 4-4v10H3V7z"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            <span style={{ fontSize: 12, fontWeight: 600 }}>Upgrade</span>
          </button>
        )}
        {/* Export/Share button - only show when there are messages and showExportMenu is true */}
        {showExportMenu &&
          (messages.length > 0 ||
            (activeChat &&
              Array.isArray(activeChat.messages) &&
              activeChat.messages.length > 0)) && (
            <button
              ref={shareBtnRef}
              className="btn ghost"
              onClick={() => setShowShareModal((s) => !s)}
              aria-label="Open export menu"
              title="Export & Share"
              aria-haspopup="menu"
              aria-expanded={showShareModal}
            >
              {/* Better export icon option - Download/Export style */}
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                aria-hidden="true"
              >
                <path
                  d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <polyline
                  points="7,10 12,15 17,10"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <line
                  x1="12"
                  y1="15"
                  x2="12"
                  y2="3"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
              </svg>
            </button>
          )}

        {/* Theme Toggle Button */}
        <button
          className="btn ghost"
          onClick={toggleDarkMode}
          aria-label={darkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
          title={darkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
          style={{
            minWidth: "40px",
            height: "40px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {darkMode ? <Sun size={18} /> : <Moon size={18} />}
        </button>
      </div>

      {/* Share Modal - only render if showExportMenu is true */}
      {showExportMenu && showShareModal && (
        <div ref={sharePopoverRef} className="share-popover" role="menu" aria-label="Share menu">
          <button
            className="share-popover-close"
            onClick={() => setShowShareModal(false)}
            aria-label="Close share menu"
          >
            <X size={16} />
          </button>
          <button
            className="share-popover-item"
            onClick={async () => {
              await handleShare();
              setShowShareModal(false);
            }}
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <circle cx="18" cy="5" r="3" stroke="currentColor" strokeWidth="2" />
              <circle cx="6" cy="12" r="3" stroke="currentColor" strokeWidth="2" />
              <circle cx="18" cy="19" r="3" stroke="currentColor" strokeWidth="2" />
              <line
                x1="8.59"
                y1="13.51"
                x2="15.42"
                y2="17.49"
                stroke="currentColor"
                strokeWidth="2"
              />
              <line
                x1="15.41"
                y1="6.51"
                x2="8.59"
                y2="10.49"
                stroke="currentColor"
                strokeWidth="2"
              />
            </svg>
            Share Conversation
          </button>
          <button
            className="share-popover-item"
            onClick={() => {
              if (onShareClick) onShareClick();
              setShowShareModal(false);
            }}
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"
                stroke="currentColor"
                strokeWidth="2"
              />
              <polyline points="14,2 14,8 20,8" stroke="currentColor" strokeWidth="2" />
              <line x1="16" y1="13" x2="8" y2="13" stroke="currentColor" strokeWidth="2" />
              <line x1="16" y1="17" x2="8" y2="17" stroke="currentColor" strokeWidth="2" />
              <polyline points="10,9 9,9 8,9" stroke="currentColor" strokeWidth="2" />
            </svg>
            Export as PDF
          </button>
        </div>
      )}
    </div>
  );
}
