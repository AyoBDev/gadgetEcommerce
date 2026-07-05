'use client';

import Fab from '@mui/material/Fab';
import ChatIcon from '@mui/icons-material/Chat';

const WA_NUMBER = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ?? '';

export function WhatsAppFab() {
  const href = `https://wa.me/${WA_NUMBER}?text=${encodeURIComponent('Hi, I need help choosing a laptop.')}`;
  return (
    <Fab
      component="a"
      href={href}
      target="_blank"
      rel="noopener"
      aria-label="Chat on WhatsApp"
      sx={{ position: 'fixed', bottom: 32, right: 32, bgcolor: '#25D366', color: 'white', '&:hover': { bgcolor: '#128C7E' } }}
    >
      <ChatIcon />
    </Fab>
  );
}
