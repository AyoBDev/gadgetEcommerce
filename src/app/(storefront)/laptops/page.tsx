import type { Metadata } from 'next';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Grid from '@mui/material/Grid2';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import Link from 'next/link';
import type { Where } from 'payload';
import { getPayloadClient } from '@/lib/payload';
import { LaptopFilters } from '@/components/LaptopFilters';
import { PageHero } from '@/components/PageHero';
import { ProductCard } from '@/components/ProductCard';
import { Reveal } from '@/components/Reveal';
import { SectionBand } from '@/components/SectionBand';
import { buildBreadcrumbJsonLd } from '@/lib/seo';
import { getSettings, resolveWhatsAppNumber } from '@/lib/settings';

export const dynamic = 'force-dynamic';

type SearchParams = { brand?: string; useCase?: string; maxPrice?: string; deals?: string };

export async function generateMetadata({ searchParams }: { searchParams: Promise<SearchParams> }): Promise<Metadata> {
  const p = await searchParams;
  const bits: string[] = [];
  if (p.brand) bits.push(`${p.brand.toUpperCase()} laptops`);
  else bits.push('UK Used laptops');
  if (p.useCase) bits.push(`for ${p.useCase.replaceAll('-', ' ')}`);
  const title = bits.join(' ');
  const description = `Browse ${title.toLowerCase()} in Nigeria. 7-day warranty. Nationwide delivery.`;
  return { title, description, alternates: { canonical: '/laptops' } };
}

async function findCategory(payload: Awaited<ReturnType<typeof getPayloadClient>>, slug: string) {
  const res = await payload.find({ collection: 'categories', where: { slug: { equals: slug } }, limit: 1 });
  return res.docs[0]?.id;
}

export default async function LaptopsPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const p = await searchParams;
  const payload = await getPayloadClient();

  const where: Where = { status: { equals: 'published' } };
  const andClauses: Where[] = [];

  if (p.brand) {
    const id = await findCategory(payload, p.brand);
    if (id) andClauses.push({ brand: { equals: id } });
  }
  if (p.useCase) {
    const id = await findCategory(payload, p.useCase);
    if (id) andClauses.push({ category: { equals: id } });
  }
  if (p.maxPrice) andClauses.push({ price: { less_than_equal: Number(p.maxPrice) } });
  if (p.deals === 'true') andClauses.push({ compareAtPrice: { greater_than: 0 } });

  const query = andClauses.length ? { and: [where, ...andClauses] } : where;

  const [brandsRes, useCasesRes, laptopsRes, settings] = await Promise.all([
    payload.find({ collection: 'categories', where: { type: { equals: 'brand' } }, limit: 50, sort: 'name' }),
    payload.find({ collection: 'categories', where: { type: { equals: 'useCase' } }, limit: 50, sort: 'name' }),
    payload.find({ collection: 'laptops', where: query, limit: 24, sort: '-updatedAt' }),
    getSettings(),
  ]);
  const whatsappNumber = resolveWhatsAppNumber(settings);

  const breadcrumb = buildBreadcrumbJsonLd([
    { name: 'Home', url: process.env.NEXT_PUBLIC_SERVER_URL ?? '' },
    { name: 'Laptops', url: (process.env.NEXT_PUBLIC_SERVER_URL ?? '') + '/laptops' },
  ]);

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumb) }} />
      <PageHero
        title="Shop UK used laptops"
        subtitle={
          <>
            <Box component="span" className="num" sx={{ color: 'night.contrastText', fontWeight: 700 }}>
              {laptopsRes.totalDocs}
            </Box>{' '}in stock
          </>
        }
      />
      <SectionBand tone="white">
        <Grid container spacing={4}>
          <Grid size={{ xs: 12, md: 3 }}>
            <LaptopFilters brands={brandsRes.docs} useCases={useCasesRes.docs} />
          </Grid>
          <Grid size={{ xs: 12, md: 9 }}>
            {laptopsRes.docs.length === 0 ? (
              <Box className="grain" sx={{
                position: 'relative', overflow: 'hidden', bgcolor: 'tint.main',
                borderRadius: 2, textAlign: 'center', py: { xs: 6, md: 10 }, px: 3,
              }}>
                {/* NOTE: no <StudioWash /> here — that wash is dark-on-black and
                    won't read on this light tint card. Plain tint + grain only. */}
                <Stack spacing={2} sx={{ position: 'relative', alignItems: 'center' }}>
                  <Typography variant="body1" sx={{ color: 'text.secondary' }}>
                    No laptops match those filters. Try clearing one.
                  </Typography>
                  <Button variant="contained" component={Link} href="/laptops">Clear filters</Button>
                </Stack>
              </Box>
            ) : (
              <Grid container spacing={3}>
                {laptopsRes.docs.map((laptop, i) => (
                  <Grid key={laptop.id} size={{ xs: 12, sm: 6, lg: 4 }}>
                    <Reveal delay={i * 60}>
                      <ProductCard laptop={laptop} whatsappNumber={whatsappNumber} />
                    </Reveal>
                  </Grid>
                ))}
              </Grid>
            )}
          </Grid>
        </Grid>
      </SectionBand>
    </>
  );
}
