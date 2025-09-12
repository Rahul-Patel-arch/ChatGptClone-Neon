import React, { useState, useEffect, useRef } from 'react';
import { Search, X } from 'lucide-react';

export default function SearchModal({ show, onClose, chats, onSelectChat, darkMode }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const inputRef = useRef(null);

  // Focus the search input when modal opens
  useEffect(() => {
    if (show && inputRef.current) {
      inputRef.current.focus();
    }
  }, [show]);

  // Filter chats based on search term
  useEffect(() => {
    if (!searchTerm.trim()) {
      setSearchResults([]);
      return;
    }

    const term = searchTerm.toLowerCase();
    const results = chats.filter(chat => 
      chat.title.toLowerCase().includes(term)
    );
    setSearchResults(results);
  }, [searchTerm, chats]);

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    if (show) {
      document.addEventListener('keydown', handleKeyDown);
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [show, onClose]);

  if (!show) return null;

  return (
    <div 
      className="position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center"
      style={{ 
        backgroundColor: 'rgba(0, 0, 0, 0.5)', 
        zIndex: 1050,
        backdropFilter: 'blur(4px)'
      }}
      onClick={onClose}
    >
      <div 
        className={`rounded-4 shadow ${darkMode ? 'bg-dark' : 'bg-white'}`}
        style={{ 
          width: '90%', 
          maxWidth: '500px',
          maxHeight: '80vh',
          overflow: 'hidden',
          animation: 'modalFadeIn 0.2s ease-out'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search Header */}
        <div className="p-3 border-bottom d-flex align-items-center">
          <Search size={18} className={`me-2 ${darkMode ? 'text-light' : 'text-muted'}`} />
          <input
            ref={inputRef}
            type="text"
            className={`form-control border-0 shadow-none ${darkMode ? 'bg-dark text-white' : ''}`}
            placeholder="Search chats..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ 
              boxShadow: 'none',
              outline: 'none',
              fontSize: '16px'
            }}
          />
          <button 
            className={`btn btn-sm ms-2 ${darkMode ? 'text-light' : 'text-muted'}`}
            onClick={onClose}
            style={{ background: 'none', border: 'none' }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Search Results */}
        <div 
          className="overflow-auto" 
          style={{ maxHeight: 'calc(80vh - 60px)' }}
        >
          {searchTerm.trim() === '' ? (
            <div className="p-4 text-center">
              <p className={`mb-0 ${darkMode ? 'text-light' : 'text-muted'}`}>
                Type to search your chats
              </p>
            </div>
          ) : searchResults.length === 0 ? (
            <div className="p-4 text-center">
              <p className={`mb-0 ${darkMode ? 'text-light' : 'text-muted'}`}>
                No chats found matching "{searchTerm}"
              </p>
            </div>
          ) : (
            <div className="p-2">
              {searchResults.map((chat) => (
                <div
                  key={chat.id}
                  className={`p-3 rounded-3 mb-2 ${darkMode ? 'hover-bg-dark' : 'hover-bg-light'}`}
                  style={{ 
                    cursor: 'pointer',
                    transition: 'background-color 0.2s'
                  }}
                  onClick={() => {
                    onSelectChat(chat.id);
                    onClose();
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.backgroundColor = darkMode ? '#333' : '#f8f9fa';
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.backgroundColor = 'transparent';
                  }}
                >
                  <div className="d-flex align-items-center">
                    <Search size={16} className={`me-2 ${darkMode ? 'text-light' : 'text-muted'}`} />
                    <span className={`${darkMode ? 'text-white' : 'text-dark'}`}>
                      {chat.title}
                    </span>
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