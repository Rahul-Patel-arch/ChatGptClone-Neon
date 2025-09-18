// src/hooks/useChats.js
// Centralized, well-documented chat state management
// - Per-user localStorage scoping
// - Safe hydration (no overwrite on reload)
// - Persistence of chats and active chat id
// - Simple, predictable operations

import { useEffect, useRef, useState } from 'react'

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

  // Hydrate on user change with legacy migration
  useEffect(() => {
    setChats([])
    setActiveChatId(null)
    hasHydratedRef.current = false
    try {
      let raw = localStorage.getItem(CHAT_STORAGE_KEY)
      if (!raw) {
        const legacyCandidates = [
          `quantumchat_chats:${userId}`,
          'quantumchat_chats_v1',
          'quantumchat_chats',
        ]
        for (const key of legacyCandidates) {
          const legacy = localStorage.getItem(key)
          if (legacy) {
            raw = legacy
            try { localStorage.setItem(CHAT_STORAGE_KEY, legacy) } catch { /* ignore persistence errors */ }
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
            // Exclude empty chats (no messages)
            .filter((c) => Array.isArray(c.messages) && c.messages.length > 0)
            // newest first
            .sort((a, b) => (Date.parse(b.createdAt) || 0) - (Date.parse(a.createdAt) || 0))

          setChats(normalized)
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
  }, [userId, CHAT_STORAGE_KEY, ACTIVE_CHAT_STORAGE_KEY])

  // Persist chats
  useEffect(() => {
    if (!hasHydratedRef.current) return
    const toSave = chats.filter((c) => Array.isArray(c.messages) && c.messages.length > 0)
    if (toSave.length === 0) {
  try { localStorage.removeItem(CHAT_STORAGE_KEY) } catch { /* ignore */ }
      return
    }
  try { localStorage.setItem(CHAT_STORAGE_KEY, JSON.stringify(toSave)) } catch { /* ignore */ }
  }, [chats, CHAT_STORAGE_KEY])

  // Persist active chat id
  useEffect(() => {
    if (!hasHydratedRef.current) return
    try {
      const existsAndHasMessages =
        activeChatId && chats.some((c) => c.id === activeChatId && Array.isArray(c.messages) && c.messages.length > 0)
      if (existsAndHasMessages) localStorage.setItem(ACTIVE_CHAT_STORAGE_KEY, activeChatId)
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
    setChats((prev) => prev.filter((c) => c.id !== chatId))
    if (activeChatId === chatId) setActiveChatId(null)
  }

  const onRename = (chatId, newTitle) => {
    setChats((prev) => prev.map((c) => (c.id === chatId ? { ...c, title: newTitle } : c)))
  }

  const onDelete = (chatId) => {
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
