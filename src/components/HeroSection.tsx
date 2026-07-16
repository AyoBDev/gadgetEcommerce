import Link from 'next/link';
import Image from 'next/image';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Container from '@mui/material/Container';
import Grid from '@mui/material/Grid2';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import ChatIcon from '@mui/icons-material/Chat';
import { QuickFinder } from '@/components/QuickFinder';
import { buildWhatsAppLink } from '@/lib/whatsapp';
import type { Category } from '@/payload-types';

export function HeroSection({ brands, useCases, whatsappNumber }: { brands: Category[]; useCases: Category[]; whatsappNumber: string }) {
  const waHref = buildWhatsAppLink(whatsappNumber, 'Hi, I want to buy a preowned laptop. Can you help me choose?');
  return (
    <Box sx={{ bgcolor: 'tint.main' }}>
    <Container maxWidth="lg" sx={{ py: { xs: 6, md: 12 } }}>
      <Grid container spacing={4} alignItems="center">
        <Grid size={{ xs: 12, md: 6 }}>
          <Stack spacing={4}>
            <Stack spacing={2}>
              <Typography variant="h1">Buy Tested Preowned Laptops in Nigeria</Typography>
              <Typography variant="body1" sx={{ color: 'text.secondary' }}>
                300+ laptops in stock · 7-day warranty · Nationwide delivery
              </Typography>
            </Stack>
            <QuickFinder brands={brands} useCases={useCases} />
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
              <Button variant="contained" size="large" component={Link} href="/laptops" fullWidth>
                Browse all laptops
              </Button>
              <Button variant="contained" size="large" startIcon={<ChatIcon />}
                sx={{ bgcolor: 'success.main', '&:hover': { bgcolor: 'success.dark' } }}
                component="a" href={waHref} target="_blank" rel="noopener" fullWidth>
                WhatsApp us
              </Button>
            </Stack>
          </Stack>
        </Grid>
        <Grid size={{ xs: 12, md: 6 }}>
          <Box sx={{ position: 'relative', height: { xs: 320, md: 500 }, borderRadius: 2, overflow: 'hidden', border: 1, borderColor: 'divider' }}>
            <Image src="/hero-laptop.jpg" alt="A sleek preowned laptop on a clean desk" fill priority sizes="(max-width: 900px) 100vw, 50vw" style={{ objectFit: 'cover' }} />
          </Box>
        </Grid>
      </Grid>
    </Container>
    </Box>
  );
}
