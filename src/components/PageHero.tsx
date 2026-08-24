import Box from '@mui/material/Box';
import Container from '@mui/material/Container';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import type { ReactNode } from 'react';
import { StudioWash } from '@/components/StudioWash';

/** Homepage-style dark hero band for inner pages (matches the night hero). */
export function PageHero({
  title,
  subtitle,
  breadcrumb,
  actions,
  children,
}: {
  title: ReactNode;
  subtitle?: ReactNode;
  breadcrumb?: ReactNode;
  actions?: ReactNode;
  children?: ReactNode;
}) {
  return (
    <Box className="grain" sx={{ position: 'relative', bgcolor: 'night.main', color: 'night.contrastText', overflow: 'hidden' }}>
      <StudioWash />
      <Container maxWidth="lg" sx={{ position: 'relative', py: { xs: 5, md: 8 } }}>
        {breadcrumb && <Box sx={{ mb: 2 }}>{breadcrumb}</Box>}
        <Stack
          direction={{ xs: 'column', sm: 'row' }}
          justifyContent="space-between"
          alignItems={{ xs: 'flex-start', sm: 'flex-end' }}
          spacing={2}
        >
          <Stack spacing={1}>
            <Typography variant="h1">{title}</Typography>
            {subtitle && (
              <Typography variant="body1" sx={{ color: 'rgba(244,242,238,0.75)' }}>{subtitle}</Typography>
            )}
          </Stack>
          {actions && <Box>{actions}</Box>}
        </Stack>
        {children}
      </Container>
    </Box>
  );
}
