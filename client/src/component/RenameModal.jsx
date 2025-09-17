import React, { useState, useEffect, useRef } from 'react';
import { X } from 'lucide-react';

export default function RenameModal({ isOpen, onClose, currentTitle, onRename }) {
  const [title, setTitle] = useState(currentTitle || '');
  const inputRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      setTitle(currentTitle || '');
      // Focus and select all text when modal opens
      setTimeout(() => {
        if (inputRef.current) {
          inputRef.current.focus();
          inputRef.current.select();
        }
      }, 100);
    }
  }, [isOpen, currentTitle]);

  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape') onClose();
    };
    
    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      return () => document.removeEventListener('keydown', handleEscape);
    }
  }, [isOpen, onClose]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (title.trim() && title.trim() !== currentTitle) {
      onRename(title.trim());
    }
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div 
      className="modal-overlay" 
      onClick={onClose}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(0, 0, 0, 0.5)',
        zIndex: 1050,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backdropFilter: 'blur(4px)'
      }}
    >
      <div 
        className="rename-modal" 
        onClick={(e) => e.stopPropagation()}
        style={{
          background: 'var(--surface)',
          borderRadius: '12px',
          padding: '24px',
          width: '400px',
          maxWidth: '90vw',
          border: '1px solid var(--border)',
          boxShadow: '0 12px 24px rgba(0,0,0,0.15)'
        }}
      >
        <div 
          className="modal-header"
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '20px'
          }}
        >
          <h3 
            style={{
              margin: 0,
              fontSize: '18px',
              fontWeight: '600',
              color: 'var(--text)'
            }}
          >
            Rename Chat
          </h3>
          <button
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              padding: '4px',
              borderRadius: '6px',
              cursor: 'pointer',
              color: 'var(--muted-text)',
              transition: 'all 0.15s ease'
            }}
            onMouseEnter={(e) => {
              e.target.style.background = 'var(--hover-overlay)';
            }}
            onMouseLeave={(e) => {
              e.target.style.background = 'transparent';
            }}
          >
            <X size={18} />
          </button>
        </div>
        
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '20px' }}>
            <label 
              htmlFor="chat-title"
              style={{
                display: 'block',
                marginBottom: '8px',
                fontSize: '14px',
                fontWeight: '500',
                color: 'var(--text)'
              }}
            >
              Chat Title
            </label>
            <input
              ref={inputRef}
              id="chat-title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter chat title..."
              style={{
                width: '100%',
                padding: '12px',
                border: '1px solid var(--border)',
                borderRadius: '8px',
                fontSize: '14px',
                background: 'var(--bg)',
                color: 'var(--text)',
                outline: 'none',
                transition: 'border-color 0.15s ease'
              }}
              onFocus={(e) => {
                e.target.style.borderColor = 'var(--accent)';
              }}
              onBlur={(e) => {
                e.target.style.borderColor = 'var(--border)';
              }}
            />
          </div>
          
          <div 
            className="modal-actions"
            style={{
              display: 'flex',
              gap: '12px',
              justifyContent: 'flex-end'
            }}
          >
            <button
              type="button"
              onClick={onClose}
              style={{
                padding: '10px 16px',
                border: '1px solid var(--border)',
                borderRadius: '8px',
                background: 'transparent',
                color: 'var(--text)',
                fontSize: '14px',
                fontWeight: '500',
                cursor: 'pointer',
                transition: 'all 0.15s ease'
              }}
              onMouseEnter={(e) => {
                e.target.style.background = 'var(--hover-overlay)';
              }}
              onMouseLeave={(e) => {
                e.target.style.background = 'transparent';
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!title.trim() || title.trim() === currentTitle}
              style={{
                padding: '10px 16px',
                border: 'none',
                borderRadius: '8px',
                background: title.trim() && title.trim() !== currentTitle ? 'var(--accent)' : 'var(--muted-surface)',
                color: title.trim() && title.trim() !== currentTitle ? 'var(--accent-on)' : 'var(--muted-text)',
                fontSize: '14px',
                fontWeight: '500',
                cursor: title.trim() && title.trim() !== currentTitle ? 'pointer' : 'not-allowed',
                transition: 'all 0.15s ease'
              }}
            >
              Rename
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}