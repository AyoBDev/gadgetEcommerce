import Stack from '@mui/material/Stack';
import Grid from '@mui/material/Grid2';
import Typography from '@mui/material/Typography';
import { ProductCard } from '@/components/ProductCard';
import type { Laptop } from '@/payload-types';

export default function RelatedProducts({ laptops, whatsappNumber }: { laptops: Laptop[]; whatsappNumber: string }) {
  if (laptops.length === 0) return null;
  return (
    <Stack spacing={3}>
      <Typography variant="h2">You might also like</Typography>
      <Grid container spacing={3}>
        {laptops.map((laptop) => (
          <Grid key={laptop.id} size={{ xs: 12, sm: 6, md: 3 }}>
            <ProductCard laptop={laptop} whatsappNumber={whatsappNumber} />
          </Grid>
        ))}
      </Grid>
    </Stack>
  );
}
