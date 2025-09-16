import React, { useState } from 'react';
import SidebarHeader from './sidebar/SidebarHeader';
import SidebarActions from './sidebar/SidebarActions';
import SidebarNav from './sidebar/SidebarNav';
import ChatList from './sidebar/ChatList';
import UserProfile from './sidebar/UserProfile';
import SearchModal from './SearchModal';
import '../styles/sidebar-enhanced.css';

export default function Sidebar({
  darkMode,
  chats = [],
  onNewChat,
  onLogout,
  isCollapsed,
  onToggle,
  currentUser,
  onSelectChat,
  activeChatId,
  onSettings,
  isMobile,
  onArchive,
  onRename,
  onDelete,
  onShare
}) {
  const [showSearchModal, setShowSearchModal] = useState(false);
  const shouldShowFull = !isCollapsed;
  const activeChats = chats.filter(c => !c.archived);

  return (
    <>
      <div
        className={`sidebar ${isMobile ? 'mobile' : ''} ${isCollapsed ? 'collapsed' : ''}`}
        style={{
          width: shouldShowFull ? 'var(--sidebar-width)' : '60px',
          left: 0,
          transform: isMobile && isCollapsed ? 'translateX(-100%)' : 'translateX(0)'
        }}
        data-theme={darkMode ? 'dark' : 'light'}
      >
        <SidebarHeader
          isCollapsed={isCollapsed}
          onToggle={onToggle}
          isMobile={isMobile}
          shouldShowFull={shouldShowFull}
        />
        <div className="sidebar-content">
          <SidebarActions
            isCollapsed={isCollapsed}
            onNewChat={onNewChat}
            onSearchClick={() => setShowSearchModal(true)}
            shouldShowFull={shouldShowFull}
          />
         
          <SidebarNav
            isCollapsed={isCollapsed}
            shouldShowFull={shouldShowFull}
            onSearchClick={() => setShowSearchModal(true)}
          />
          <ChatList
            chats={activeChats}
            activeChatId={activeChatId}
            onSelectChat={onSelectChat}
            isCollapsed={isCollapsed}
            shouldShowFull={shouldShowFull}
            onArchive={onArchive}
            onRename={onRename}
            onDelete={onDelete}
            onShare={onShare}
          />
        </div>
        <UserProfile
          currentUser={currentUser}
          isCollapsed={isCollapsed}
          shouldShowFull={shouldShowFull}
          onLogout={onLogout}
          onSettings={onSettings}
        />
      </div>
      <SearchModal
        show={showSearchModal}
        onClose={() => setShowSearchModal(false)}
        chats={chats}
        onSelectChat={onSelectChat}
        darkMode={darkMode}
      />
    </>
  );
}
