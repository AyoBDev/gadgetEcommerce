import type { Metadata } from 'next';
import Container from '@mui/material/Container';
import Grid from '@mui/material/Grid2';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import type { Where } from 'payload';
import { getPayloadClient } from '@/lib/payload';
import { LaptopFilters } from '@/components/LaptopFilters';
import { ProductCard } from '@/components/ProductCard';
import { buildBreadcrumbJsonLd } from '@/lib/seo';

export const dynamic = 'force-dynamic';

type SearchParams = { brand?: string; useCase?: string; maxPrice?: string; deals?: string };

export async function generateMetadata({ searchParams }: { searchParams: Promise<SearchParams> }): Promise<Metadata> {
  const p = await searchParams;
  const bits: string[] = [];
  if (p.brand) bits.push(`${p.brand.toUpperCase()} laptops`);
  else bits.push('Preowned laptops');
  if (p.useCase) bits.push(`for ${p.useCase.replace('-', ' ')}`);
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

  const [brandsRes, useCasesRes, laptopsRes] = await Promise.all([
    payload.find({ collection: 'categories', where: { type: { equals: 'brand' } }, limit: 50, sort: 'name' }),
    payload.find({ collection: 'categories', where: { type: { equals: 'useCase' } }, limit: 50, sort: 'name' }),
    payload.find({ collection: 'laptops', where: query, limit: 24, sort: '-updatedAt' }),
  ]);

  const breadcrumb = buildBreadcrumbJsonLd([
    { name: 'Home', url: process.env.NEXT_PUBLIC_SERVER_URL ?? '' },
    { name: 'Laptops', url: (process.env.NEXT_PUBLIC_SERVER_URL ?? '') + '/laptops' },
  ]);

  return (
    <Container maxWidth="xl" sx={{ py: { xs: 4, md: 8 } }}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumb) }} />
      <Stack spacing={4}>
        <Stack spacing={1}>
          <Typography variant="h1" sx={{ fontSize: { xs: 32, md: 48 } }}>Shop preowned laptops</Typography>
          <Typography variant="body1" sx={{ color: 'text.secondary' }}>{laptopsRes.totalDocs} in stock</Typography>
        </Stack>
        <Grid container spacing={4}>
          <Grid size={{ xs: 12, md: 3 }}>
            <LaptopFilters brands={brandsRes.docs} useCases={useCasesRes.docs} />
          </Grid>
          <Grid size={{ xs: 12, md: 9 }}>
            {laptopsRes.docs.length === 0 ? (
              <Typography variant="body1">No laptops match those filters. Try clearing one.</Typography>
            ) : (
              <Grid container spacing={3}>
                {laptopsRes.docs.map((laptop) => (
                  <Grid key={laptop.id} size={{ xs: 12, sm: 6, lg: 4 }}><ProductCard laptop={laptop} /></Grid>
                ))}
              </Grid>
            )}
          </Grid>
        </Grid>
      </Stack>
    </Container>
  );
}
