import Link from 'next/link';
import Image from 'next/image';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import IconButton from '@mui/material/IconButton';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import ChatIcon from '@mui/icons-material/Chat';
import { formatNaira } from '@/lib/money';
import { buildWhatsAppLink } from '@/lib/whatsapp';
import type { Laptop } from '@/payload-types';

function conditionLabel(condition: Laptop['condition']) {
  return { 'grade-a': 'Grade A', 'grade-b': 'Grade B', 'grade-c': 'Grade C' }[condition];
}

function discountPercent(price: number, compareAt: number | null | undefined): number | null {
  if (!compareAt || compareAt <= price) return null;
  return Math.round(((compareAt - price) / compareAt) * 100);
}

function laptopImage(laptop: Laptop): string {
  const image = typeof laptop.gallery?.[0]?.image === 'object' ? laptop.gallery[0].image : null;
  return image?.sizes?.card?.url ?? image?.url ?? '/laptop-placeholder.jpg';
}

function specLine(laptop: Laptop): string {
  const parts: string[] = [];
  if (laptop.specs?.ram) parts.push(`RAM ${laptop.specs.ram}GB`);
  if (laptop.specs?.storage) parts.push(`Storage ${laptop.specs.storage}`);
  if (laptop.specs?.screenSize) parts.push(`${laptop.specs.screenSize}″`);
  return parts.join(' · ');
}

/** Hero deal — large photo top, mono badge, price + Buy now. Mirrors the mockup's 2fr card. */
export function DealHero({ laptop, whatsappNumber }: { laptop: Laptop; whatsappNumber: string }) {
  const discount = discountPercent(laptop.price, laptop.compareAtPrice);
  const waHref = buildWhatsAppLink(
    whatsappNumber,
    `Hi, I'm interested in the ${laptop.title} (${formatNaira(laptop.price)}). Is it still available?`,
  );

  return (
    <Card variant="outlined" sx={{ display: 'flex', flexDirection: 'column', height: '100%', position: 'relative', overflow: 'hidden' }}>
      <Box sx={{ position: 'relative', aspectRatio: { xs: '4/3', md: '16/10' }, bgcolor: 'grey.50', overflow: 'hidden' }}>
        <Link href={`/laptops/${laptop.slug}`} style={{ display: 'block', position: 'absolute', inset: 0 }}>
          <Image src={laptopImage(laptop)} alt={laptop.title} fill sizes="(max-width: 900px) 100vw, 50vw" style={{ objectFit: 'cover' }} />
        </Link>
        {discount !== null && (
          <Box sx={{
            position: 'absolute', top: 12, left: 12, zIndex: 2,
            bgcolor: 'tint.main', color: 'primary.main',
            px: 1.25, py: 0.5, borderRadius: 0.75,
            fontFamily: 'var(--font-mono), monospace',
            fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase',
          }}>
            {conditionLabel(laptop.condition)} · −{discount}%
          </Box>
        )}
      </Box>
      <Box sx={{ p: { xs: 2.5, md: 3 }, display: 'flex', flexDirection: 'column', flexGrow: 1 }}>
        <Typography component="h3" variant="h3" sx={{ mb: 0.75, fontSize: 18 }}>
          <Link href={`/laptops/${laptop.slug}`} style={{ color: 'inherit', textDecoration: 'none' }}>
            {laptop.title}
          </Link>
        </Typography>
        <Typography sx={{ fontFamily: 'var(--font-mono), monospace', fontSize: 12, color: 'text.secondary', mb: 2 }}>
          {specLine(laptop)}
        </Typography>
        <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mt: 'auto' }}>
          <Stack direction="row" spacing={1} alignItems="baseline">
            <Typography className="num" sx={{ color: 'primary.main', fontSize: 22, fontWeight: 700, lineHeight: 1 }}>
              {formatNaira(laptop.price)}
            </Typography>
            {laptop.compareAtPrice && (
              <Typography className="num" sx={{ color: 'text.secondary', textDecoration: 'line-through', fontSize: 13 }}>
                {formatNaira(laptop.compareAtPrice)}
              </Typography>
            )}
          </Stack>
          <Button component={Link} href={`/laptops/${laptop.slug}`} variant="contained">Buy now</Button>
        </Stack>
        <Typography sx={{ mt: 1.5, fontSize: 12, color: 'text.secondary' }}>
          <a href={waHref} target="_blank" rel="noopener" style={{ color: 'inherit' }}>Or chat on WhatsApp →</a>
        </Typography>
      </Box>
    </Card>
  );
}

/** Compact horizontal deal — small photo left, price + WhatsApp button right. Mirrors the mockup's 1fr rows. */
export function DealRow({ laptop, whatsappNumber }: { laptop: Laptop; whatsappNumber: string }) {
  const waHref = buildWhatsAppLink(
    whatsappNumber,
    `Hi, I'm interested in the ${laptop.title} (${formatNaira(laptop.price)}). Is it still available?`,
  );

  return (
    <Card variant="outlined" sx={{ display: 'flex', gap: 2, alignItems: 'center', p: { xs: 1.75, md: 2 } }}>
      <Link href={`/laptops/${laptop.slug}`} style={{ flexShrink: 0, display: 'block', width: 96, height: 96, position: 'relative', borderRadius: 2, overflow: 'hidden', backgroundColor: '#F1F0ED' }}>
        <Image src={laptopImage(laptop)} alt={laptop.title} fill sizes="96px" style={{ objectFit: 'cover' }} />
      </Link>
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Typography sx={{
          display: 'inline-block', mb: 0.5,
          fontFamily: 'var(--font-mono), monospace', fontSize: 10, fontWeight: 700,
          letterSpacing: '0.08em', textTransform: 'uppercase',
          color: 'primary.main', bgcolor: 'tint.main', px: 0.75, py: 0.25, borderRadius: 0.5,
        }}>
          {conditionLabel(laptop.condition)}
        </Typography>
        <Typography component="h3" sx={{ fontSize: 14, fontWeight: 600, mb: 0.25, lineHeight: 1.25 }}>
          <Link href={`/laptops/${laptop.slug}`} style={{ color: 'inherit', textDecoration: 'none', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
            {laptop.title}
          </Link>
        </Typography>
        <Typography sx={{ fontFamily: 'var(--font-mono), monospace', fontSize: 11, color: 'text.secondary', mb: 0.75 }}>
          {specLine(laptop)}
        </Typography>
        <Stack direction="row" alignItems="center" justifyContent="space-between" spacing={1}>
          <Stack direction="row" spacing={0.75} alignItems="baseline">
            <Typography className="num" sx={{ color: 'primary.main', fontSize: 15, fontWeight: 700, lineHeight: 1 }}>
              {formatNaira(laptop.price)}
            </Typography>
            {laptop.compareAtPrice && (
              <Typography className="num" sx={{ color: 'text.secondary', textDecoration: 'line-through', fontSize: 11 }}>
                {formatNaira(laptop.compareAtPrice)}
              </Typography>
            )}
          </Stack>
          <IconButton component="a" href={waHref} target="_blank" rel="noopener" aria-label="WhatsApp inquiry"
            sx={{ width: 32, height: 32, bgcolor: 'success.main', color: 'white', borderRadius: '50%', '&:hover': { bgcolor: 'success.dark' } }}>
            <ChatIcon sx={{ fontSize: 16 }} />
          </IconButton>
        </Stack>
      </Box>
    </Card>
  );
}