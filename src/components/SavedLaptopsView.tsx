'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Container from '@mui/material/Container';
import Grid from '@mui/material/Grid2';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import CircularProgress from '@mui/material/CircularProgress';
import { useStore } from '@/components/StoreProvider';
import { ProductCard } from '@/components/ProductCard';
import type { Laptop } from '@/payload-types';

type Mode = 'wishlist' | 'compare';

async function fetchLaptopsByIds(ids: number[]): Promise<Laptop[]> {
  if (ids.length === 0) return [];
  const params = new URLSearchParams();
  ids.forEach((id) => params.append('where[id][in]', String(id)));
  params.set('where[status][equals]', 'published');
  params.set('depth', '1');
  params.set('limit', '100');
  const res = await fetch(`/api/laptops?${params.toString()}`, { credentials: 'include' });
  if (!res.ok) throw new Error('Failed to load laptops');
  const data: { docs: Laptop[] } = await res.json();
  return data.docs;
}

export function SavedLaptopsView({
  mode,
  whatsappNumber,
}: {
  mode: Mode;
  whatsappNumber: string;
}) {
  const store = useStore();
  const ids = mode === 'wishlist' ? store.wishlist : store.compare;
  const clear = mode === 'wishlist' ? store.clearWishlist : store.clearCompare;
  const idsKey = ids.join(',');

  // `result` is tagged with the idsKey it was fetched for. When the current
  // idsKey doesn't match, we're implicitly loading — so the effect never has
  // to synchronously flip a loading flag.
  const [result, setResult] = useState<{ key: string; laptops: Laptop[] } | null>(null);
  const loading = !store.isHydrated || result?.key !== idsKey;

  useEffect(() => {
    if (!store.isHydrated) return;
    let active = true;
    fetchLaptopsByIds(ids)
      .then((docs) => {
        if (!active) return;
        // preserve the order the user added them in
        const byId = new Map(docs.map((d) => [d.id, d]));
        const ordered = ids.map((id) => byId.get(id)).filter((l): l is Laptop => Boolean(l));
        setResult({ key: idsKey, laptops: ordered });
      })
      .catch(() => active && setResult({ key: idsKey, laptops: [] }));
    return () => {
      active = false;
    };
    // re-fetch whenever the id set changes
  }, [store.isHydrated, idsKey]); // eslint-disable-line react-hooks/exhaustive-deps

  const laptops = result?.key === idsKey ? result.laptops : [];

  const title = mode === 'wishlist' ? 'Your wishlist' : 'Compare laptops';
  const emptyMsg =
    mode === 'wishlist'
      ? 'Your wishlist is empty. Tap the heart on any laptop to save it here.'
      : 'No laptops to compare yet. Tap the compare icon on any laptop to add it.';

  return (
    <Container maxWidth="xl" sx={{ py: { xs: 4, md: 8 } }}>
      <Stack spacing={4}>
        <Stack direction="row" justifyContent="space-between" alignItems="center">
          <Typography variant="h1" sx={{ fontSize: { xs: 32, md: 48 } }}>{title}</Typography>
          {ids.length > 0 && (
            <Button onClick={clear} color="inherit">Clear all</Button>
          )}
        </Stack>

        {!store.isHydrated || loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
            <CircularProgress />
          </Box>
        ) : laptops.length === 0 ? (
          <Stack spacing={3} sx={{ py: 6, alignItems: 'flex-start' }}>
            <Typography variant="body1" sx={{ color: 'text.secondary' }}>{emptyMsg}</Typography>
            <Button variant="contained" component={Link} href="/laptops">Browse laptops</Button>
          </Stack>
        ) : (
          <Grid container spacing={3}>
            {laptops.map((laptop) => (
              <Grid key={laptop.id} size={{ xs: 12, sm: 6, lg: mode === 'compare' ? 3 : 4 }}>
                <ProductCard laptop={laptop} whatsappNumber={whatsappNumber} />
              </Grid>
            ))}
          </Grid>
        )}
      </Stack>
    </Container>
  );
}
