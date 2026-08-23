import Link from 'next/link';
import Icon from '@mui/material/Icon';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import type { Category } from '@/payload-types';

export function CategoryCard({ category }: { category: Category }) {
  const href = category.type === 'brand'
    ? `/laptops?brand=${category.slug}`
    : `/laptops?useCase=${category.slug}`;

  return (
    <Paper
      component={Link}
      href={href}
      variant="outlined"
      sx={{
        p: 2.5,
        textDecoration: 'none',
        display: 'block',
        position: 'relative',
        boxShadow: '0 1px 2px rgba(0,0,0,0.04), 0 8px 24px rgba(0,0,0,0.06)',
        transition: 'transform 0.25s ease, box-shadow 0.25s ease, border-color 0.25s ease',
        '&:hover': {
          transform: 'translateY(-4px)',
          boxShadow: '0 2px 4px rgba(0,0,0,0.06), 0 16px 40px rgba(0,0,0,0.10), 0 16px 24px -16px rgba(225, 35, 42, 0.25)',
          borderColor: 'primary.main',
        },
        '&:hover .cat-arrow': { transform: 'translateX(4px)', color: 'primary.main' },
        '@media (prefers-reduced-motion: reduce)': {
          transition: 'border-color 0.2s ease',
          '&:hover': { transform: 'none', boxShadow: 'none' },
        },
      }}
    >
      <Stack direction="row" alignItems="center" spacing={1.5}>
        <Icon sx={{ fontSize: 24, color: 'primary.main' }}>{category.icon ?? 'laptop_mac'}</Icon>
        <Typography sx={{ flex: 1, fontFamily: 'var(--font-space-grotesk), sans-serif', fontWeight: 600, fontSize: 15 }}>
          {category.name}
        </Typography>
        <ArrowForwardIcon
          className="cat-arrow"
          sx={{ fontSize: 18, color: 'text.secondary', transition: 'transform 0.25s ease, color 0.25s ease' }}
        />
      </Stack>
    </Paper>
  );
}
