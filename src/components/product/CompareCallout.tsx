import Link from 'next/link';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';

export default function CompareCallout() {
  return (
    <Paper sx={{ p: { xs: 3, md: 4 }, bgcolor: 'primary.main', color: 'primary.contrastText' }}>
      <Stack direction={{ xs: 'column', md: 'row' }} spacing={3} alignItems={{ md: 'center' }} justifyContent="space-between">
        <Stack spacing={1}>
          <Typography variant="h2">Compare with similar laptops</Typography>
          <Typography variant="body2" sx={{ opacity: 0.85 }}>
            Not sure if this is the right fit? Compare specs side by side.
          </Typography>
        </Stack>
        <Button component={Link} href="/compare" variant="outlined"
          sx={{ color: 'primary.contrastText', borderColor: 'primary.contrastText', whiteSpace: 'nowrap',
            '&:hover': { bgcolor: 'primary.contrastText', color: 'primary.main' } }}>
          Compare Devices
        </Button>
      </Stack>
    </Paper>
  );
}
