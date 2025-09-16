import React from "react";
import { Send, Sun, Moon, Volume2, Copy, Share2, Plus, Mic, FileText, X } from "lucide-react";
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import quantumIcon from "../assets/quantum-chat-icon.png";
import MarkdownMessage from "./MarkdownMessage";
import { generateGeminiResponse } from "../services/geminiService";

export default function ChatArea({
  darkMode,
  toggleDarkMode,
  sidebarCollapsed,
  messages,
  message,
  setMessage,
  onSendMessage,
  currentUser,
  isLoading = false,
  forceUpdate = 0,
  onToggleSidebar,
}) {
  React.useEffect(() => {
    console.log("ChatArea re-rendered due to forceUpdate:", forceUpdate);
  }, [forceUpdate]);

  const [isMobile, setIsMobile] = React.useState(window.innerWidth < 768);
  const [showToast, setShowToast] = React.useState(false);
  const [toastMessage, setToastMessage] = React.useState("");

  const messagesEndRef = React.useRef(null);
  const fileInputRef = React.useRef(null);
  const recognitionRef = React.useRef(null);
  const shareBtnRef = React.useRef(null);
  const sharePopoverRef = React.useRef(null);

  // Auto scroll to bottom on new messages
  React.useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isLoading]);

  // Window resize
  React.useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Notification
  const showNotification = (msg) => {
    setToastMessage(msg);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 2000);
  };

  // Share page (header button) - uses native share when available, falls back to copy
  const handleShare = async () => {
    const shareData = {
      title: document.title || "QuantumChat",
      text: "Check out my QuantumChat session",
      url: window.location.href,
    };
    try {
      if (navigator.share) {
        await navigator.share(shareData);
        showNotification("🔗 Shared");
      } else if (navigator.clipboard) {
        await navigator.clipboard.writeText(window.location.href);
        showNotification("🔗 Link copied to clipboard");
      } else {
        showNotification("🔗 Share not supported");
      }
    } catch (err) {
      console.error("Share failed", err);
      showNotification("🔗 Share failed");
    }
  };

  // Share modal state
  const [showShareModal, setShowShareModal] = React.useState(false);

  // Close popover when clicking outside
  React.useEffect(() => {
    if (!showShareModal) return;
    const onDocClick = (e) => {
      const pop = sharePopoverRef.current;
      const btn = shareBtnRef.current;
      if (pop && !pop.contains(e.target) && btn && !btn.contains(e.target)) {
        setShowShareModal(false);
      }
    };
    document.addEventListener('mousedown', onDocClick);
    return () => document.removeEventListener('mousedown', onDocClick);
  }, [showShareModal]);

  // Export messages as a downloadable PDF using jsPDF + autotable. Falls back to a printable window.
  const handleExportPdf = () => {
    try {
      if (!messages || messages.length === 0) return showNotification('Nothing to export');

      const doc = new jsPDF({ unit: 'pt', format: 'a4' });
      const marginX = 40;
      const startY = 48;
      doc.setFontSize(14);
      doc.text('QuantumChat Export', marginX, 36);
      doc.setFontSize(10);

      // Build rows: [Role, Message]
      const rows = messages.map((m) => {
        const role = m.role || '';
        // Prefer text property; fallback to stringified content
        let text = '';
        if (typeof m.text === 'string') text = m.text.replace(/\s+/g, ' ').trim();
        else if (m.content) text = String(m.content).slice(0, 2000);
        return [role, text];
      });

      // Use autoTable to layout messages across pages
      // Column widths: role narrow, message fills rest
      const pageWidth = doc.internal.pageSize.getWidth();
      const roleColWidth = 70;
      const msgColWidth = pageWidth - marginX * 2 - roleColWidth;

      autoTable(doc, {
        startY,
        head: [['Role', 'Message']],
        body: rows,
        styles: { fontSize: 10, cellPadding: 6 },
        headStyles: { fillColor: [74, 111, 165], textColor: 255 },
        columnStyles: {
          0: { cellWidth: roleColWidth },
          1: { cellWidth: msgColWidth }
        },
        theme: 'striped',
        didDrawPage: (data) => {
          // optional: could add header/footer here
        }
      });

      const fileName = `quantumchat_export_${new Date().toISOString().slice(0,19).replace(/[:T]/g,'_')}.pdf`;
      doc.save(fileName);
      showNotification('PDF downloaded');
    } catch (err) {
      console.error('Auto PDF failed, falling back to printable window', err);
      // Fallback: printable window
      try {
        const printable = document.querySelector('.chat-messages-container');
        if (!printable) return showNotification('Nothing to export');
        const html = `
          <html>
            <head>
              <title>QuantumChat export</title>
              <meta charset="utf-8" />
              <style>
                body { font-family: Inter, system-ui, -apple-system, Arial, sans-serif; color: #111; padding: 24px; }
                .msg { margin-bottom: 12px; padding: 12px; border-radius: 10px; background: #fff; border: 1px solid #e6e9f2; }
              </style>
            </head>
            <body>
              ${printable.innerHTML}
            </body>
          </html>
        `;
        const newWin = window.open('', '_blank');
        if (!newWin) return showNotification('Popup blocked. Cannot export.');
        newWin.document.write(html);
        newWin.document.close();
        newWin.focus();
        newWin.print();
        showNotification('Preparing export...');
      } catch (err2) {
        console.error('Fallback export failed', err2);
        showNotification('Export failed');
      }
    }
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
    try {
      onSendMessage(message);
    } catch (err) {
      console.error('Send handler error', err);
      showNotification('⚠️ Could not send message');
    }
  };

  // File upload
  const handleAttachClick = () => {
    if (fileInputRef.current) fileInputRef.current.click();
  };
  const handleFileChange = (e) => {
    const f = e.target.files && e.target.files[0];
    if (!f) return;
    setMessage((prev) => (prev ? prev + " " : "") + `[file: ${f.name}] `);
    showNotification(`Attached file: ${f.name}`);
    e.target.value = null;
  };

  // Speech recognition
  const [isRecording, setIsRecording] = React.useState(false);
  const startSpeechRecognition = () => {
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;
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

  return (
    <div className={`chat-area ${sidebarCollapsed ? "sidebar-collapsed" : ""}`}>
      {/* Header */}
      <div className="chat-header">
        <div className="d-flex align-items-center gap-2">
          {isMobile && (
            <button
              className="btn ghost me-2"
              onClick={onToggleSidebar}
              aria-label="Toggle Sidebar"
            >
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                stroke="currentColor"
                fill="none"
              >
                <line x1="3" y1="12" x2="21" y2="12"></line>
                <line x1="3" y1="6" x2="21" y2="6"></line>
                <line x1="3" y1="18" x2="21" y2="18"></line>
              </svg>
            </button>
          )}
          {(sidebarCollapsed || isMobile) && (
            <>
              <img
                src={quantumIcon}
                alt="QuantumChat Logo"
                style={{ width: "32px", height: "32px" }}
              />
              <h2 className="h5 fw-bold mb-0">QuantumChat</h2>
            </>
          )}
        </div>
        <div className="d-flex align-items-center gap-2" style={{ position: 'relative' }}>
          {/* header icon that opens the share popover */}
          <button
            ref={shareBtnRef}
            className="btn ghost"
            onClick={() => setShowShareModal((s) => !s)}
            aria-label="Open export menu"
            title="Export & Share"
            aria-haspopup="menu"
            aria-expanded={showShareModal}
          >
            {/* Custom export icon (inline SVG) — uses currentColor so it follows theme */}
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
              <rect x="3" y="7" width="18" height="14" rx="2" stroke="currentColor" strokeWidth="1.5" fill="none" />
              <path d="M8 11l4-4 4 4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" fill="none" />
              <path d="M12 7v8" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" fill="none" />
            </svg>
          </button>
          {showShareModal && (
            <div ref={sharePopoverRef} className="share-popover" role="menu" aria-label="Share menu">
              <button className="share-popover-close" onClick={() => setShowShareModal(false)} aria-label="Close share menu">
                <X size={16} />
              </button>
              <button className="share-popover-item" onClick={async () => { await handleShare(); setShowShareModal(false);} }>
                <Share2 size={16} style={{ marginRight: 8 }} /> Share
              </button>
              <button className="share-popover-item" onClick={() => { handleExportPdf(); setShowShareModal(false); }}>
                <FileText size={16} style={{ marginRight: 8 }} /> Export as PDF
              </button>
            </div>
          )}
          <button
            className="btn ghost"
            onClick={toggleDarkMode}
            aria-label={
              darkMode ? "Switch to Light Mode" : "Switch to Dark Mode"
            }
          >
            {darkMode ? <Sun size={18} /> : <Moon size={18} />}
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="chat-content">
        {messages.length === 0 ? (
          <div className="empty-chat-state">
            <h3>QuantumChat</h3>
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
                <div
                  className={`msg ${msg.role === "user" ? "user" : "bot"}`}
                >
                  {msg.role === "user" ? (
                    msg.text
                  ) : (
                    // If this AI message is streaming, show a typing indicator instead of partial text
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
                      <MarkdownMessage darkMode={darkMode}>
                        {msg.text}
                      </MarkdownMessage>
                    )
                  )}
                  {msg.role === "ai" && msg.text && !msg.isStreaming && (
                    <div className="msg-actions">
                      <button onClick={() => speakText(msg.text)} className="msg-action-btn" title="Read aloud">
                        <Volume2 size={14} />
                      </button>
                      <button onClick={() => copyMessage(msg.text)} className="msg-action-btn" title="Copy message">
                        <Copy size={14} />
                      </button>
                      <button onClick={() => showNotification("Shared!")} className="msg-action-btn" title="Share message">
                        <Share2 size={14} />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      {/* Input */}
      <div className="chat-input-container">
        <div className="chat-input-wrapper">
          <div className="chat-input-pill">
            {/* Hidden file input */}
            <input
              ref={fileInputRef}
              type="file"
              style={{ display: "none" }}
              onChange={handleFileChange}
              aria-hidden
            />

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
                if (e.key === "Enter" && !isLoading && message.trim()) {
                  handleSendMessage();
                }
              }}
              placeholder="Message QuantumChat..."
              disabled={isLoading}
              aria-label="Message input"
            />

            {/* Right-side actions */}
            <div className="pill-actions-right">
              {/* Mic */}
              <button
                className={`pill-action mic-btn ${isRecording ? "recording" : ""}`}
                onClick={() =>
                  isRecording ? stopSpeechRecognition() : startSpeechRecognition()
                }
                aria-label="Voice input"
                title="Voice input"
              >
                <Mic size={18} />
              </button>

              {/* Send */}
              <button
                onClick={handleSendMessage}
                disabled={!message.trim() || isLoading}
                className="pill-action send-btn"
                aria-label="Send message"
              >
                {isLoading ? "..." : <Send size={18} />}
              </button>
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