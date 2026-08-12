'use client';

import { createTheme } from '@mui/material/styles';

declare module '@mui/material/styles' {
  interface Palette {
    tint: { main: string };
  }
  interface PaletteOptions {
    tint?: { main: string };
  }
}

export const theme = createTheme({
  cssVariables: true,
  palette: {
    mode: 'light',
    primary: { main: '#E1232A', contrastText: '#ffffff' },
    secondary: { main: '#1A1A1A', contrastText: '#ffffff' },
    success: { main: '#25D366', contrastText: '#ffffff' }, // WhatsApp green
    error: { main: '#ba1a1a', contrastText: '#ffffff' },
    background: { default: '#ffffff', paper: '#ffffff' },
    text: { primary: '#111111', secondary: '#6B6B6B' },
    divider: '#EAEAEA',
    grey: { 50: '#FAFAFA', 100: '#F7F7F7' },
    // Soft red-tinted surface derived from primary #E1232A — for hero/finder/footer washes.
    tint: { main: '#FCF1F1' },
  },
  shape: { borderRadius: 8 },
  typography: {
    fontFamily: 'var(--font-inter), Inter, system-ui, sans-serif',
    h1: {
      fontFamily: 'var(--font-space-grotesk), "Space Grotesk", var(--font-inter), sans-serif',
      fontSize: '34px',
      lineHeight: '40px',
      letterSpacing: '-0.03em',
      fontWeight: 700,
      '@media (min-width:900px)': { fontSize: '56px', lineHeight: '60px', letterSpacing: '-0.035em' },
    },
    h2: {
      fontFamily: 'var(--font-space-grotesk), "Space Grotesk", var(--font-inter), sans-serif',
      fontSize: '20px',
      lineHeight: '28px',
      fontWeight: 700,
      '@media (min-width:900px)': { fontSize: '24px', lineHeight: '32px' },
    },
    h3: {
      fontFamily: 'var(--font-space-grotesk), "Space Grotesk", var(--font-inter), sans-serif',
      fontSize: '20px',
      lineHeight: '28px',
      fontWeight: 700,
    },
    body1: { fontSize: '18px', lineHeight: '28px', fontWeight: 400 },
    body2: { fontSize: '16px', lineHeight: '24px', fontWeight: 400 },
    caption: { fontSize: '14px', lineHeight: '20px', fontWeight: 400 },
    button: {
      fontFamily: 'var(--font-space-grotesk), "Space Grotesk", var(--font-inter), sans-serif',
      fontSize: '12px',
      lineHeight: '16px',
      letterSpacing: '0.05em',
      fontWeight: 700,
      textTransform: 'uppercase',
    },
  },
  components: {
    MuiButton: {
      defaultProps: { disableElevation: true },
      styleOverrides: {
        root: {
          borderRadius: 8,
          paddingBlock: 12,
          paddingInline: 24,
          boxShadow: 'none',
          // Spring-like ease-out for a slightly bouncy press. `cubic-bezier(.34,1.56,.64,1)` = mild overshoot.
          transition: 'background-color 0.2s ease, border-color 0.2s ease, color 0.2s ease, transform 0.28s cubic-bezier(.34,1.56,.64,1), box-shadow 0.2s ease',
          '&:hover': { transform: 'translateY(-1px)' },
          '&:active': { transform: 'scale(0.97)', transition: 'transform 0.08s ease' },
          '@media (prefers-reduced-motion: reduce)': {
            transition: 'background-color 0.2s ease, color 0.2s ease',
            '&:hover': { transform: 'none' },
            '&:active': { transform: 'none' },
          },
        },
        containedPrimary: {
          // Tinted red-glow shadow on hover for primary CTAs
          '&:hover': { boxShadow: '0 8px 16px -8px rgba(225, 35, 42, 0.5)' },
        },
      },
    },
    MuiCard: {
      defaultProps: { variant: 'outlined', elevation: 0 },
      styleOverrides: {
        root: { borderColor: '#EAEAEA', boxShadow: 'none' },
      },
    },
    MuiPaper: {
      styleOverrides: { root: { backgroundImage: 'none' } },
    },
  },
});
