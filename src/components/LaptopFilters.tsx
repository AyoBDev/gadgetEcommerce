'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import type { Category } from '@/payload-types';

export function LaptopFilters({ brands, useCases }: { brands: Category[]; useCases: Category[] }) {
  const router = useRouter();
  const params = useSearchParams();
  const activeBrand = params.get('brand');
  const activeUseCase = params.get('useCase');

  function toggle(key: 'brand' | 'useCase', value: string) {
    const next = new URLSearchParams(params.toString());
    if (next.get(key) === value) next.delete(key);
    else next.set(key, value);
    router.push(`/laptops${next.toString() ? '?' + next.toString() : ''}`);
  }

  return (
    <Box sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 1, p: 2 }}>
      <Stack spacing={3}>
        <Box>
          <Typography variant="button" sx={{ mb: 1, display: 'block' }}>Brand</Typography>
          <Stack direction="row" spacing={1} flexWrap="wrap" gap={1}>
            {brands.map((b) => (
              <Chip key={b.id} label={b.name} clickable onClick={() => toggle('brand', b.slug ?? '')}
                color={activeBrand === b.slug ? 'primary' : 'default'}
                variant={activeBrand === b.slug ? 'filled' : 'outlined'} />
            ))}
          </Stack>
        </Box>
        <Box>
          <Typography variant="button" sx={{ mb: 1, display: 'block' }}>Use case</Typography>
          <Stack direction="row" spacing={1} flexWrap="wrap" gap={1}>
            {useCases.map((u) => (
              <Chip key={u.id} label={u.name} clickable onClick={() => toggle('useCase', u.slug ?? '')}
                color={activeUseCase === u.slug ? 'primary' : 'default'}
                variant={activeUseCase === u.slug ? 'filled' : 'outlined'} />
            ))}
          </Stack>
        </Box>
      </Stack>
    </Box>
  );
}
