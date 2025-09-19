import React, { useEffect, useRef } from "react";
import { Pencil, Share2, Archive, Trash2 } from "lucide-react";

export default function ChatItemMenu({
  chatId,
  onRename,
  onShare,
  onArchive,
  onDelete,
  onClose,
}) {
  const ref = useRef(null);

  useEffect(() => {
    const handleClick = (e) => {
      if (ref.current && !ref.current.contains(e.target)) onClose?.();
    };
    const handleKey = (e) => {
      if (e.key === "Escape") onClose?.();
    };
    document.addEventListener("mousedown", handleClick);
    document.addEventListener("keydown", handleKey);
    return () => {
      document.removeEventListener("mousedown", handleClick);
      document.removeEventListener("keydown", handleKey);
    };
  }, [onClose]);

  // Pass icon as child to avoid unused var false positives in some ESLint setups
  const Item = ({ label, action, danger, children }) => (
    <button
      className={`chat-item-menu-btn ${danger ? "danger" : ""}`}
      onClick={() => {
        action?.(chatId);
        onClose?.();
      }}
    >
      {children}
      <span>{label}</span>
    </button>
  );

  return (
    <div className="chat-item-menu" ref={ref} role="menu">
      <Item label="Rename" action={onRename}>
        <Pencil size={14} />
      </Item>
      <Item label="Share" action={onShare}>
        <Share2 size={14} />
      </Item>
      <Item label="Archive" action={onArchive}>
        <Archive size={14} />
      </Item>
      <Item label="Delete" danger action={onDelete}>
        <Trash2 size={14} />
      </Item>
    </div>
  );
}
