import Link from 'next/link';
import Icon from '@mui/material/Icon';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import type { Category } from '@/payload-types';

export function CategoryCard({ category }: { category: Category }) {
  const href = category.type === 'brand'
    ? `/laptops?brand=${category.slug}`
    : `/laptops?useCase=${category.slug}`;

  return (
    <Paper component={Link} href={href} variant="outlined"
      sx={{ p: 3, textDecoration: 'none', display: 'block', transition: 'box-shadow 200ms', '&:hover': { boxShadow: 2 } }}>
      <Stack spacing={2} alignItems="center">
        <Icon sx={{ fontSize: 40, color: 'primary.main' }}>{category.icon ?? 'laptop_mac'}</Icon>
        <Typography variant="button" sx={{ textAlign: 'center' }}>{category.name}</Typography>
      </Stack>
    </Paper>
  );
}
