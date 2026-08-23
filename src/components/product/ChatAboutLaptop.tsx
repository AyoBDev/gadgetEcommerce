'use client';
import Button from '@mui/material/Button';
import ChatIcon from '@mui/icons-material/Chat';
import { useChatLauncher } from '@/components/chat/ChatContext';

export function ChatAboutLaptop(props: { id: number; title: string; price: number; url: string; disabled?: boolean }) {
  const { id, title, price, url, disabled } = props;
  const { openChat } = useChatLauncher();
  return (
    <Button
      onClick={() => openChat({ id, title, price, url })}
      variant="contained"
      size="large"
      startIcon={<ChatIcon />}
      fullWidth
      disabled={disabled}
    >
      Chat with us
    </Button>
  );
}
