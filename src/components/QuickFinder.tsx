'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import MenuItem from '@mui/material/MenuItem';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import type { Category } from '@/payload-types';

const BUDGETS = [
  { label: 'Any budget', maxPrice: undefined },
  { label: 'Under ₦200k', maxPrice: 20_000_000 },
  { label: '₦200k - ₦400k', maxPrice: 40_000_000 },
  { label: 'Above ₦400k', maxPrice: undefined },
] as const;

export function QuickFinder({ brands, useCases }: { brands: Category[]; useCases: Category[] }) {
  const router = useRouter();
  const [budget, setBudget] = useState('');
  const [useCase, setUseCase] = useState('');
  const [brand, setBrand] = useState('');

  function submit() {
    const params = new URLSearchParams();
    if (brand) params.set('brand', brand);
    if (useCase) params.set('useCase', useCase);
    const selected = BUDGETS.find((b) => b.label === budget);
    if (selected?.maxPrice) params.set('maxPrice', String(selected.maxPrice));
    router.push(`/laptops${params.toString() ? '?' + params.toString() : ''}`);
  }

  return (
    <Box sx={{ bgcolor: 'background.paper', border: 1, borderColor: 'divider', borderRadius: 3, p: 3 }}>
      <Stack spacing={2}>
        <Typography variant="h3">What do you need?</Typography>
        <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
          <TextField select label="Budget" size="small" fullWidth value={budget} onChange={(e) => setBudget(e.target.value)}>
            {BUDGETS.map((b) => (
              <MenuItem key={b.label} value={b.label}>{b.label}</MenuItem>
            ))}
          </TextField>
          <TextField select label="Use case" size="small" fullWidth value={useCase} onChange={(e) => setUseCase(e.target.value)}>
            <MenuItem value="">Any use case</MenuItem>
            {useCases.map((u) => (
              <MenuItem key={u.id} value={u.slug ?? ''}>{u.name}</MenuItem>
            ))}
          </TextField>
          <TextField select label="Brand" size="small" fullWidth value={brand} onChange={(e) => setBrand(e.target.value)}>
            <MenuItem value="">Any brand</MenuItem>
            {brands.map((b) => (
              <MenuItem key={b.id} value={b.slug ?? ''}>{b.name}</MenuItem>
            ))}
          </TextField>
        </Stack>
        <Button variant="contained" onClick={submit}>Search laptops</Button>
      </Stack>
    </Box>
  );
}
