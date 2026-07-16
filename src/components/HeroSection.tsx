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
  const waHref = buildWhatsAppLink(whatsappNumber, 'Hi, I want to buy a UK used laptop. Can you help me choose?');
  return (
    <Box sx={{ position: 'relative', bgcolor: 'tint.main', overflow: 'hidden' }}>
      {/* Frosted studio wash — spans the full hero band. Red-tinted, high-key,
          soft milky diffusions on both sides + subtle top bloom. */}
      <Box aria-hidden sx={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
        {/* Left warm-red diffusion */}
        <Box sx={{
          position: 'absolute',
          left: '-15%', top: '10%',
          width: '55%', height: '90%',
          background:
            'radial-gradient(60% 55% at 55% 45%, rgba(255,215,210,0.85) 0%, rgba(255,215,210,0.45) 35%, rgba(255,215,210,0) 72%)',
          filter: 'blur(40px)',
          borderRadius: '50%',
          transform: 'rotate(-8deg)',
        }} />
        {/* Right cool milky diffusion */}
        <Box sx={{
          position: 'absolute',
          right: '-18%', top: '20%',
          width: '58%', height: '92%',
          background:
            'radial-gradient(58% 52% at 42% 50%, rgba(250,240,240,0.9) 0%, rgba(250,240,240,0.5) 32%, rgba(250,240,240,0) 72%)',
          filter: 'blur(44px)',
          borderRadius: '50%',
          transform: 'rotate(10deg)',
        }} />
        {/* Top bloom — brightens the upper band to feel high-key */}
        <Box sx={{
          position: 'absolute', inset: 0,
          background: 'radial-gradient(70% 40% at 50% 0%, rgba(255,255,255,0.85), transparent 70%)',
        }} />
        {/* Bottom red-tint deepen — anchors the section */}
        <Box sx={{
          position: 'absolute', inset: 0,
          background: 'radial-gradient(80% 40% at 50% 100%, rgba(225,35,42,0.06), transparent 70%)',
        }} />
      </Box>
    <Container maxWidth="lg" sx={{ position: 'relative', py: { xs: 6, md: 12 } }}>
      <Grid container spacing={4} alignItems="center">
        <Grid size={{ xs: 12, md: 6 }}>
          <Stack spacing={4}>
            <Stack spacing={2}>
              <Typography variant="h1">
                Buy Tested UK Used <Box component="span" sx={{ color: 'primary.main' }}>Laptops</Box> in Nigeria
              </Typography>
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
          <Box sx={{ position: 'relative', height: { xs: 340, md: 520 } }}>
            {/* Soft floating ground shadow under the laptop */}
            <Box aria-hidden sx={{
              position: 'absolute',
              left: '15%', right: '15%',
              bottom: { xs: 24, md: 40 },
              height: 30,
              background: 'radial-gradient(50% 100% at 50% 50%, rgba(60,20,20,0.22), transparent 70%)',
              filter: 'blur(8px)',
            }} />
            {/* The laptop, razor-sharp, floating dead-center */}
            <Box sx={{
              position: 'absolute', inset: 0,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              p: { xs: 2, md: 3 },
            }}>
              <Box sx={{ position: 'relative', width: '96%', height: '88%' }}>
                <Image
                  src="/hero-laptop.png"
                  alt="A certified UK used gold MacBook Air, tested and ready for delivery"
                  fill priority
                  sizes="(max-width: 900px) 100vw, 50vw"
                  style={{ objectFit: 'contain', filter: 'drop-shadow(0 14px 26px rgba(0,0,0,0.14))' }}
                />
              </Box>
            </Box>
          </Box>
        </Grid>
      </Grid>
    </Container>
    </Box>
  );
}
