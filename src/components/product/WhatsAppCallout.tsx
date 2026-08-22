'use client';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import ChatIcon from '@mui/icons-material/Chat';
import { useChatLauncher } from '@/components/chat/ChatContext';

export default function WhatsAppCallout({ laptop }: { laptop?: { id: number; title: string; price: number; url: string } }) {
  const { openChat } = useChatLauncher();
  return (
    <Paper variant="outlined" sx={{ p: 4, textAlign: 'center', bgcolor: 'grey.50' }}>
      <Stack spacing={2} alignItems="center">
        <Typography variant="h2">Still confused? Chat with us before buying</Typography>
        <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 640 }}>
          Our laptop experts are online to answer any questions about specs, condition, or shipping.
        </Typography>
        <Button onClick={() => openChat(laptop)} startIcon={<ChatIcon />}
          variant="contained" size="large" color="primary" sx={{ borderRadius: 999 }}>
          Chat with us
        </Button>
      </Stack>
    </Paper>
  );
}
