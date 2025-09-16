import React from 'react';
import { ChevronLeft, Menu } from 'lucide-react';
import quantumIcon from '../../assets/quantum-chat-icon.png';

export default function SidebarHeader({ 
  isCollapsed, 
  onToggle, 
  isMobile, 
  shouldShowFull 
}) {
  return (
    <div className="sidebar-header">
      {shouldShowFull ? (
        <>
          <img 
            src={quantumIcon} 
            alt="QuantumChat Logo" 
            className="sidebar-logo" 
          />
          <h2 className="sidebar-title">QuantumChat</h2>
          {!isMobile && (
            <button
              onClick={onToggle}
              className="btn ghost ms-auto"
              aria-label="Collapse Sidebar"
            >
              <ChevronLeft size={20} />
            </button>
          )}
        </>
      ) : (
        <button
          onClick={onToggle}
          className="btn ghost expand-btn"
          title="Expand Sidebar"
          aria-label="Expand Sidebar"
        >
          <Menu size={20} />
        </button>
      )}
    </div>
  );
}