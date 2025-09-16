import React, { useState, useEffect } from 'react';
import Sidebar from './component/sidebar';
import ChatArea from './component/ChatArea';
import SettingsPanel from './component/SettingsPanel/SettingsPanel';
import {
  generateGeminiStreamResponse,
  isGeminiConfigured,
  generateConversationTitle,
} from './services/geminiService';

// Notice it now receives `user` and `onLogout` as props from App.jsx
export default function ChatApp({ user, onLogout }) { 
  const [darkMode, setDarkMode] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [theme, setTheme] = useState("system");
  const [isLoading, setIsLoading] = useState(false);

  const [messages, setMessages] = useState([
    {
      role: "ai",
      text: `Hello ${user.name || user.username}! I'm powered by Google's Gemini AI. How can I help you today?`,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    },
  ]);
  const [input, setInput] = useState("");

  const [chats] = useState([
    { title: "How to learn React?", id: 1 },
    { title: "JavaScript tips", id: 2 },
  ]);

  const [activeChatId, setActiveChatId] = useState(1);

  useEffect(() => {
    const userTheme = user.preferences?.theme || 'system';
    setTheme(userTheme);
  }, [user]);

  useEffect(() => {
    const systemPrefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    let shouldBeDark = theme === 'dark' || (theme === 'system' && systemPrefersDark);
    setDarkMode(shouldBeDark);
    document.body.className = shouldBeDark ? 'bg-dark text-white' : 'bg-light text-dark';
  }, [theme]);

  const toggleDarkMode = () => {
    const newTheme = darkMode ? 'light' : 'dark';
    setTheme(newTheme);
  };

  const toggleSidebar = () => setSidebarCollapsed(!sidebarCollapsed);
  const handleSettings = () => setShowSettings(true);
  const handleCloseSettings = () => setShowSettings(false);

  const handleSettingsChange = (newSettings) => {
    if (newSettings.appearance?.theme !== theme) {
      setTheme(newSettings.appearance.theme);
    }
  };

  const handleSend = async () => {
    if (input.trim() && !isLoading) {
      const userMessage = { role: "user", text: input.trim(), time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) };
      const newMessages = [...messages, userMessage];
      setMessages(newMessages);
      const currentInput = input.trim();
      setInput("");
      setIsLoading(true);

      try {
        if (!isGeminiConfigured()) throw new Error('Gemini API key not configured.');
        const tempAiMessage = { role: "ai", text: '', time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }), isStreaming: true };
        setMessages(prev => [...prev, tempAiMessage]);

        await generateGeminiStreamResponse(currentInput, newMessages, (chunk, isComplete) => {
          if (chunk) {
            setMessages(prev => {
              const updated = [...prev];
              const last = updated[updated.length - 1];
              if (last.isStreaming) last.text += chunk;
              return updated;
            });
          }
          if (isComplete) {
            setMessages(prev => prev.map(m => m.isStreaming ? { ...m, isStreaming: false } : m));
          }
        });
        
        if (newMessages.length <= 2) {
          const title = await generateConversationTitle(newMessages);
          console.log('Generated conversation title:', title);
        }
      } catch (error) {
        console.error('Error getting AI response:', error);
        const errorMessage = { role: "ai", text: `Sorry, an error occurred.`, time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }), isError: true };
        setMessages(prev => prev.map(m => m.isStreaming ? errorMessage : m));
      } finally {
        setIsLoading(false);
      }
    }
  };

  const handleNewChat = () => {
    setMessages([{ role: "ai", text: "Hello! How can I help you today?", time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }]);
    setActiveChatId(null);
  };

  const handleSelectChat = (chatId) => {
    setActiveChatId(chatId);
    setMessages([{ role: "ai", text: `Welcome back to chat ${chatId}!`, time: "10:00 AM" }]);
  };

  return (
    <div className={`d-flex ${darkMode ? 'bg-dark text-white' : 'bg-light text-dark'}`} style={{height: '100vh', overflow: 'hidden'}}>
      <Sidebar
        darkMode={darkMode} chats={chats} onNewChat={handleNewChat} onLogout={onLogout}
        isCollapsed={sidebarCollapsed} onToggle={toggleSidebar} currentUser={user}
        onSelectChat={handleSelectChat} activeChatId={activeChatId} onSettings={handleSettings}
      />
      <ChatArea
        darkMode={darkMode} toggleDarkMode={toggleDarkMode} sidebarCollapsed={sidebarCollapsed}
        messages={messages} message={input} setMessage={setInput} onSendMessage={handleSend}
        currentUser={user} isLoading={isLoading}
      />
      <SettingsPanel
        isOpen={showSettings} onClose={handleCloseSettings} darkMode={darkMode}
        theme={theme} setTheme={setTheme} currentUser={user} onSettingsChange={handleSettingsChange}
      />
    </div>
  );
}