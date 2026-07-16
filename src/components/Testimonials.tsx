import Avatar from '@mui/material/Avatar';
import Box from '@mui/material/Box';
import Container from '@mui/material/Container';
import Grid from '@mui/material/Grid2';
import Paper from '@mui/material/Paper';
import Rating from '@mui/material/Rating';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { SectionHeading } from '@/components/SectionHeading';

const REVIEWS = [
  {
    initial: 'O',
    name: 'Oluwaseun A.',
    location: 'Lagos, NG',
    rating: 5,
    quote: 'Got an HP EliteBook for my programming classes. The laptop was super clean, almost like new. Battery lasts over 4 hours. Highly recommend!',
  },
  {
    initial: 'C',
    name: 'Chima E.',
    location: 'Abuja, NG',
    rating: 5,
    quote: 'I was skeptical about buying preowned, but the 7-day warranty gave me peace of mind. Delivery to Abuja was fast, and the MacBook works perfectly.',
  },
  {
    initial: 'F',
    name: 'Fatima Y.',
    location: 'Kano, NG',
    rating: 4.5,
    quote: 'Great customer service on WhatsApp. They helped me choose the right Dell laptop for my business needs and budget. Very professional.',
  },
] as const;

export function Testimonials() {
  return (
    <Box sx={{ bgcolor: 'grey.50', py: 10, borderTop: 1, borderBottom: 1, borderColor: 'divider' }}>
      <Container maxWidth="lg">
        <SectionHeading center sx={{ mb: 6 }}>What our customers say</SectionHeading>
        <Grid container spacing={3}>
          {REVIEWS.map((review) => (
            <Grid key={review.name} size={{ xs: 12, md: 4 }}>
              <Paper variant="outlined" sx={{ p: 3, height: '100%' }}>
                <Stack spacing={2} sx={{ height: '100%' }}>
                  <Rating value={review.rating} precision={0.5} readOnly size="small" />
                  <Typography variant="body2">&ldquo;{review.quote}&rdquo;</Typography>
                  <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mt: 'auto' }}>
                    <Avatar sx={{ bgcolor: 'primary.main' }}>{review.initial}</Avatar>
                    <Stack spacing={0}>
                      <Typography variant="button">{review.name}</Typography>
                      <Typography variant="caption" sx={{ color: 'text.secondary' }}>{review.location}</Typography>
                    </Stack>
                  </Stack>
                </Stack>
              </Paper>
            </Grid>
          ))}
        </Grid>
      </Container>
    </Box>
  );
}
