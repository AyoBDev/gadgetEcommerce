import Box from '@mui/material/Box';
import Container from '@mui/material/Container';
import type { ReactNode } from 'react';

export type SectionTone = 'white' | 'grey' | 'tint';

const BG: Record<SectionTone, string> = {
  white: 'background.paper',
  grey: 'grey.50',
  tint: 'tint.main',
};

/** Full-bleed section band with alternating background + optional grain. */
export function SectionBand({
  tone = 'white',
  grain,
  py = { xs: 6, md: 8 },
  maxWidth = 'lg',
  children,
  id,
}: {
  tone?: SectionTone;
  grain?: boolean;
  py?: { xs: number; md: number };
  maxWidth?: 'lg' | false;
  children: ReactNode;
  id?: string;
}) {
  const showGrain = grain ?? tone !== 'white';
  return (
    <Box id={id} className={showGrain ? 'grain' : undefined} sx={{ bgcolor: BG[tone], py }}>
      {maxWidth === false ? children : <Container maxWidth={maxWidth}>{children}</Container>}
    </Box>
  );
}
