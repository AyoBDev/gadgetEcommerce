'use client';

import { createTheme } from '@mui/material/styles';

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
  },
  shape: { borderRadius: 8 },
  typography: {
    fontFamily: 'var(--font-inter), Inter, system-ui, sans-serif',
    h1: { fontSize: '48px', lineHeight: '56px', letterSpacing: '-0.02em', fontWeight: 700 },
    h2: { fontSize: '24px', lineHeight: '32px', fontWeight: 700 },
    h3: { fontSize: '20px', lineHeight: '28px', fontWeight: 700 },
    body1: { fontSize: '18px', lineHeight: '28px', fontWeight: 400 },
    body2: { fontSize: '16px', lineHeight: '24px', fontWeight: 400 },
    caption: { fontSize: '14px', lineHeight: '20px', fontWeight: 400 },
    button: { fontSize: '12px', lineHeight: '16px', letterSpacing: '0.05em', fontWeight: 700, textTransform: 'uppercase' },
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
          transition: 'background-color 0.25s ease, border-color 0.25s ease, color 0.25s ease, transform 0.2s ease',
          '&:hover': { transform: 'scale(1.02)' },
          '&:active': { transform: 'scale(0.99)' },
          '@media (prefers-reduced-motion: reduce)': {
            transition: 'none',
            '&:hover': { transform: 'none' },
            '&:active': { transform: 'none' },
          },
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
