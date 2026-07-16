import Link from 'next/link';
import Image from 'next/image';
import Box from '@mui/material/Box';
import Container from '@mui/material/Container';
import Grid from '@mui/material/Grid2';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import type { Setting } from '@/payload-types';

const YEAR = new Date().getFullYear();

const COLUMNS = [
  { title: 'Shop', links: [
    { label: 'All laptops', href: '/laptops' },
    { label: 'Deals', href: '/laptops?deals=true' },
    { label: '7-Day Warranty', href: '/#warranty' },
  ]},
  { title: 'Help', links: [
    { label: 'FAQ', href: '/#faq' },
    { label: 'Delivery', href: '/#delivery' },
    { label: 'About Us', href: '/#about' },
  ]},
] as const;

export function Footer({ settings }: { settings: Setting }) {
  const businessName = settings.businessName || 'Jaysmart';

  return (
    <Box component="footer" sx={{ bgcolor: 'tint.main', borderTop: 1, borderColor: 'divider', mt: 8, py: 6 }}>
      <Container maxWidth="lg">
        <Grid container spacing={4}>
          <Grid size={{ xs: 12, md: 3 }}>
            <Box sx={{ mb: 2, lineHeight: 0 }}>
              <Image src="/logo.jpg" alt="Jaysmart Global Ventures" width={32} height={32} style={{ height: 32, width: 'auto' }} />
            </Box>
            <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block' }}>
              © {YEAR} {businessName}. Certified &amp; verified.
            </Typography>
            {settings.businessAddress && (
              <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', mt: 1 }}>
                {settings.businessAddress}
              </Typography>
            )}
          </Grid>
          {COLUMNS.map((col) => (
            <Grid key={col.title} size={{ xs: 6, md: 3 }}>
              <Typography variant="button" sx={{ display: 'block', mb: 2 }}>{col.title}</Typography>
              <Stack spacing={1}>
                {col.links.map((link) => (
                  <Typography key={link.href} component={Link} href={link.href} variant="caption"
                    sx={{ color: 'text.secondary', textDecoration: 'none', '&:hover': { color: 'primary.main' } }}>
                    {link.label}
                  </Typography>
                ))}
              </Stack>
            </Grid>
          ))}
          <Grid size={{ xs: 12, md: 3 }}>
            <Typography variant="button" sx={{ display: 'block', mb: 2 }}>Contact</Typography>
            <Stack spacing={1}>
              {settings.supportEmail && (
                <Typography component="a" href={`mailto:${settings.supportEmail}`} variant="caption"
                  sx={{ color: 'text.secondary', textDecoration: 'none', '&:hover': { color: 'primary.main' } }}>
                  {settings.supportEmail}
                </Typography>
              )}
              {settings.businessPhone && (
                <Typography component="a" href={`tel:${settings.businessPhone}`} variant="caption"
                  sx={{ color: 'text.secondary', textDecoration: 'none', '&:hover': { color: 'primary.main' } }}>
                  {settings.businessPhone}
                </Typography>
              )}
              <Typography component={Link} href="/#privacy" variant="caption"
                sx={{ color: 'text.secondary', textDecoration: 'none', '&:hover': { color: 'primary.main' } }}>
                Privacy
              </Typography>
            </Stack>
          </Grid>
        </Grid>
      </Container>
    </Box>
  );
}
