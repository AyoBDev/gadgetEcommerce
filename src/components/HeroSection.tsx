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
    <Box sx={{ bgcolor: 'tint.main' }}>
    <Container maxWidth="lg" sx={{ py: { xs: 6, md: 12 } }}>
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
          <Box
            sx={{
              position: 'relative',
              height: { xs: 340, md: 520 },
              borderRadius: 3,
              overflow: 'hidden',
              // High-key studio wash: pure white base with warm rim
              background:
                'radial-gradient(120% 90% at 50% 40%, #ffffff 0%, #fbf5f2 55%, #f4e8e6 100%)',
              boxShadow: 'inset 0 0 0 1px rgba(0,0,0,0.04)',
            }}
          >
            {/* Frosted-glass "hands" layer — two soft, blurred abstract shapes reaching in from the sides. */}
            <Box aria-hidden sx={{ position: 'absolute', inset: 0, overflow: 'hidden' }}>
              {/* Left hand — warm milky blob */}
              <Box sx={{
                position: 'absolute',
                left: '-18%', top: '18%',
                width: '70%', height: '78%',
                background:
                  'radial-gradient(60% 50% at 60% 45%, rgba(255,225,215,0.85) 0%, rgba(255,225,215,0.55) 30%, rgba(255,225,215,0) 70%)',
                filter: 'blur(28px)',
                borderRadius: '50%',
                transform: 'rotate(-8deg)',
              }} />
              {/* Right hand — cooler milky blob, offset lower */}
              <Box sx={{
                position: 'absolute',
                right: '-20%', top: '28%',
                width: '72%', height: '80%',
                background:
                  'radial-gradient(58% 52% at 40% 50%, rgba(240,235,240,0.9) 0%, rgba(240,235,240,0.6) 30%, rgba(240,235,240,0) 70%)',
                filter: 'blur(30px)',
                borderRadius: '50%',
                transform: 'rotate(10deg)',
              }} />
              {/* Subtle top vignette / bloom */}
              <Box sx={{
                position: 'absolute', inset: 0,
                background: 'radial-gradient(80% 40% at 50% 10%, rgba(255,255,255,0.9), transparent 70%)',
              }} />
            </Box>

            {/* Soft floating ground shadow */}
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
              position: 'absolute',
              inset: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              p: { xs: 3, md: 5 },
            }}>
              <Box sx={{ position: 'relative', width: '92%', height: '82%' }}>
                <Image
                  src="/hero-laptop.png"
                  alt="A certified UK used gold MacBook Air, tested and ready for delivery"
                  fill priority
                  sizes="(max-width: 900px) 100vw, 50vw"
                  style={{ objectFit: 'contain', filter: 'drop-shadow(0 12px 24px rgba(0,0,0,0.12))' }}
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
