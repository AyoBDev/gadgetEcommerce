import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import Box from '@mui/material/Box';
import Container from '@mui/material/Container';
import Grid from '@mui/material/Grid2';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import Breadcrumbs from '@mui/material/Breadcrumbs';
import { getPayloadClient } from '@/lib/payload';
import { StudioWash } from '@/components/StudioWash';
import { LaptopGallery } from '@/components/LaptopGallery';
import { ProductDetailActions } from '@/components/ProductDetailActions';
import { ChatAboutLaptop } from '@/components/product/ChatAboutLaptop';
import { buildLaptopMetadata, buildProductJsonLd, buildBreadcrumbJsonLd } from '@/lib/seo';
import { formatNaira } from '@/lib/money';
import { getSettings, resolveWhatsAppNumber } from '@/lib/settings';
import { relatedLaptopsWhere } from '@/lib/related-laptops';
import StockPill from '@/components/product/StockPill';
import ConditionBadge from '@/components/product/ConditionBadge';
import TrustBox from '@/components/product/TrustBox';
import KeySpecs from '@/components/product/KeySpecs';
import CompareCallout from '@/components/product/CompareCallout';
import WhatsAppCallout from '@/components/product/WhatsAppCallout';
import AddonsSection from '@/components/product/AddonsSection';
import RelatedProducts from '@/components/product/RelatedProducts';
import { Reveal } from '@/components/Reveal';
import { SectionBand } from '@/components/SectionBand';
import type { Media } from '@/payload-types';

const SERVER_URL = process.env.NEXT_PUBLIC_SERVER_URL ?? 'http://localhost:3000';

