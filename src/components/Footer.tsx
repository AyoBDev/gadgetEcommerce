import Link from 'next/link';
import Box from '@mui/material/Box';
import Container from '@mui/material/Container';
import Grid from '@mui/material/Grid2';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

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
  { title: 'Legal', links: [
    { label: 'Contact', href: '/#contact' },
    { label: 'Privacy', href: '/#privacy' },
  ]},
] as const;

export function Footer() {
  return (
    <Box component="footer" sx={{ bgcolor: 'grey.100', mt: 8, py: 6 }}>
      <Container maxWidth="xl">
        <Grid container spacing={4}>
          <Grid size={{ xs: 12, md: 3 }}>
            <Typography variant="h3" sx={{ color: 'primary.main', mb: 2 }}>Certified Preowned Laptops</Typography>
            <Typography variant="caption" sx={{ color: 'text.secondary' }}>© {YEAR} Jaysmart. Certified & verified.</Typography>
          </Grid>
          {COLUMNS.map((col) => (
            <Grid key={col.title} size={{ xs: 6, md: 3 }}>
              <Typography variant="button" sx={{ display: 'block', mb: 2 }}>{col.title}</Typography>
              <Stack spacing={1}>
                {col.links.map((link) => (
                  <Typography key={link.href} component={Link} href={link.href} variant="caption"
                    sx={{ color: 'text.secondary', textDecoration: 'none', '&:hover': { color: 'secondary.main' } }}>
                    {link.label}
                  </Typography>
                ))}
              </Stack>
            </Grid>
          ))}
        </Grid>
      </Container>
    </Box>
  );
}
