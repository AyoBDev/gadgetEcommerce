'use client';
import { useCallback, useEffect, useRef, useState } from 'react';
import { createConversation, fetchMessages, sendMessage, type ChatMessage } from '@/lib/chat-client';

type Laptop = { id: number; title: string; price: number; url: string };

const TYPING_THROTTLE_MS = 2000;

export function useChat(opts?: { laptop?: Laptop }) {
  const [open, setOpen] = useState(false);
  const [convoId, setConvoId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [unread, setUnread] = useState(0);
  const [status, setStatus] = useState<string>('open');
  const [adminTyping, setAdminTyping] = useState(false);
  const seen = useRef(0);
  const pendingRef = useRef<Promise<string> | null>(null);
  const lastTypingNotifyRef = useRef(0);

  const ensure = useCallback(async () => {
    if (convoId) return convoId;
    if (pendingRef.current) return pendingRef.current;
    const promise = createConversation(opts?.laptop)
      .then(({ conversationId }) => {
        setConvoId(conversationId);
        return conversationId;
      })
      .finally(() => {
        pendingRef.current = null;
      });
    pendingRef.current = promise;
    return promise;
  }, [convoId, opts?.laptop]);

  const openChat = useCallback(async () => {
    await ensure();
    setUnread(0);
    setOpen(true);
  }, [ensure]);

  const send = useCallback(async (text: string) => {
    const id = await ensure();
    const m = await sendMessage(id, text);
    setMessages((prev) => [...prev, m]);
  }, [ensure]);

  const notifyTyping = useCallback(() => {
    if (!convoId) return;
    const now = Date.now();
    if (now - lastTypingNotifyRef.current < TYPING_THROTTLE_MS) return;
    lastTypingNotifyRef.current = now;
    void fetch(`/api/chat/${convoId}/typing`, { method: 'POST', credentials: 'same-origin' }).catch(() => {
      /* best-effort */
    });
  }, [convoId]);

  useEffect(() => {
    if (!convoId) return;
    let active = true;
    const tick = async () => {
      try {
        const result = await fetchMessages(convoId);
        const { messages: msgs, status: st } = result;
        const typing = (result as { adminTyping?: boolean }).adminTyping;
        if (!active) return;
        setMessages(msgs);
        setStatus(st);
        setAdminTyping(Boolean(typing));
        const adminCount = msgs.filter((m) => m.sender === 'admin').length;
        if (!open && adminCount > seen.current) setUnread((u) => u + (adminCount - seen.current));
        seen.current = adminCount;
      } catch { /* transient; next tick retries */ }
    };
    tick();
    const iv = setInterval(tick, 3000);
    return () => { active = false; clearInterval(iv); };
  }, [convoId, open]);

  return { open, setOpen, openChat, messages, unread, status, send, notifyTyping, adminTyping, ready: Boolean(convoId) };
}
