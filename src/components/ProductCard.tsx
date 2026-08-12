'use client';

import Link from 'next/link';
import Image from 'next/image';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import IconButton from '@mui/material/IconButton';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import ChatIcon from '@mui/icons-material/Chat';
import { formatNaira } from '@/lib/money';
import { buildWhatsAppLink } from '@/lib/whatsapp';
import { ProductCardActions } from '@/components/ProductCardActions';
import type { Laptop } from '@/payload-types';

function conditionLabel(condition: Laptop['condition']) {
  return { 'grade-a': 'Grade A', 'grade-b': 'Grade B', 'grade-c': 'Grade C' }[condition];
}

function discountPercent(price: number, compareAt: number | null | undefined): number | null {
  if (!compareAt || compareAt <= price) return null;
  return Math.round(((compareAt - price) / compareAt) * 100);
}

export function ProductCard({ laptop, whatsappNumber }: { laptop: Laptop; whatsappNumber: string }) {
  const image = typeof laptop.gallery?.[0]?.image === 'object' ? laptop.gallery[0].image : null;
  const imgUrl = image?.sizes?.card?.url ?? image?.url ?? '/laptop-placeholder.jpg';
  const discount = discountPercent(laptop.price, laptop.compareAtPrice);
  const waHref = buildWhatsAppLink(
    whatsappNumber,
    `Hi, I'm interested in the ${laptop.title} (${formatNaira(laptop.price)}). Is it still available?`,
  );

  // Small "SKU-style" tag from the slug for the tech feel — deterministic per product.
  const sku = `JS-${(laptop.slug ?? '').slice(0, 6).toUpperCase().replace(/[^A-Z0-9]/g, 'X') || 'XXXXXX'}`;

  return (
    <Card variant="outlined" sx={{
      display: 'flex', flexDirection: 'column', height: '100%',
      position: 'relative', overflow: 'hidden',
      transition: 'transform 0.28s cubic-bezier(.34,1.56,.64,1), box-shadow 0.25s ease, border-color 0.25s ease',
      // Tinted red-glow shadow on hover + corner tick reveal (see the L-shape below)
      '&:hover': {
        transform: 'translateY(-6px)',
        boxShadow: '0 18px 32px -16px rgba(225, 35, 42, 0.22), 0 4px 12px -6px rgba(17, 17, 17, 0.06)',
        borderColor: 'primary.main',
      },
      '&:hover .corner-tick': { opacity: 1, transform: 'translate(0, 0)' },
      '@media (prefers-reduced-motion: reduce)': {
        transition: 'border-color 0.2s ease',
        '&:hover': { transform: 'none', boxShadow: 'none' },
      },
    }}>
      {/* Corner tick — small red L in the top-right that appears on hover */}
      <Box
        aria-hidden
        className="corner-tick"
        sx={{
          position: 'absolute', top: 8, right: 8, width: 14, height: 14, zIndex: 3,
          opacity: 0, transform: 'translate(4px, -4px)',
          transition: 'opacity 0.2s ease, transform 0.28s cubic-bezier(.34,1.56,.64,1)',
          borderTop: '2px solid', borderRight: '2px solid', borderColor: 'primary.main',
          pointerEvents: 'none',
        }}
      />

      <Box sx={{ position: 'relative', height: { xs: 240, sm: 192 }, bgcolor: 'grey.50', overflow: 'hidden' }}>
        <Link href={`/laptops/${laptop.slug}`} style={{ display: 'block', position: 'absolute', inset: 0, zIndex: 0 }}>
          <Image src={imgUrl ?? '/laptop-placeholder.jpg'} alt={image?.alt ?? laptop.title} fill sizes="(max-width: 600px) 50vw, 25vw" style={{ objectFit: 'cover' }} />
        </Link>
        {discount !== null && (
          <Box sx={{
            position: 'absolute', top: 8, left: 8, zIndex: 2,
            bgcolor: 'primary.main', color: 'primary.contrastText',
            px: 1, py: 0.25, borderRadius: 0.5,
            fontFamily: 'var(--font-mono), monospace',
            fontSize: 11, fontWeight: 700, letterSpacing: '0.02em',
          }}>
            -{discount}%
          </Box>
        )}
        <Box sx={{
          position: 'absolute', bottom: 8, left: 8, zIndex: 2,
          bgcolor: 'rgba(17,17,17,0.85)', color: '#fff',
          px: 1, py: 0.25, borderRadius: 0.5,
          fontFamily: 'var(--font-mono), monospace',
          fontSize: 10, fontWeight: 500, letterSpacing: '0.05em',
        }}>
          {conditionLabel(laptop.condition).toUpperCase()}
        </Box>
        <ProductCardActions laptopId={laptop.id} />
      </Box>
      <CardContent sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', p: 2.5 }}>
        {/* SKU/model line — tiny, monospace, tech-catalog feel */}
        <Typography
          className="num"
          sx={{ fontSize: 10, color: 'text.secondary', letterSpacing: '0.08em', mb: 0.75, textTransform: 'uppercase' }}
        >
          {sku}
        </Typography>
        <Typography component="h3" variant="h3" sx={{ mb: 1.5, fontSize: 17, letterSpacing: '-0.01em' }}>
          <Link href={`/laptops/${laptop.slug}`} style={{ color: 'inherit', textDecoration: 'none', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
            {laptop.title}
          </Link>
        </Typography>

        {/* Spec row — key/value strip with hairline dividers, monospace values */}
        {(laptop.specs?.ram || laptop.specs?.storage) && (
          <Stack
            direction="row"
            divider={<Box sx={{ width: '1px', bgcolor: 'divider' }} />}
            spacing={0}
            sx={{ mb: 2, borderTop: 1, borderBottom: 1, borderColor: 'divider', py: 1 }}
          >
            {laptop.specs?.ram && (
              <Box sx={{ flex: 1, textAlign: 'center', px: 1 }}>
                <Typography sx={{ fontSize: 9, color: 'text.secondary', letterSpacing: '0.08em', textTransform: 'uppercase' }}>RAM</Typography>
                <Typography className="num" sx={{ fontSize: 13, fontWeight: 700, color: 'text.primary' }}>{laptop.specs.ram}GB</Typography>
              </Box>
            )}
            {laptop.specs?.storage && (
              <Box sx={{ flex: 1, textAlign: 'center', px: 1 }}>
                <Typography sx={{ fontSize: 9, color: 'text.secondary', letterSpacing: '0.08em', textTransform: 'uppercase' }}>Storage</Typography>
                <Typography className="num" sx={{ fontSize: 13, fontWeight: 700, color: 'text.primary' }}>{laptop.specs.storage}</Typography>
              </Box>
            )}
          </Stack>
        )}

        <Box sx={{ mt: 'auto' }}>
          <Stack direction="row" spacing={1} alignItems="baseline" sx={{ mb: 2 }}>
            <Typography className="num" sx={{ color: 'primary.main', fontSize: { xs: 26, md: 30 }, fontWeight: 700, lineHeight: 1 }}>
              {formatNaira(laptop.price)}
            </Typography>
            {laptop.compareAtPrice && (
              <Typography className="num" sx={{ color: 'text.secondary', textDecoration: 'line-through', fontSize: 13 }}>
                {formatNaira(laptop.compareAtPrice)}
              </Typography>
            )}
          </Stack>
          <Stack direction="row" spacing={1}>
            <Button component={Link} href={`/laptops/${laptop.slug}`} variant="contained" fullWidth>Buy now</Button>
            <IconButton component="a" href={waHref} target="_blank" rel="noopener" aria-label="WhatsApp inquiry"
              sx={{ bgcolor: 'success.main', color: 'white', borderRadius: 1, '&:hover': { bgcolor: 'success.dark' } }}>
              <ChatIcon />
            </IconButton>
          </Stack>
        </Box>
      </CardContent>
    </Card>
  );
}
