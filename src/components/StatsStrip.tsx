'use client';

import { useEffect, useRef, useState } from 'react';
import Box from '@mui/material/Box';
import Container from '@mui/material/Container';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

const STATS = [
  { end: 300, suffix: '+', decimals: 0, label: 'Laptops in stock' },
  { end: 1500, suffix: '+', decimals: 0, label: 'Happy customers' },
  { end: 4.9, suffix: '★', decimals: 1, label: 'Average rating' },
] as const;

const DURATION_MS = 1200;

function format(value: number, decimals: number) {
  return value.toLocaleString('en-NG', { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
}

/**
 * Social-proof stat counters that count up once when scrolled into view.
 * Renders final values by default (SSR / no-JS / reduced-motion safe);
 * the count-up only runs when a live IntersectionObserver confirms entry.
 */
export function StatsStrip() {
  const ref = useRef<HTMLDivElement>(null);
  const [progress, setProgress] = useState(1); // 1 = final values (fail-safe)

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (typeof IntersectionObserver === 'undefined') return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    let raf = 0;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry?.isIntersecting) return;
        observer.disconnect();
        const start = performance.now();
        const tick = (now: number) => {
          const t = Math.min((now - start) / DURATION_MS, 1);
          setProgress(1 - Math.pow(1 - t, 3)); // ease-out cubic
          if (t < 1) raf = requestAnimationFrame(tick);
        };
        setProgress(0);
        raf = requestAnimationFrame(tick);
      },
      { threshold: 0.4 },
    );
    observer.observe(el);
    return () => {
      observer.disconnect();
      cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <Box ref={ref} sx={{ borderTop: 1, borderBottom: 1, borderColor: 'divider', py: { xs: 4, md: 5 } }}>
      <Container maxWidth="lg">
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={{ xs: 3, sm: 6 }} justifyContent="space-evenly" alignItems="center">
          {STATS.map((stat) => (
            <Stack key={stat.label} spacing={0.5} alignItems="center">
              <Typography variant="h1" component="p" sx={{ color: 'primary.main' }}>
                {format(stat.end * progress, stat.decimals)}
                {stat.suffix}
              </Typography>
              <Typography variant="button" sx={{ color: 'text.secondary' }}>{stat.label}</Typography>
            </Stack>
          ))}
        </Stack>
      </Container>
    </Box>
  );
}
