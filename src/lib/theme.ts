'use client';

import { createTheme } from '@mui/material/styles';

declare module '@mui/material/styles' {
  interface Palette {
    tint: { main: string };
    night: { main: string; light: string; contrastText: string };
    ink: { main: string };
  }
  interface PaletteOptions {
    tint?: { main: string };
    night?: { main: string; light: string; contrastText: string };
    ink?: { main: string };
  }
}

export const theme = createTheme({
  cssVariables: true,
  palette: {
    mode: 'light',
    primary: { main: '#E1232A', contrastText: '#ffffff' },
    secondary: { main: '#1A1A1C', contrastText: '#ffffff' },
    success: { main: '#25D366', contrastText: '#ffffff' }, // WhatsApp green
    error: { main: '#ba1a1a', contrastText: '#ffffff' },
    background: { default: '#F6F5F2', paper: '#FFFFFF' },
    text: { primary: '#161512', secondary: '#6B6B6B' },
    divider: '#E4E1DC',
    grey: { 50: '#F1F0ED', 100: '#EFEDE8', 200: '#E4E1DC' },
    // Near-black band for hero, stats, finder, footer. The dark spine that
    // bookends the light sections and kills the all-white flatness.
    night: { main: '#0E0E0F', light: '#1A1A1C', contrastText: '#F4F2EE' },
    // Soft red-tinted surface derived from primary #E1232A — red-washed band.
    tint: { main: '#FCEBEA' },
    // Warm near-black for text on dark bands / strong headers.
    ink: { main: '#161512' },
  },
  shape: { borderRadius: 10 },
  typography: {
    fontFamily: 'var(--font-inter), Instrument Sans, Inter, system-ui, sans-serif',
    h1: {
      fontFamily: 'var(--font-space-grotesk), "Space Grotesk", sans-serif',
      fontSize: '40px',
      lineHeight: '42px',
      letterSpacing: '-0.035em',
      fontWeight: 700,
      '@media (min-width:900px)': { fontSize: '56px', lineHeight: '58px' },
      '@media (min-width:1200px)': { fontSize: '72px', lineHeight: '74px' },
    },
    h2: {
      fontFamily: 'var(--font-space-grotesk), "Space Grotesk", sans-serif',
      fontSize: '28px',
      lineHeight: '31px',
      fontWeight: 700,
      letterSpacing: '-0.02em',
      '@media (min-width:900px)': { fontSize: '32px', lineHeight: '35px' },
    },
    h3: {
      fontFamily: 'var(--font-space-grotesk), "Space Grotesk", sans-serif',
      fontSize: '16px',
      lineHeight: '22px',
      fontWeight: 600,
      letterSpacing: '-0.01em',
    },
    body1: { fontSize: '17px', lineHeight: '27px', fontWeight: 400 },
    body2: { fontSize: '16px', lineHeight: '24px', fontWeight: 400 },
    caption: { fontSize: '14px', lineHeight: '20px', fontWeight: 400 },
    button: {
      fontFamily: 'var(--font-space-grotesk), "Space Grotesk", sans-serif',
      fontSize: '13px',
      lineHeight: '17px',
      letterSpacing: '0.05em',
      fontWeight: 700,
      textTransform: 'uppercase',
    },
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          backgroundColor: '#F6F5F2',
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          backgroundColor: 'rgba(246, 245, 242, 0.86)',
          backdropFilter: 'saturate(1.8) blur(20px)',
          WebkitBackdropFilter: 'saturate(1.8) blur(20px)',
        },
      },
    },
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
          '&:hover': { boxShadow: '0 8px 20px -8px rgba(225, 35, 42, 0.5)' },
        },
      },
    },
    MuiCard: {
      defaultProps: { variant: 'outlined', elevation: 0 },
      styleOverrides: {
        root: {
          borderColor: '#E4E1DC',
          boxShadow: '0 1px 2px rgba(0,0,0,0.04), 0 8px 24px rgba(0,0,0,0.06)',
          '&:hover': {
            boxShadow: '0 2px 4px rgba(0,0,0,0.06), 0 16px 40px rgba(0,0,0,0.10)',
          },
        },
      },
    },
    MuiPaper: {
      styleOverrides: { root: { backgroundImage: 'none' } },
    },
  },
});