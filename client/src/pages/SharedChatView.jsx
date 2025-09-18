// src/pages/SharedChatView.jsx
import React from "react";
import { useLocation, useOutletContext } from "react-router-dom";
import MarkdownMessage from "../component/MarkdownMessage";
import quantumIcon from "../assets/quantum-chat-icon.png";

export default function SharedChatView() {
  const outlet = useOutletContext?.() || {};
  const darkMode = outlet.darkMode || false;
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
    const decodedData = atob(data);
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

  return (
    <div className={`shared-view-container ${darkMode ? "dark-mode" : ""}`}>
      <div className="shared-view-header">
        <img src={quantumIcon} alt="QuantumChat Logo" style={{ width: "32px", height: "32px" }} />
        <h2 className="shared-view-title">{chat.title || "Shared Chat"}</h2>
      </div>
      <div
        className="chat-messages-container"
        style={{ padding: "0 20px", maxWidth: "600px", margin: "auto" }}
      >
        {chat.messages.map((m, i) => (
          <div
            key={i}
            className={`msg-container ${m.role === "user" ? "user-container" : "bot-container"}`}
          >
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
  );
}
