'use client'

import { Button, useDocumentInfo } from '@payloadcms/ui'
import React from 'react'
import { isTypingActive } from '@/lib/chat'

type Message = {
  id: number | string
  sender: 'buyer' | 'admin'
  text: string
  createdAt: string
}

const TYPING_THROTTLE_MS = 2000

const fetchConversation = async (
  conversationId: number | string,
): Promise<{ buyerTypingAt?: string | null } | null> => {
  const res = await fetch(`/api/conversations/${conversationId}`, {
    credentials: 'include',
  })
  if (!res.ok) return null
  return res.json()
}

const fetchMessages = async (conversationId: number | string): Promise<Message[]> => {
  const params = new URLSearchParams({
    'where[conversation][equals]': String(conversationId),
    sort: 'createdAt',
    limit: '200',
    depth: '0',
  })
  const res = await fetch(`/api/messages?${params.toString()}`, {
    credentials: 'include',
  })
  if (!res.ok) {
    throw new Error(`Failed to load messages (${res.status})`)
  }
  const json = await res.json()
  return Array.isArray(json?.docs) ? json.docs : []
}

const ConversationThread: React.FC = () => {
  const { id } = useDocumentInfo()

  const [messages, setMessages] = React.useState<Message[]>([])
  const [loading, setLoading] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const [draft, setDraft] = React.useState('')
  const [sending, setSending] = React.useState(false)
  const [buyerTyping, setBuyerTyping] = React.useState(false)
  const lastTypingNotifyRef = React.useRef(0)

  const loadMessages = React.useCallback(async () => {
    if (!id) return
    setLoading(true)
    setError(null)
    try {
      const docs = await fetchMessages(id)
      setMessages(docs)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load messages')
    } finally {
      setLoading(false)
    }
  }, [id])

  // Load the thread whenever the document id becomes available.
  React.useEffect(() => {
    void loadMessages()
  }, [loadMessages])

  // Clear the admin-unread badge once per conversation open. Kept isolated
  // from loadMessages/render so it never re-fires on unrelated re-renders.
  React.useEffect(() => {
    if (!id) return
    const clearUnread = async () => {
      try {
        await fetch(`/api/conversations/${id}`, {
          method: 'PATCH',
          credentials: 'include',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ unreadForAdmin: 0 }),
        })
      } catch {
        // Swallow — failing to clear the badge shouldn't break the admin UI.
      }
    }
    void clearUnread()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id])

  // Poll the conversation for the buyer's typing heartbeat.
  React.useEffect(() => {
    if (!id) return
    let active = true
    const tick = async () => {
      const convo = await fetchConversation(id)
      if (!active || !convo) return
      setBuyerTyping(isTypingActive(convo.buyerTypingAt))
    }
    void tick()
    const iv = setInterval(tick, 2000)
    return () => {
      active = false
      clearInterval(iv)
    }
  }, [id])

  const notifyAdminTyping = React.useCallback(() => {
    if (!id) return
    const now = Date.now()
    if (now - lastTypingNotifyRef.current < TYPING_THROTTLE_MS) return
    lastTypingNotifyRef.current = now
    void fetch(`/api/conversations/${id}`, {
      method: 'PATCH',
      credentials: 'include',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ adminTypingAt: new Date().toISOString() }),
    }).catch(() => {
      // Best-effort — a missed heartbeat just delays the buyer's indicator.
    })
  }, [id])

  const handleSend = async () => {
    const text = draft.trim()
    if (!text || !id || sending) return
    setSending(true)
    setError(null)
    try {
      const res = await fetch('/api/messages', {
        method: 'POST',
        credentials: 'include',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ conversation: Number(id), sender: 'admin', text }),
      })
      if (!res.ok) {
        throw new Error(`Failed to send message (${res.status})`)
      }
      setDraft('')
      await loadMessages()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send message')
    } finally {
      setSending(false)
    }
  }

  if (!id) {
    return (
      <div style={{ padding: '1rem 0', color: 'var(--theme-elevation-500)' }}>
        Save the conversation first to load messages.
      </div>
    )
  }

  return (
    <div
      style={{
        border: '1px solid var(--theme-elevation-150)',
        borderRadius: 'var(--style-radius-m)',
        marginBottom: '1.5rem',
        padding: '1rem',
      }}
    >
      <h3 style={{ marginTop: 0 }}>Conversation</h3>

      {error && (
        <div style={{ color: 'var(--theme-error-500)', marginBottom: '0.75rem' }}>{error}</div>
      )}

      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '0.5rem',
          maxHeight: 360,
          overflowY: 'auto',
          marginBottom: '1rem',
        }}
      >
        {loading && messages.length === 0 && <div>Loading messages…</div>}
        {!loading && messages.length === 0 && <div>No messages yet.</div>}
        {messages.map((message) => {
          const isAdmin = message.sender === 'admin'
          return (
            <div
              key={message.id}
              style={{
                alignSelf: isAdmin ? 'flex-end' : 'flex-start',
                maxWidth: '75%',
                background: isAdmin
                  ? 'var(--theme-success-100)'
                  : 'var(--theme-elevation-100)',
                borderRadius: 'var(--style-radius-m)',
                padding: '0.5rem 0.75rem',
              }}
            >
              <div
                style={{
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  color: 'var(--theme-elevation-500)',
                  marginBottom: '0.15rem',
                }}
              >
                {isAdmin ? 'Admin' : 'Buyer'}
              </div>
              <div style={{ whiteSpace: 'pre-wrap' }}>{message.text}</div>
            </div>
          )
        })}
        {buyerTyping && (
          <div style={{ fontSize: '0.85rem', fontStyle: 'italic', color: 'var(--theme-elevation-500)' }}>
            Buyer is typing…
          </div>
        )}
      </div>

      <div style={{ display: 'flex', gap: '0.5rem' }}>
        <input
          type="text"
          value={draft}
          onChange={(event) => {
            setDraft(event.target.value)
            notifyAdminTyping()
          }}
          onKeyDown={(event) => {
            if (event.key === 'Enter' && !event.shiftKey) {
              event.preventDefault()
              void handleSend()
            }
          }}
          placeholder="Reply to buyer…"
          disabled={sending}
          style={{
            flex: 1,
            padding: '0.5rem 0.75rem',
            border: '1px solid var(--theme-elevation-150)',
            borderRadius: 'var(--style-radius-m)',
            background: 'var(--theme-input-bg)',
            color: 'var(--theme-elevation-800)',
          }}
        />
        <Button
          buttonStyle="primary"
          disabled={sending || !draft.trim()}
          onClick={() => void handleSend()}
          type="button"
        >
          {sending ? 'Sending…' : 'Send'}
        </Button>
      </div>
    </div>
  )
}

export default ConversationThread
