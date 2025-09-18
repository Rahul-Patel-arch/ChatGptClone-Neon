// client/src/ChatApp.jsx
// Fixed mobile sidebar integration - v1.4 - AGGRESSIVE send button fix

import React, { useState, useEffect, useRef } from "react";
import { useOutletContext, useNavigate } from "react-router-dom";
import ChatArea from "./component/ChatArea";
import Header from "./component/Header";
import SettingsPanel from "./component/SettingsPanel/SettingsPanel";
import useToast from "./hooks/useToast";
import {
  generateGeminiStreamResponse,
  isGeminiConfigured,
  generateConversationTitle,
} from "./services/geminiService";

export default function ChatApp() {
  const outlet = useOutletContext?.() || {};
  const navigate = useNavigate();
  const currentUser = outlet.currentUser || null;
  const _chats = outlet.chats || []; // Keep for future use
  const setChats = outlet.setChats || (() => {});
  const activeChatId = outlet.activeChatId;
  const setActiveChatId = outlet.setActiveChatId || (() => {});
  const onNewChat = outlet.onNewChat || (() => {});
  const onSelectChat = outlet.onSelectChat || (() => {});
  const onArchive = outlet.onArchive || (() => {});
  const onRestoreChat = outlet.onRestoreChat || (() => {});
  const onPermanentlyDeleteChat = outlet.onPermanentlyDeleteChat || (() => {});
  const _onRename = outlet.onRename || (() => {}); // Keep for future use
  const _onDelete = outlet.onDelete || (() => {}); // Keep for future use

  // Use theme from MainLayout context instead of local useThemeToggle
  const darkMode = outlet.darkMode || false;
  const toggleDarkMode = outlet.toggleDarkMode || (() => {});
  const themeMode = outlet.themeMode || (darkMode ? "dark" : "light");
  const setThemeMode = outlet.setThemeMode || (() => {});

  // Use MainLayout's sidebar state instead of local state
  const sidebarCollapsed = outlet.sidebarCollapsed || false;
  const onToggleSidebar = outlet.onToggleSidebar || (() => {});
  const isMobile =
    outlet.isMobile !== undefined
      ? outlet.isMobile
      : typeof window !== "undefined" && window.innerWidth < 768;

  const [showSettings, setShowSettings] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [_streamingResponse, setStreamingResponse] = useState(""); // Keep for future use

  const [_messages, _setMessages] = useState([]); // Keep for future use
  const [activeMessages, setActiveMessages] = useState([]);
  const [input, setInput] = useState("");
  const streamingCtrlRef = useRef({ cancelled: false });
  const _hasLoadedChatsRef = useRef(false); // Keep for future use
  // Share UI state
  const [showShareModal, setShowShareModal] = useState(false);
  const shareBtnRef = useRef(null);
  const sharePopoverRef = useRef(null);
  const [proMode, setProMode] = useState(() => {
    try {
      const email = (outlet.currentUser?.email || "").toLowerCase();
      const plans = JSON.parse(localStorage.getItem("quantumchat_user_plans") || "{}");
      return email && plans[email] === "pro";
    } catch {
      return false;
    }
  });
  // Pro modal is deprecated; header now navigates to /checkout

  // Toast notifications (shared pattern with MainLayout)
  const { toast, show: showNotification } = useToast();

  // Helper to sanitize and cap titles consistently
  const sanitizeTitle = (s) =>
    (s || "")
      .replaceAll("\n", " ")
      .replace(/[#>*`_-]+/g, " ") // remove markdown-y chars
      .replace(/\s+/g, " ") // collapse whitespace
      .replace(/[\u200B-\u200D\uFEFF]/g, "") // zero-width chars
      .replace(/^[^A-Za-z0-9]+/, "") // trim leading non-alnum
      .trim();
  const capTitle = (s, n = 60) => (s.length > n ? s.slice(0, n).trim() : s);
  const deriveTitleFromText = (text) => {
    const cleaned = sanitizeTitle(text || "");
    if (!cleaned) return "";
    // Take first sentence-like chunk or up to 6 words
    const firstSentence = cleaned.split(/[.!?]/)[0];
    const words = firstSentence.split(" ").filter(Boolean).slice(0, 8).join(" ");
    return capTitle(words || cleaned);
  };

  // Responsive sidebar and settings event handling
  useEffect(() => {
    // Open settings when triggered by layout/profile
    const openSettingsHandler = () => setShowSettings(true);
    window.addEventListener("open-settings", openSettingsHandler);
    return () => window.removeEventListener("open-settings", openSettingsHandler);
  }, []);

  // Listen for pro upgrade event to refresh local pro state
  useEffect(() => {
    const onUpgraded = () => {
      try {
        const email = (outlet.currentUser?.email || "").toLowerCase();
        const plans = JSON.parse(localStorage.getItem("quantumchat_user_plans") || "{}");
        setProMode(email && plans[email] === "pro");
      } catch {
        setProMode(false);
      }
    };
    window.addEventListener("qc:pro-upgraded", onUpgraded);
    return () => window.removeEventListener("qc:pro-upgraded", onUpgraded);
  }, [outlet.currentUser?.email]);

  // Body class handled globally in App based on logged-in user plan

  // Sync active messages when shared chats or activeChatId change
  useEffect(() => {
    const current = (outlet.chats || []).find((c) => c.id === outlet.activeChatId);
    setActiveMessages(current?.messages || []);
  }, [outlet.chats, outlet.activeChatId]);

  const handleSettings = () => setShowSettings(true);
  const handleCloseSettings = () => setShowSettings(false);
  const handleSettingsChange = () => {}; // Simplified since theme is managed by MainLayout

  const handleSend = async (textArg) => {
    // Support either a plain string or an object { text, attachment }
    let attachmentPart = null;
    let draft = input;
    if (typeof textArg === "string") {
      draft = textArg;
    } else if (textArg && typeof textArg === "object") {
      draft = textArg.text ?? input;
      if (textArg.attachment) {
        attachmentPart = textArg.attachment; // already in { text } or { inlineData } shape
      }
    }
    if (!draft || !draft.trim() || isLoading) return;
    let currentChatId = activeChatId;
    if (!currentChatId) {
      // Ask layout to create a new chat and use its id immediately
      const createdId = onNewChat && typeof onNewChat === "function" ? onNewChat() : undefined;
      if (createdId) {
        currentChatId = createdId;
      } else {
        // Fallback: try to read the latest chats array
        const chatList = outlet.chats || [];
        currentChatId = (outlet.chats && outlet.chats[0])?.id || chatList[0]?.id;
      }
    }
    if (!currentChatId) return;
    if (currentChatId !== activeChatId) setActiveChatId(currentChatId);
    const textToSend = draft.trim();
    const userMsg = {
      role: "user",
      text: textToSend,
      time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };
    // Clear input box if we own it
    setInput("");
    setIsLoading(true);
    // Prepare a fresh controller for this stream
    streamingCtrlRef.current = { cancelled: false };
    setStreamingResponse("");

    // Upsert the chat immediately so the first message appears even if onNewChat() hasn't propagated
    setChats((prev) => {
      const idx = prev.findIndex((c) => c.id === currentChatId);
      if (idx === -1) {
        const newChat = {
          id: currentChatId,
          title: "New Chat",
          createdAt: new Date().toISOString(),
          archived: false,
          messages: [userMsg],
        };
        return [newChat, ...prev];
      }
      const updated = [...prev];
      const chat = updated[idx];
      updated[idx] = { ...chat, messages: [...(chat.messages || []), userMsg] };
      return updated;
    });
    setActiveMessages((prev) => [...prev, userMsg]);

    try {
      if (!isGeminiConfigured()) throw new Error("Gemini API key not configured.");

      const tempAi = {
        role: "ai",
        text: "",
        time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        isStreaming: true,
      };
      // Ensure the AI placeholder is appended even if the chat was just created
      setChats((prev) => {
        const idx = prev.findIndex((c) => c.id === currentChatId);
        if (idx === -1) {
          const newChat = {
            id: currentChatId,
            title: "New Chat",
            createdAt: new Date().toISOString(),
            archived: false,
            messages: [userMsg, tempAi],
          };
          return [newChat, ...prev];
        }
        const updated = [...prev];
        const chat = updated[idx];
        updated[idx] = { ...chat, messages: [...(chat.messages || []), tempAi] };
        return updated;
      });
      setActiveMessages((prev) => [...prev, tempAi]);

      let accumulated = "";
      const chatList = outlet.chats || [];
      const convoHistory = [
        ...(chatList.find((c) => c.id === currentChatId)?.messages || []),
        userMsg,
      ];

      const fullResponse = await generateGeminiStreamResponse(
        userMsg.text,
        convoHistory,
        (chunk, isComplete, errorMessage) => {
          if (errorMessage) {
            console.error(errorMessage);
            return;
          }
          if (chunk) {
            accumulated += chunk;
            setStreamingResponse(accumulated);
            setChats((prev) =>
              prev.map((c) => {
                if (c.id !== currentChatId) return c;
                const msgs = [...c.messages];
                const last = msgs[msgs.length - 1];
                if (last?.isStreaming) last.text = accumulated;
                return { ...c, messages: msgs };
              })
            );
            setActiveMessages((prev) => {
              const updated = [...prev];
              const last = updated[updated.length - 1];
              if (last?.isStreaming) last.text = accumulated;
              return updated;
            });
          }
          if (isComplete) {
            setChats((prev) =>
              prev.map((c) => {
                if (c.id !== currentChatId) return c;
                const msgs = [...c.messages];
                const last = msgs[msgs.length - 1];
                if (last?.isStreaming) last.isStreaming = false;
                return { ...c, messages: msgs };
              })
            );
            setActiveMessages((prev) => {
              const updated = [...prev];
              const last = updated[updated.length - 1];
              if (last?.isStreaming) last.isStreaming = false;
              return updated;
            });
          }
        },
        null,
        { controller: streamingCtrlRef.current },
        attachmentPart ? [attachmentPart] : []
      );

      // Allow users to opt-out of auto titling via localStorage flag
      const disableAutoTitle = (() => {
        try {
          return localStorage.getItem("qc:disableAutoTitle") === "1";
        } catch {
          return false;
        }
      })();
      if (!disableAutoTitle) {
        try {
          // Build a title purely from the local conversation history we already have,
          // independent of potentially stale outlet.chats
          const draftHistory = [...convoHistory, { role: "ai", text: fullResponse }];
          let newTitle = "";
          try {
            newTitle = await generateConversationTitle(draftHistory);
          } catch (inner) {
            console.warn("Title model failed, will fallback:", inner?.message);
          }
          let finalTitle = sanitizeTitle(newTitle || "");
          if (!finalTitle) {
            // Fallback 1: derive from combined early conversation (user + AI)
            const combined = `${userMsg.text} ${fullResponse || ""}`;
            finalTitle = deriveTitleFromText(combined);
          }
          if (!finalTitle) {
            // Fallback 2: generic title with date/time
            finalTitle = `Chat ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`;
          }
          finalTitle = capTitle(finalTitle);
          if (finalTitle) {
            // Only update if the chat still has the default title to avoid overriding manual rename
            setChats((prev) =>
              prev.map((c) =>
                c.id === currentChatId && (c.title === "New Chat" || !c.title)
                  ? { ...c, title: finalTitle }
                  : c
              )
            );
          }
        } catch (error) {
          console.error("Error setting auto title:", error);
        }
      }
    } catch (error) {
      const errMsg = {
        role: "ai",
        text: `Sorry, I encountered an error: ${error.message}`,
        time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        isError: true,
      };
      setChats((prev) => {
        const targetId = activeChatId || currentChatId;
        const idx = prev.findIndex((c) => c.id === targetId);
        if (idx === -1) {
          const newChat = {
            id: targetId || Date.now().toString(),
            title: "New Chat",
            createdAt: new Date().toISOString(),
            archived: false,
            messages: [userMsg, errMsg],
          };
          return [newChat, ...prev];
        }
        const updated = [...prev];
        const chat = updated[idx];
        const msgs = [...(chat.messages || [])];
        if (msgs[msgs.length - 1]?.isStreaming) msgs[msgs.length - 1] = errMsg;
        else msgs.push(errMsg);
        updated[idx] = { ...chat, messages: msgs };
        return updated;
      });
      setActiveMessages((prev) => {
        const updated = [...prev];
        if (updated[updated.length - 1]?.isStreaming) updated[updated.length - 1] = errMsg;
        else updated.push(errMsg);
        return updated;
      });
      // As a last resort, set a reasonable title from the user's message if it's a new chat
      const fallbackTitle = deriveTitleFromText(userMsg.text);
      if (fallbackTitle) {
        setChats((prev) =>
          prev.map((c) =>
            c.id === (activeChatId || currentChatId) && (c.title === "New Chat" || !c.title)
              ? { ...c, title: fallbackTitle }
              : c
          )
        );
      }
    } finally {
      setIsLoading(false);
      setStreamingResponse("");
    }
  };

  const handleStop = () => {
    // Cooperative cancel of the current stream
    if (streamingCtrlRef.current) {
      streamingCtrlRef.current.cancelled = true;
    }
    setIsLoading(false);
    // Mark streaming message as finished in UI
    setChats((prev) =>
      prev.map((c) => {
        if (c.id !== activeChatId) return c;
        const msgs = [...c.messages];
        const last = msgs[msgs.length - 1];
        if (last?.isStreaming) last.isStreaming = false;
        return { ...c, messages: msgs };
      })
    );
    setActiveMessages((prev) => {
      const updated = [...prev];
      const last = updated[updated.length - 1];
      if (last?.isStreaming) last.isStreaming = false;
      return updated;
    });
  };

  const _handleNewChat = () => {
    // Keep for future use
    onNewChat();
    setActiveMessages([]);
    setStreamingResponse("");
  };

  const _handleSelectChat = (chatId) => {
    // Keep for future use
    onSelectChat(chatId);
    const target = (outlet.chats || _chats).find((c) => c.id === chatId);
    setActiveMessages(target?.messages || []);
  };

  const _handleArchiveChat = (chatId) => {
    // Keep for future use
    onArchive(chatId);
    if (outlet.activeChatId === chatId) {
      setActiveMessages([]);
    }
  };

  const handleRestoreChat = (chatId) => {
    onRestoreChat(chatId);
  };

  const handlePermanentlyDeleteChat = (chatId) => {
    onPermanentlyDeleteChat(chatId);
    if (outlet.activeChatId === chatId) {
      setActiveMessages([]);
    }
  };

  // 📤 New helper function to handle sharing logic
  const shareData = async (data, title) => {
    const encodedData = encodeURIComponent(btoa(JSON.stringify(data)));
    const { buildSharedChatUrl } = await import("./utils/urlHelpers");
    const shareUrl = buildSharedChatUrl(encodedData);

    if (navigator.share) {
      try {
        await navigator.share({
          title: title,
          text: `Check out this content from QuantumChat.`,
          url: shareUrl,
        });
        showNotification("📤 Shared successfully.");
        return;
      } catch (err) {
        if (err.name === "AbortError") return; // User cancelled
        console.error("Share failed:", err);
      }
    }
    // Fallback: copy link to clipboard
    await navigator.clipboard.writeText(shareUrl);
    showNotification("📋 Link copied to clipboard.");
  };

  // 🔹 Share whole chat
  const handleShareChat = async (chatId) => {
    const chatList = outlet.chats || [];
    const chatToShare = chatList.find((chat) => chat.id === chatId);
    if (!chatToShare || chatToShare.messages.length === 0) {
      // You'll need a showNotification function
      showNotification("Cannot share an empty chat.");
      return;
    }
    const chatData = {
      title: chatToShare.title,
      messages: chatToShare.messages.map((msg) => ({ role: msg.role, text: msg.text })),
    };
    await shareData(chatData, chatToShare.title);
  };

  // 🔹 Share single message
  const handleShareMessage = async (messageToShare) => {
    const chatData = {
      title: "QuantumChat Message",
      messages: [{ role: messageToShare.role, text: messageToShare.text }],
    };
    await shareData(chatData, "QuantumChat Message");
  };

  // 🔹 Global share button for active chat
  const handleGlobalShare = () => {
    if (!activeChatId) {
      showNotification("No active chat to share.");
      return;
    }
    handleShareChat(activeChatId);
  };

  // 📄 Export active chat as PDF with deep debugging
  const exportActiveChatAsPDF = async () => {
    try {
      console.log("=== PDF EXPORT DEBUG START ===");
      console.log("Export PDF: outlet =", outlet);
      console.log("Export PDF: outlet.chats =", outlet.chats);
      console.log("Export PDF: outlet.activeChatId =", outlet.activeChatId);
      console.log("Export PDF: activeMessages =", activeMessages);
      console.log("Export PDF: activeMessages length =", activeMessages?.length || 0);

      // Let's also check if we should use outlet.chats data instead
      const currentChat = (outlet.chats || []).find((c) => c.id === outlet.activeChatId);
      console.log("Export PDF: currentChat =", currentChat);
      console.log("Export PDF: currentChat.messages =", currentChat?.messages);

      // Use either activeMessages or currentChat.messages - whichever has data
      let messagesToExport = activeMessages;
      if ((!activeMessages || activeMessages.length === 0) && currentChat?.messages) {
        console.log("Export PDF: Using currentChat.messages instead of activeMessages");
        messagesToExport = currentChat.messages;
      }

      console.log("Export PDF: messagesToExport =", messagesToExport);
      console.log("Export PDF: messagesToExport length =", messagesToExport?.length || 0);

      // Ensure there's content to export
      if (!messagesToExport || messagesToExport.length === 0) {
        console.log("Export PDF: No messages found to export");
        showNotification("Nothing to export - no messages found.");
        return;
      }

      // Filter out streaming/error messages for export
      const exportableMessages = messagesToExport.filter((msg) => {
        const isValid = !msg.isStreaming && !msg.isError && msg.text && msg.text.trim();
        console.log(
          `Export PDF: Message ${msg.role} - isStreaming: ${msg.isStreaming}, isError: ${msg.isError}, hasText: ${!!msg.text}, textLength: ${msg.text?.length || 0}, isValid: ${isValid}`
        );
        return isValid;
      });

      console.log("Export PDF: exportableMessages =", exportableMessages);
      console.log("Export PDF: exportableMessages length =", exportableMessages.length);

      if (exportableMessages.length === 0) {
        console.log("Export PDF: No valid messages after filtering");
        showNotification("No valid messages to export.");
        return;
      }

      // Build a selectable, copyable, text-based PDF using jsPDF only
      const jsPDFModule = await import("jspdf");
      const jsPDF =
        jsPDFModule.jsPDF ||
        jsPDFModule.default ||
        (typeof window !== "undefined" && window.jspdf && window.jspdf.jsPDF);
      if (!jsPDF) throw new Error("jsPDF not available");

      const chatTitle = currentChat?.title || "QuantumChat Conversation";
      const filename = chatTitle.replace(/[\\/:*?"<>|]+/g, "-") + ".pdf";
      showNotification("📄 Generating PDF...");

      const doc = new jsPDF({ unit: "pt", format: "a4", orientation: "portrait" });
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      const margin = 40;
      const wrapWidth = pageWidth - margin * 2;
      let y = margin;

      // Header
      doc.setFont("helvetica", "bold");
      doc.setFontSize(14);
      doc.text(chatTitle, margin, y);
      y += 18;
      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      doc.text(
        `Exported ${new Date().toLocaleString()} • ${exportableMessages.length} messages`,
        margin,
        y
      );
      y += 16;
      doc.setDrawColor(200);
      doc.line(margin, y, pageWidth - margin, y);
      y += 14;

      const ensureSpace = (needed = 14) => {
        if (y > pageHeight - margin - needed) {
          doc.addPage();
          y = margin;
        }
      };

      // Helpers for basic Markdown handling
      const stripInlineMarkdown = (s) => {
        if (!s) return "";
        let out = s;
        // Links [text](url) -> text (url)
        out = out.replace(/\[([^\]]+)\]\(([^)]+)\)/g, "$1 ($2)");
        // Images ![alt](url) -> alt (url)
        out = out.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, "$1 ($2)");
        // Bold/italic/inline code markers -> remove markers
        out = out.replace(/\*\*([^*]+)\*\*/g, "$1");
        out = out.replace(/\*([^*]+)\*/g, "$1");
        out = out.replace(/__([^_]+)__/g, "$1");
        out = out.replace(/_([^_]+)_/g, "$1");
        out = out.replace(/`([^`]+)`/g, "$1");
        // Trim stray asterisks or formatting dangles
        out = out.replace(/\s+\*+\s*/g, " ");
        return out;
      };

      const parseMarkdownBlocks = (text) => {
        const lines = (text || "").replace(/\r\n/g, "\n").split("\n");
        const blocks = [];
        let inCode = false;
        let codeLang = "";
        let codeLines = [];
        let listBuffer = [];
        let paraBuffer = [];

        const flushPara = () => {
          if (paraBuffer.length) {
            blocks.push({ type: "paragraph", text: paraBuffer.join(" ").trim() });
            paraBuffer = [];
          }
        };
        const flushList = () => {
          if (listBuffer.length) {
            blocks.push({ type: "list", items: listBuffer.slice() });
            listBuffer = [];
          }
        };
        const flushCode = () => {
          if (codeLines.length) {
            blocks.push({ type: "code", language: codeLang, lines: codeLines.slice() });
            codeLines = [];
            codeLang = "";
            inCode = false;
          }
        };

        for (let line of lines) {
          const fence = line.match(/^```\s*(\w+)?\s*$/);
          if (fence) {
            if (!inCode) {
              flushPara();
              flushList();
              inCode = true;
              codeLang = fence[1] || "";
            } else {
              flushCode();
            }
            continue;
          }
          if (inCode) {
            codeLines.push(line);
            continue;
          }

          if (!line.trim()) {
            // blank -> breaks
            flushPara();
            flushList();
            continue;
          }

          const heading = line.match(/^(#{1,6})\s+(.*)$/);
          if (heading) {
            flushPara();
            flushList();
            blocks.push({ type: "heading", level: heading[1].length, text: heading[2].trim() });
            continue;
          }
          const checkbox = line.match(/^\s*[-*+]\s+\[( |x|X)\]\s+(.*)$/);
          if (checkbox) {
            flushPara();
            const checked = checkbox[1].toLowerCase() === "x";
            listBuffer.push((checked ? "☑ " : "☐ ") + checkbox[2].trim());
            continue;
          }
          const listItem = line.match(/^\s*[-*+]\s+(.*)$/);
          if (listItem) {
            flushPara();
            listBuffer.push("• " + listItem[1].trim());
            continue;
          }
          const quote = line.match(/^>\s?(.*)$/);
          if (quote) {
            flushPara();
            flushList();
            blocks.push({ type: "quote", text: quote[1].trim() });
            continue;
          }
          // paragraph text
          paraBuffer.push(line.trim());
        }
        flushPara();
        flushList();
        flushCode();
        return blocks;
      };

      const drawWrapped = (text, x) => {
        const lines = doc.splitTextToSize(text, wrapWidth);
        lines.forEach((line) => {
          ensureSpace(14);
          doc.text(line, x, y);
          y += 14;
        });
        return y;
      };

      exportableMessages.forEach((msg) => {
        // Role label
        doc.setFont("helvetica", "bold");
        doc.setFontSize(11);
        doc.setTextColor(
          msg.role === "user" ? 30 : 10,
          msg.role === "user" ? 60 : 150,
          msg.role === "user" ? 110 : 60
        );
        ensureSpace(16);
        doc.text(msg.role === "user" ? "You" : "Assistant", margin, y);
        y += 14;

        // Message content with basic Markdown parsing
        doc.setTextColor(20, 20, 20);
        const blocks = parseMarkdownBlocks(msg.text || "");
        blocks.forEach((block) => {
          switch (block.type) {
            case "heading": {
              doc.setFont("helvetica", "bold");
              const size = Math.max(11, 16 - (block.level - 1));
              doc.setFontSize(size);
              y = drawWrapped(stripInlineMarkdown(block.text), margin);
              doc.setFont("helvetica", "normal");
              doc.setFontSize(11);
              y += 4;
              break;
            }
            case "paragraph": {
              doc.setFont("helvetica", "normal");
              doc.setFontSize(11);
              y = drawWrapped(stripInlineMarkdown(block.text), margin);
              y += 6;
              break;
            }
            case "list": {
              doc.setFont("helvetica", "normal");
              doc.setFontSize(11);
              block.items.forEach((item) => {
                y = drawWrapped(stripInlineMarkdown(item), margin);
              });
              y += 6;
              break;
            }
            case "quote": {
              // Slightly muted text for quote
              doc.setFont("helvetica", "italic");
              doc.setFontSize(11);
              doc.setTextColor(90, 90, 90);
              y = drawWrapped(stripInlineMarkdown("“ " + block.text + " ”"), margin);
              doc.setTextColor(20, 20, 20);
              doc.setFont("helvetica", "normal");
              y += 6;
              break;
            }
            case "code": {
              // Render code block in monospace on shaded background
              const pad = 8;
              const innerWidth = wrapWidth - pad * 2;
              doc.setFont("courier", "normal");
              doc.setFontSize(10);
              // Pre-wrap to compute height
              let wrapped = [];
              block.lines.forEach((line) => {
                const sub = doc.splitTextToSize(line.replace(/\t/g, "  "), innerWidth);
                wrapped = wrapped.concat(sub);
              });
              const lineH = 12; // pts
              const boxH = wrapped.length * lineH + pad * 2;
              ensureSpace(boxH + 6);
              // Background
              doc.setFillColor(246, 248, 250);
              doc.setDrawColor(208, 215, 222);
              doc.setLineWidth(0.5);
              doc.rect(margin, y - 10, wrapWidth + pad * 2 - (pad * 2 - 0), boxH + 12, "FD");
              // Code text
              let cy = y + pad;
              wrapped.forEach((wl) => {
                doc.text(wl, margin + pad, cy);
                cy += lineH;
              });
              y = y + boxH + 6;
              // Reset font
              doc.setFont("helvetica", "normal");
              doc.setFontSize(11);
              break;
            }
            default:
              break;
          }
        });

        y += 4; // space after message
        if (y > pageHeight - margin) {
          doc.addPage();
          y = margin;
        }
      });

      doc.save(filename);
      console.log("Export PDF: Text-based export complete");
      showNotification("📄 PDF exported successfully");
      console.log("=== PDF EXPORT DEBUG END ===");
    } catch (err) {
      console.error("PDF export failed:", err);
      console.error("PDF export error stack:", err.stack);
      showNotification("❌ PDF export failed: " + (err.message || "Unknown error"));
    } finally {
      // Clean up temp nodes
      document.querySelectorAll(".__pdf_export_temp").forEach((n) => n.remove());
      // overlay removed; nothing else to clean
    }
  };

  // Authentication is handled at App level; ChatApp assumes a logged-in user

  return (
    <div
      className={`d-flex ${darkMode ? "dark" : "light"}`}
      style={{
        display: "flex",
        flex: 1,
        overflow: "hidden",
        background: darkMode ? "#0E1114" : "#F5F6FA",
        color: "var(--text)",
        flexDirection: "column",
        height: "100vh",
        maxHeight: "100vh",
        width: "100%",
        minHeight: "100vh",
        position: "relative",
      }}
    >
      {/* Header with theme toggle and share functionality */}
      <Header
        darkMode={darkMode}
        toggleDarkMode={toggleDarkMode}
        onToggleSidebar={onToggleSidebar}
        isMobile={isMobile}
        sidebarCollapsed={sidebarCollapsed}
        activeChat={(outlet.chats || []).find((c) => c.id === activeChatId)}
        messages={activeMessages}
        showExportMenu={true}
        onShareClick={exportActiveChatAsPDF}
        showShareModal={showShareModal}
        setShowShareModal={setShowShareModal}
        shareBtnRef={shareBtnRef}
        sharePopoverRef={sharePopoverRef}
        handleShare={() => handleShareChat(activeChatId)}
        proMode={proMode}
        onUpgradeClick={() => navigate("/update")}
      />

      {/* Chat Area without header - this should handle all scrolling */}
      <div style={{ flex: 1, display: "flex", overflow: "hidden", minHeight: 0 }}>
        <ChatArea
          darkMode={darkMode}
          toggleDarkMode={toggleDarkMode}
          sidebarCollapsed={sidebarCollapsed}
          isMobile={isMobile}
          messages={activeMessages}
          message={input}
          setMessage={setInput}
          onSendMessage={handleSend}
          onStopStreaming={handleStop}
          currentUser={currentUser}
          isLoading={isLoading}
          onToggleSidebar={onToggleSidebar}
          onOpenSettings={handleSettings}
          onShareMessage={handleShareMessage}
          onGlobalShare={handleGlobalShare}
          activeChat={(outlet.chats || []).find((c) => c.id === activeChatId)}
          activeChatId={activeChatId}
        />
      </div>

      <SettingsPanel
        isOpen={showSettings}
        onClose={handleCloseSettings}
        darkMode={darkMode}
        theme={themeMode}
        setTheme={setThemeMode}
        currentUser={currentUser}
        onSettingsChange={handleSettingsChange}
        chats={outlet.chats || []}
        onRestoreChat={handleRestoreChat}
        onPermanentlyDeleteChat={handlePermanentlyDeleteChat}
      />

      {/* ProUpgradeModal retained for legacy triggers; header now navigates to /checkout */}

      {/* Toast notification */}
      {toast.show && (
        <div
          className="toast-notification"
          style={{
            position: "fixed",
            bottom: "20px",
            right: "20px",
            background: "var(--surface)",
            color: "var(--text)",
            padding: "12px 16px",
            borderRadius: "8px",
            border: "1px solid var(--border)",
            boxShadow: "0 4px 12px rgba(0, 0, 0, 0.15)",
            zIndex: 9999,
            fontSize: "14px",
            fontWeight: "500",
            maxWidth: "300px",
            animation: "fadeInUp 0.3s ease-out",
          }}
        >
          {toast.message}
        </div>
      )}
    </div>
  );
}
