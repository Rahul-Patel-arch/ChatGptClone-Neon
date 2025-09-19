import React from "react";
import {
  Send,
  Sun,
  Moon,
  Volume2,
  VolumeX,
  Copy,
  Share2,
  Plus,
  Mic,
  FileText,
  X,
  ChevronDown,
} from "lucide-react";
import MarkdownMessage from "./MarkdownMessage";
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
  rateLimited = false,
  rateLimitSeconds = 0,
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
  // const fileInputRef = React.useRef(null); // removed (unused)
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

  // Text-to-speech with reliable toggle (single active)
  const [speakingIndex, setSpeakingIndex] = React.useState(null); // index of currently spoken message
  const utteranceRef = React.useRef(null);
  const speakStartTimeoutRef = React.useRef(null); // guards delayed start after cancel
  const availableVoicesRef = React.useRef([]);

  // Load / refresh voices (some browsers async load voices list)
  React.useEffect(() => {
    if (typeof window === 'undefined' || !window.speechSynthesis) return;
    const loadVoices = () => {
      const v = window.speechSynthesis.getVoices();
      if (v && v.length) {
        availableVoicesRef.current = v;
      }
    };
    loadVoices();
    window.speechSynthesis.addEventListener?.('voiceschanged', loadVoices);
    return () => {
      window.speechSynthesis.removeEventListener?.('voiceschanged', loadVoices);
    };
  }, []);

  const forceCancel = () => {
    // Multi-cancel still used for explicit STOP only
    for (let i = 0; i < 3; i++) {
      setTimeout(() => {
        try { window.speechSynthesis?.cancel(); } catch { /* ignore */ }
      }, i * 40);
    }
  };

  const stopSpeaking = React.useCallback(() => {
    if (speakStartTimeoutRef.current) {
      clearTimeout(speakStartTimeoutRef.current);
      speakStartTimeoutRef.current = null;
    }
    forceCancel();
    utteranceRef.current = null;
    setSpeakingIndex(null);
  }, []);

  React.useEffect(() => {
    return () => {
      // Cleanup on unmount
      stopSpeaking();
    };
  }, [stopSpeaking]);

  const toggleSpeakMessage = (idx, rawText) => {
    // Disallow TTS while message is still streaming
    const msg = messages[idx];
    if (msg?.isStreaming) {
      showNotification('Wait for the message to finish before reading');
      return;
    }
    // If already speaking this message -> stop
    if (speakingIndex === idx) {
      stopSpeaking();
      return;
    }
    if (!rawText || typeof rawText !== 'string') return;
    if (typeof window === 'undefined' || !window.speechSynthesis) {
      showNotification('Speech synthesis not supported in this browser');
      return;
    }
    // (Re)load voices synchronously if empty
    if (!availableVoicesRef.current.length) {
      const current = window.speechSynthesis.getVoices();
      if (current && current.length) availableVoicesRef.current = current;
    }
    // Basic markdown/code cleanup for more natural speech
    let text = rawText
      .replace(/```[\s\S]*?```/g, (block) => block.replace(/```/g, '')) // strip code fences
      .replace(/`([^`]+)`/g, '$1')
      .replace(/\*\*([^*]+)\*\*/g, '$1')
      .replace(/\*([^*]+)\*/g, '$1')
      .replace(/__([^_]+)__/g, '$1')
      .replace(/_([^_]+)_/g, '$1')
      .replace(/#+\s*/g, '')
  .replace(/[>*-]+/g, ' ')
      .replace(/\s+/g, ' ') // collapse whitespace
      .trim();

    // Choose a preferred English voice if available (skip each run re-pick for performance)
    const pickVoice = () => {
      const voices = availableVoicesRef.current || [];
      if (!voices.length) return null;
      // Preference order: Google en-US, Microsoft en-US, generic en-*
      const pref = voices.find(v => /Google/i.test(v.name) && /en-US/i.test(v.lang))
        || voices.find(v => /Microsoft/i.test(v.name) && /en-US/i.test(v.lang))
        || voices.find(v => /en-US/i.test(v.lang))
        || voices.find(v => /^en-/i.test(v.lang));
      return pref || voices[0];
    };

    const startSpeech = () => {
      try {
        // Long response chunking: speak in ~4000 char slices (API limit is higher but some engines stall)
        const MAX_CHARS = 4000;
        const segments = [];
        if (text.length > MAX_CHARS) {
          let start = 0;
          while (start < text.length) {
            segments.push(text.slice(start, start + MAX_CHARS));
            start += MAX_CHARS;
          }
        } else {
          segments.push(text);
        }
        let segmentIndex = 0;
        const playNext = () => {
          if (segmentIndex >= segments.length) {
            setSpeakingIndex((current) => (current === idx ? null : current));
            return;
          }
          const partText = segments[segmentIndex++];
          const utt = new SpeechSynthesisUtterance(partText);
          const voice = pickVoice();
          if (voice) utt.voice = voice;
          utt.lang = voice?.lang || 'en-US';
          utt.rate = 0.95; // slightly slower for clarity
          utt.pitch = 1;
          utt.onend = () => {
            if (speakingIndex === idx) {
              playNext();
            }
          };
          utt.onerror = () => {
            setSpeakingIndex((current) => (current === idx ? null : current));
            showNotification('⚠️ Speech error');
          };
          utteranceRef.current = utt;
          window.speechSynthesis.speak(utt);
        };
        setSpeakingIndex(idx);
        playNext();
      } catch (e) {
        console.error('Speech synthesis failed', e);
        showNotification('⚠️ Could not start speech');
      }
    };

    // If another message is currently speaking, cancel then delay new start so multi-cancel doesn't nuke it
    if (speakingIndex !== null) {
      window.speechSynthesis.cancel();
      setSpeakingIndex(null);
      if (speakStartTimeoutRef.current) clearTimeout(speakStartTimeoutRef.current);
      speakStartTimeoutRef.current = setTimeout(() => {
        startSpeech();
      }, 120); // allow internal queue to flush (multi-cancel is 0-80ms)
    } else {
      startSpeech();
    }
  };

  // Copy message
  const copyMessage = async (text) => {
    if (!text) return;
    try {
      // Basic markdown stripping so clipboard gets clean text
      const cleaned = text
        // Remove code fences (```language optional)
        .replace(/```[\s\S]*?```/g, (block) => {
          // Keep inner code content without backticks
          return block.replace(/```/g, "");
        })
        // Bold **text** or __text__ -> text
        .replace(/\*\*(.*?)\*\*/g, "$1")
        .replace(/__(.*?)__/g, "$1")
        // Italic *text* or _text_ (avoid matching bullet * )
        .replace(/(^|\s)\*(?!\s)([^*]+?)\*(?=\s|[.!,?]|$)/g, (_, p1, p2) => `${p1}${p2}`)
        .replace(/(^|\s)_([^_]+?)_(?=\s|[.!,?]|$)/g, (_, p1, p2) => `${p1}${p2}`)
        // Inline code `code` -> code
        .replace(/`([^`]+?)`/g, "$1")
        // Remove leading list markers * - + and numbered lists
        .replace(/^[ \t]*([*+-]|\d+\.)\s+/gm, "")
        // Replace multiple blank lines
        .replace(/\n{3,}/g, "\n\n")
        // Trim leftover emphasis markers
        .replace(/\*/g, "")
        .trim();
      await navigator.clipboard.writeText(cleaned || text);
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
                    {(msg.role === "ai" || msg.role === 'assistant') && msg.text && !msg.isStreaming && (
                      <div className="msg-actions">
                        <button
                          onClick={() => toggleSpeakMessage(i, msg.text)}
                          className={`msg-action-btn tts-toggle ${speakingIndex === i ? "speaking" : ""}`}
                          title={speakingIndex === i ? "Stop reading" : "Read aloud"}
                          aria-label={speakingIndex === i ? "Stop reading message" : "Read message aloud"}
                          aria-pressed={speakingIndex === i}
                          role="button"
                        >
                          {speakingIndex === i ? <VolumeX size={14} /> : <Volume2 size={14} />}
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
              onSelect={({ part, label }) => {
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
                  if (!isLoading && !rateLimited && message && message.trim()) {
                    handleSendMessage();
                  }
                }
              }}
              placeholder={rateLimited ? `Rate limit: wait ${rateLimitSeconds}s` : "Message QuantumChat..."}
              disabled={isLoading || rateLimited}
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
                  disabled={!message.trim() || rateLimited}
                  className="pill-action send-btn always-visible-send-btn"
                  aria-label="Send message"
                  title="Send message"
                  style={{
                    background: (!message.trim() || rateLimited) ? "#cccccc" : "#4A6FA5",
                    color: (!message.trim() || rateLimited) ? "#666666" : "#ffffff",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    width: "36px",
                    height: "36px",
                    minWidth: "36px",
                    minHeight: "36px",
                    borderRadius: "10px",
                    border: "none",
                    cursor: (!message.trim() || rateLimited) ? "not-allowed" : "pointer",
                    flexShrink: 0,
                    position: "relative",
                    zIndex: 10,
                    visibility: "visible",
                    opacity: 1,
                    boxShadow: (!message.trim() || rateLimited) ? "none" : "0 2px 8px rgba(74, 111, 165, 0.3)",
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
