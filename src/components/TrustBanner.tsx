import Box from '@mui/material/Box';
import Container from '@mui/material/Container';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import VerifiedIcon from '@mui/icons-material/Verified';
import BatteryChargingFullIcon from '@mui/icons-material/BatteryChargingFull';
import LocalShippingIcon from '@mui/icons-material/LocalShipping';

const TRUST_ITEMS = [
  { icon: <VerifiedIcon fontSize="small" />, label: '7-Day Warranty' },
  { icon: <BatteryChargingFullIcon fontSize="small" />, label: 'Verified Battery' },
  { icon: <LocalShippingIcon fontSize="small" />, label: 'Nationwide Delivery' },
] as const;

export function TrustBanner() {
  return (
    <Box sx={{ bgcolor: 'grey.100', borderBottom: 1, borderColor: 'divider', py: 1.5 }}>
      <Container maxWidth="xl">
        <Stack direction="row" spacing={{ xs: 3, md: 6 }} justifyContent="center">
          {TRUST_ITEMS.map((item) => (
            <Stack key={item.label} direction="row" spacing={1} alignItems="center">
              <Box sx={{ color: 'primary.main' }}>{item.icon}</Box>
              <Typography variant="button" sx={{ color: 'primary.main' }}>{item.label}</Typography>
            </Stack>
          ))}
        </Stack>
      </Container>
    </Box>
  );
}
