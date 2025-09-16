import React, { useState, useEffect, useRef } from 'react';
import {
  LogOut,
  Plus,
  X,
  Menu,
  Search,
  Book,
  Zap,
  Grid3X3,
  Folder,
  User,
  ArrowUp,
  Settings,
  HelpCircle
} from 'lucide-react';
import gptIcon from '../assets/quantum-chat-icon.png';
import ChatActionsDropdown from './ChatActionsDropdown';

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
  onRename,
  onArchive,
  onDelete
}) {
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showSearchModal, setShowSearchModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredChats, setFilteredChats] = useState(chats);
  const [openDropdownChatId, setOpenDropdownChatId] = useState(null);

  const scrollContainerRef = useRef(null);
  const prevChatsLength = useRef(chats.length);

  // Update filtered chats when search term or chats change
  useEffect(() => {
    if (searchTerm.trim() === '') {
      setFilteredChats(chats);
    } else {
      setFilteredChats(
        chats.filter((chat) =>
          chat.title.toLowerCase().includes(searchTerm.toLowerCase())
        )
      );
    }
  }, [searchTerm, chats]);

  // Scroll only when a new chat is added
  useEffect(() => {
    if (scrollContainerRef.current && chats.length > prevChatsLength.current) {
      scrollContainerRef.current.scrollTop = scrollContainerRef.current.scrollHeight;
    }
    prevChatsLength.current = chats.length;
  }, [chats]);

  const shouldShowFull = !isCollapsed;
  const sidebarWidth = shouldShowFull ? '280px' : '60px';

  const navButtonStyle = {
    background: 'none',
    border: 'none',
    transition: 'background-color 0.2s',
    width: '100%',
    textAlign: 'start',
    padding: '6px 12px',
    borderRadius: '0.5rem',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    cursor: 'pointer'
  };

  const handleHover = (e) => {
    e.target.style.backgroundColor = darkMode ? '#333' : '#f8f9fa';
  };
  const handleLeave = (e) => {
    e.target.style.backgroundColor = 'transparent';
  };

  return (
    <div
      className={`d-flex flex-column shadow ${darkMode ? 'bg-dark text-white' : 'bg-light'}`}
      style={{
        width: sidebarWidth,
        borderRight: `1px solid ${darkMode ? '#333' : 'var(--bs-border-color)'}`,
        height: '100vh',
        position: 'fixed',
        top: 0,
        left: 0,
        zIndex: 1000,
        transition: 'width 0.3s ease-in-out',
      }}
    >
      {/* Header - Fixed at top */}
      <div
        className={`d-flex align-items-center justify-content-between p-3 ${darkMode ? 'border-bottom border-dark' : 'border-bottom'}`}
        style={{ 
          minHeight: '60px',
          flexShrink: 0,
          borderBottom: `1px solid ${darkMode ? '#333' : 'var(--bs-border-color)'}`
        }}
      >
        {shouldShowFull ? (
          <>
            <div className="d-flex align-items-center gap-2">
              <img src={gptIcon} alt="ChatClone Logo" style={{ width: '24px', height: '24px' }} />
              <h2 className="h5 fw-bold mb-0 gradient-text" style={{ whiteSpace: 'nowrap' }}>
                ChatClone
              </h2>
            </div>
            <button
              onClick={onToggle}
              className="btn btn-sm"
              style={{ background: 'none', border: 'none', color: darkMode ? 'white' : 'black' }}
            >
              <X size={16} />
            </button>
          </>
        ) : (
          <button
            onClick={onToggle}
            className="btn btn-sm mx-auto"
            style={{ background: 'none', border: 'none', color: darkMode ? 'white' : 'black' }}
            title="Expand Sidebar"
          >
            <Menu size={16} />
          </button>
        )}
      </div>

      {/* Unified Scrollable Content - Everything scrolls together like ChatGPT */}
      <div
        className="d-flex flex-column flex-grow-1"
        style={{ 
          minHeight: 0, 
          overflowY: 'auto', 
          overflowX: 'hidden',
          scrollbarWidth: 'thin',
          scrollbarColor: darkMode ? '#555 transparent' : '#ccc transparent'
        }}
        ref={scrollContainerRef}
      >
        {/* Action Buttons Section */}
        <div className={`${shouldShowFull ? 'p-3' : 'p-2'}`} style={{ flexShrink: 0 }}>
          {shouldShowFull ? (
            <>
              <button
                onClick={onNewChat}
                className="btn text-white w-100 mb-3 rounded-3 d-flex align-items-center justify-content-center gap-2"
                style={{ background: 'linear-gradient(to right, #3b82f6, #8b5cf6)', border: 'none' }}
              >
                <Plus size={16} /> New Chat
              </button>

              <button
                onClick={() => setShowSearchModal(true)}
                className={`btn w-100 mb-3 rounded-3 d-flex align-items-center gap-2 ${darkMode ? 'text-white' : 'text-dark'}`}
                style={{ background: 'none', border: 'none' }}
                onMouseEnter={handleHover}
                onMouseLeave={handleLeave}
              >
                <Search size={16} /> Search Chats
              </button>
            </>
          ) : (
            <>
              <button
                onClick={onNewChat}
                className="btn text-white w-100 mb-3 rounded-3 d-flex justify-content-center"
                style={{ background: 'linear-gradient(to right, #3b82f6, #8b5cf6)', border: 'none' }}
                title="New Chat"
              >
                <Plus size={16} />
              </button>
              <button
                onClick={() => setShowSearchModal(true)}
                className={`btn w-100 mb-3 rounded-3 d-flex justify-content-center ${darkMode ? 'text-white' : 'text-dark'}`}
                style={{ background: 'none', border: 'none' }}
                title="Search Chats"
              >
                <Search size={16} />
              </button>
              <button
                className={`btn w-100 mb-3 rounded-3 d-flex justify-content-center ${darkMode ? 'text-white' : 'text-dark'}`}
                style={{ background: 'none', border: 'none' }}
                title="Library"
              >
                <Book size={16} />
              </button>
            </>
          )}
        </div>

        {/* Navigation Links Section */}
        {shouldShowFull && (
          <div className="px-3" style={{ flexShrink: 0 }}>
            <div className="d-flex flex-column gap-1 mb-3">
              <button style={navButtonStyle} className={darkMode ? 'text-white' : 'text-dark'} onMouseEnter={handleHover} onMouseLeave={handleLeave}>
                <Book size={16} /> Library
              </button>
              <button style={navButtonStyle} className={darkMode ? 'text-white' : 'text-dark'} onMouseEnter={handleHover} onMouseLeave={handleLeave}>
                <Zap size={16} /> AI Tools
              </button>
              <button style={navButtonStyle} className={darkMode ? 'text-white' : 'text-dark'} onMouseEnter={handleHover} onMouseLeave={handleLeave}>
                <Grid3X3 size={16} /> Templates
              </button>
              <button style={navButtonStyle} className={darkMode ? 'text-white' : 'text-dark'} onMouseEnter={handleHover} onMouseLeave={handleLeave}>
                <Folder size={16} /> Projects
              </button>
            </div>
          </div>
        )}

        {/* Archived Chats Section */}
        {shouldShowFull && (
          <div className="px-3 mb-3" style={{ flexShrink: 0 }}>
            <h6 className={`mb-2 ${darkMode ? 'text-light' : 'text-muted'}`} style={{ fontSize: '12px', fontWeight: '600', textTransform: 'uppercase' }}>
              Archived Chats
            </h6>
            {chats.filter((c) => c.archived).length === 0 ? (
              <small className={`${darkMode ? 'text-light' : 'text-muted'} d-block`} style={{ opacity: 0.7 }}>
                No archived chats
              </small>
            ) : (
              chats.filter((c) => c.archived).map((chat) => (
                <div
                  key={chat.id}
                  onClick={() => onSelectChat(chat.id)}
                  className="p-2 rounded-3 mb-2"
                  style={{
                    cursor: 'pointer',
                    backgroundColor: activeChatId === chat.id ? '#0d6efd' : 'transparent',
                    transition: 'background-color 0.2s ease',
                  }}
                  onMouseEnter={(e) => {
                    if (activeChatId !== chat.id) {
                      e.currentTarget.style.backgroundColor = darkMode ? '#2a2a2a' : '#f1f1f1';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (activeChatId !== chat.id) {
                      e.currentTarget.style.backgroundColor = 'transparent';
                    }
                  }}
                >
                  <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', fontSize: '14px', opacity: 0.8 }}>
                    {chat.title}
                  </span>
                </div>
              ))
            )}
          </div>
        )}

        {/* Recent Chats Section - No separate scrolling, part of main flow */}
        {shouldShowFull && (
          <div className="px-3 flex-grow-1">
            <h6 className={`mb-2 ${darkMode ? 'text-light' : 'text-muted'}`} style={{ fontSize: '12px', fontWeight: '600', textTransform: 'uppercase' }}>
              Recent Chats
            </h6>
            {chats.filter(chat => !chat.archived).length === 0 ? (
              <small className={`${darkMode ? 'text-light' : 'text-muted'} d-block`} style={{ opacity: 0.7 }}>
                No chats found
              </small>
            ) : (
              chats.filter(chat => !chat.archived).map((chat) => (
                <div
                  key={chat.id}
                  onClick={() => onSelectChat(chat.id)}
                  className={`p-2 rounded-3 mb-2 d-flex justify-content-between align-items-center ${activeChatId === chat.id ? 'bg-primary text-white' : ''}`}
                  style={{
                    cursor: 'pointer',
                    backgroundColor: activeChatId === chat.id ? '#0d6efd' : 'transparent',
                    transition: 'background-color 0.2s ease',
                  }}
                  onMouseEnter={(e) => {
                    if (activeChatId !== chat.id) {
                      e.currentTarget.style.backgroundColor = darkMode ? '#2a2a2a' : '#f1f1f1';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (activeChatId !== chat.id) {
                      e.currentTarget.style.backgroundColor = 'transparent';
                    }
                  }}
                >
                  <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', fontSize: '14px' }}>
                    {chat.title}
                  </span>
                  {/* Dropdown fixed to viewport */}
                  <div style={{ position: 'relative', zIndex: 1000 }}>
                    <ChatActionsDropdown
                      chat={chat}
                      darkMode={darkMode}
                      onRename={onRename}
                      onArchive={onArchive}
                      onDelete={onDelete}
                      openDropdownChatId={openDropdownChatId}
                      setOpenDropdownChatId={setOpenDropdownChatId}
                    />
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {/* User Profile - Fixed at bottom like ChatGPT */}
      <div 
        className={`${shouldShowFull ? 'p-3 border-top' : 'p-2'} mt-auto`} 
        style={{ 
          flexShrink: 0,
          borderTop: `1px solid ${darkMode ? '#333' : 'var(--bs-border-color)'}`,
          background: darkMode ? '#111' : '#fff' 
        }}
      >
        {shouldShowFull ? (
          <>
            <div 
              className="d-flex align-items-center" 
              style={{ cursor: 'pointer' }} 
              onClick={() => setShowUserMenu(!showUserMenu)}
            >
              <div className="d-flex align-items-center gap-2">
                <div
                  className={`rounded-circle d-flex align-items-center justify-content-center ${darkMode ? 'bg-dark border border-secondary' : 'bg-light'}`}
                  style={{ width: '32px', height: '32px' }}
                >
                  <User size={16} />
                </div>
                <div>
                  <div className="fw-semibold small">{currentUser?.name || 'User'}</div>
                  <small className={darkMode ? 'text-light' : 'text-muted'}>Free Plan</small>
                </div>
              </div>
            </div>

            {showUserMenu && (
              <div
                className={`position-absolute bottom-100 w-100 mb-2 rounded-3 shadow ${darkMode ? 'bg-dark border border-secondary' : 'bg-white border'}`}
                style={{ left: '12px', right: '12px', zIndex: 1000 }}
              >
                <div className="p-2">
                  <button className={`btn w-100 text-start mb-1 ${darkMode ? 'text-white' : 'text-dark'}`} style={{ background: 'none', border: 'none' }}>
                    <ArrowUp size={14} className="me-2" /> Upgrade Plan
                  </button>
                  <button
                    className={`btn w-100 text-start mb-1 ${darkMode ? 'text-white' : 'text-dark'}`}
                    style={{ background: 'none', border: 'none' }}
                    onClick={() => {
                      setShowUserMenu(false);
                      onSettings && onSettings();
                    }}
                  >
                    <Settings size={14} className="me-2" /> Settings
                  </button>
                  <button className={`btn w-100 text-start mb-1 ${darkMode ? 'text-white' : 'text-dark'}`} style={{ background: 'none', border: 'none' }}>
                    <HelpCircle size={14} className="me-2" /> Help
                  </button>
                  <button onClick={onLogout} className="btn btn-outline-danger w-100 text-start" style={{ border: 'none' }}>
                    <LogOut size={14} className="me-2" /> Logout
                  </button>
                </div>
              </div>
            )}
          </>
        ) : (
          <button
            className={`btn w-100 rounded-3 d-flex justify-content-center ${darkMode ? 'text-white' : 'text-dark'}`}
            style={{ background: 'none', border: 'none' }}
            title="Account"
            onClick={() => setShowUserMenu(!showUserMenu)}
          >
            <User size={16} />
          </button>
        )}
      </div>

      {/* Search Modal */}
      {showSearchModal && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            backgroundColor: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 2000,
          }}
          onClick={() => setShowSearchModal(false)}
        >
          <div
            className={`p-4 rounded-3 shadow ${darkMode ? 'bg-dark text-white' : 'bg-light'}`}
            style={{ width: '400px', maxHeight: '80vh', overflowY: 'auto' }}
            onClick={(e) => e.stopPropagation()}
          >
            <h5>Search Chats</h5>
            <input
              type="text"
              className="form-control mt-2 mb-3"
              placeholder="Search chats..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <div>
              {filteredChats.length === 0 ? (
                <small className={darkMode ? 'text-light' : 'text-muted'}>No chats found</small>
              ) : (
                filteredChats.map((chat) => (
                  <div
                    key={chat.id}
                    onClick={() => {
                      onSelectChat(chat.id);
                      setShowSearchModal(false);
                    }}
                    className="p-2 rounded-3 mb-2"
                    style={{
                      cursor: 'pointer',
                      backgroundColor: activeChatId === chat.id ? '#0d6efd' : darkMode ? '#2a2a2a' : '#f9f9f9',
                      color: activeChatId === chat.id ? 'white' : darkMode ? 'white' : 'black',
                    }}
                  >
                    {chat.title}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}