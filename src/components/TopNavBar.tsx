'use client';

import { useState } from 'react';
import Link from 'next/link';
import AppBar from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';
import Stack from '@mui/material/Stack';
import Box from '@mui/material/Box';
import IconButton from '@mui/material/IconButton';
import Badge from '@mui/material/Badge';
import Drawer from '@mui/material/Drawer';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemText from '@mui/material/ListItemText';
import Tooltip from '@mui/material/Tooltip';
import MenuIcon from '@mui/icons-material/Menu';
import CompareArrowsIcon from '@mui/icons-material/CompareArrows';
import FavoriteIcon from '@mui/icons-material/Favorite';
import ChatIcon from '@mui/icons-material/Chat';
import { useStore } from '@/components/StoreProvider';
import { buildWhatsAppLink } from '@/lib/whatsapp';

const NAV_LINKS = [
  { label: 'Shop', href: '/laptops' },
  { label: 'Deals', href: '/laptops?deals=true' },
  { label: 'Warranty', href: '/#warranty' },
  { label: 'About Us', href: '/#about' },
] as const;

export function TopNavBar({ whatsappNumber }: { whatsappNumber: string }) {
  const { wishlist, compare, isHydrated } = useStore();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const waHref = buildWhatsAppLink(whatsappNumber, 'Hi, I need help choosing a laptop.');

  return (
    <AppBar position="fixed" color="inherit" elevation={0} sx={{ borderBottom: 1, borderColor: 'divider' }}>
      <Container maxWidth="xl">
        <Toolbar sx={{ minHeight: 80, justifyContent: 'space-between', gap: 2 }}>
          <Stack direction="row" alignItems="center" spacing={1}>
            <IconButton
              aria-label="Open menu"
              onClick={() => setDrawerOpen(true)}
              sx={{ display: { xs: 'inline-flex', md: 'none' } }}
            >
              <MenuIcon />
            </IconButton>
            <Typography variant="h2" component={Link} href="/"
              sx={{ color: 'primary.main', textDecoration: 'none', fontWeight: 700, fontSize: { xs: 18, md: 24 } }}>
              Certified Preowned Laptops
            </Typography>
          </Stack>

          <Stack direction="row" spacing={4} sx={{ display: { xs: 'none', md: 'flex' } }}>
            {NAV_LINKS.map((link) => (
              <Typography key={link.href} component={Link} href={link.href} variant="body2"
                sx={{ color: 'text.secondary', textDecoration: 'none', '&:hover': { color: 'primary.main' } }}>
                {link.label}
              </Typography>
            ))}
          </Stack>

          <Stack direction="row" spacing={0.5}>
            <Tooltip title="Compare">
              <IconButton aria-label="Compare laptops" component={Link} href="/compare">
                <Badge badgeContent={isHydrated ? compare.length : 0} color="primary">
                  <CompareArrowsIcon />
                </Badge>
              </IconButton>
            </Tooltip>
            <Tooltip title="Wishlist">
              <IconButton aria-label="Wishlist" component={Link} href="/wishlist">
                <Badge badgeContent={isHydrated ? wishlist.length : 0} color="error">
                  <FavoriteIcon />
                </Badge>
              </IconButton>
            </Tooltip>
            <Tooltip title="Chat on WhatsApp">
              <IconButton aria-label="Chat on WhatsApp" component="a" href={waHref} target="_blank" rel="noopener">
                <ChatIcon />
              </IconButton>
            </Tooltip>
          </Stack>
        </Toolbar>
      </Container>

      <Drawer anchor="left" open={drawerOpen} onClose={() => setDrawerOpen(false)}>
        <Box sx={{ width: 260 }} role="presentation" onClick={() => setDrawerOpen(false)}>
          <List>
            {NAV_LINKS.map((link) => (
              <ListItem key={link.href} disablePadding>
                <ListItemButton component={Link} href={link.href}>
                  <ListItemText primary={link.label} />
                </ListItemButton>
              </ListItem>
            ))}
            <ListItem disablePadding>
              <ListItemButton component={Link} href="/wishlist">
                <ListItemText primary={`Wishlist${isHydrated && wishlist.length ? ` (${wishlist.length})` : ''}`} />
              </ListItemButton>
            </ListItem>
            <ListItem disablePadding>
              <ListItemButton component={Link} href="/compare">
                <ListItemText primary={`Compare${isHydrated && compare.length ? ` (${compare.length})` : ''}`} />
              </ListItemButton>
            </ListItem>
          </List>
        </Box>
      </Drawer>
    </AppBar>
  );
}
