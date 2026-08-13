'use client';
import { useCallback, useEffect, useRef, useState } from 'react';
import { createConversation, fetchMessages, sendMessage, type ChatMessage } from '@/lib/chat-client';

type Laptop = { id: number; title: string; price: number; url: string };

export function useChat(opts?: { laptop?: Laptop }) {
  const [open, setOpen] = useState(false);
  const [convoId, setConvoId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [unread, setUnread] = useState(0);
  const [status, setStatus] = useState<string>('open');
  const seen = useRef(0);

  const ensure = useCallback(async () => {
    if (convoId) return convoId;
    const { conversationId } = await createConversation(opts?.laptop);
    setConvoId(conversationId);
    return conversationId;
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

  useEffect(() => {
    if (!convoId) return;
    let active = true;
    const tick = async () => {
      try {
        const { messages: msgs, status: st } = await fetchMessages(convoId);
        if (!active) return;
        setMessages(msgs);
        setStatus(st);
        const adminCount = msgs.filter((m) => m.sender === 'admin').length;
        if (!open && adminCount > seen.current) setUnread((u) => u + (adminCount - seen.current));
        seen.current = adminCount;
      } catch { /* transient; next tick retries */ }
    };
    tick();
    const iv = setInterval(tick, 3000);
    return () => { active = false; clearInterval(iv); };
  }, [convoId, open]);

  return { open, setOpen, openChat, messages, unread, status, send, ready: Boolean(convoId) };
}
