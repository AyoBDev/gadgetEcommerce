import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import VerifiedUserIcon from '@mui/icons-material/VerifiedUser';
import BatteryChargingFullIcon from '@mui/icons-material/BatteryChargingFull';
import LocalShippingIcon from '@mui/icons-material/LocalShipping';

export default function TrustBox({ batteryHealth }: { batteryHealth?: number | null }) {
  const battery = typeof batteryHealth === 'number'
    ? `Verified battery health (${batteryHealth}%+)`
    : 'Verified battery health';
  const rows = [
    { icon: <VerifiedUserIcon color="primary" />, label: 'Passed 20-point inspection' },
    { icon: <BatteryChargingFullIcon color="primary" />, label: battery },
    { icon: <LocalShippingIcon color="primary" />, label: 'Instant delivery available' },
  ];
  return (
    <Paper variant="outlined" sx={{ p: 2, bgcolor: 'grey.50' }}>
      <Stack spacing={1.5}>
        {rows.map((r) => (
          <Stack key={r.label} direction="row" spacing={1.5} alignItems="center">
            {r.icon}
            <Typography variant="caption" color="text.secondary">{r.label}</Typography>
          </Stack>
        ))}
      </Stack>
    </Paper>
  );
}
