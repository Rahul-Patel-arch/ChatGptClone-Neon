import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { User, ChevronUp } from 'lucide-react';
import UserMenu from './UserMenu';

export default function UserProfile({ 
  currentUser, 
  isCollapsed, 
  shouldShowFull, 
  onLogout, 
  onSettings 
}) {
  const [showUserMenu, setShowUserMenu] = useState(false);
  const menuRef = useRef(null);
  const buttonRef = useRef(null);

  // Close menu on outside click
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target) &&
          buttonRef.current && !buttonRef.current.contains(event.target)) {
        setShowUserMenu(false);
      }
    };

    if (showUserMenu) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showUserMenu]);

  // Close menu on escape key
  useEffect(() => {
    const handleEscape = (event) => {
      if (event.key === 'Escape') {
        setShowUserMenu(false);
      }
    };

    if (showUserMenu) {
      document.addEventListener('keydown', handleEscape);
      return () => document.removeEventListener('keydown', handleEscape);
    }
  }, [showUserMenu]);

  const handleMenuToggle = () => {
    setShowUserMenu(!showUserMenu);
  };

  const handleMenuItemClick = (callback) => {
    setShowUserMenu(false);
    if (callback) callback();
  };

  return (
    <div className="user-profile">
      <button
        ref={buttonRef}
        className={`user-profile-button ${isCollapsed ? 'collapsed' : ''}`}
        onClick={handleMenuToggle}
        aria-label={isCollapsed ? "Open user menu" : `${currentUser?.name || 'User'} menu`}
        aria-expanded={showUserMenu}
        aria-haspopup="true"
      >
        {shouldShowFull ? (
          <>
            <div className="user-avatar">
              {currentUser?.name?.[0]?.toUpperCase() || 'U'}
            </div>
            <div className="user-info">
              <div className="user-name">
                {currentUser?.name || 'User'}
              </div>
            </div>
            <ChevronUp 
              size={16} 
              className={`chevron ${showUserMenu ? 'rotated' : ''}`}
            />
          </>
        ) : (
          <User size={16} />
        )}
      </button>

      {showUserMenu && (
        isCollapsed
          ? createPortal(
              <div
                ref={menuRef}
                style={{
                  position: 'fixed',
                  left: '70px',
                  bottom: '12px',
                  zIndex: 2000
                }}
              >
                <UserMenu
                  currentUser={currentUser}
                  isCollapsed={isCollapsed}
                  onSettings={() => handleMenuItemClick(onSettings)}
                  onLogout={() => handleMenuItemClick(onLogout)}
                  onClose={() => setShowUserMenu(false)}
                />
              </div>,
              document.body
            )
          : (
              <div ref={menuRef}>
                <UserMenu
                  currentUser={currentUser}
                  isCollapsed={isCollapsed}
                  onSettings={() => handleMenuItemClick(onSettings)}
                  onLogout={() => handleMenuItemClick(onLogout)}
                  onClose={() => setShowUserMenu(false)}
                />
              </div>
            )
      )}
    </div>
  );
}