// client/src/ChatApp.jsx

import React, { useState, useEffect, useRef } from 'react';
import { useOutletContext } from 'react-router-dom';
import ChatArea from './component/ChatArea';
import SettingsPanel from './component/SettingsPanel/SettingsPanel';
import useThemeToggle from './utils/useThemeToggle';
import {
  generateGeminiResponse,
  generateGeminiStreamResponse,
  isGeminiConfigured,
  generateConversationTitle
} from './services/geminiService';

export default function ChatApp() {
  const { darkMode, toggleTheme, themePreference, setTheme } = useThemeToggle(false);
  const outlet = useOutletContext?.() || {};
  const currentUser = outlet.currentUser || null;
  const chats = outlet.chats || [];
  const setChats = outlet.setChats || (()=>{});
  const activeChatId = outlet.activeChatId;
  const setActiveChatId = outlet.setActiveChatId || (()=>{});
  const onNewChat = outlet.onNewChat || (()=>{});
  const onSelectChat = outlet.onSelectChat || (()=>{});
  const onArchive = outlet.onArchive || (()=>{});
  const onRestoreChat = outlet.onRestoreChat || (()=>{});
  const onPermanentlyDeleteChat = outlet.onPermanentlyDeleteChat || (()=>{});
  const onRename = outlet.onRename || (()=>{});
  const onDelete = outlet.onDelete || (()=>{});
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [streamingResponse, setStreamingResponse] = useState('');
  const [forceUpdate, setForceUpdate] = useState(0);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  const [messages, setMessages] = useState([]);
  const [activeMessages, setActiveMessages] = useState([]);
  const [input, setInput] = useState("");
  const hasLoadedChatsRef = useRef(false);

  // Responsive sidebar
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    handleResize();
    window.addEventListener('resize', handleResize);
    // Open settings when triggered by layout/profile
    const openSettingsHandler = () => setShowSettings(true);
    window.addEventListener('open-settings', openSettingsHandler);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  useEffect(() => {
    const openSettingsHandler = () => setShowSettings(true);
    window.addEventListener('open-settings', openSettingsHandler);
    return () => window.removeEventListener('open-settings', openSettingsHandler);
  }, []);

  // Sync active messages when shared chats or activeChatId change
  useEffect(() => {
    const current = (outlet.chats || []).find(c => c.id === outlet.activeChatId);
    setActiveMessages(current?.messages || []);
  }, [outlet.chats, outlet.activeChatId]);

  const toggleDarkMode = () => { toggleTheme(); setTimeout(() => setForceUpdate(prev => prev + 1), 0); };
  const toggleSidebar = () => setSidebarCollapsed(!sidebarCollapsed);
  const handleSettings = () => setShowSettings(true);
  const handleCloseSettings = () => setShowSettings(false);
  const handleSettingsChange = (newSettings) => {
    if (newSettings.appearance?.theme !== themePreference) setTheme(newSettings.appearance.theme);
  };

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;
    let currentChatId = activeChatId;
    if (!currentChatId) {
      onNewChat();
      currentChatId = (outlet.chats && outlet.chats[0])?.id || chats[0]?.id;
    }
    if (!currentChatId) return;
    if (currentChatId !== activeChatId) setActiveChatId(currentChatId);

    const userMsg = { role: 'user', text: input.trim(), time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) };
    setInput('');
    setIsLoading(true);
    setStreamingResponse('');

  setChats(prev => prev.map(c => c.id === currentChatId ? { ...c, messages: [...(c.messages||[]), userMsg] } : c));
    setActiveMessages(prev => [...prev, userMsg]);

    try {
      if (!isGeminiConfigured()) throw new Error('Gemini API key not configured.');

      const tempAi = { role: 'ai', text: '', time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }), isStreaming: true };
  setChats(prev => prev.map(c => c.id === currentChatId ? { ...c, messages: [...c.messages, tempAi] } : c));
      setActiveMessages(prev => [...prev, tempAi]);

      let accumulated = '';
      const convoHistory = [...(chats.find(c => c.id === currentChatId)?.messages || []), userMsg];

      const fullResponse = await generateGeminiStreamResponse(userMsg.text, convoHistory, (chunk, isComplete, errorMessage) => {
        if (errorMessage) { console.error(errorMessage); return; }
        if (chunk) {
          accumulated += chunk;
          setStreamingResponse(accumulated);
          setChats(prev => prev.map(c => {
            if (c.id !== currentChatId) return c;
            const msgs = [...c.messages];
            const last = msgs[msgs.length - 1];
            if (last?.isStreaming) last.text = accumulated;
            return { ...c, messages: msgs };
          }));
          setActiveMessages(prev => {
            const updated = [...prev];
            const last = updated[updated.length - 1];
            if (last?.isStreaming) last.text = accumulated;
            return updated;
          });
        }
        if (isComplete) {
          setChats(prev => prev.map(c => {
            if (c.id !== currentChatId) return c;
            const msgs = [...c.messages];
            const last = msgs[msgs.length - 1];
            if (last?.isStreaming) last.isStreaming = false;
            return { ...c, messages: msgs };
          }));
          setActiveMessages(prev => {
            const updated = [...prev];
            const last = updated[updated.length - 1];
            if (last?.isStreaming) last.isStreaming = false;
            return updated;
          });
        }
      });

  const currentChat = (outlet.chats || chats).find(c => c.id === currentChatId);
      if (currentChat && currentChat.title === 'New Chat') {
        try {
          const draftHistory = [...(currentChat.messages || []), { role: 'ai', text: fullResponse }];
          const newTitle = await generateConversationTitle(draftHistory);
          if (newTitle && newTitle.trim()) {
            setChats(prev => prev.map(c => c.id === currentChatId ? { ...c, title: newTitle.trim() } : c));
          }
        } catch { }
      }
    } catch (error) {
      const errMsg = { role: 'ai', text: `Sorry, I encountered an error: ${error.message}`, time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }), isError: true };
      setChats(prev => prev.map(c => {
        if (c.id !== (activeChatId || currentChatId)) return c;
        const msgs = [...c.messages];
        if (msgs[msgs.length - 1]?.isStreaming) msgs[msgs.length - 1] = errMsg; else msgs.push(errMsg);
        return { ...c, messages: msgs };
      }));
      setActiveMessages(prev => {
        const updated = [...prev];
        if (updated[updated.length - 1]?.isStreaming) updated[updated.length - 1] = errMsg; else updated.push(errMsg);
        return updated;
      });
    } finally {
      setIsLoading(false);
      setStreamingResponse('');
    }
  };

  const handleNewChat = () => {
    onNewChat();
    setActiveMessages([]);
    setStreamingResponse('');
  };

  const handleSelectChat = (chatId) => {
    onSelectChat(chatId);
    const target = (outlet.chats || chats).find(c => c.id === chatId);
    setActiveMessages(target?.messages || []);
  };

  const handleArchiveChat = (chatId) => {
    onArchive(chatId);
    if (outlet.activeChatId === chatId) { setActiveMessages([]); }
  };

  const handleRestoreChat = (chatId) => {
    onRestoreChat(chatId);
  };

  const handlePermanentlyDeleteChat = (chatId) => {
    onPermanentlyDeleteChat(chatId);
    if (outlet.activeChatId === chatId) { setActiveMessages([]); }
  };

  // 📤 New helper function to handle sharing logic
  const shareData = async (data, title) => {
    const encodedData = btoa(JSON.stringify(data));
    const shareUrl = `${window.location.origin}/shared-chat?data=${encodedData}`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: title,
          text: `Check out this content from QuantumChat.`,
          url: shareUrl
        });
        showNotification('📤 Shared successfully.');
        return;
      } catch (err) {
        if (err.name === 'AbortError') return; // User cancelled
        console.error('Share failed:', err);
      }
    }
    // Fallback: copy link to clipboard
    await navigator.clipboard.writeText(shareUrl);
    showNotification('📋 Link copied to clipboard.');
  };

  // 🔹 Share whole chat
  const handleShareChat = async (chatId) => {
    const chatToShare = chats.find(chat => chat.id === chatId);
    if (!chatToShare || chatToShare.messages.length === 0) {
      // You'll need a showNotification function
      showNotification('Cannot share an empty chat.');
      return;
    }
    const chatData = {
      title: chatToShare.title,
      messages: chatToShare.messages.map(msg => ({ role: msg.role, text: msg.text }))
    };
    await shareData(chatData, chatToShare.title);
  };

  // 🔹 Share single message
  const handleShareMessage = async (messageToShare) => {
    const chatData = {
      title: 'QuantumChat Message',
      messages: [{ role: messageToShare.role, text: messageToShare.text }]
    };
    await shareData(chatData, 'QuantumChat Message');
  };

  // 🔹 Global share button for active chat
  const handleGlobalShare = () => {
    if (!activeChatId) {
      showNotification('No active chat to share.');
      return;
    }
    handleShareChat(activeChatId);
  };

  // Authentication is handled at App level; ChatApp assumes a logged-in user

  return (
    <div className={`d-flex ${darkMode ? 'dark' : 'light'}`} style={{ display: 'flex', flex: 1, overflow: 'hidden', background: 'var(--bg)', color: 'var(--text)' }}>
      {/* Sidebar is rendered by MainLayout. ChatApp should flex to fill the available space provided by MainLayout */}

      <ChatArea
        darkMode={darkMode}
        toggleDarkMode={toggleDarkMode}
        sidebarCollapsed={sidebarCollapsed}
        messages={activeMessages}
        message={input}
        setMessage={setInput}
        onSendMessage={handleSend}
        currentUser={currentUser}
        isLoading={isLoading}
        forceUpdate={forceUpdate}
        onToggleSidebar={toggleSidebar}
        onOpenSettings={handleSettings}
        onShareMessage={handleShareMessage}
        onGlobalShare={handleGlobalShare}
      />

      <SettingsPanel
        isOpen={showSettings}
        onClose={handleCloseSettings}
        darkMode={darkMode}
        theme={themePreference}
        setTheme={setTheme}
        currentUser={currentUser}
        onSettingsChange={handleSettingsChange}
        chats={chats}
        onRestoreChat={handleRestoreChat}
        onPermanentlyDeleteChat={handlePermanentlyDeleteChat}
      />
    </div>
  );
}

// Dummy showNotification function to avoid errors. You should implement this with a toast library.
function showNotification(message) {
  console.log(message);
}