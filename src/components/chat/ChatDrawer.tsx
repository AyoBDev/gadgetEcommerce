'use client';
import { useEffect, useRef, useState } from 'react';
import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Drawer from '@mui/material/Drawer';
import IconButton from '@mui/material/IconButton';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import Divider from '@mui/material/Divider';
import CloseIcon from '@mui/icons-material/Close';
import SendIcon from '@mui/icons-material/Send';
import type { useChat } from './useChat';

export function ChatDrawer({
  chat,
  laptopSummary,
}: {
  chat: ReturnType<typeof useChat>;
  laptopSummary?: string;
}) {
  const { open, setOpen, messages, send, notifyTyping, adminTyping } = chat;
  const [draft, setDraft] = useState('');
  const [sending, setSending] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open) {
      const id = setTimeout(() => inputRef.current?.focus(), 0);
      return () => clearTimeout(id);
    }
  }, [open]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, open]);

  const handleSend = async () => {
    const text = draft.trim();
    if (!text || sending) return;
    setSending(true);
    setDraft('');
    try {
      await send(text);
    } finally {
      setSending(false);
    }
  };

  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={() => setOpen(false)}
      ModalProps={{ keepMounted: true }}
      aria-label="Chat with us"
    >
      <Box sx={{ width: { xs: '100vw', sm: 380 }, height: '100%', display: 'flex', flexDirection: 'column' }}>
        <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ px: 2, py: 1.5 }}>
          <Box>
            <Typography variant="h3" sx={{ fontSize: 18 }}>Chat with us</Typography>
            {laptopSummary && (
              <Typography variant="body2" color="text.secondary">{laptopSummary}</Typography>
            )}
          </Box>
          <IconButton aria-label="Close chat" onClick={() => setOpen(false)}>
            <CloseIcon />
          </IconButton>
        </Stack>
        <Divider />
        <Box ref={scrollRef} sx={{ flex: 1, overflowY: 'auto', px: 2, py: 2 }}>
          <Stack spacing={1.5}>
            {messages.length === 0 && (
              <Typography variant="body2" color="text.secondary">
                Send a message and our team will get back to you.
              </Typography>
            )}
            {messages.map((m) => (
              <Box
                key={m.id}
                sx={{
                  alignSelf: m.sender === 'buyer' ? 'flex-end' : 'flex-start',
                  maxWidth: '80%',
                  bgcolor: m.sender === 'buyer' ? 'primary.main' : 'grey.100',
                  color: m.sender === 'buyer' ? 'primary.contrastText' : 'text.primary',
                  borderRadius: 2,
                  px: 1.5,
                  py: 1,
                }}
              >
                <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                  {m.text}
                </Typography>
              </Box>
            ))}
            {adminTyping && (
              <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}>
                Admin is typing…
              </Typography>
            )}
          </Stack>
        </Box>
        <Divider />
        <Stack direction="row" spacing={1} sx={{ p: 1.5 }}>
          <TextField
            inputRef={inputRef}
            fullWidth
            size="small"
            placeholder="Type a message"
            aria-label="Message"
            value={draft}
            onChange={(e) => {
              setDraft(e.target.value);
              notifyTyping();
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                void handleSend();
              }
            }}
          />
          <IconButton aria-label="Send message" color="primary" onClick={() => void handleSend()} disabled={sending || !draft.trim()}>
            <SendIcon />
          </IconButton>
        </Stack>
      </Box>
    </Drawer>
  );
}
