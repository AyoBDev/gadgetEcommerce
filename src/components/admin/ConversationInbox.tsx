'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import { isTypingActive } from '@/lib/chat';

type Message = {
  id: number | string;
  sender: 'buyer' | 'admin';
  text: string;
  createdAt: string;
};

const TYPING_THROTTLE_MS = 2000;

async function fetchConversation(conversationId: number): Promise<{ buyerTypingAt?: string | null } | null> {
  const res = await fetch(`/api/conversations/${conversationId}`, { credentials: 'include' });
  if (!res.ok) return null;
  return res.json();
}

async function fetchMessages(conversationId: number): Promise<Message[]> {
  const params = new URLSearchParams({
    'where[conversation][equals]': String(conversationId),
    sort: 'createdAt',
    limit: '200',
    depth: '0',
  });
  const res = await fetch(`/api/messages?${params.toString()}`, { credentials: 'include' });
  if (!res.ok) {
    throw new Error(`Failed to load messages (${res.status})`);
  }
  const json = await res.json();
  return Array.isArray(json?.docs) ? json.docs : [];
}

export function ConversationInbox({ conversationId }: { conversationId: number }) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [draft, setDraft] = useState('');
  const [sending, setSending] = useState(false);
  const [buyerTyping, setBuyerTyping] = useState(false);
  const lastTypingNotifyRef = useRef(0);
  const scrollRef = useRef<HTMLDivElement>(null);

  const loadMessages = useCallback(async () => {
    try {
      const docs = await fetchMessages(conversationId);
      setMessages(docs);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load messages');
    } finally {
      setLoading(false);
    }
  }, [conversationId]);

  useEffect(() => {
    let ignore = false;
    const load = async () => {
      try {
        const docs = await fetchMessages(conversationId);
        if (!ignore) {
          setMessages(docs);
          setError(null);
        }
      } catch (err) {
        if (!ignore) setError(err instanceof Error ? err.message : 'Failed to load messages');
      } finally {
        if (!ignore) setLoading(false);
      }
    };
    void load();
    return () => {
      ignore = true;
    };
  }, [conversationId]);

  useEffect(() => {
    const clearUnread = async () => {
      try {
        await fetch(`/api/conversations/${conversationId}`, {
          method: 'PATCH',
          credentials: 'include',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ unreadForAdmin: 0 }),
        });
      } catch {
        // Best-effort — failing to clear the badge shouldn't break the UI.
      }
    };
    void clearUnread();
  }, [conversationId]);

  useEffect(() => {
    let active = true;
    const tick = async () => {
      const convo = await fetchConversation(conversationId);
      if (!active || !convo) return;
      setBuyerTyping(isTypingActive(convo.buyerTypingAt));
    };
    void tick();
    const iv = setInterval(tick, 2000);
    return () => {
      active = false;
      clearInterval(iv);
    };
  }, [conversationId]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight });
  }, [messages.length, buyerTyping]);

  const notifyAdminTyping = useCallback(() => {
    const now = Date.now();
    if (now - lastTypingNotifyRef.current < TYPING_THROTTLE_MS) return;
    lastTypingNotifyRef.current = now;
    void fetch(`/api/conversations/${conversationId}`, {
      method: 'PATCH',
      credentials: 'include',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ adminTypingAt: new Date().toISOString() }),
    }).catch(() => {
      // Best-effort — a missed heartbeat just delays the buyer's indicator.
    });
  }, [conversationId]);

  const handleSend = async () => {
    const text = draft.trim();
    if (!text || sending) return;
    setSending(true);
    setError(null);
    try {
      const res = await fetch('/api/messages', {
        method: 'POST',
        credentials: 'include',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ conversation: conversationId, sender: 'admin', text }),
      });
      if (!res.ok) {
        throw new Error(`Failed to send message (${res.status})`);
      }
      setDraft('');
      await loadMessages();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send message');
    } finally {
      setSending(false);
    }
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {error && (
        <Typography variant="body2" color="error" sx={{ mb: 1 }}>
          {error}
        </Typography>
      )}
      <Box
        ref={scrollRef}
        sx={{
          flexGrow: 1,
          overflowY: 'auto',
          display: 'flex',
          flexDirection: 'column',
          gap: 1,
          mb: 2,
          maxHeight: 420,
          p: 1,
          bgcolor: 'grey.50',
          borderRadius: 1,
        }}
      >
        {loading && messages.length === 0 && (
          <Typography color="text.secondary">Loading messages…</Typography>
        )}
        {!loading && messages.length === 0 && (
          <Typography color="text.secondary">No messages yet.</Typography>
        )}
        {messages.map((message) => {
          const isAdmin = message.sender === 'admin';
          return (
            <Box
              key={message.id}
              sx={{
                alignSelf: isAdmin ? 'flex-end' : 'flex-start',
                maxWidth: '75%',
                bgcolor: isAdmin ? 'tint.main' : 'background.paper',
                border: 1,
                borderColor: 'divider',
                borderRadius: 1.5,
                px: 1.25,
                py: 0.75,
              }}
            >
              <Typography variant="caption" fontWeight={600} color="text.secondary" display="block">
                {isAdmin ? 'Admin' : 'Buyer'}
              </Typography>
              <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
                {message.text}
              </Typography>
            </Box>
          );
        })}
        {buyerTyping && (
          <Typography variant="body2" fontStyle="italic" color="text.secondary">
            Buyer is typing…
          </Typography>
        )}
      </Box>
      <Stack direction="row" spacing={1}>
        <TextField
          fullWidth
          size="small"
          value={draft}
          onChange={(e) => {
            setDraft(e.target.value);
            notifyAdminTyping();
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              void handleSend();
            }
          }}
          placeholder="Reply to buyer…"
          disabled={sending}
        />
        <Button
          variant="contained"
          onClick={() => void handleSend()}
          disabled={sending || !draft.trim()}
        >
          {sending ? 'Sending…' : 'Send'}
        </Button>
      </Stack>
    </Box>
  );
}