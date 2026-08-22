'use client';
import Fab from '@mui/material/Fab';
import Badge from '@mui/material/Badge';
import Box from '@mui/material/Box';
import ChatIcon from '@mui/icons-material/Chat';
import { useChat } from './useChat';
import { ChatPanel } from './ChatPanel';

export function ChatLauncher() {
  const chat = useChat();
  return (
    <>
      <Box
        sx={{
          position: 'fixed',
          bottom: 24,
          right: 24,
          zIndex: 1200,
          transition: 'opacity 0.2s ease, transform 0.2s ease',
          opacity: chat.open ? 0 : 1,
          transform: chat.open ? 'scale(0.8)' : 'scale(1)',
          pointerEvents: chat.open ? 'none' : 'auto',
          // Idle pulse ring behind the FAB.
          '@keyframes chatFabPulse': {
            '0%': { boxShadow: '0 0 0 0 rgba(225,35,42,0.45)' },
            '70%': { boxShadow: '0 0 0 16px rgba(225,35,42,0)' },
            '100%': { boxShadow: '0 0 0 0 rgba(225,35,42,0)' },
          },
        }}
      >
        <Badge color="error" badgeContent={chat.unread} overlap="circular">
          <Fab
            color="primary"
            aria-label="Chat with us"
            onClick={() => void chat.openChat()}
            sx={{
              animation: 'chatFabPulse 2.4s infinite',
              '&:hover': { animation: 'none' },
              '@media (prefers-reduced-motion: reduce)': { animation: 'none' },
            }}
          >
            <ChatIcon />
          </Fab>
        </Badge>
      </Box>
      <ChatPanel chat={chat} />
    </>
  );
}
