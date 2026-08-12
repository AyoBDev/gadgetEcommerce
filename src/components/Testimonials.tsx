'use client';

import { useEffect, useState } from 'react';
import Box from '@mui/material/Box';
import Container from '@mui/material/Container';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import Rating from '@mui/material/Rating';
import { SectionHeading } from '@/components/SectionHeading';

const REVIEWS = [
  {
    initial: 'O',
    name: 'Oluwaseun A.',
    location: 'Lagos, NG',
    rating: 5,
    quote: 'Got an HP EliteBook for my programming classes. The laptop was super clean, almost like new. Battery lasts over 4 hours. Highly recommend.',
  },
  {
    initial: 'C',
    name: 'Chima E.',
    location: 'Abuja, NG',
    rating: 5,
    quote: 'I was skeptical about buying UK used, but the 7-day warranty gave me peace of mind. Delivery to Abuja was fast, and the MacBook works perfectly.',
  },
  {
    initial: 'F',
    name: 'Fatima Y.',
    location: 'Kano, NG',
    rating: 4.5,
    quote: 'Great customer service on WhatsApp. They helped me choose the right Dell laptop for my business needs and budget. Very professional.',
  },
] as const;

const ROTATE_MS = 6500;

export function Testimonials() {
  const [i, setI] = useState(0);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (paused) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const id = window.setInterval(() => setI((n) => (n + 1) % REVIEWS.length), ROTATE_MS);
    return () => window.clearInterval(id);
  }, [paused]);

  const active = REVIEWS[i]!;

  return (
    <Box sx={{ bgcolor: 'grey.50', py: { xs: 6, md: 9 }, borderTop: 1, borderBottom: 1, borderColor: 'divider' }}>
      <Container maxWidth="lg">
        <SectionHeading sx={{ mb: 6 }}>What our customers say</SectionHeading>
        <Box
          onMouseEnter={() => setPaused(true)}
          onMouseLeave={() => setPaused(false)}
          sx={{ position: 'relative', maxWidth: 820 }}
        >
          {/* Oversized pull-quote mark */}
          <Box
            aria-hidden
            sx={{
              position: 'absolute',
              top: { xs: -32, md: -48 },
              left: -8,
              fontFamily: 'var(--font-space-grotesk), serif',
              fontSize: { xs: 96, md: 160 },
              lineHeight: 1,
              color: 'primary.main',
              opacity: 0.15,
              pointerEvents: 'none',
              userSelect: 'none',
            }}
          >
            &ldquo;
          </Box>
          <Stack spacing={4} sx={{ position: 'relative' }}>
            <Typography
              key={active.name}
              sx={{
                fontFamily: 'var(--font-space-grotesk), sans-serif',
                fontSize: { xs: 22, md: 30 },
                lineHeight: { xs: '32px', md: '42px' },
                fontWeight: 500,
                letterSpacing: '-0.01em',
                color: 'text.primary',
                animation: 'testimonialFade 0.5s ease-out',
                '@keyframes testimonialFade': {
                  from: { opacity: 0, transform: 'translateY(6px)' },
                  to: { opacity: 1, transform: 'none' },
                },
              }}
            >
              {active.quote}
            </Typography>
            <Stack direction="row" alignItems="center" spacing={2}>
              <Box
                sx={{
                  width: 40, height: 40, borderRadius: '4px',
                  bgcolor: 'primary.main', color: 'primary.contrastText',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontFamily: 'var(--font-space-grotesk), sans-serif', fontWeight: 700, fontSize: 16,
                }}
              >
                {active.initial}
              </Box>
              <Stack spacing={0}>
                <Typography sx={{ fontFamily: 'var(--font-space-grotesk), sans-serif', fontWeight: 700, fontSize: 14 }}>
                  {active.name}
                </Typography>
                <Typography variant="caption" sx={{ color: 'text.secondary' }}>{active.location}</Typography>
              </Stack>
              <Box sx={{ flex: 1 }} />
              <Rating value={active.rating} precision={0.5} readOnly size="small" />
            </Stack>

            {/* Dots — click to jump, current is red */}
            <Stack direction="row" spacing={1} sx={{ pt: 1 }}>
              {REVIEWS.map((r, idx) => (
                <Box
                  key={r.name}
                  role="button"
                  aria-label={`Testimonial from ${r.name}`}
                  onClick={() => setI(idx)}
                  sx={{
                    width: idx === i ? 24 : 8, height: 4, borderRadius: 2,
                    bgcolor: idx === i ? 'primary.main' : 'divider',
                    cursor: 'pointer',
                    transition: 'width 0.3s ease, background-color 0.3s ease',
                  }}
                />
              ))}
            </Stack>
          </Stack>
        </Box>
      </Container>
    </Box>
  );
}
