'use client';

import { createTheme } from '@mui/material/styles';

export const theme = createTheme({
  cssVariables: true,
  palette: {
    mode: 'light',
    primary: { main: '#003178', contrastText: '#ffffff' },
    secondary: { main: '#1b6d24', contrastText: '#ffffff' },
    error: { main: '#ba1a1a', contrastText: '#ffffff' },
    background: { default: '#f7f9ff', paper: '#ffffff' },
    text: { primary: '#0b1d2d', secondary: '#434652' },
  },
  shape: { borderRadius: 8 },
  typography: {
    fontFamily: 'var(--font-inter), Inter, system-ui, sans-serif',
    h1: { fontSize: '48px', lineHeight: '56px', letterSpacing: '-0.02em', fontWeight: 800 },
    h2: { fontSize: '24px', lineHeight: '32px', fontWeight: 700 },
    h3: { fontSize: '20px', lineHeight: '28px', fontWeight: 700 },
    body1: { fontSize: '18px', lineHeight: '28px', fontWeight: 400 },
    body2: { fontSize: '16px', lineHeight: '24px', fontWeight: 400 },
    caption: { fontSize: '14px', lineHeight: '20px', fontWeight: 400 },
    button: { fontSize: '12px', lineHeight: '16px', letterSpacing: '0.05em', fontWeight: 700, textTransform: 'uppercase' },
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: { borderRadius: 8, paddingBlock: 12, paddingInline: 24 },
      },
    },
  },
});
