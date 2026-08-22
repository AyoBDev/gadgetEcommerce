'use client';
import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Avatar from '@mui/material/Avatar';
import Typography from '@mui/material/Typography';

const SPRING = 'cubic-bezier(.34,1.56,.64,1)';

const RISE = {
  '@keyframes chatBubbleRise': {
    from: { opacity: 0, transform: 'translateY(8px)' },
    to: { opacity: 1, transform: 'translateY(0)' },
  },
};

export function ChatBubble({ text, sender }: { text: string; sender: 'buyer' | 'admin' }) {
  const isBuyer = sender === 'buyer';
  const bubble = (
    <Box
      sx={{
        maxWidth: '80%',
        px: 1.75,
        py: 1.25,
        color: isBuyer ? 'common.white' : 'text.primary',
        background: isBuyer
          ? 'linear-gradient(135deg, #E1232A, #b4171d)'
          : (t) => t.palette.grey[100],
        borderRadius: isBuyer ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
        boxShadow: isBuyer ? '0 4px 12px -6px rgba(225,35,42,0.5)' : 'none',
        ...RISE,
        animation: `chatBubbleRise 0.26s ${SPRING} both`,
        '@media (prefers-reduced-motion: reduce)': {
          animation: 'chatBubbleRise 0.15s ease both',
        },
      }}
    >
      <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
        {text}
      </Typography>
    </Box>
  );

  if (isBuyer) {
    return <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>{bubble}</Box>;
  }

  return (
    <Stack direction="row" spacing={1} alignItems="flex-end">
      <Avatar sx={{ width: 28, height: 28, bgcolor: 'primary.main', fontSize: 13 }}>J</Avatar>
      {bubble}
    </Stack>
  );
}
