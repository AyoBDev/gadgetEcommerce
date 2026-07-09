import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Container from '@mui/material/Container';
import Grid from '@mui/material/Grid2';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import Breadcrumbs from '@mui/material/Breadcrumbs';
import ChatIcon from '@mui/icons-material/Chat';
import { RichText } from '@payloadcms/richtext-lexical/react';
import { getPayloadClient } from '@/lib/payload';
import { LaptopGallery } from '@/components/LaptopGallery';
import { ProductDetailActions } from '@/components/ProductDetailActions';
import { buildLaptopMetadata, buildProductJsonLd, buildBreadcrumbJsonLd } from '@/lib/seo';
import { formatNaira } from '@/lib/money';
import { getSettings, resolveWhatsAppNumber } from '@/lib/settings';
import { buildWhatsAppLink, buildInquiryMessage } from '@/lib/whatsapp';
import { relatedLaptopsWhere } from '@/lib/related-laptops';
import StockPill from '@/components/product/StockPill';
import ConditionBadge from '@/components/product/ConditionBadge';
import TrustBox from '@/components/product/TrustBox';
import KeySpecs from '@/components/product/KeySpecs';
import CompareCallout from '@/components/product/CompareCallout';
import WhatsAppCallout from '@/components/product/WhatsAppCallout';
import AddonsSection from '@/components/product/AddonsSection';
import RelatedProducts from '@/components/product/RelatedProducts';
import type { Addon, Media } from '@/payload-types';

const SERVER_URL = process.env.NEXT_PUBLIC_SERVER_URL ?? 'http://localhost:3000';

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

  const settings = await getSettings();
  const whatsappNumber = resolveWhatsAppNumber(settings);
  const url = `${SERVER_URL}/laptops/${laptop.slug}`;

  const brandId = typeof laptop.brand === 'object' ? laptop.brand.id : laptop.brand;
  const categoryId = laptop.category == null
    ? null
    : (typeof laptop.category === 'object' ? laptop.category.id : laptop.category);

  const [relatedRes, addonsRes] = await Promise.all([
    payload.find({
      collection: 'laptops',
      where: relatedLaptopsWhere({ laptopId: laptop.id, brandId, categoryId }),
      sort: '-publishedAt',
      limit: 4,
      depth: 1,
    }),
    payload.find({ collection: 'addons', where: { active: { equals: true } }, limit: 50 }),
  ]);
  const related = relatedRes.docs;
  const addons = addonsRes.docs as Addon[];

  const productLd = buildProductJsonLd(laptop, SERVER_URL);
  const breadcrumbLd = buildBreadcrumbJsonLd([
    { name: 'Home', url: SERVER_URL },
    { name: 'Laptops', url: `${SERVER_URL}/laptops` },
    { name: laptop.title, url },
  ]);
  const waHref = buildWhatsAppLink(whatsappNumber, buildInquiryMessage({ title: laptop.title, price: laptop.price, url }));
  const gallery = (laptop.gallery ?? []).filter(
    (g): g is { image: Media; id?: string | null } => typeof g.image === 'object',
  );
  const subtitle = [
    typeof laptop.specs?.processor === 'string' ? laptop.specs.processor : null,
    typeof laptop.specs?.ram === 'number' ? `${laptop.specs.ram}GB RAM` : null,
    typeof laptop.specs?.storage === 'string' ? laptop.specs.storage : null,
  ].filter(Boolean).join(' · ');

  return (
    <>
      <script key="product-ld" type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(productLd) }} />
      <script key="breadcrumb-ld" type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }} />
      <Container maxWidth="xl" sx={{ py: { xs: 4, md: 8 } }}>
        <Breadcrumbs sx={{ mb: 3 }}>
          <Link href="/">Home</Link>
          <Link href="/laptops">Laptops</Link>
          <Typography color="text.primary">{laptop.title}</Typography>
        </Breadcrumbs>

        <Stack spacing={{ xs: 6, md: 8 }}>
          {/* Hero split */}
          <Grid container spacing={{ xs: 4, md: 6 }}>
            <Grid size={{ xs: 12, md: 7 }}>
              <Box sx={{ position: 'relative' }}>
                <Box sx={{ position: 'absolute', top: 16, left: 16, zIndex: 1 }}>
                  <ConditionBadge condition={laptop.condition} />
                </Box>
                <LaptopGallery images={gallery} />
              </Box>
            </Grid>
            <Grid size={{ xs: 12, md: 5 }}>
              <Stack spacing={3}>
                <Stack spacing={1}>
                  <Typography variant="h1" sx={{ fontSize: { xs: 32, md: 44 } }}>{laptop.title}</Typography>
                  {subtitle && <Typography variant="h3" color="text.secondary">{subtitle}</Typography>}
                </Stack>
                <Stack direction="row" spacing={2} alignItems="baseline">
                  <Typography variant="h1" sx={{ color: 'primary.main', fontSize: 32 }}>{formatNaira(laptop.price)}</Typography>
                  {laptop.compareAtPrice && (
                    <Typography variant="body2" sx={{ color: 'text.secondary', textDecoration: 'line-through' }}>
                      {formatNaira(laptop.compareAtPrice)}
                    </Typography>
                  )}
                </Stack>
                <StockPill stock={laptop.stock} />
                <TrustBox batteryHealth={laptop.specs?.batteryHealth} />
                <Stack spacing={1.5}>
                  <Button component="a" href={waHref} target="_blank" rel="noopener"
                    variant="contained" size="large" disabled={laptop.stock === 0} fullWidth>
                    {laptop.stock > 0 ? 'Buy Now' : 'Sold Out'}
                  </Button>
                  <Button component="a" href={waHref} target="_blank" rel="noopener"
                    variant="contained" size="large" startIcon={<ChatIcon />} fullWidth
                    sx={{ bgcolor: 'secondary.main', '&:hover': { bgcolor: 'secondary.dark' } }}>
                    WhatsApp inquiry
                  </Button>
                </Stack>
                <ProductDetailActions laptopId={laptop.id} />
                <Box sx={{ p: 2, bgcolor: 'grey.50', borderRadius: 2 }}>
                  <Typography variant="caption">
                    Note: online checkout is coming soon. For now, tap <strong>WhatsApp inquiry</strong> to place your order.
                  </Typography>
                </Box>
              </Stack>
            </Grid>
          </Grid>

          <KeySpecs laptop={laptop} />

          {laptop.description && (
            <Paper variant="outlined" sx={{ p: { xs: 3, md: 4 } }}>
              <Typography variant="h2" sx={{ mb: 3, pb: 2, borderBottom: 1, borderColor: 'divider' }}>
                Product Description
              </Typography>
              <RichText data={laptop.description} />
            </Paper>
          )}

          <AddonsSection addons={addons} whatsappNumber={whatsappNumber}
            laptopTitle={laptop.title} laptopPrice={laptop.price} url={url} />
          <CompareCallout />
          <RelatedProducts laptops={related} whatsappNumber={whatsappNumber} />
          <WhatsAppCallout href={waHref} />
        </Stack>
      </Container>
    </>
  );
}
