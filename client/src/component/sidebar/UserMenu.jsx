import React from 'react';
import { Settings, HelpCircle, LogOut, ArrowUp } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function UserMenu({ 
  currentUser, 
  isCollapsed, 
  onSettings, 
  onLogout, 
  onClose 
}) {
  const navigate = useNavigate();
  const handleMenuItemClick = (action) => {
    onClose();
    if (action) action();
  };

  return (
    <div 
      className={`user-menu ${isCollapsed ? 'floating' : ''}`}
    >
      {/* User Info */}
      <div className="user-menu-header">
        <div className="user-info">
          <div className="user-avatar">
            {currentUser?.name?.[0]?.toUpperCase() || 'U'}
          </div>
          <div className="user-details">
            <div className="user-name">{currentUser?.name || 'User'}</div>
            <div className="user-email">{currentUser?.email || 'user@example.com'}</div>
          </div>
        </div>
      </div>

      {/* Plan Section */}
      <div className="user-menu-plan">
        <div className="plan-info">
          <div className="plan-name">Free Plan</div>
          <div className="plan-description">Basic features</div>
        </div>
        <button className="btn primary btn-sm upgrade-btn" onClick={() => { onClose(); navigate('/update'); }}>
          <ArrowUp size={12} />
          <span>Upgrade</span>
        </button>
      </div>

      {/* Menu Items */}
      <div className="user-menu-items">
        <button 
          className="user-menu-item"
          onClick={() => handleMenuItemClick(onSettings)}
        >
          <Settings size={14} />
          <span>Settings</span>
        </button>
        
        {/* Help & FAQ removed per request */}
        
        <div className="user-menu-divider" />
        
        <button
          className="user-menu-item danger"
          onClick={() => handleMenuItemClick(onLogout)}
        >
          <LogOut size={14} />
          <span>Logout</span>
        </button>
      </div>
    </div>
  );
}