import { useNavigate, useLocation } from 'react-router-dom';
import { Plus, Search } from 'lucide-react';
export default function SidebarActions({ 
  isCollapsed, 
  shouldShowFull,
  onNewChat, 
  onSearchClick 
}) {
  const navigate = useNavigate();
  const location = useLocation();
  const handleNewChatClick = () => {
    if (onNewChat) onNewChat();
    // Only navigate if not on auth page
    if (location.pathname !== '/login' && location.pathname !== '/signup') {
      navigate('/', { replace: true });
    }
  };
  return (
    <div className={`sidebar-actions ${isCollapsed ? 'collapsed' : 'expanded'}`}>
      <button
        onClick={handleNewChatClick}
        className={`new-chat-btn ${isCollapsed ? 'collapsed-circle' : 'pill'}`}
        title={isCollapsed ? 'New Chat' : ''}
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