import React, { useEffect, useRef } from 'react';
import { Pencil, Share2, Archive, Trash2 } from 'lucide-react';

export default function ChatItemMenu({
  chatId,        // ✅ pass the chat ID
  onRename,
  onShare,
  onArchive,
  onDelete,
  onClose
}) {
  const ref = useRef(null);

  useEffect(() => {
    const handleClick = (e) => {
      if (ref.current && !ref.current.contains(e.target)) onClose?.();
    };
    const handleKey = (e) => { if (e.key === 'Escape') onClose?.(); };
    document.addEventListener('mousedown', handleClick);
    document.addEventListener('keydown', handleKey);
    return () => {
      document.removeEventListener('mousedown', handleClick);
      document.removeEventListener('keydown', handleKey);
    };
  }, [onClose]);

  const Item = ({ icon: Icon, label, action, danger }) => (
    <button className={`chat-item-menu-btn ${danger ? 'danger' : ''}`} onClick={() => { action(chatId); onClose?.(); }}>
      <Icon size={14} />
      <span>{label}</span>
    </button>
  );

  return (
    <div className="chat-item-menu" ref={ref} role="menu">
      <Item icon={Pencil} label="Rename" action={onRename} />
      <Item icon={Share2} label="Share" action={onShare} />   {/* ✅ passes chatId now */}
      <Item icon={Archive} label="Archive" action={onArchive} />
      <Item icon={Trash2} label="Delete" action={onDelete} danger />
    </div>
  );
}
