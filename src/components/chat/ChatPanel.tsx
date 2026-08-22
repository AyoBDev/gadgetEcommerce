'use client';
import { useEffect, useRef, useState } from 'react';
import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Grow from '@mui/material/Grow';
import IconButton from '@mui/material/IconButton';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import CloseIcon from '@mui/icons-material/Close';
import SendIcon from '@mui/icons-material/Send';
import type { useChat } from './useChat';
import { ChatBubble } from './ChatBubble';
import { TypingDots } from './TypingDots';

const SPRING = 'cubic-bezier(.34,1.56,.64,1)';

export function ChatPanel({
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
  }, [messages, open, adminTyping]);

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
    <Grow
      in={open}
      style={{ transformOrigin: 'bottom right' }}
      timeout={{ enter: 320, exit: 180 }}
      easing={{ enter: SPRING, exit: 'ease' }}
      mountOnEnter
      unmountOnExit
    >
      <Box
        role="dialog"
        aria-label="Chat with us"
        sx={{
          position: 'fixed',
          zIndex: 1300,
          bottom: { xs: 12, sm: 96 },
          right: { xs: 12, sm: 24 },
          left: { xs: 12, sm: 'auto' },
          width: { xs: 'auto', sm: 380 },
          maxHeight: 'min(70vh, 600px)',
          display: 'flex',
          flexDirection: 'column',
          bgcolor: 'background.paper',
          borderRadius: '20px',
          overflow: 'hidden',
          boxShadow:
            '0 12px 40px -8px rgba(0,0,0,0.25), 0 0 0 1px rgba(0,0,0,0.04), 0 0 32px -12px rgba(225,35,42,0.25)',
        }}
      >
        {/* Header */}
        <Stack
          direction="row"
          alignItems="center"
          justifyContent="space-between"
          sx={{
            px: 2,
            py: 1.75,
            background: 'linear-gradient(135deg, #E1232A, #b4171d)',
            color: 'common.white',
          }}
        >
          <Box sx={{ minWidth: 0 }}>
            <Stack direction="row" alignItems="center" spacing={0.75}>
              <Box
                sx={{
                  width: 8,
                  height: 8,
                  borderRadius: '50%',
                  bgcolor: 'success.main',
                  boxShadow: '0 0 0 0 rgba(37,211,102,0.6)',
                  '@keyframes chatOnlinePulse': {
                    '0%': { boxShadow: '0 0 0 0 rgba(37,211,102,0.6)' },
                    '70%': { boxShadow: '0 0 0 6px rgba(37,211,102,0)' },
                    '100%': { boxShadow: '0 0 0 0 rgba(37,211,102,0)' },
                  },
                  animation: 'chatOnlinePulse 2s infinite',
                  '@media (prefers-reduced-motion: reduce)': { animation: 'none' },
                }}
              />
              <Typography variant="h3" sx={{ fontSize: 18, color: 'common.white' }}>
                Chat with us
              </Typography>
            </Stack>
            <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.85)', display: 'block', mt: 0.25 }} noWrap>
              {laptopSummary ?? 'Typically replies in minutes'}
            </Typography>
          </Box>
          <IconButton aria-label="Close chat" onClick={() => setOpen(false)} sx={{ color: 'common.white' }}>
            <CloseIcon />
          </IconButton>
        </Stack>

        {/* Messages */}
        <Box ref={scrollRef} sx={{ flex: 1, overflowY: 'auto', px: 2, py: 2, bgcolor: 'background.paper' }}>
          {messages.length === 0 ? (
            <Stack alignItems="center" justifyContent="center" spacing={1} sx={{ height: '100%', textAlign: 'center', color: 'text.secondary', py: 4 }}>
              <Box sx={{ fontSize: 36, lineHeight: 1 }}>💬</Box>
              <Typography variant="body2" color="text.secondary">
                Send us a message and our team will reply shortly.
              </Typography>
            </Stack>
          ) : (
            <Stack spacing={1.5}>
              {messages.map((m) => (
                <ChatBubble key={m.id} text={m.text} sender={m.sender} />
              ))}
              {adminTyping && <TypingDots />}
            </Stack>
          )}
        </Box>

        {/* Input */}
        <Stack direction="row" spacing={1} sx={{ p: 1.5, borderTop: '1px solid', borderColor: 'divider' }}>
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
            sx={{
              '& .MuiOutlinedInput-root': { borderRadius: '999px' },
              '& .MuiOutlinedInput-root.Mui-focused .MuiOutlinedInput-notchedOutline': {
                borderColor: 'primary.main',
                borderWidth: 2,
              },
            }}
          />
          <IconButton
            aria-label="Send message"
            color="primary"
            onClick={() => void handleSend()}
            disabled={sending || !draft.trim()}
            sx={{
              transition: `transform 0.2s ${SPRING}`,
              '&:not(:disabled):active': { transform: 'scale(0.9) rotate(-8deg)' },
              '@media (prefers-reduced-motion: reduce)': { transition: 'none', '&:active': { transform: 'none' } },
            }}
          >
            <SendIcon />
          </IconButton>
        </Stack>
      </Box>
    </Grow>
  );
}
