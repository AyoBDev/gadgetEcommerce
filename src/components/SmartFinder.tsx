'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import Slider from '@mui/material/Slider';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { formatNaira } from '@/lib/money';

const USE_CASES = ['student', 'programming', 'gaming', 'business', 'video-editing'] as const;

export function SmartFinder() {
  const router = useRouter();
  const [useCase, setUseCase] = useState<string | null>(null);
  const [budget, setBudget] = useState<number>(500_000);

  function submit() {
    const params = new URLSearchParams();
    if (useCase) params.set('useCase', useCase);
    params.set('maxPrice', String(budget * 100));
    router.push(`/laptops?${params.toString()}`);
  }

  return (
    <Box sx={{ bgcolor: 'primary.main', color: 'primary.contrastText', borderRadius: 3, p: { xs: 4, md: 6 } }}>
      <Stack spacing={4} sx={{ maxWidth: 720, mx: 'auto', textAlign: 'center' }}>
        <Stack spacing={1}>
          <Typography variant="h2" sx={{ color: 'inherit' }}>Not sure what to buy?</Typography>
          <Typography variant="body1">Get a personalized recommendation.</Typography>
        </Stack>
        <Box sx={{ bgcolor: 'background.paper', color: 'text.primary', borderRadius: 2, p: 4, textAlign: 'left' }}>
          <Stack spacing={4}>
            <Stack spacing={2}>
              <Typography variant="h3">What&apos;s your primary purpose?</Typography>
              <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap', gap: 1 }}>
                {USE_CASES.map((uc) => (
                  <Chip key={uc} label={uc.replace('-', ' ')} clickable
                    color={useCase === uc ? 'primary' : 'default'} variant={useCase === uc ? 'filled' : 'outlined'}
                    onClick={() => setUseCase(uc)} />
                ))}
              </Stack>
            </Stack>
            <Stack spacing={2}>
              <Stack direction="row" justifyContent="space-between">
                <Typography variant="h3">Budget</Typography>
                <Typography variant="button" sx={{ color: 'primary.main' }}>{formatNaira(budget * 100)}</Typography>
              </Stack>
              <Slider value={budget} onChange={(_, v) => setBudget(v as number)} min={100_000} max={1_000_000} step={50_000} />
            </Stack>
            <Button variant="contained" size="large" onClick={submit}>Find my perfect laptop</Button>
          </Stack>
        </Box>
      </Stack>
    </Box>
  );
}
