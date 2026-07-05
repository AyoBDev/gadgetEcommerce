'use client';

import { useState } from 'react';
import Image from 'next/image';
import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import ButtonBase from '@mui/material/ButtonBase';
import type { Media } from '@/payload-types';

export function LaptopGallery({ images }: { images: { image: Media }[] }) {
  const [active, setActive] = useState(0);
  const main = images[active]?.image;
  const mainUrl = main?.sizes?.hero?.url ?? main?.url ?? '';
  return (
    <Stack spacing={2}>
      <Box sx={{ position: 'relative', aspectRatio: '3/2', bgcolor: 'grey.100', borderRadius: 2, overflow: 'hidden' }}>
        {main && <Image src={mainUrl} alt={main.alt} fill priority sizes="(max-width: 900px) 100vw, 50vw" style={{ objectFit: 'contain' }} />}
      </Box>
      {images.length > 1 && (
        <Stack direction="row" spacing={1} sx={{ overflowX: 'auto' }}>
          {images.map((g, i) => {
            const t = g.image.sizes?.thumbnail?.url ?? g.image.url ?? '';
            return (
              <ButtonBase key={g.image.id} onClick={() => setActive(i)}
                sx={{ position: 'relative', width: 80, height: 80, borderRadius: 1, overflow: 'hidden',
                  border: 2, borderColor: i === active ? 'primary.main' : 'transparent' }}>
                <Image src={t} alt={g.image.alt} fill sizes="80px" style={{ objectFit: 'cover' }} />
              </ButtonBase>
            );
          })}
        </Stack>
      )}
    </Stack>
  );
}
