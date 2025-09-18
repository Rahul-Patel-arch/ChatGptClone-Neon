import { useNavigate, useLocation } from "react-router-dom";
import { Plus, Search } from "lucide-react";
export default function SidebarActions({
  isCollapsed,
  shouldShowFull,
  onNewChat,
  onSearchClick,
  // We'll accept onToggle via props if parent wires it; if absent, fallback to no-op
  onToggle,
  onNotify,
}) {
  const navigate = useNavigate();
  const location = useLocation();
  const handleNewChatClick = () => {
    // Always attempt to create a new chat, even when collapsed (no auto-expand)
    const createdId = onNewChat ? onNewChat() : undefined;
    // Navigate to home only if a new chat was created successfully and not on auth pages
    if (
      createdId &&
      location.pathname !== "/login" &&
      location.pathname !== "/signup"
    ) {
      navigate("/", { replace: true });
    }
  };
  return (
    <div className={`sidebar-actions ${isCollapsed ? "collapsed" : "expanded"}`}>
      <button
        onClick={handleNewChatClick}
        className={`new-chat-btn ${isCollapsed ? "collapsed-circle" : "pill"}`}
        title={isCollapsed ? "New Chat" : ""}
        aria-label="Start new chat"
      >
        <Plus size={isCollapsed ? 20 : 16} />
        {shouldShowFull && <span>New Chat</span>}
      </button>

      {shouldShowFull && (
        <button
          onClick={onSearchClick}
          className="search-chats-btn pill"
          title="Search Chats"
          aria-label="Search chats"
        >
          <Search size={16} />
          <span>Search Chats</span>
        </button>
      )}

      {/* AI Tools button removed here because there's already a link in the sidebar navigation */}
    </div>
  );
}
