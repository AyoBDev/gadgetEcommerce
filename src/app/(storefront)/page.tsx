import Container from '@mui/material/Container';
import Grid from '@mui/material/Grid2';
import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Link from 'next/link';
import LocalFireDepartmentIcon from '@mui/icons-material/LocalFireDepartment';
import { getPayloadClient } from '@/lib/payload';
import { HeroSection } from '@/components/HeroSection';
import { CategoryCard } from '@/components/CategoryCard';
import { ProductCard } from '@/components/ProductCard';
import { SmartFinder } from '@/components/SmartFinder';
import { WhyBuyFromUs } from '@/components/WhyBuyFromUs';
import { CompareTeaser } from '@/components/CompareTeaser';
import { Testimonials } from '@/components/Testimonials';
import { buildOrganizationJsonLd } from '@/lib/seo';
import { getSettings, resolveWhatsAppNumber } from '@/lib/settings';

export const revalidate = 300;

export default async function Home() {
  const payload = await getPayloadClient();

  const [categoriesRes, dealsRes, settings, brandsRes, useCasesRes] = await Promise.all([
    payload.find({ collection: 'categories', limit: 8, sort: 'name' }),
    payload.find({
      collection: 'laptops',
      where: { and: [{ status: { equals: 'published' } }, { compareAtPrice: { greater_than: 0 } }] },
      limit: 4,
      sort: '-updatedAt',
    }),
    getSettings(),
    payload.find({ collection: 'categories', where: { type: { equals: 'brand' } }, limit: 50, sort: 'name' }),
    payload.find({ collection: 'categories', where: { type: { equals: 'useCase' } }, limit: 50, sort: 'name' }),
  ]);

  const allPublished = await payload.find({
    collection: 'laptops',
    where: { status: { equals: 'published' } },
    limit: 100,
    depth: 0,
    sort: 'title',
  });
  const compareOptions = allPublished.docs.map((l) => ({ id: l.id, title: l.title }));

  const orgLd = buildOrganizationJsonLd(settings, process.env.NEXT_PUBLIC_SERVER_URL ?? 'http://localhost:3000');
  const whatsappNumber = resolveWhatsAppNumber(settings);

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(orgLd) }} />
      <HeroSection brands={brandsRes.docs} useCases={useCasesRes.docs} whatsappNumber={whatsappNumber} />

      <Box sx={{ bgcolor: 'background.paper', py: 8 }}>
        <Container maxWidth="xl">
          <Typography variant="h2" sx={{ mb: 4 }}>Shop by category</Typography>
          <Grid container spacing={3}>
            {categoriesRes.docs.map((c) => (
              <Grid key={c.id} size={{ xs: 6, md: 3 }}><CategoryCard category={c} /></Grid>
            ))}
          </Grid>
        </Container>
      </Box>

      <Container maxWidth="xl" sx={{ py: 8 }}>
        <SmartFinder useCases={useCasesRes.docs} />
      </Container>

      <Box sx={{ bgcolor: 'grey.50', py: 8 }}>
        <Container maxWidth="xl">
          <Stack direction="row" justifyContent="space-between" alignItems="flex-end" sx={{ mb: 4 }}>
            <Stack spacing={0.5}>
              <Stack direction="row" spacing={1} alignItems="center">
                <LocalFireDepartmentIcon color="error" />
                <Typography variant="h2">Featured deals</Typography>
              </Stack>
              <Typography variant="body2" sx={{ color: 'text.secondary' }}>Limited-time offers on top-rated laptops</Typography>
            </Stack>
            <Button component={Link} href="/laptops?deals=true">View all deals</Button>
          </Stack>
          <Grid container spacing={3}>
            {dealsRes.docs.map((laptop) => (
              <Grid key={laptop.id} size={{ xs: 12, sm: 6, lg: 3 }}><ProductCard laptop={laptop} whatsappNumber={whatsappNumber} /></Grid>
            ))}
          </Grid>
        </Container>
      </Box>

      <WhyBuyFromUs />
      <CompareTeaser options={compareOptions} />
      <Testimonials />
    </>
  );
}
