import React, { useState } from 'react';
import { MoreVertical } from 'lucide-react';
import ChatItemMenu from './ChatItemMenu';
import { useNavigate } from 'react-router-dom';

// Chat list now only renders in expanded mode (ChatGPT style: no recent chats in collapsed sidebar)
export default function ChatList({
  chats = [],
  activeChatId,
  onSelectChat,
  shouldShowFull,
  onArchive,
  onRename,
  onDelete,
  onShare
}) {
  const [openMenuId, setOpenMenuId] = useState(null);
  const navigate = useNavigate();
  if (!shouldShowFull) return null;

  if (chats.length === 0) {
    return (
      <div className="chat-list empty">
        <small className="text-muted empty-message">No chats yet</small>
      </div>
    );
  }

  const handleChatClick = (chatId) => {
    if (onSelectChat) onSelectChat(chatId);
    navigate('/');
  };

  return (
    <div className="chat-list">
      <h6 className="chat-list-header">Recent Chats</h6>
      <div className="chat-items expanded">
        {chats.map((chat, i) => {
          const isActive = activeChatId === chat.id;
          const isMenuOpen = openMenuId === chat.id;
          return (
            <div
              key={chat.id || i}
              className={`chat-item with-actions ${isActive ? 'active' : ''} ${isMenuOpen ? 'menu-open' : ''}`}
            >
              <button
                className="chat-main-btn"
                onClick={() => handleChatClick(chat.id)}
                title={chat.title}
              >
                <span className="chat-title text-truncate">{chat.title}</span>
              </button>
              <div className="chat-actions">
                <button
                  className="chat-action-btn"
                  onClick={(e) => {
                    e.stopPropagation();
                    setOpenMenuId(prev => prev === chat.id ? null : chat.id);
                  }}
                  aria-haspopup="true"
                  aria-expanded={isMenuOpen}
                  aria-label="Chat options"
                >
                  <MoreVertical size={14} />
                </button>
                {isMenuOpen && (
                  <ChatItemMenu
                    onRename={() => {
                      const newTitle = window.prompt('Rename chat', chat.title);
                      if (newTitle && newTitle.trim()) onRename && onRename(chat.id, newTitle.trim());
                    }}
                    onShare={() => onShare && onShare(chat.id)}
                    onArchive={() => onArchive && onArchive(chat.id)}
                    onDelete={() => onDelete && onDelete(chat.id)}
                    onClose={() => setOpenMenuId(null)}
                  />
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}