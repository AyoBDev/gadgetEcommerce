import Box from '@mui/material/Box';
import Container from '@mui/material/Container';
import Grid from '@mui/material/Grid2';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { SectionHeading } from '@/components/SectionHeading';
import Inventory2Icon from '@mui/icons-material/Inventory2';
import VerifiedIcon from '@mui/icons-material/Verified';
import PhotoCameraIcon from '@mui/icons-material/PhotoCamera';
import LocalShippingIcon from '@mui/icons-material/LocalShipping';
import LockIcon from '@mui/icons-material/Lock';
import SupportAgentIcon from '@mui/icons-material/SupportAgent';

const REASONS = [
  { icon: <Inventory2Icon />, label: '300+ Tested Laptops', copy: 'Every laptop in stock passes a 20-point inspection before it hits our shelves.' },
  { icon: <VerifiedIcon />, label: '7-Day Warranty', copy: 'Not happy in the first week? Return it for a full refund, no questions asked.' },
  { icon: <PhotoCameraIcon />, label: 'Real Device Photos', copy: 'What you see is exactly what ships. No stock images, no surprises on delivery.' },
  { icon: <LocalShippingIcon />, label: 'Fast Nationwide Delivery', copy: 'Same-day dispatch in Lagos, 24–72 hours to every state in Nigeria.' },
  { icon: <LockIcon />, label: 'Secure Payment', copy: 'Pay on delivery in Lagos, or via verified bank transfer nationwide.' },
  { icon: <SupportAgentIcon />, label: 'WhatsApp Support', copy: 'Real humans on WhatsApp, from picking the right model to after-sales help.' },
] as const;

export function WhyBuyFromUs() {
  return (
    <Container maxWidth="lg" sx={{ py: { xs: 8, md: 12 }, borderTop: 1, borderBottom: 1, borderColor: 'divider' }}>
      <Stack spacing={1} sx={{ mb: 8, maxWidth: 640 }}>
        <SectionHeading>Why Buy From Us</SectionHeading>
        <Typography variant="body1" sx={{ color: 'text.secondary' }}>
          Nigeria&apos;s most trusted UK used laptop retailer.
        </Typography>
      </Stack>
      <Grid container spacing={{ xs: 4, md: 6 }} columnSpacing={{ xs: 4, md: 8 }}>
        {REASONS.map((reason, i) => (
          <Grid key={reason.label} size={{ xs: 12, md: 6 }}>
            <Stack direction="row" spacing={3} alignItems="flex-start">
              <Typography
                className="num"
                sx={{ color: 'primary.main', fontSize: 28, fontWeight: 700, lineHeight: 1, minWidth: 44 }}
              >
                {String(i + 1).padStart(2, '0')}
              </Typography>
              <Stack spacing={1} sx={{ flex: 1, pb: 3, borderBottom: 1, borderColor: 'divider' }}>
                <Stack direction="row" spacing={1.5} alignItems="center">
                  <Box sx={{ color: 'text.primary', display: 'inline-flex' }}>{reason.icon}</Box>
                  <Typography
                    sx={{ fontFamily: 'var(--font-space-grotesk), sans-serif', fontWeight: 700, fontSize: 18, letterSpacing: '-0.01em' }}
                  >
                    {reason.label}
                  </Typography>
                </Stack>
                <Typography variant="body2" sx={{ color: 'text.secondary' }}>{reason.copy}</Typography>
              </Stack>
            </Stack>
          </Grid>
        ))}
      </Grid>
    </Container>
  );
}
