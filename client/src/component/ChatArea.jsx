import React from "react";
import {
  Send,
  Sun,
  Moon,
  Volume2,
  Copy,
  Share2,
  Plus,
  Mic,
  FileText,
  X,
  ChevronDown,
} from "lucide-react";
import MarkdownMessage from "./MarkdownMessage";
import { fileToGeminiPart } from "../services/geminiService";
import FileUploader from "./FileUploader";
import "../styles/chat-input-fixes.css"; // Emergency fixes

export default function ChatArea({
  darkMode,
  sidebarCollapsed,
  isMobile: isMobileProp,
  messages,
  message,
  setMessage,
  onSendMessage,
  onStopStreaming,
  // currentUser, // Available but unused
  isLoading = false,
  // onOpenSettings, // Available but unused
  onShareMessage, // now used
  // onGlobalShare, // Available but unused
  activeChat,
  // activeChatId, // Available but unused
}) {
  // Debug logging in development only
  React.useEffect(() => {
    /* eslint-disable no-undef */
    if (typeof process !== "undefined" && process.env?.NODE_ENV === "development") {
      console.log("ChatArea state:", { message, isLoading });
    }
    /* eslint-enable no-undef */
    console.log("Send button should be visible:", true);
  }, [message, isLoading]);

  const [internalIsMobile, setInternalIsMobile] = React.useState(window.innerWidth < 768);
  const isMobile = isMobileProp !== undefined ? isMobileProp : internalIsMobile;
  const [showToast, setShowToast] = React.useState(false);
  const [toastMessage, setToastMessage] = React.useState("");

  const messagesEndRef = React.useRef(null);
  const chatContentRef = React.useRef(null);
  const [showScrollToBottom, setShowScrollToBottom] = React.useState(false);
  const [hasNewWhileAway, setHasNewWhileAway] = React.useState(false);
  const fileInputRef = React.useRef(null);
  const recognitionRef = React.useRef(null);

  // Helper: check if near bottom (within threshold)
  const isNearBottom = React.useCallback(() => {
    const el = chatContentRef.current;
    if (!el) return true;
    const threshold = 80; // px
    const distanceFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
    return distanceFromBottom <= threshold;
  }, []);

  // Scroll to bottom function
  const scrollToBottom = React.useCallback((behavior = "smooth") => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior });
    }
  }, []);

  // Manage button visibility and new-message indicator
  React.useEffect(() => {
    const el = chatContentRef.current;
    if (!el) return;
    const onScroll = () => {
      const atBottom = isNearBottom();
      setShowScrollToBottom(!atBottom);
      if (atBottom) setHasNewWhileAway(false);
    };
    el.addEventListener("scroll", onScroll, { passive: true });
    // Initialize state
    onScroll();
    return () => el.removeEventListener("scroll", onScroll);
  }, [isNearBottom]);

  // Auto-scroll on new messages only if user is near bottom; otherwise show indicator
  React.useEffect(() => {
    if (isNearBottom()) {
      scrollToBottom("smooth");
    } else {
      setHasNewWhileAway(true);
    }
  }, [messages, isLoading, isNearBottom, scrollToBottom]);

  // Window resize
  React.useEffect(() => {
    const handleResize = () => setInternalIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Notification
  const showNotification = (msg) => {
    setToastMessage(msg);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 2000);
  };

  // Text-to-speech
  const speakText = (text) => {
    if (!text || typeof text !== "string") return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "en-US";
    utterance.rate = 0.9;
    utterance.pitch = 1;
    window.speechSynthesis.speak(utterance);
    showNotification("🔊 Reading message aloud");
  };

  // Copy message
  const copyMessage = async (text) => {
    if (!text) return;
    try {
      await navigator.clipboard.writeText(text);
      showNotification("📋 Message copied to clipboard");
    } catch {
      showNotification("📋 Copy failed");
    }
  };

  // Send message
  const handleSendMessage = async () => {
    // Forward message to parent handler which owns the send flow.
    if (!message || !message.trim() || isLoading) return;

    const messageToSend = message.trim();
    if (!messageToSend) return;

    try {
      await onSendMessage({ text: messageToSend, attachment: pendingAttachment?.part });
      setPendingAttachment(null);
    } catch (err) {
      console.error("Send handler error", err);
      showNotification("⚠️ Could not send message");
    }
  };

  // File upload
  const handleAttachClick = () => {
    if (uploaderApiRef.current?.open) uploaderApiRef.current.open();
  };
  const [pendingAttachment, setPendingAttachment] = React.useState(null);
  const uploaderApiRef = React.useRef({ open: null });

  // Speech recognition
  const [isRecording, setIsRecording] = React.useState(false);
  const startSpeechRecognition = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      showNotification("Speech recognition not supported.");
      return;
    }
    try {
      const recog = new SpeechRecognition();
      recog.lang = "en-US";
      recog.interimResults = true;
      recog.continuous = false;
      recog.onresult = (event) => {
        const transcript = Array.from(event.results)
          .map((r) => r[0].transcript)
          .join("");
        setMessage((prev) => (prev ? prev + " " : "") + transcript);
      };
      recog.onend = () => setIsRecording(false);
      recog.onerror = () => {
        showNotification("Speech recognition error");
        setIsRecording(false);
      };
      recognitionRef.current = recog;
      recog.start();
      setIsRecording(true);
      showNotification("🎤 Listening...");
    } catch (e) {
      console.error(e);
      showNotification("Could not start speech recognition.");
    }
  };
  const stopSpeechRecognition = () => {
    if (recognitionRef.current) recognitionRef.current.stop();
    setIsRecording(false);
  };

  const handleStop = () => {
    if (onStopStreaming) onStopStreaming();
  };

  return (
    <div
      className={`chat-area ${sidebarCollapsed ? "sidebar-collapsed" : ""} ${messages?.length > 0 ? "has-messages" : ""} ${isMobile ? "mobile" : ""} ${darkMode ? "dark-mode" : "light-mode"}`}
    >
      {/* Messages */}
      <div className="chat-content" ref={chatContentRef}>
        <div className="chat-messages-container">
          {messages.length === 0 ? (
            <div className="empty-chat-state">
              <h3>{activeChat ? activeChat.title : "QuantumChat"}</h3>
              <p>How can I help you today?</p>
            </div>
          ) : (
            <>
              {messages.map((msg, i) => (
                <div
                  key={i}
                  className={`msg-container ${
                    msg.role === "user" ? "user-container" : "bot-container"
                  }`}
                >
                  <div className={`msg ${msg.role === "user" ? "user" : "bot"}`}>
                    {msg.role === "user" ? (
                      msg.text
                    ) : // If this AI message is streaming, show a typing indicator instead of partial text
                    msg.isStreaming ? (
                      <div className="typing-placeholder" aria-live="polite">
                        <div className="typing-indicator" aria-hidden>
                          <span></span>
                          <span></span>
                          <span></span>
                        </div>
                        <span className="typing-cursor"> typing...</span>
                      </div>
                    ) : (
                      <MarkdownMessage darkMode={darkMode}>{msg.text}</MarkdownMessage>
                    )}
                    {msg.role === "ai" && msg.text && !msg.isStreaming && (
                      <div className="msg-actions">
                        <button
                          onClick={() => speakText(msg.text)}
                          className="msg-action-btn"
                          title="Read aloud"
                        >
                          <Volume2 size={14} />
                        </button>
                        <button
                          onClick={() => copyMessage(msg.text)}
                          className={`msg-action-btn ${/```/.test(msg.text) ? "small" : ""}`}
                          title="Copy message"
                        >
                          <Copy size={14} />
                        </button>
                        <button
                          onClick={() =>
                            onShareMessage ? onShareMessage(msg) : showNotification("Shared!")
                          }
                          className="msg-action-btn"
                          title="Share message"
                        >
                          <Share2 size={14} />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} className="messages-end-spacer" />
            </>
          )}
        </div>
      </div>

      {/* Floating Scroll-to-bottom Button */}
      {showScrollToBottom && (
        <button
          className={`scroll-to-bottom-btn ${darkMode ? "dark" : "light"} ${hasNewWhileAway ? "pulse" : ""}`}
          onClick={() => {
            scrollToBottom("smooth");
            setHasNewWhileAway(false);
          }}
          aria-label="Scroll to latest message"
          title="Jump to latest"
        >
          <ChevronDown size={18} />
          {hasNewWhileAway && <span className="dot" aria-hidden></span>}
        </button>
      )}

      {/* Input */}
      <div className="chat-input-container">
        <div className="chat-input-wrapper">
          <div className="chat-input-pill">
            {/* File uploader (hidden input via render-prop) */}
            <FileUploader
              onSelect={({ part, file, label }) => {
                setPendingAttachment({ name: label, part });
                setMessage((prev) => (prev ? prev + " " : "") + `[attached: ${label}] `);
                showNotification(`Attached: ${label}`);
              }}
              onError={(msg) => showNotification(msg)}
            >
              {({ open }) => {
                uploaderApiRef.current.open = open;
                return null;
              }}
            </FileUploader>

            {/* Attach button */}
            <button
              className="pill-action attach-btn"
              onClick={handleAttachClick}
              title="Attach file"
              aria-label="Attach file"
            >
              <Plus size={18} />
            </button>

            {/* Text input */}
            <input
              className="pill-input"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={(e) => {
                // Handle Enter key with proper event handling
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault(); // Prevent form submission or other default behavior
                  if (!isLoading && message && message.trim()) {
                    handleSendMessage();
                  }
                }
              }}
              placeholder="Message QuantumChat..."
              disabled={isLoading}
              aria-label="Message input"
            />

            {/* Right-side actions */}
            <div
              className="pill-actions-right"
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                flexShrink: 0,
                minWidth: "100px",
              }}
            >
              {/* Mic */}
              <button
                className={`pill-action mic-btn ${isRecording ? "recording" : ""}`}
                onClick={() => (isRecording ? stopSpeechRecognition() : startSpeechRecognition())}
                aria-label="Voice input"
                title="Voice input"
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  width: "44px",
                  height: "44px",
                  borderRadius: "10px",
                  border: "none",
                  background: "transparent",
                  color: "var(--muted-text)",
                  cursor: "pointer",
                  flexShrink: 0,
                }}
              >
                <Mic size={18} />
              </button>

              {/* Send Button - ALWAYS VISIBLE */}
              {isLoading ? (
                <button
                  onClick={handleStop}
                  className="pill-action send-btn always-visible-send-btn"
                  aria-label="Stop generating"
                  title="Stop generating"
                  style={{
                    background: "#c0392b",
                    color: "#ffffff",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    width: "36px",
                    height: "36px",
                    minWidth: "36px",
                    minHeight: "36px",
                    borderRadius: "10px",
                    border: "none",
                    cursor: "pointer",
                    flexShrink: 0,
                    position: "relative",
                    zIndex: 10,
                    visibility: "visible",
                    opacity: 1,
                    boxShadow: "0 2px 8px rgba(192, 57, 43, 0.35)",
                  }}
                >
                  <X size={18} style={{ color: "inherit" }} />
                </button>
              ) : (
                <button
                  onClick={handleSendMessage}
                  disabled={!message.trim()}
                  className="pill-action send-btn always-visible-send-btn"
                  aria-label="Send message"
                  title="Send message"
                  style={{
                    background: !message.trim() ? "#cccccc" : "#4A6FA5",
                    color: !message.trim() ? "#666666" : "#ffffff",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    width: "36px",
                    height: "36px",
                    minWidth: "36px",
                    minHeight: "36px",
                    borderRadius: "10px",
                    border: "none",
                    cursor: !message.trim() ? "not-allowed" : "pointer",
                    flexShrink: 0,
                    position: "relative",
                    zIndex: 10,
                    visibility: "visible",
                    opacity: 1,
                    boxShadow: !message.trim() ? "none" : "0 2px 8px rgba(74, 111, 165, 0.3)",
                  }}
                >
                  <Send size={18} style={{ color: "inherit" }} />
                </button>
              )}
            </div>
          </div>

          {/* Safety note */}
          <div className="pill-note" aria-hidden>
            <small className="text-muted">
              QuantumChat can make mistakes. Consider checking important information.
            </small>
          </div>
        </div>
      </div>

      {showToast && <div className="toast-notification">{toastMessage}</div>}
      {/* (Popover-only) share UI — modal removed to keep compact dropdown only */}
    </div>
  );
}
