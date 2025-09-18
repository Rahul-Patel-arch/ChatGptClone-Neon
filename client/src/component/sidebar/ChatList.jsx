import React, { useState, useRef, useEffect } from "react";
import { MoreVertical } from "lucide-react";
import ChatItemMenu from "./ChatItemMenu";
import { useNavigate } from "react-router-dom";

// Chat list now only renders in expanded mode (ChatGPT style: no recent chats in collapsed sidebar)
export default function ChatList({
  chats = [],
  activeChatId,
  onSelectChat,
  shouldShowFull,
  onArchive,
  onRename,
  onDelete,
  onShare,
}) {
  const [openMenuId, setOpenMenuId] = useState(null);
  const [editingChatId, setEditingChatId] = useState(null);
  const [editingTitle, setEditingTitle] = useState("");
  const editInputRef = useRef(null);
  const navigate = useNavigate();

  // Focus the input when entering edit mode
  useEffect(() => {
    if (editingChatId && editInputRef.current) {
      editInputRef.current.focus();
      editInputRef.current.select();
    }
  }, [editingChatId]);

  if (!shouldShowFull) return null;

  if (chats.length === 0) {
    return (
      <div className="chat-list empty">
        <small className="text-muted empty-message">No chats yet</small>
      </div>
    );
  }

  const handleChatClick = (chatId) => {
    if (editingChatId) return; // Don't navigate while editing
    if (onSelectChat) onSelectChat(chatId);
    navigate("/");
  };

  const handleStartRename = (chatId, currentTitle) => {
    setEditingChatId(chatId);
    setEditingTitle(currentTitle);
    setOpenMenuId(null);
  };

  const handleSaveRename = () => {
    if (onRename && editingChatId && editingTitle.trim()) {
      onRename(editingChatId, editingTitle.trim());
    }
    setEditingChatId(null);
    setEditingTitle("");
  };

  const handleCancelRename = () => {
    setEditingChatId(null);
    setEditingTitle("");
  };

  const handleRenameKeyDown = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleSaveRename();
    } else if (e.key === "Escape") {
      e.preventDefault();
      handleCancelRename();
    }
  };

  return (
    <div className="chat-list">
      <h6 className="chat-list-header">Recent Chats</h6>
      <div className="chat-items expanded">
        {chats.map((chat, i) => {
          const isActive = activeChatId === chat.id;
          const isMenuOpen = openMenuId === chat.id;
          const isEditing = editingChatId === chat.id;

          return (
            <div
              key={chat.id || i}
              className={`chat-item with-actions ${isActive ? "active" : ""} ${isMenuOpen ? "menu-open" : ""} ${isEditing ? "editing" : ""}`}
            >
              {isEditing ? (
                // Inline edit mode - confirm with Enter, cancel with Escape or blur
                <div className="chat-rename-inline">
                  <input
                    ref={editInputRef}
                    type="text"
                    value={editingTitle}
                    onChange={(e) => setEditingTitle(e.target.value)}
                    onKeyDown={handleRenameKeyDown}
                    onBlur={handleCancelRename}
                    className="chat-rename-input"
                    placeholder="Name this chat"
                  />
                </div>
              ) : (
                // Normal display mode
                <>
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
                        setOpenMenuId((prev) => (prev === chat.id ? null : chat.id));
                      }}
                      aria-haspopup="true"
                      aria-expanded={isMenuOpen}
                      aria-label="Chat options"
                    >
                      <MoreVertical size={14} />
                    </button>
                    {isMenuOpen && (
                      <ChatItemMenu
                        chatId={chat.id}
                        onRename={() => handleStartRename(chat.id, chat.title)}
                        onShare={() => onShare && onShare(chat.id)}
                        onArchive={() => onArchive && onArchive(chat.id)}
                        onDelete={() => {
                          const ok = window.confirm(
                            "Delete this chat permanently? This cannot be undone."
                          );
                          if (ok && onDelete) onDelete(chat.id);
                        }}
                        onClose={() => setOpenMenuId(null)}
                      />
                    )}
                  </div>
                </>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
