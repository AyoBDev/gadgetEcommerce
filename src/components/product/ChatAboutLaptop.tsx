'use client';
import Button from '@mui/material/Button';
import ChatIcon from '@mui/icons-material/Chat';
import { useChat } from '@/components/chat/useChat';
import { ChatDrawer } from '@/components/chat/ChatDrawer';

export function ChatAboutLaptop(props: { id: number; title: string; price: number; url: string; disabled?: boolean }) {
  const { id, title, price, url, disabled } = props;
  const chat = useChat({ laptop: { id, title, price, url } });
  return (
    <>
      <Button
        onClick={() => void chat.openChat()}
        variant="contained"
        size="large"
        startIcon={<ChatIcon />}
        fullWidth
        disabled={disabled}
      >
        Chat with us
      </Button>
      <ChatDrawer chat={chat} laptopSummary={title} />
    </>
  );
}
