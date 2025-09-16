import React, { useState } from "react";
import Sidebar from "../component/sidebar";
import { Outlet, useLocation } from "react-router-dom";
import { useEffect } from "react";

export default function MainLayout(props) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  // settingsOpen is handled inside ChatApp; MainLayout will dispatch an event to open settings there
  const toggleSidebar = () => setSidebarCollapsed((prev) => !prev);

  const location = useLocation();
  const hideSidebarOn = ["/login", "/signup", "/register"];
  const shouldShowSidebar = !hideSidebarOn.includes(location.pathname);

  // Chats state lifted to layout so Sidebar, SettingsPanel and ChatApp share the same data
  const CHAT_STORAGE_KEY = 'quantumchat_chats_v1';
  const [chats, setChats] = useState([]);
  const [activeChatId, setActiveChatId] = useState(null);

  // Load chats from localStorage once
  useEffect(() => {
    try {
      const raw = localStorage.getItem(CHAT_STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          setChats(parsed);
          const firstActive = parsed.find(c => !c.archived);
          if (firstActive) setActiveChatId(firstActive.id);
        }
      }
    } catch (e) {
      console.warn('Failed to load chats from storage', e);
    }
  }, []);

  // Persist chats to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(CHAT_STORAGE_KEY, JSON.stringify(chats));
    } catch (e) {
      console.warn('Failed to save chats to storage', e);
    }
  }, [chats]);

  const sidebarWidth = sidebarCollapsed ? 60 : 260;

  // Chat operations exposed to children
  const handleNewChat = () => {
    const newChat = { id: Date.now().toString(), title: 'New Chat', createdAt: new Date().toISOString(), archived: false, messages: [] };
    setChats(prev => [newChat, ...prev]);
    setActiveChatId(newChat.id);
  };

  const handleSelectChat = (chatId) => {
    setActiveChatId(chatId);
  };

  const handleArchiveChat = (chatId) => {
    setChats(prev => prev.map(c => c.id === chatId ? { ...c, archived: true, archivedAt: new Date().toISOString() } : c));
    if (activeChatId === chatId) setActiveChatId(null);
  };

  const handleRestoreChat = (chatId) => {
    setChats(prev => prev.map(c => c.id === chatId ? { ...c, archived: false, archivedAt: undefined } : c));
  };

  const handlePermanentlyDeleteChat = (chatId) => {
    setChats(prev => prev.filter(c => c.id !== chatId));
    if (activeChatId === chatId) setActiveChatId(null);
  };

  const handleRenameChat = (chatId, newTitle) => {
    setChats(prev => prev.map(c => c.id === chatId ? { ...c, title: newTitle } : c));
  };

  const handleDeleteChat = (chatId) => {
    // same as permanently delete for now
    handlePermanentlyDeleteChat(chatId);
  };
  return (
    <div className="app-container" style={{ display: "flex", minHeight: "100vh" }}>
      {shouldShowSidebar && (
        <Sidebar
          {...props}
          isCollapsed={sidebarCollapsed}
          onToggle={toggleSidebar}
          onSettings={() => window.dispatchEvent(new CustomEvent('open-settings'))}
          chats={chats}
          activeChatId={activeChatId}
          onNewChat={handleNewChat}
          onSelectChat={handleSelectChat}
          onArchive={handleArchiveChat}
          onRename={handleRenameChat}
          onDelete={handleDeleteChat}
          onShare={props.onShare}
        />
      )}
      <div
        className={`main-content${shouldShowSidebar ? "" : " auth-page"}`}
        style={{
          flex: 1,
          marginLeft: shouldShowSidebar ? `${sidebarWidth}px` : 0
        }}
      >
        <Outlet context={{
          currentUser: props.currentUser,
          onLogout: props.onLogout,
          chats,
          setChats,
          activeChatId,
          setActiveChatId,
          onNewChat: handleNewChat,
          onSelectChat: handleSelectChat,
          onArchive: handleArchiveChat,
          onRestoreChat: handleRestoreChat,
          onPermanentlyDeleteChat: handlePermanentlyDeleteChat,
          onRename: handleRenameChat,
          onDelete: handleDeleteChat
        }} />
      </div>
      {/* SettingsPanel is owned by ChatApp so it has access to chats and handlers; MainLayout opens it via a window event */}
    </div>
  );
}
