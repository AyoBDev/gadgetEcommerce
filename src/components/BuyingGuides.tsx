import Box from '@mui/material/Box';
import Container from '@mui/material/Container';
import Grid from '@mui/material/Grid2';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import ArticleIcon from '@mui/icons-material/Article';

const GUIDES = [
  {
    title: 'Best Laptops Under ₦200k in 2026',
    description: 'Discover the top preowned laptops that offer the best value without breaking the bank.',
  },
  {
    title: 'Dell vs HP: Which is better for work?',
    description: 'A comprehensive comparison between Latitude and EliteBook lines for business users.',
  },
  {
    title: 'What to check when buying a used MacBook',
    description: 'Battery cycles, screen issues, and other crucial things to inspect before purchasing.',
  },
] as const;

export function BuyingGuides() {
  return (
    <Container maxWidth="xl" sx={{ py: 8 }}>
      <Stack direction="row" justifyContent="space-between" alignItems="flex-end" sx={{ mb: 4 }}>
        <Stack spacing={0.5}>
          <Typography variant="h2">Buying guides</Typography>
          <Typography variant="body2" sx={{ color: 'text.secondary' }}>Expert advice to help you choose</Typography>
        </Stack>
      </Stack>
      <Grid container spacing={3}>
        {GUIDES.map((guide) => (
          <Grid key={guide.title} size={{ xs: 12, md: 4 }}>
            <Stack spacing={2}>
              <Box
                sx={{
                  height: 192,
                  bgcolor: 'grey.100',
                  borderRadius: 2,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'text.secondary',
                }}
              >
                <ArticleIcon sx={{ fontSize: 40 }} />
              </Box>
              <Typography variant="h3">{guide.title}</Typography>
              <Typography variant="body2" sx={{ color: 'text.secondary' }}>{guide.description}</Typography>
            </Stack>
          </Grid>
        ))}
      </Grid>
    </Container>
  );
}
