import Link from 'next/link';
import Image from 'next/image';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Chip from '@mui/material/Chip';
import IconButton from '@mui/material/IconButton';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import ChatIcon from '@mui/icons-material/Chat';
import { formatNaira } from '@/lib/money';
import type { Laptop } from '@/payload-types';

const WA_NUMBER = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ?? '';

function conditionLabel(condition: Laptop['condition']) {
  return { 'grade-a': 'Grade A', 'grade-b': 'Grade B', 'grade-c': 'Grade C' }[condition];
}

function discountPercent(price: number, compareAt: number | null | undefined): number | null {
  if (!compareAt || compareAt <= price) return null;
  return Math.round(((compareAt - price) / compareAt) * 100);
}

export function ProductCard({ laptop }: { laptop: Laptop }) {
  const image = typeof laptop.gallery?.[0]?.image === 'object' ? laptop.gallery[0].image : null;
  const imgUrl = image?.sizes?.card?.url ?? image?.url ?? '/laptop-placeholder.jpg';
  const discount = discountPercent(laptop.price, laptop.compareAtPrice);
  const waMsg = encodeURIComponent(`Hi, I'm interested in the ${laptop.title} (${formatNaira(laptop.price)}). Is it still available?`);
  const waHref = `https://wa.me/${WA_NUMBER}?text=${waMsg}`;

  return (
    <Card variant="outlined" sx={{ display: 'flex', flexDirection: 'column', height: '100%', '&:hover': { boxShadow: 3 } }}>
      <Box sx={{ position: 'relative', height: 192, bgcolor: 'grey.100' }}>
        {discount !== null && (
          <Chip label={`-${discount}%`} color="error" size="small"
            sx={{ position: 'absolute', top: 8, left: 8, fontWeight: 700 }} />
        )}
        <Chip label={conditionLabel(laptop.condition)} color="success" size="small"
          sx={{ position: 'absolute', top: 8, right: 8, fontWeight: 700 }} />
        <Link href={`/laptops/${laptop.slug}`} style={{ display: 'block', position: 'absolute', inset: 0 }}>
          <Image src={imgUrl ?? '/laptop-placeholder.jpg'} alt={image?.alt ?? laptop.title} fill sizes="(max-width: 600px) 50vw, 25vw" style={{ objectFit: 'contain' }} />
        </Link>
      </Box>
      <CardContent sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
        <Typography component={Link} href={`/laptops/${laptop.slug}`} variant="h3"
          sx={{ color: 'text.primary', textDecoration: 'none', mb: 1, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
          {laptop.title}
        </Typography>
        <Stack direction="row" spacing={1} sx={{ mb: 2, flexWrap: 'wrap' }}>
          {laptop.specs?.ram && <Chip label={`${laptop.specs.ram}GB RAM`} size="small" />}
          {laptop.specs?.storage && <Chip label={laptop.specs.storage} size="small" />}
        </Stack>
        <Box sx={{ mt: 'auto' }}>
          <Stack direction="row" spacing={1} alignItems="baseline" sx={{ mb: 2 }}>
            <Typography variant="h2" sx={{ color: 'primary.main' }}>{formatNaira(laptop.price)}</Typography>
            {laptop.compareAtPrice && (
              <Typography variant="caption" sx={{ color: 'text.secondary', textDecoration: 'line-through' }}>
                {formatNaira(laptop.compareAtPrice)}
              </Typography>
            )}
          </Stack>
          <Stack direction="row" spacing={1}>
            <Button component={Link} href={`/laptops/${laptop.slug}`} variant="contained" fullWidth>Buy now</Button>
            <IconButton component="a" href={waHref} target="_blank" rel="noopener" aria-label="WhatsApp inquiry"
              sx={{ bgcolor: 'secondary.main', color: 'white', '&:hover': { bgcolor: 'secondary.dark' } }}>
              <ChatIcon />
            </IconButton>
          </Stack>
        </Box>
      </CardContent>
    </Card>
  );
}
