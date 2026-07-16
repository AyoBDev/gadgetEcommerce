'use client';

import { useEffect, useRef, useState, type ReactNode } from 'react';
import Box from '@mui/material/Box';

type Phase = 'initial' | 'hidden' | 'shown';

/**
 * Scroll-triggered reveal: children fade in and slide up once when they
 * first enter the viewport.
 *
 * Content is visible by default (SSR, no-JS, reduced-motion, or any
 * environment where IntersectionObserver callbacks don't run). Only after
 * the observer confirms the element is OUT of view does it hide, arming
 * the reveal for when it scrolls in — so nothing can be stuck invisible.
 * Use `delay` (ms) to stagger siblings.
 */
export function Reveal({ children, delay = 0 }: { children: ReactNode; delay?: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const [phase, setPhase] = useState<Phase>('initial');

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (typeof IntersectionObserver === 'undefined') return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry) return;
        if (entry.isIntersecting) {
          setPhase('shown');
          observer.disconnect();
        } else {
          // Confirmed below the fold with a live observer: safe to arm the reveal.
          setPhase((p) => (p === 'initial' ? 'hidden' : p));
        }
      },
      { threshold: 0.15, rootMargin: '0px 0px -40px 0px' },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const hidden = phase === 'hidden';
  return (
    <Box
      ref={ref}
      sx={{
        opacity: hidden ? 0 : 1,
        transform: hidden ? 'translateY(24px)' : 'none',
        transition: 'opacity 0.6s ease-out, transform 0.6s ease-out',
        transitionDelay: `${delay}ms`,
        '@media (prefers-reduced-motion: reduce)': { transition: 'none', opacity: 1, transform: 'none' },
      }}
    >
      {children}
    </Box>
  );
}
