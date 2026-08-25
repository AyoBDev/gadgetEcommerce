'use client';

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
import { StudioWash } from '@/components/StudioWash';
import { useChatLauncher } from '@/components/chat/ChatContext';
import type { Category } from '@/payload-types';

export function HeroSection({ brands, useCases, whatsappNumber }: { brands: Category[]; useCases: Category[]; whatsappNumber: string }) {
  const { openChat } = useChatLauncher();
  return (
    <Box className="grain" sx={{ position: 'relative', bgcolor: 'night.main', color: 'night.contrastText', overflow: 'hidden' }}>
      <StudioWash />
    <Container maxWidth="lg" sx={{ position: 'relative', py: { xs: 5, md: 9 } }}>
      <Grid container spacing={4} alignItems="center">
        <Grid size={{ xs: 12, md: 6 }}>
          <Stack spacing={4}>
            <Stack spacing={2}>
              <Typography variant="h1">
                Buy Tested UK Used <Box component="span" sx={{ color: 'primary.main' }}>Laptops</Box> in Nigeria
              </Typography>
              <Typography variant="body1" sx={{ color: 'rgba(244,242,238,0.75)' }}>
                300+ laptops in stock · 30-day warranty · Nationwide delivery
              </Typography>
            </Stack>
            <QuickFinder brands={brands} useCases={useCases} />
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
              <Button variant="contained" size="large" component={Link} href="/laptops" fullWidth>
                Browse all laptops
              </Button>
              <Button variant="contained" size="large" color="primary" startIcon={<ChatIcon />}
                onClick={() => openChat()} fullWidth>
                Chat with us
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
              background: 'radial-gradient(50% 100% at 50% 50%, rgba(0,0,0,0.5), transparent 70%)',
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
                  style={{ objectFit: 'contain', filter: 'drop-shadow(0 18px 32px rgba(0,0,0,0.5))' }}
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
