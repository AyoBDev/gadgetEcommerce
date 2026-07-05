import Link from 'next/link';
import AppBar from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';
import Stack from '@mui/material/Stack';
import IconButton from '@mui/material/IconButton';
import CompareArrowsIcon from '@mui/icons-material/CompareArrows';
import FavoriteIcon from '@mui/icons-material/Favorite';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import ChatIcon from '@mui/icons-material/Chat';

const NAV_LINKS = [
  { label: 'Shop', href: '/laptops' },
  { label: 'Deals', href: '/laptops?deals=true' },
  { label: 'Warranty', href: '/#warranty' },
  { label: 'About Us', href: '/#about' },
] as const;

export function TopNavBar() {
  return (
    <AppBar position="fixed" color="inherit" elevation={0} sx={{ borderBottom: 1, borderColor: 'divider' }}>
      <Container maxWidth="xl">
        <Toolbar sx={{ minHeight: 80, justifyContent: 'space-between', gap: 4 }}>
          <Typography variant="h2" component={Link} href="/" sx={{ color: 'primary.main', textDecoration: 'none', fontWeight: 700 }}>
            Certified Preowned Laptops
          </Typography>
          <Stack direction="row" spacing={4} sx={{ display: { xs: 'none', md: 'flex' } }}>
            {NAV_LINKS.map((link) => (
              <Typography key={link.href} component={Link} href={link.href} variant="body2"
                sx={{ color: 'text.secondary', textDecoration: 'none', '&:hover': { color: 'primary.main' } }}>
                {link.label}
              </Typography>
            ))}
          </Stack>
          <Stack direction="row" spacing={1}>
            <IconButton aria-label="Compare"><CompareArrowsIcon /></IconButton>
            <IconButton aria-label="Wishlist"><FavoriteIcon /></IconButton>
            <IconButton aria-label="Cart"><ShoppingCartIcon /></IconButton>
            <IconButton aria-label="Chat"><ChatIcon /></IconButton>
          </Stack>
        </Toolbar>
      </Container>
    </AppBar>
  );
}
