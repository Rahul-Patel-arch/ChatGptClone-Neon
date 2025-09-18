import React from "react";
import { Book, Search } from "lucide-react";
import { useNavigate } from "react-router-dom";

// Collapsed: minimal essential (Search first for quicker access, then Library)
const collapsedNavItems = [
  { icon: Search, label: "Search", id: "search" },
  { icon: Book, label: "Library", id: "library" },
];

// Expanded: full suite similar to ChatGPT left group
const fullNavItems = [{ icon: Book, label: "Library", id: "library" }];

export default function SidebarNav({ isCollapsed, shouldShowFull, onNavClick, onSearchClick }) {
  const navigate = useNavigate();
  const handleNavClick = (itemId) => {
    if (itemId === "search" && onSearchClick) {
      onSearchClick();
    } else if (itemId === "library") {
      navigate("/library");
    } else if (onNavClick) {
      onNavClick(itemId);
    }
  };

  return (
    <div className={`sidebar-nav ${isCollapsed ? "collapsed" : "expanded"}`}>
      {shouldShowFull ? (
        <>
          <div className="sidebar-nav-label">Navigation</div>
          <div className="sidebar-nav-items">
            {/* eslint-disable-next-line no-unused-vars */}
            {fullNavItems.map(({ icon: Icon, label, id }) => (
              <button
                key={id}
                className="sidebar-nav-item"
                onClick={() => handleNavClick(id)}
                aria-label={label}
              >
                <Icon size={16} className="sidebar-nav-icon" />
                <span>{label}</span>
              </button>
            ))}
          </div>
        </>
      ) : (
        <div className="sidebar-nav-collapsed">
          {/* eslint-disable-next-line no-unused-vars */}
          {collapsedNavItems.map(({ icon: Icon, label, id }) => (
            <button
              key={id}
              className="sidebar-nav-icon-btn"
              title={label}
              aria-label={label}
              onClick={() => handleNavClick(id)}
            >
              <Icon size={18} />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
