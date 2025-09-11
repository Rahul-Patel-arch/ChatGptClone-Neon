import React, { useState } from 'react';
import { LogOut, MessageSquare, Plus, X, Menu, Search, Book, Zap, Grid3X3, Folder, User, ArrowUp, Settings, HelpCircle } from 'lucide-react';
import gptIcon from '../assets/gpt-clone-icon.png';

export default function Sidebar({ 
  darkMode, 
  chats, 
  onNewChat, 
  onLogout, 
  isCollapsed,
  onToggle,
  currentUser,
  onSelectChat,
  activeChatId,
  onSettings
}) {
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showSearchModal, setShowSearchModal] = useState(false);
  
  const shouldShowFull = !isCollapsed;
  const sidebarWidth = shouldShowFull ? '280px' : '60px';

  return (
    <>
      <div
        className={`d-flex flex-column shadow ${
          darkMode ? 'bg-dark text-white' : 'bg-light'
        }`}
        style={{
          width: sidebarWidth,
          borderRight: `1px solid ${darkMode ? '#333' : 'var(--bs-border-color)'}`,
          height: '100vh',
          position: 'fixed',
          top: 0,
          left: 0,
          zIndex: 1000,
          transition: 'width 0.3s ease-in-out',
          overflow: 'hidden'
        }}
      >
      {/* Header with Toggle Button */}
      <div className={`d-flex align-items-center justify-content-between p-3 ${
        darkMode ? 'border-bottom border-dark' : 'border-bottom'
      }`} style={{minHeight: '60px'}}>
        {shouldShowFull ? (
          <>
            <div className="d-flex align-items-center gap-2">
              <img src={gptIcon} alt="ChatClone Logo" style={{width: '24px', height: '24px'}} />
              <h2 className="h5 fw-bold mb-0 gradient-text" style={{whiteSpace: 'nowrap'}}>ChatClone</h2>
            </div>
            <button
              onClick={onToggle}
              className={`btn btn-sm rounded-3 ${
                darkMode ? 'text-white' : 'btn-outline-secondary'
              }`}
              style={{
                background: 'none',
                border: 'none'
              }}
            >
              <X size={16} />
            </button>
          </>
        ) : (
          <button
            onClick={onToggle}
            className={`btn btn-sm rounded-3 mx-auto ${
              darkMode ? 'text-white' : 'btn-outline-secondary'
            }`}
            style={{
              background: 'none',
              border: 'none'
            }}
            title="Expand Sidebar"
          >
            <Menu size={16} />
          </button>
        )}
      </div>

      {/* Navigation Menu */}
      {shouldShowFull ? (
        <div className={`p-3 ${darkMode ? 'border-bottom border-dark' : 'border-bottom'}`}>
          {/* New Chat Button */}
          <button
            onClick={onNewChat}
            className="btn text-white w-100 mb-3 rounded-3 d-flex align-items-center justify-content-center gap-2"
            style={{
              background: 'linear-gradient(to right, #3b82f6, #8b5cf6)', 
              border: 'none'
            }}
          >
            <Plus size={16} /> New Chat
          </button>

          {/* Search Toggle */}
          <button
            onClick={() => setShowSearchModal(true)}
            className={`btn w-100 mb-2 rounded-3 d-flex align-items-center gap-2 ${
              darkMode 
                ? 'text-white hover-bg-secondary' 
                : 'text-dark hover-bg-light'
            }`}
            style={{
              background: 'none',
              border: 'none',
              transition: 'background-color 0.2s'
            }}
            onMouseEnter={(e) => {
              e.target.style.backgroundColor = darkMode ? '#333' : '#f8f9fa';
            }}
            onMouseLeave={(e) => {
              e.target.style.backgroundColor = 'transparent';
            }}
          >
            <Search size={16} /> Search Chats
          </button>

          {/* Navigation Links */}
          <div className="d-flex flex-column gap-1">
            <button className={`btn text-start rounded-3 d-flex align-items-center gap-2 ${
              darkMode ? 'text-white' : 'text-dark'
            }`}
            style={{
              background: 'none',
              border: 'none',
              transition: 'background-color 0.2s'
            }}
            onMouseEnter={(e) => {
              e.target.style.backgroundColor = darkMode ? '#333' : '#f8f9fa';
            }}
            onMouseLeave={(e) => {
              e.target.style.backgroundColor = 'transparent';
            }}>
              <Book size={16} /> Library
            </button>
            <button className={`btn text-start rounded-3 d-flex align-items-center gap-2 ${
              darkMode ? 'text-white' : 'text-dark'
            }`}
            style={{
              background: 'none',
              border: 'none',
              transition: 'background-color 0.2s'
            }}
            onMouseEnter={(e) => {
              e.target.style.backgroundColor = darkMode ? '#333' : '#f8f9fa';
            }}
            onMouseLeave={(e) => {
              e.target.style.backgroundColor = 'transparent';
            }}>
              <Zap size={16} /> AI Tools
            </button>
            <button className={`btn text-start rounded-3 d-flex align-items-center gap-2 ${
              darkMode ? 'text-white' : 'text-dark'
            }`}
            style={{
              background: 'none',
              border: 'none',
              transition: 'background-color 0.2s'
            }}
            onMouseEnter={(e) => {
              e.target.style.backgroundColor = darkMode ? '#333' : '#f8f9fa';
            }}
            onMouseLeave={(e) => {
              e.target.style.backgroundColor = 'transparent';
            }}>
              <Grid3X3 size={16} /> Templates
            </button>
            <button className={`btn text-start rounded-3 d-flex align-items-center gap-2 ${
              darkMode ? 'text-white' : 'text-dark'
            }`}
            style={{
              background: 'none',
              border: 'none',
              transition: 'background-color 0.2s'
            }}
            onMouseEnter={(e) => {
              e.target.style.backgroundColor = darkMode ? '#333' : '#f8f9fa';
            }}
            onMouseLeave={(e) => {
              e.target.style.backgroundColor = 'transparent';
            }}>
              <Folder size={16} /> Projects
            </button>
          </div>
        </div>
      ) : (
        // Collapsed Navigation Icons - Only Essential Buttons
        <div className="p-2">
          {/* New Chat */}
          <button
            onClick={onNewChat}
            className="btn text-white w-100 mb-3 rounded-3 d-flex justify-content-center"
            style={{
              background: 'linear-gradient(to right, #3b82f6, #8b5cf6)', 
              border: 'none'
            }}
            title="New Chat"
          >
            <Plus size={16} />
          </button>
          
          {/* Search */}
          <button
            onClick={() => setShowSearchModal(true)}
            className={`btn w-100 mb-3 rounded-3 d-flex justify-content-center ${
              darkMode ? 'text-white' : 'text-dark'
            }`}
            style={{
              background: 'none',
              border: 'none'
            }}
            title="Search Chats"
          >
            <Search size={16} />
          </button>
          
          {/* Library */}
          <button
            className={`btn w-100 mb-3 rounded-3 d-flex justify-content-center ${
              darkMode ? 'text-white' : 'text-dark'
            }`}
            style={{
              background: 'none',
              border: 'none'
            }}
            title="Library"
          >
            <Book size={16} />
          </button>
        </div>
      )}

      {/* Chat History */}
      {shouldShowFull && (
        <div className="flex-grow-1 overflow-auto p-3">
          <h6 className={`mb-3 ${darkMode ? 'text-light' : 'text-muted'}`}>Recent Chats</h6>
          
          {chats.length === 0 ? (
            <small className={darkMode ? 'text-light' : 'text-muted'}>No chats found</small>
          ) : (
            chats.map((chat, i) => (
              <div
                key={chat.id || i}
                className={`p-2 rounded-3 mb-2 d-flex justify-content-between align-items-center ${
                  activeChatId === chat.id 
                    ? 'bg-primary text-white'
                    : (darkMode ? 'hover-bg-dark' : 'hover-bg-light')
                }`}
                style={{ 
                  cursor: 'pointer',
                  backgroundColor: activeChatId === chat.id 
                    ? '#0d6efd' 
                    : 'transparent',
                  transition: 'background-color 0.2s'
                }}
                onClick={() => onSelectChat && onSelectChat(chat.id)}
                onMouseEnter={(e) => {
                  if (activeChatId !== chat.id) {
                    e.target.style.backgroundColor = darkMode ? '#333' : '#f8f9fa';
                  }
                }}
                onMouseLeave={(e) => {
                  if (activeChatId !== chat.id) {
                    e.target.style.backgroundColor = 'transparent';
                  }
                }}
              >
                <span className="fw-medium small" style={{
                  whiteSpace: 'nowrap', 
                  overflow: 'hidden', 
                  textOverflow: 'ellipsis'
                }}>
                  {chat.title}
                </span>
                <button
                  className={`btn btn-sm ${darkMode ? 'text-light' : 'text-dark'}`}
                  style={{ background: 'none', border: 'none' }}
                  onClick={(e) => {
                    e.stopPropagation();
                    // Handle chat options
                  }}
                >
                  ⋮
                </button>
              </div>
            ))
          )}
        </div>
      )}

      {/* User Profile Section */}
      <div className={`${shouldShowFull ? 'p-3' : 'p-2'} ${
        shouldShowFull ? (darkMode ? 'border-top border-dark' : 'border-top') : ''
      } ${!shouldShowFull ? 'mt-auto' : ''} position-relative`}>
        {shouldShowFull ? (
          <>
            <div 
              className="d-flex align-items-center"
              style={{ cursor: 'pointer' }}
              onClick={() => setShowUserMenu(!showUserMenu)}
            >
              <div className="d-flex align-items-center gap-2">
                <div className={`rounded-circle d-flex align-items-center justify-content-center ${
                  darkMode ? 'bg-dark border border-secondary' : 'bg-light'
                }`} style={{width: '32px', height: '32px'}}>
                  <User size={16} />
                </div>
                <div>
                  <div className="fw-semibold small">
                    {currentUser?.name || 'User'}
                  </div>
                  <small className={darkMode ? 'text-light' : 'text-muted'}>Free Plan</small>
                </div>
              </div>
            </div>

            {/* User Dropdown Menu */}
            {showUserMenu && (
              <div className={`position-absolute bottom-100 w-100 mb-2 rounded-3 shadow ${
                darkMode ? 'bg-dark border border-secondary' : 'bg-white border'
              }`} style={{left: '12px', right: '12px'}}>
                <div className="p-2">
                  <button className={`btn w-100 text-start mb-1 ${
                    darkMode ? 'text-white' : 'text-dark'
                  }`}
                  style={{ background: 'none', border: 'none' }}>
                    <ArrowUp size={14} className="me-2" /> Upgrade Plan
                  </button>
                  <button 
                    className={`btn w-100 text-start mb-1 ${
                      darkMode ? 'text-white' : 'text-dark'
                    }`}
                    style={{ background: 'none', border: 'none' }}
                    onClick={() => {
                      setShowUserMenu(false);
                      onSettings && onSettings();
                    }}
                  >
                    <Settings size={14} className="me-2" /> Settings
                  </button>
                  <button className={`btn w-100 text-start mb-1 ${
                    darkMode ? 'text-white' : 'text-dark'
                  }`}
                  style={{ background: 'none', border: 'none' }}>
                    <HelpCircle size={14} className="me-2" /> Help
                  </button>
                  <button
                    onClick={onLogout}
                    className="btn btn-outline-danger w-100 text-start"
                    style={{ border: 'none' }}
                  >
                    <LogOut size={14} className="me-2" /> Logout
                  </button>
                </div>
              </div>
            )}
          </>
        ) : (
          // Collapsed user section - Only Account Button
          <button
            className={`btn w-100 rounded-3 d-flex justify-content-center ${
              darkMode ? 'text-white' : 'text-dark'
            }`}
            style={{ background: 'none', border: 'none' }}
            title="Account"
            onClick={() => setShowUserMenu(!showUserMenu)}
          >
            <User size={16} />
          </button>
        )}
      </div>
      </div>
    </>
  );
}
