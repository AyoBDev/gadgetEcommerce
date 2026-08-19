'use client';
import Fab from '@mui/material/Fab';
import Badge from '@mui/material/Badge';
import ChatIcon from '@mui/icons-material/Chat';
import { useChat } from './useChat';
import { ChatDrawer } from './ChatDrawer';

export function ChatLauncher() {
  const chat = useChat();
  return (
    <>
      <Badge
        color="error"
        badgeContent={chat.unread}
        overlap="circular"
        sx={{ position: 'fixed', bottom: 24, right: 24, zIndex: 1200 }}
      >
        <Fab color="primary" aria-label="Chat with us" onClick={() => void chat.openChat()}>
          <ChatIcon />
        </Fab>
      </Badge>
      <ChatDrawer chat={chat} />
    </>
  );
}
