'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Container from '@mui/material/Container';
import MenuItem from '@mui/material/MenuItem';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import CompareArrowsIcon from '@mui/icons-material/CompareArrows';
import { useStore } from '@/components/StoreProvider';

export type CompareOption = { id: number; title: string };

export function CompareTeaser({ options }: { options: CompareOption[] }) {
  const router = useRouter();
  const { toggleCompare, compare } = useStore();
  const [a, setA] = useState('');
  const [b, setB] = useState('');

  function compareNow() {
    const ids = [a, b].map(Number).filter((n) => Number.isFinite(n) && n > 0);
    for (const id of ids) {
      if (!compare.includes(id)) toggleCompare(id);
    }
    router.push('/compare');
  }

  const canCompare = a !== '' && b !== '' && a !== b;

  return (
    <Box sx={{ bgcolor: 'grey.50', py: 10 }}>
      <Container maxWidth="xl">
        <Paper
          variant="outlined"
          sx={{
            p: { xs: 4, md: 6 },
            display: 'flex',
            flexDirection: { xs: 'column', md: 'row' },
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 4,
          }}
        >
          <Stack spacing={1} sx={{ maxWidth: 360 }}>
            <Typography variant="h2">Compare Laptops Before You Buy</Typography>
            <Typography variant="body1" sx={{ color: 'text.secondary' }}>
              See detailed specs side-by-side to make the right choice.
            </Typography>
          </Stack>
          <Stack spacing={2} alignItems="center" sx={{ width: '100%', flex: 1 }}>
            <Stack
              direction={{ xs: 'column', sm: 'row' }}
              spacing={2}
              alignItems="center"
              sx={{ width: '100%' }}
            >
              <TextField select label="Laptop A" size="small" fullWidth value={a} onChange={(e) => setA(e.target.value)}>
                {options.map((o) => (
                  <MenuItem key={o.id} value={String(o.id)} disabled={String(o.id) === b}>{o.title}</MenuItem>
                ))}
              </TextField>
              <Box
                sx={{
                  width: 40,
                  height: 40,
                  borderRadius: '50%',
                  bgcolor: 'grey.200',
                  color: 'text.secondary',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                <CompareArrowsIcon fontSize="small" sx={{ transform: { xs: 'rotate(90deg)', sm: 'none' } }} />
              </Box>
              <TextField select label="Laptop B" size="small" fullWidth value={b} onChange={(e) => setB(e.target.value)}>
                {options.map((o) => (
                  <MenuItem key={o.id} value={String(o.id)} disabled={String(o.id) === a}>{o.title}</MenuItem>
                ))}
              </TextField>
            </Stack>
            <Button
              variant="contained"
              disabled={!canCompare}
              onClick={compareNow}
              sx={{ width: { xs: '100%', sm: 'auto' }, alignSelf: { xs: 'stretch', sm: 'flex-end' } }}
            >
              Compare now
            </Button>
          </Stack>
        </Paper>
      </Container>
    </Box>
  );
}