export async function generateStaticParams() {
  // Runs at build time. If the database isn't reachable/migrated yet (e.g. a
  // fresh deploy where migrations run in the same build), fall back to no
  // prerendered params — pages are then rendered on demand at request time.
  try {
    const payload = await getPayloadClient();
    const res = await payload.find({ collection: 'laptops', where: { status: { equals: 'published' } }, limit: 500 });
    return res.docs.map((l) => ({ slug: l.slug }));
  } catch {
    return [];
  }
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
  const addons = addonsRes.docs;

  const productLd = buildProductJsonLd(laptop, SERVER_URL);
  const breadcrumbLd = buildBreadcrumbJsonLd([
    { name: 'Home', url: SERVER_URL },
    { name: 'Laptops', url: `${SERVER_URL}/laptops` },
    { name: laptop.title, url },
  ]);
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

      {/* Hero band — dark studio wash (matches homepage night hero) */}
      <Box className="grain" sx={{ position: 'relative', bgcolor: 'night.main', color: 'night.contrastText', overflow: 'hidden' }}>
        <StudioWash />
        <Container maxWidth="lg" sx={{ position: 'relative', py: { xs: 4, md: 8 } }}>
          <Breadcrumbs sx={{ mb: 3, color: 'rgba(244,242,238,0.6)', '& a': { color: 'rgba(244,242,238,0.85)' } }}>
            <Link href="/">Home</Link>
            <Link href="/laptops">Laptops</Link>
            <Typography sx={{ color: 'night.contrastText' }}>{laptop.title}</Typography>
          </Breadcrumbs>
          <Grid container spacing={{ xs: 4, md: 6 }} alignItems="center">
            <Grid size={{ xs: 12, md: 6 }}>
              <Box sx={{ position: 'relative', maxWidth: 520, mx: 'auto' }}>
                {/* floating ground shadow under the gallery (dark-appropriate) */}
                <Box aria-hidden sx={{
                  position: 'absolute', left: '12%', right: '12%', bottom: -8, height: 26,
                  background: 'radial-gradient(50% 100% at 50% 50%, rgba(0,0,0,0.5), transparent 70%)',
                  filter: 'blur(8px)', zIndex: 0,
                }} />
                <Box sx={{ position: 'absolute', top: 16, left: 16, zIndex: 2 }}>
                  <ConditionBadge condition={laptop.condition} />
                </Box>
                <Box sx={{ position: 'relative', zIndex: 1 }}>
                  <LaptopGallery images={gallery} />
                </Box>
              </Box>
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <Box>
                {/* Title + subtitle sit on the dark band with light text */}
                <Stack spacing={1} sx={{ mb: 3 }}>
                  <Typography variant="h1" sx={{ fontSize: { xs: 30, md: 40 }, letterSpacing: '-0.025em' }}>{laptop.title}</Typography>
                  {subtitle && <Typography variant="h3" sx={{ fontWeight: 500, color: 'rgba(244,242,238,0.75)' }}>{subtitle}</Typography>}
                </Stack>
                {/* Whole buy panel on ONE paper card so its light-mode children read on the dark band */}
                <Box sx={{ bgcolor: 'background.paper', color: 'text.primary', border: 1, borderColor: 'divider', borderRadius: 2.5, p: { xs: 2.5, md: 3 } }}>
                  <Stack spacing={2.5}>
                    <Stack direction="row" spacing={2} alignItems="baseline">
                      <Typography className="price" sx={{ color: 'primary.main', fontSize: { xs: 32, md: 40 }, fontWeight: 700, lineHeight: 1 }}>
                        {formatNaira(laptop.price)}
                      </Typography>
                      {laptop.compareAtPrice && (
                        <Typography className="price" sx={{ color: 'text.secondary', textDecoration: 'line-through', fontSize: 15 }}>
                          {formatNaira(laptop.compareAtPrice)}
                        </Typography>
                      )}
                    </Stack>
                    <StockPill stock={laptop.stock} />
                    <TrustBox batteryHealth={laptop.specs?.batteryHealth} />
                    <Stack spacing={1.5}>
                      <ChatAboutLaptop id={laptop.id} title={laptop.title} price={laptop.price} url={url}
                        disabled={laptop.stock === 0} />
                    </Stack>
                    <ProductDetailActions laptopId={laptop.id} />
                    {/* checkout note — already inside the paper card, so a plain tinted strip */}
                    <Box sx={{ p: 2, bgcolor: 'grey.50', borderRadius: 2 }}>
                      <Typography variant="caption">
                        Note: online checkout is coming soon. For now, tap <strong>Chat with us</strong> to place your order.
                      </Typography>
                    </Box>
                  </Stack>
                </Box>
              </Box>
            </Grid>
          </Grid>
        </Container>
      </Box>

      {/* body sections — alternating design-system bands */}
      <SectionBand tone="white">
        <Reveal><KeySpecs laptop={laptop} /></Reveal>
      </SectionBand>

      {laptop.description && (
        <SectionBand tone="grey">
          <Reveal>
            <Paper variant="outlined" sx={{ p: { xs: 3, md: 4 } }}>
              <Typography variant="h2" sx={{ mb: 3, pb: 2, borderBottom: 1, borderColor: 'divider' }}>
                Product Description
              </Typography>
              <Typography sx={{ whiteSpace: 'pre-wrap' }}>{laptop.description}</Typography>
            </Paper>
          </Reveal>
        </SectionBand>
      )}

      <SectionBand tone="white">
        <Reveal>
          <AddonsSection addons={addons} whatsappNumber={whatsappNumber}
            laptopId={laptop.id} laptopTitle={laptop.title} laptopPrice={laptop.price} url={url} />
        </Reveal>
      </SectionBand>

      <SectionBand tone="tint">
        <Reveal><CompareCallout /></Reveal>
      </SectionBand>

      <SectionBand tone="white">
        <Reveal><RelatedProducts laptops={related} whatsappNumber={whatsappNumber} /></Reveal>
      </SectionBand>

      <SectionBand tone="grey">
        <Reveal><WhatsAppCallout laptop={{ id: laptop.id, title: laptop.title, price: laptop.price, url }} /></Reveal>
      </SectionBand>
    </>
  );
}
