import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

export default function StockPill({ stock }: { stock: number }) {
  const inStock = stock > 0;
  return (
    <Stack direction="row" spacing={1} alignItems="center">
      <Box sx={{ width: 12, height: 12, borderRadius: '50%', bgcolor: inStock ? 'secondary.main' : 'error.main' }} />
      <Typography variant="button" sx={{ color: 'text.primary' }}>
        {inStock ? `IN STOCK (${stock} AVAILABLE)` : 'SOLD'}
      </Typography>
    </Stack>
  );
}
