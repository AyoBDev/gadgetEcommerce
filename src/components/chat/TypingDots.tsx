'use client';
import Box from '@mui/material/Box';

const BOUNCE = {
  '@keyframes chatDotBounce': {
    '0%, 80%, 100%': { transform: 'translateY(0)', opacity: 0.4 },
    '40%': { transform: 'translateY(-4px)', opacity: 1 },
  },
};

export function TypingDots() {
  return (
    <Box
      aria-label="Admin is typing"
      sx={{
        alignSelf: 'flex-start',
        display: 'flex',
        gap: 0.6,
        bgcolor: 'grey.100',
        borderRadius: '18px 18px 18px 4px',
        px: 1.5,
        py: 1.25,
        ...BOUNCE,
      }}
    >
      {[0, 1, 2].map((i) => (
        <Box
          key={i}
          sx={{
            width: 7,
            height: 7,
            borderRadius: '50%',
            bgcolor: 'text.secondary',
            animation: 'chatDotBounce 1.2s infinite ease-in-out',
            animationDelay: `${i * 0.15}s`,
            '@media (prefers-reduced-motion: reduce)': {
              animation: 'none',
              opacity: 0.6,
            },
          }}
        />
      ))}
    </Box>
  );
}
