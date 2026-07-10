import Box from '@mui/material/Box';
import Container from '@mui/material/Container';
import Grid from '@mui/material/Grid2';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import Inventory2Icon from '@mui/icons-material/Inventory2';
import VerifiedIcon from '@mui/icons-material/Verified';
import PhotoCameraIcon from '@mui/icons-material/PhotoCamera';
import LocalShippingIcon from '@mui/icons-material/LocalShipping';
import LockIcon from '@mui/icons-material/Lock';
import SupportAgentIcon from '@mui/icons-material/SupportAgent';

const REASONS = [
  { icon: <Inventory2Icon fontSize="large" />, label: '300+ Tested Laptops' },
  { icon: <VerifiedIcon fontSize="large" />, label: '7-Day Warranty' },
  { icon: <PhotoCameraIcon fontSize="large" />, label: 'Real Device Photos' },
  { icon: <LocalShippingIcon fontSize="large" />, label: 'Fast Delivery' },
  { icon: <LockIcon fontSize="large" />, label: 'Secure Payment' },
  { icon: <SupportAgentIcon fontSize="large" />, label: 'WhatsApp Support' },
] as const;

export function WhyBuyFromUs() {
  return (
    <Container maxWidth="xl" sx={{ py: 10, borderTop: 1, borderBottom: 1, borderColor: 'divider' }}>
      <Stack spacing={1} sx={{ textAlign: 'center', mb: 6 }}>
        <Typography variant="h2">Why Buy From Us</Typography>
        <Typography variant="body1" sx={{ color: 'text.secondary' }}>
          Nigeria&apos;s most trusted preowned laptop retailer
        </Typography>
      </Stack>
      <Grid container spacing={4} justifyContent="center">
        {REASONS.map((reason) => (
          <Grid key={reason.label} size={{ xs: 6, sm: 4, md: 2 }}>
            <Stack spacing={1.5} alignItems="center">
              <Box
                sx={{
                  width: 64,
                  height: 64,
                  borderRadius: '50%',
                  bgcolor: 'grey.100',
                  color: 'primary.main',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                {reason.icon}
              </Box>
              <Typography variant="button" sx={{ textAlign: 'center' }}>{reason.label}</Typography>
            </Stack>
          </Grid>
        ))}
      </Grid>
    </Container>
  );
}
