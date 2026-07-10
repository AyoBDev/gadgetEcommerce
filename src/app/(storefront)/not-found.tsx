import Link from 'next/link';
import Button from '@mui/material/Button';
import Container from '@mui/material/Container';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

export default function NotFound() {
  return (
    <Container maxWidth="sm" sx={{ py: { xs: 10, md: 16 }, textAlign: 'center' }}>
      <Stack spacing={3} alignItems="center">
        <Typography variant="h1" sx={{ fontSize: 64, color: 'primary.main' }}>404</Typography>
        <Typography variant="body1" sx={{ color: 'text.secondary' }}>
          We couldn&apos;t find that page.
        </Typography>
        <Button variant="contained" color="primary" component={Link} href="/">
          Back to shop
        </Button>
      </Stack>
    </Container>
  );
}
