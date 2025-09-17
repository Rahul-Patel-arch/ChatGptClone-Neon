import React from "react";
import { Send, Sun, Moon, Volume2, Copy, Share2, Plus, Mic, FileText, X } from "lucide-react";
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import quantumIcon from "../assets/quantum-chat-icon.png";
import MarkdownMessage from "./MarkdownMessage";
import { generateGeminiResponse } from "../services/geminiService";
import "../styles/chat-input-fixes.css"; // Emergency fixes

export default function ChatArea({
  darkMode,
  toggleDarkMode,
  sidebarCollapsed,
  isMobile: isMobileProp,
  messages,
  message,
  setMessage,
  onSendMessage,
  currentUser,
  isLoading = false,
  forceUpdate = 0,
  onToggleSidebar,
  onOpenSettings,
  onShareMessage,
  onGlobalShare,
  activeChat,
  activeChatId,
}) {
  React.useEffect(() => {
    console.log("ChatArea re-rendered due to forceUpdate:", forceUpdate);
    console.log("Current message:", message);
    console.log("Is loading:", isLoading);
    console.log("Send button should be visible:", true);
  }, [forceUpdate, message, isLoading]);

  const [internalIsMobile, setInternalIsMobile] = React.useState(window.innerWidth < 768);
  const isMobile = isMobileProp !== undefined ? isMobileProp : internalIsMobile;
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

  // Helper function to parse markdown and extract structured content
  const parseMessageContent = (text) => {
    if (!text || typeof text !== 'string') return [{ type: 'text', content: '' }];
    
    const elements = [];
    const lines = text.split('\n');
    let i = 0;
    
    while (i < lines.length) {
      const line = lines[i];
      
      // Code blocks (```language)
      if (line.trim().startsWith('```')) {
        const language = line.trim().slice(3) || 'code';
        const codeLines = [];
        i++;
        
        while (i < lines.length && !lines[i].trim().startsWith('```')) {
          codeLines.push(lines[i]);
          i++;
        }
        
        if (codeLines.length > 0) {
          elements.push({
            type: 'code',
            language: language,
            content: codeLines.join('\n')
          });
        }
        i++; // Skip closing ```
      }
      // Headers
      else if (line.trim().startsWith('#')) {
        const level = (line.match(/^#+/) || [''])[0].length;
        const content = line.replace(/^#+\s*/, '');
        elements.push({
          type: 'header',
          level: level,
          content: content
        });
        i++;
      }
      // Lists
      else if (line.trim().match(/^[-*+]\s/) || line.trim().match(/^\d+\.\s/)) {
        const listItems = [];
        const isOrdered = line.trim().match(/^\d+\.\s/);
        
        while (i < lines.length && (lines[i].trim().match(/^[-*+]\s/) || lines[i].trim().match(/^\d+\.\s/) || lines[i].trim() === '')) {
          if (lines[i].trim() && (lines[i].trim().match(/^[-*+]\s/) || lines[i].trim().match(/^\d+\.\s/))) {
            listItems.push(lines[i].replace(/^[-*+\d.]\s*/, '').trim());
          }
          i++;
        }
        
        if (listItems.length > 0) {
          elements.push({
            type: 'list',
            ordered: isOrdered,
            items: listItems
          });
        }
      }
      // Regular text
      else if (line.trim()) {
        let textContent = line;
        i++;
        
        // Collect continuous text lines
        while (i < lines.length && lines[i].trim() && 
               !lines[i].trim().startsWith('```') && 
               !lines[i].trim().startsWith('#') && 
               !lines[i].trim().match(/^[-*+]\s/) && 
               !lines[i].trim().match(/^\d+\.\s/)) {
          textContent += ' ' + lines[i].trim();
          i++;
        }
        
        elements.push({
          type: 'text',
          content: textContent
        });
      } else {
        i++; // Skip empty lines
      }
    }
    
    return elements.length > 0 ? elements : [{ type: 'text', content: text }];
  };

  // Export messages as a downloadable PDF using jsPDF + autotable. Falls back to a printable window.
  const handleExportPdf = () => {
    try {
      if (!messages || messages.length === 0) {
        showNotification('Nothing to export');
        return;
      }

      // Check if jsPDF is available
      if (typeof jsPDF === 'undefined') {
        console.error('jsPDF is not available');
        showNotification('PDF library not loaded');
        return;
      }

      console.log('Starting PDF generation...');
      const doc = new jsPDF({ unit: 'pt', format: 'a4' });
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      const marginX = 40;
      const marginY = 40;
      const contentWidth = pageWidth - (marginX * 2);
      let currentY = marginY + 20;

      // Header
      doc.setFontSize(16);
      doc.setFont('helvetica', 'bold');
      doc.text('QuantumChat Export', marginX, currentY);
      
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(100, 100, 100);
      const exportDate = new Date().toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
      doc.text(`Exported on ${exportDate}`, marginX, currentY + 20);
      
      currentY += 50;
      doc.setTextColor(0, 0, 0);

      console.log('Processing messages...');
      // Process each message
      messages.forEach((message, index) => {
        const role = message.role || 'unknown';
        const isUser = role === 'user';
        
        // Check if we need a new page
        if (currentY > pageHeight - 100) {
          doc.addPage();
          currentY = marginY;
        }
        
        // Role header
        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        if (isUser) {
          doc.setTextColor(0, 102, 204); // Blue color for user
        } else {
          doc.setTextColor(34, 139, 34); // Green color for assistant
        }
        doc.text(isUser ? 'User' : 'Assistant', marginX, currentY);
        currentY += 20;
        
        doc.setTextColor(0, 0, 0); // Reset to black
        doc.setFont('helvetica', 'normal');
        
        // Parse message content
        const elements = parseMessageContent(message.text);
        
        elements.forEach(element => {
          // Check for page break
          if (currentY > pageHeight - 80) {
            doc.addPage();
            currentY = marginY;
          }
          
          switch (element.type) {
            case 'header':
              doc.setFontSize(12 - (element.level - 1));
              doc.setFont('helvetica', 'bold');
              const headerLines = doc.splitTextToSize(element.content, contentWidth);
              headerLines.forEach(line => {
                doc.text(line, marginX, currentY);
                currentY += 16;
              });
              doc.setFont('helvetica', 'normal');
              currentY += 5;
              break;
              
            case 'code':
              // Code block background
              doc.setFillColor(245, 245, 245);
              const codeHeight = element.content.split('\n').length * 12 + 20;
              doc.rect(marginX - 5, currentY - 10, contentWidth + 10, codeHeight, 'F');
              
              // Language label
              doc.setFontSize(9);
              doc.setFont('courier', 'bold');
              doc.setTextColor(100, 100, 100);
              doc.text(`[${element.language}]`, marginX, currentY);
              currentY += 15;
              
              // Code content
              doc.setFontSize(9);
              doc.setFont('courier', 'normal');
              doc.setTextColor(0, 0, 0);
              
              const codeLines = element.content.split('\n');
              codeLines.forEach(codeLine => {
                // Wrap long lines
                const wrappedLines = doc.splitTextToSize(codeLine || ' ', contentWidth - 10);
                wrappedLines.forEach(wrappedLine => {
                  doc.text(wrappedLine, marginX, currentY);
                  currentY += 12;
                });
              });
              
              doc.setFont('helvetica', 'normal');
              currentY += 10;
              break;
              
            case 'list':
              doc.setFontSize(10);
              element.items.forEach((item, idx) => {
                const bullet = element.ordered ? `${idx + 1}.` : '•';
                const listText = `${bullet} ${item}`;
                const listLines = doc.splitTextToSize(listText, contentWidth - 20);
                
                listLines.forEach((line, lineIdx) => {
                  doc.text(line, marginX + (lineIdx > 0 ? 20 : 0), currentY);
                  currentY += 12;
                });
              });
              currentY += 5;
              break;
              
            case 'text':
            default:
              doc.setFontSize(10);
              const textLines = doc.splitTextToSize(element.content, contentWidth);
              textLines.forEach(line => {
                doc.text(line, marginX, currentY);
                currentY += 12;
              });
              currentY += 5;
              break;
          }
        });
        
        // Add spacing between messages
        currentY += 15;
        
        // Add a subtle separator line between messages
        if (index < messages.length - 1) {
          doc.setDrawColor(220, 220, 220);
          doc.line(marginX, currentY, pageWidth - marginX, currentY);
          currentY += 15;
        }
      });

      console.log('PDF generation complete, starting download...');
      const fileName = `quantumchat_export_${new Date().toISOString().slice(0,19).replace(/[:T]/g,'_')}.pdf`;
      
      // Force download using blob and URL.createObjectURL
      try {
        const pdfBlob = doc.output('blob');
        const url = URL.createObjectURL(pdfBlob);
        
        // Create a temporary link element to trigger download
        const link = document.createElement('a');
        link.href = url;
        link.download = fileName;
        link.style.display = 'none';
        
        // Add to DOM, click, and remove
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        // Clean up the URL object
        setTimeout(() => URL.revokeObjectURL(url), 100);
        
        console.log('PDF download triggered successfully');
        showNotification('✅ PDF downloaded successfully!');
      } catch (saveErr) {
        console.error('Blob download failed, trying direct save', saveErr);
        doc.save(fileName);
        showNotification('PDF downloaded');
      }
    } catch (err) {
      console.error('Enhanced PDF failed:', err);
      showNotification('❌ PDF generation failed - check console for details');
      
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
                body { 
                  font-family: Inter, system-ui, -apple-system, Arial, sans-serif; 
                  color: #111; 
                  padding: 24px; 
                  line-height: 1.6;
                }
                .msg { 
                  margin-bottom: 24px; 
                  padding: 16px; 
                  border-radius: 10px; 
                  background: #fff; 
                  border: 1px solid #e6e9f2; 
                  page-break-inside: avoid;
                }
                .msg.user { background: #f0f8ff; }
                .msg.bot { background: #f9f9f9; }
                pre { 
                  background: #f5f5f5; 
                  padding: 12px; 
                  border-radius: 6px; 
                  overflow-x: auto;
                  white-space: pre-wrap;
                  font-family: 'Courier New', monospace;
                }
                code { 
                  background: #f5f5f5; 
                  padding: 2px 4px; 
                  border-radius: 3px;
                  font-family: 'Courier New', monospace;
                }
                h1, h2, h3, h4, h5, h6 { margin-top: 1.5em; margin-bottom: 0.5em; }
                ul, ol { margin: 1em 0; padding-left: 2em; }
                li { margin: 0.5em 0; }
              </style>
            </head>
            <body>
              <h1>QuantumChat Export</h1>
              <p style="color: #666; margin-bottom: 2em;">Exported on ${new Date().toLocaleString()}</p>
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
        showNotification('Preparing enhanced export...');
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
    <div className={`chat-area ${sidebarCollapsed ? "sidebar-collapsed" : ""} ${messages?.length > 0 ? "has-messages" : ""} ${isMobile ? "mobile" : ""}`}>
      {/* Header */}
      <div className="chat-header">
        <div className="d-flex align-items-center gap-2">
          {/* Mobile logo menu (replace hamburger) */}
          {isMobile && (
            <button
              className="btn ghost me-2 mobile-logo-btn"
              onClick={onToggleSidebar}
              aria-label="Toggle Sidebar"
              style={{
                padding: '6px',
                borderRadius: '8px',
                display: 'flex',
                alignItems: 'center',
                background: 'transparent',
                border: 'none'
              }}
            >
              <img
                src={quantumIcon}
                alt="QuantumChat"
                style={{
                  width: '28px',
                  height: '28px',
                  borderRadius: '6px'
                }}
              />
            </button>
          )}
          
          {/* Active Chat Title - Left side for better UX */}
          {activeChat && (
            <div className="chat-header-title">
              <h6 style={{ 
                margin: 0, 
                fontSize: '16px', 
                fontWeight: '500', 
                color: 'var(--text)',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                maxWidth: '400px'
              }}>
                {activeChat.title}
              </h6>
            </div>
          )}
          
          {/* Spacer to push action buttons to the right */}
          <div style={{ flex: 1 }}></div>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
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
            {/* Better export icon option - Download/Export style */}
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <polyline points="7,10 12,15 17,10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <line x1="12" y1="15" x2="12" y2="3" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
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
      </div>

      {/* Messages */}
      <div className="chat-content">
        <div className="chat-messages-container">
          {messages.length === 0 ? (
            <div className="empty-chat-state">
              <h3>{activeChat ? activeChat.title : 'QuantumChat'}</h3>
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
            <div className="pill-actions-right" style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              flexShrink: 0,
              minWidth: '100px'
            }}>
              {/* Mic */}
              <button
                className={`pill-action mic-btn ${isRecording ? "recording" : ""}`}
                onClick={() =>
                  isRecording ? stopSpeechRecognition() : startSpeechRecognition()
                }
                aria-label="Voice input"
                title="Voice input"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: '44px',
                  height: '44px',
                  borderRadius: '10px',
                  border: 'none',
                  background: 'transparent',
                  color: 'var(--muted-text)',
                  cursor: 'pointer',
                  flexShrink: 0
                }}
              >
                <Mic size={18} />
              </button>

              {/* Send Button - ALWAYS VISIBLE */}
              <button
                onClick={handleSendMessage}
                disabled={!message.trim() || isLoading}
                className="pill-action send-btn always-visible-send-btn"
                aria-label="Send message"
                title="Send message"
                style={{
                  background: (!message.trim() || isLoading) ? '#cccccc' : '#4A6FA5',
                  color: (!message.trim() || isLoading) ? '#666666' : '#ffffff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: '36px',
                  height: '36px',
                  minWidth: '36px',
                  minHeight: '36px',
                  borderRadius: '10px',
                  border: 'none',
                  cursor: (!message.trim() || isLoading) ? 'not-allowed' : 'pointer',
                  flexShrink: 0,
                  position: 'relative',
                  zIndex: 10,
                  visibility: 'visible',
                  opacity: 1,
                  boxShadow: (!message.trim() || isLoading) ? 'none' : '0 2px 8px rgba(74, 111, 165, 0.3)'
                }}
              >
                {isLoading ? (
                  <span style={{ fontSize: '12px', color: 'inherit' }}>...</span>
                ) : (
                  <Send size={18} style={{ color: 'inherit' }} />
                )}
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