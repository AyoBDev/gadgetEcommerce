import Box from '@mui/material/Box';
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

// One sequence, repeated to fill any viewport; the track holds two copies and
// slides -50% for a seamless infinite loop.
const REPEATS = 4;

function Sequence() {
  return (
    <>
      {Array.from({ length: REPEATS }).flatMap((_, r) =>
        TRUST_ITEMS.map((item) => (
          <Stack key={`${r}-${item.label}`} direction="row" spacing={1} alignItems="center" sx={{ px: { xs: 2.5, md: 4 }, flexShrink: 0 }}>
            <Box sx={{ color: 'text.secondary', display: 'inline-flex' }}>{item.icon}</Box>
            <Typography variant="button" sx={{ color: 'text.secondary', whiteSpace: 'nowrap' }}>{item.label}</Typography>
            <Box component="span" sx={{ color: 'primary.main', pl: { xs: 2.5, md: 4 }, fontSize: 10 }} aria-hidden>✦</Box>
          </Stack>
        )),
      )}
    </>
  );
}

export function TrustBanner() {
  return (
    <Box sx={{ bgcolor: 'grey.50', borderBottom: 1, borderColor: 'divider', py: 1.5, overflow: 'hidden' }}>
      <Box
        aria-label="7-Day Warranty, Verified Battery, Nationwide Delivery"
        sx={{
          display: 'flex',
          width: 'max-content',
          '@keyframes trust-marquee': { from: { transform: 'translateX(0)' }, to: { transform: 'translateX(-50%)' } },
          animation: 'trust-marquee 36s linear infinite',
          '@media (prefers-reduced-motion: reduce)': { animation: 'none', width: '100%', justifyContent: 'center' },
        }}
      >
        <Sequence />
        <Box component="span" aria-hidden sx={{ display: 'contents' }}><Sequence /></Box>
      </Box>
    </Box>
  );
}
