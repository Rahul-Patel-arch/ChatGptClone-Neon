// src/hooks/useChats.js
// Centralized, well-documented chat state management
// - Per-user localStorage scoping
// - Safe hydration (no overwrite on reload)
// - Persistence of chats and active chat id
// - Simple, predictable operations

import { useEffect, useRef, useState, useMemo } from 'react'

/**
 * Chat message shape
 * @typedef {{ role: 'user'|'ai'|'assistant', text: string, time?: string, isStreaming?: boolean, isError?: boolean }} Message
 */

/**
 * Chat item shape
 * @typedef {{ id: string, title: string, createdAt: string, archived: boolean, archivedAt?: string, messages: Message[] }} Chat
 */

/**
 * useChats
 * Encapsulates chat state and storage logic in one place.
 *
 * Contract
 * - Input: current user email (string or undefined), optional callbacks
 * - Output: { chats, setChats, activeChatId, setActiveChatId, handlers }
 * - Side effects: hydrates from and persists to localStorage with per-user keys
 *
 * @param {string|undefined} userEmail
 * @param {{ onInfo?: (msg: string)=>void }} [opts]
 */
export default function useChats(userEmail, opts) {
  const notify = opts?.onInfo || (() => {})
  const userId = (userEmail || 'guest').toLowerCase()
  const CHAT_STORAGE_KEY = `quantumchat_chats_v1:${userId}`
  const ACTIVE_CHAT_STORAGE_KEY = `quantumchat_active_chat_id_v1:${userId}`

  const [chats, setChats] = useState(/** @type {Chat[]} */ ([]))
  const [activeChatId, setActiveChatId] = useState(/** @type {string|null} */ (null))
  const hasHydratedRef = useRef(false)
  // Tracks whether we have previously hydrated a non-empty set so we don't accidentally overwrite with [] on a transient render
  const hadPersistedChatsRef = useRef(false)
  // Flag that the current transition to empty was intentional (user deleted last chat)
  const intentionalEmptyRef = useRef(false)

  // Legacy storage keys (for migration + later cleanup)
  const legacyCandidates = useMemo(() => [
    `quantumchat_chats:${userId}`,
    'quantumchat_chats_v1',
    'quantumchat_chats',
  ], [userId])

  // Hydrate on user change with legacy migration (one-time per user session)
  useEffect(() => {
    setChats([])
    setActiveChatId(null)
    hasHydratedRef.current = false
    try {
      let raw = localStorage.getItem(CHAT_STORAGE_KEY)
      // Only attempt migration if there is no versioned key present at all
      if (!raw) {
        for (const key of legacyCandidates) {
          const legacy = localStorage.getItem(key)
          if (legacy) {
            raw = legacy
            try { localStorage.setItem(CHAT_STORAGE_KEY, legacy) } catch { /* ignore persistence errors */ }
            // Immediately purge legacy key to prevent resurrection after deletion
            try { localStorage.removeItem(key) } catch { /* ignore */ }
            break
          }
        }
      }
      if (raw) {
        const parsed = JSON.parse(raw)
        if (Array.isArray(parsed)) {
          const normalized = parsed
            .map((c) => ({
              id: c.id ?? String(c.createdAt ?? Date.now()),
              title: c.title ?? 'New Chat',
              createdAt: c.createdAt ?? new Date().toISOString(),
              archived: Boolean(c.archived),
              archivedAt: c.archivedAt,
              messages: Array.isArray(c.messages) ? c.messages : [],
            }))
            // newest first (keep even empty chats to preserve placeholders the user created)
            .sort((a, b) => (Date.parse(b.createdAt) || 0) - (Date.parse(a.createdAt) || 0))

          setChats(normalized)
          if (normalized.length > 0) {
            hadPersistedChatsRef.current = true
          }
          const savedActiveId = localStorage.getItem(ACTIVE_CHAT_STORAGE_KEY)
          const hasSaved = savedActiveId && normalized.some((c) => c.id === savedActiveId)
          if (hasSaved) setActiveChatId(savedActiveId)
          else {
            const firstActive = normalized.find((c) => !c.archived)
            if (firstActive) setActiveChatId(firstActive.id)
          }
        }
      }
  } catch { /* ignore */ }
    hasHydratedRef.current = true
  }, [userId, CHAT_STORAGE_KEY, ACTIVE_CHAT_STORAGE_KEY, legacyCandidates])

  // Persist chats, but avoid overwriting existing stored chats with an empty array unless the user intentionally deleted them.
  useEffect(() => {
    if (!hasHydratedRef.current) return
    if (chats.length === 0) {
      // If we previously had chats and this empty state was NOT intentional, skip writing
      if (hadPersistedChatsRef.current && !intentionalEmptyRef.current) {
        return
      }
      // If empty was intentional (deletions), persist empty array to reflect cleared state
      try { localStorage.setItem(CHAT_STORAGE_KEY, JSON.stringify([])) } catch { /* ignore */ }
      intentionalEmptyRef.current = false
      hadPersistedChatsRef.current = false
    } else {
      try { localStorage.setItem(CHAT_STORAGE_KEY, JSON.stringify(chats)) } catch { /* ignore */ }
      hadPersistedChatsRef.current = true
      intentionalEmptyRef.current = false
    }
    // Defensive: remove legacy keys once we have a saved versioned state
    for (const key of legacyCandidates) {
      try { localStorage.removeItem(key) } catch { /* ignore */ }
    }
  }, [chats, CHAT_STORAGE_KEY, legacyCandidates])

  // Persist active chat id
  useEffect(() => {
    if (!hasHydratedRef.current) return
    try {
      const exists = activeChatId && chats.some((c) => c.id === activeChatId)
      if (exists) localStorage.setItem(ACTIVE_CHAT_STORAGE_KEY, activeChatId)
      else localStorage.removeItem(ACTIVE_CHAT_STORAGE_KEY)
  } catch { /* ignore */ }
  }, [activeChatId, chats, ACTIVE_CHAT_STORAGE_KEY])

  // Handlers (kept simple and predictable)
  const onSelectChat = (chatId) => setActiveChatId(chatId)

  const onArchive = (chatId) => {
    setChats((prev) => prev.map((c) => (c.id === chatId ? { ...c, archived: true, archivedAt: new Date().toISOString() } : c)))
    if (activeChatId === chatId) setActiveChatId(null)
  }

  const onRestoreChat = (chatId) => {
    setChats((prev) => prev.map((c) => (c.id === chatId ? { ...c, archived: false, archivedAt: undefined } : c)))
  }

  const onPermanentlyDeleteChat = (chatId) => {
    setChats((prev) => {
      const updated = prev.filter((c) => c.id !== chatId)
      // Immediate persistence of full updated list (may be empty array)
      try {
        localStorage.setItem(CHAT_STORAGE_KEY, JSON.stringify(updated))
        if (activeChatId === chatId) localStorage.removeItem(ACTIVE_CHAT_STORAGE_KEY)
      } catch { /* ignore storage errors */ }
      if (updated.length === 0) {
        // Mark that we intentionally cleared chats so persist effect can write empty
        intentionalEmptyRef.current = true
      }
      return updated
    })
    if (activeChatId === chatId) setActiveChatId(null)
  }

  const onRename = (chatId, newTitle) => {
    setChats((prev) => prev.map((c) => (c.id === chatId ? { ...c, title: newTitle } : c)))
  }

  const onDelete = (chatId) => {
    // Single centralized confirmation (UI menus should not duplicate)
    try {
      const ok = window.confirm('Permanently delete this chat? This action cannot be undone.')
      if (!ok) return
    } catch { /* ignore confirm failures (non-browser) */ }
    onPermanentlyDeleteChat(chatId)
  }

  /**
   * Create a new chat id and make it active.
   * Prevents stacking empty chats: requires the current chat to have both user and AI messages.
   * Returns the new id (string) or undefined if prevented.
   */
  const onNewChat = () => {
    const current = chats.find((c) => c.id === activeChatId)
    if (current) {
      const msgs = current.messages || []
      if (msgs.length === 0) {
        notify('💬 Send a message first before creating a new chat')
        return undefined
      }
      const hasUser = msgs.some((m) => m.role === 'user')
      const hasAI = msgs.some((m) => m.role === 'ai' || m.role === 'assistant')
      if (!hasUser || !hasAI) {
        notify('💬 Complete the current conversation before starting a new chat')
        return undefined
      }
    }
    const newId = Date.now().toString()
    setActiveChatId(newId)
    notify('✨ New chat started')
    return newId
  }

  return {
    chats,
    setChats,
    activeChatId,
    setActiveChatId,
    onNewChat,
    onSelectChat,
    onArchive,
    onRestoreChat,
    onPermanentlyDeleteChat,
    onRename,
    onDelete,
  }
}
