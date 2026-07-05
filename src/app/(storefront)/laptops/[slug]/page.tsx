import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import Container from '@mui/material/Container';
import Grid from '@mui/material/Grid2';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import Breadcrumbs from '@mui/material/Breadcrumbs';
import ChatIcon from '@mui/icons-material/Chat';
import { getPayloadClient } from '@/lib/payload';
import { LaptopGallery } from '@/components/LaptopGallery';
import { LaptopSpecsTable } from '@/components/LaptopSpecsTable';
import { buildLaptopMetadata, buildProductJsonLd, buildBreadcrumbJsonLd } from '@/lib/seo';
import { formatNaira } from '@/lib/money';
import type { Media } from '@/payload-types';

const SERVER_URL = process.env.NEXT_PUBLIC_SERVER_URL ?? 'http://localhost:3000';
const WA_NUMBER = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ?? '';

export async function generateStaticParams() {
  const payload = await getPayloadClient();
  const res = await payload.find({ collection: 'laptops', where: { status: { equals: 'published' } }, limit: 500 });
  return res.docs.map((l) => ({ slug: l.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const payload = await getPayloadClient();
  const res = await payload.find({ collection: 'laptops', where: { slug: { equals: slug }, status: { equals: 'published' } }, limit: 1 });
  const laptop = res.docs[0];
  if (!laptop) return {};
  return buildLaptopMetadata(laptop);
}

export default async function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const payload = await getPayloadClient();
  const res = await payload.find({
    collection: 'laptops',
    where: { slug: { equals: slug }, status: { equals: 'published' } },
    depth: 2,
    limit: 1,
  });
  const laptop = res.docs[0];
  if (!laptop) notFound();

  const productLd = buildProductJsonLd(laptop, SERVER_URL);
  const breadcrumbLd = buildBreadcrumbJsonLd([
    { name: 'Home', url: SERVER_URL },
    { name: 'Laptops', url: `${SERVER_URL}/laptops` },
    { name: laptop.title, url: `${SERVER_URL}/laptops/${laptop.slug}` },
  ]);
  const waHref = `https://wa.me/${WA_NUMBER}?text=${encodeURIComponent(`Hi, I'm interested in the ${laptop.title} (${formatNaira(laptop.price)}) — ${SERVER_URL}/laptops/${laptop.slug}`)}`;
  const gallery = (laptop.gallery ?? []).filter(
    (g): g is { image: Media; id?: string | null } => typeof g.image === 'object',
  );

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(productLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }} />
      <Container maxWidth="xl" sx={{ py: { xs: 4, md: 8 } }}>
        <Breadcrumbs sx={{ mb: 3 }}>
          <Link href="/">Home</Link>
          <Link href="/laptops">Laptops</Link>
          <Typography color="text.primary">{laptop.title}</Typography>
        </Breadcrumbs>
        <Grid container spacing={{ xs: 4, md: 8 }}>
          <Grid size={{ xs: 12, md: 6 }}>
            <LaptopGallery images={gallery} />
          </Grid>
          <Grid size={{ xs: 12, md: 6 }}>
            <Stack spacing={3}>
              <Stack spacing={1}>
                <Typography variant="h1" sx={{ fontSize: { xs: 28, md: 40 } }}>{laptop.title}</Typography>
                <Stack direction="row" spacing={1}>
                  <Chip label={{ 'grade-a': 'Grade A', 'grade-b': 'Grade B', 'grade-c': 'Grade C' }[laptop.condition]} color="success" />
                  <Chip label={laptop.stock > 0 ? 'In stock' : 'Sold'} color={laptop.stock > 0 ? 'default' : 'error'} />
                </Stack>
              </Stack>
              <Stack direction="row" spacing={2} alignItems="baseline">
                <Typography variant="h1" sx={{ color: 'primary.main', fontSize: 40 }}>{formatNaira(laptop.price)}</Typography>
                {laptop.compareAtPrice && (
                  <Typography variant="body1" sx={{ color: 'text.secondary', textDecoration: 'line-through' }}>
                    {formatNaira(laptop.compareAtPrice)}
                  </Typography>
                )}
              </Stack>
              <LaptopSpecsTable laptop={laptop} />
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                <Button variant="contained" size="large" disabled={laptop.stock === 0} fullWidth>
                  {laptop.stock > 0 ? 'Buy now' : 'Sold out'}
                </Button>
                <Button variant="contained" size="large" startIcon={<ChatIcon />}
                  sx={{ bgcolor: 'secondary.main', '&:hover': { bgcolor: 'secondary.dark' } }}
                  component="a" href={waHref} target="_blank" rel="noopener" fullWidth>
                  WhatsApp inquiry
                </Button>
              </Stack>
              <Box sx={{ p: 2, bgcolor: 'grey.50', borderRadius: 2 }}>
                <Typography variant="caption">
                  Note: online checkout is coming soon. For now, tap <strong>WhatsApp inquiry</strong> to place your order.
                </Typography>
              </Box>
            </Stack>
          </Grid>
        </Grid>
      </Container>
    </>
  );
}
