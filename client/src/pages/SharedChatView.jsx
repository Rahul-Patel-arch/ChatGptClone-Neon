// src/pages/SharedChatView.jsx
import React, { useEffect, useState } from "react";
import { useLocation, useOutletContext } from "react-router-dom";
import MarkdownMessage from "../component/MarkdownMessage";
import quantumIcon from "../assets/quantum-chat-icon.png";
import ThemeToggleButton from "../component/ThemeToggleButton";
import { Copy, Share2 } from "lucide-react";
import "./SharedChatView.css";

export default function SharedChatView() {
  const outlet = useOutletContext?.() || {};
  const layoutDark = !!outlet.darkMode;
  const layoutToggle = outlet.toggleDarkMode;
  const [localDark, setLocalDark] = useState(layoutDark);
  useEffect(() => setLocalDark(layoutDark), [layoutDark]);
  const darkMode = layoutToggle ? layoutDark : localDark;
  const location = useLocation();
  const params = new URLSearchParams(location.search);
  const data = params.get("data");

  if (!data) {
    return (
      <div style={{ padding: "20px", textAlign: "center" }}>
        <h3 style={{ color: "red" }}>Error: Invalid or missing chat data.</h3>
      </div>
    );
  }

  let chat;
  try {
    // Support both plain base64 and URL-encoded/url-safe base64
    const raw = decodeURIComponent(data);
    const base64 = raw.replace(/-/g, "+").replace(/_/g, "/");
    const pad = base64.length % 4 === 0 ? "" : "=".repeat(4 - (base64.length % 4));
    const decodedData = atob(base64 + pad);
    chat = JSON.parse(decodedData);
  } catch (e) {
    console.error("Error parsing chat data:", e);
    return (
      <div style={{ padding: "20px", textAlign: "center" }}>
        <h3 style={{ color: "red" }}>Error: Could not decode chat data.</h3>
      </div>
    );
  }

  // Ensure the 'messages' property exists and is an array
  if (!chat || !Array.isArray(chat.messages)) {
    return (
      <div style={{ padding: "20px", textAlign: "center" }}>
        <h3 style={{ color: "red" }}>Error: Invalid chat object structure.</h3>
      </div>
    );
  }

  const currentUrl = typeof window !== "undefined" ? window.location.href : "";
  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(currentUrl);
      alert("Link copied to clipboard");
    } catch (err) {
      console.debug("Clipboard copy failed", err);
    }
  };

  const systemShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({ title: chat.title || "Shared Chat", url: currentUrl });
        return;
      } catch (err) {
        console.debug("System share failed or was cancelled", err);
      }
    }
    copyLink();
  };

  return (
    <div className={`shared-view-container ${darkMode ? "dark-mode" : ""}`}>
      <div className="shared-view-header">
        <img src={quantumIcon} alt="QuantumChat Logo" style={{ width: 28, height: 28 }} />
        <h2 className="shared-view-title">{chat.title || "Shared Chat"}</h2>
        <div className="shared-actions">
          <button
            className="scv-icon-btn"
            onClick={copyLink}
            title="Copy link"
            aria-label="Copy link"
            type="button"
          >
            <Copy size={16} />
          </button>
          <button
            className="scv-icon-btn"
            onClick={systemShare}
            title="Share"
            aria-label="Share"
            type="button"
          >
            <Share2 size={16} />
          </button>
          <ThemeToggleButton
            isDarkMode={darkMode}
            onToggle={() => (layoutToggle ? layoutToggle() : setLocalDark((d) => !d))}
          />
        </div>
      </div>
      <div className="scv-content">
        <div className="scv-card">
          <div className="chat-messages-container">
            {chat.messages.length === 0 && (
              <div className="scv-empty-state">No messages to display.</div>
            )}
            {chat.messages.map((m, i) => (
              <div key={i} className={`msg-container ${m.role === "user" ? "user-container" : "bot-container"}`}>
                <div className="msg-avatar">
                  {m.role === "user" ? "U" : <img src={quantumIcon} alt="AI" width={18} height={18} />}
                </div>
                <div className="msg-content-wrapper">
                  <div className={`msg ${m.role === "user" ? "user" : "bot"}`}>
                    <div>
                      {m.role === "user" ? (
                        m.text
                      ) : (
                        <MarkdownMessage darkMode={darkMode}>{m.text}</MarkdownMessage>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
