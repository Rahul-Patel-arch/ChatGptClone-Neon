import React, { useState, useEffect, useRef } from "react";
import { Search, X } from "lucide-react";
import "./SearchModal.css";

export default function SearchModal({ show, onClose, chats = [], onSelectChat }) {
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const inputRef = useRef(null);

  // Focus the search input when modal opens
  useEffect(() => {
    if (show && inputRef.current) {
      inputRef.current.focus();
    }
  }, [show]);

  // Filter chats based on search term. When empty, show all chats (including archived)
  useEffect(() => {
    const term = searchTerm.trim().toLowerCase();
    if (!term) {
      setSearchResults(
        chats
          .slice()
          .filter(Boolean)
          .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0))
      );
      return;
    }
    const results = chats.filter((chat) => (chat?.title || "").toLowerCase().includes(term));
    setSearchResults(results);
  }, [searchTerm, chats]);

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        onClose();
      }
    };

    if (show) {
      document.addEventListener("keydown", handleKeyDown);
    }

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [show, onClose]);

  if (!show) return null;

  return (
    <div className="search-modal-backdrop" onClick={onClose}>
      <div className="search-modal-card" onClick={(e) => e.stopPropagation()}>
        <div className="search-modal-header">
          <Search size={18} className="me-2 text-muted" />
          <input
            ref={inputRef}
            type="text"
            className="search-input"
            placeholder="Search chats..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <button className="search-close-btn" onClick={onClose} aria-label="Close search">
            <X size={18} />
          </button>
        </div>

        <div className="search-results">
          {searchResults.length === 0 ? (
            <div className="search-empty">
              <p className="mb-0">
                {searchTerm.trim() === ""
                  ? "No chats yet"
                  : `No chats found matching "${searchTerm}"`}
              </p>
            </div>
          ) : (
            <div>
              {searchResults.map((chat) => (
                <div
                  key={chat.id}
                  className="search-result-item"
                  onClick={() => {
                    onSelectChat(chat.id);
                    onClose();
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <Search size={16} className="text-muted" />
                    <span className="search-result-title">{chat.title}</span>
                    {chat.archived && <small className="search-result-meta">(archived)</small>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
