'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import Drawer from '@mui/material/Drawer';
import Box from '@mui/material/Box';
import Toolbar from '@mui/material/Toolbar';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import Typography from '@mui/material/Typography';
import DashboardIcon from '@mui/icons-material/Dashboard';
import LaptopMacIcon from '@mui/icons-material/LaptopMac';
import ReceiptLongIcon from '@mui/icons-material/ReceiptLong';
import ChatIcon from '@mui/icons-material/Chat';
import ImageIcon from '@mui/icons-material/Image';
import SettingsIcon from '@mui/icons-material/Settings';
import PeopleIcon from '@mui/icons-material/People';
import StorefrontIcon from '@mui/icons-material/Storefront';
import LogoutIcon from '@mui/icons-material/Logout';

const DRAWER_WIDTH = 240;

const NAV_ITEMS = [
  { label: 'Dashboard', href: '/admin-v2', icon: DashboardIcon },
  { label: 'Laptops', href: '/admin-v2/laptops', icon: LaptopMacIcon },
  { label: 'Orders', href: '/admin-v2/orders', icon: ReceiptLongIcon },
  { label: 'Conversations', href: '/admin-v2/conversations', icon: ChatIcon },
  { label: 'Media', href: '/admin-v2/media', icon: ImageIcon },
  { label: 'Settings', href: '/admin-v2/settings', icon: SettingsIcon },
  { label: 'Users', href: '/admin-v2/users', icon: PeopleIcon },
] as const;

type AdminSidebarProps = {
  variant?: 'permanent' | 'temporary';
  open?: boolean;
  onClose?: () => void;
  onNavigate?: () => void;
  sx?: object;
};

export function AdminSidebar({ variant = 'permanent', open, onClose, onNavigate, sx }: AdminSidebarProps) {
  const pathname = usePathname();
  const router = useRouter();

  async function handleLogout() {
    await fetch('/api/users/logout', { method: 'POST', credentials: 'include' });
    router.push('/admin-v2/login');
    router.refresh();
  }

  const content = (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <Toolbar>
        <Typography variant="h6" fontWeight={700}>
          Jaysmart
        </Typography>
      </Toolbar>
      <List sx={{ flexGrow: 1, px: 1 }}>
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
          return (
            <ListItem key={item.href} disablePadding>
              <ListItemButton
                component={Link}
                href={item.href}
                selected={active}
                onClick={onNavigate}
                sx={{ borderRadius: 1 }}
              >
                <ListItemIcon>
                  <Icon fontSize="small" />
                </ListItemIcon>
                <ListItemText primary={item.label} primaryTypographyProps={{ variant: 'body2' }} />
              </ListItemButton>
            </ListItem>
          );
        })}
      </List>
      <List sx={{ px: 1 }}>
        <ListItem disablePadding>
          <ListItemButton component="a" href="/" target="_blank" rel="noreferrer" sx={{ borderRadius: 1 }}>
            <ListItemIcon>
              <StorefrontIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText primary="View storefront" primaryTypographyProps={{ variant: 'body2' }} />
          </ListItemButton>
        </ListItem>
        <ListItem disablePadding>
          <ListItemButton onClick={handleLogout} sx={{ borderRadius: 1 }}>
            <ListItemIcon>
              <LogoutIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText primary="Sign out" primaryTypographyProps={{ variant: 'body2' }} />
          </ListItemButton>
        </ListItem>
      </List>
    </Box>
  );

  return (
    <Drawer
      variant={variant}
      open={open}
      onClose={onClose}
      sx={{
        width: DRAWER_WIDTH,
        flexShrink: 0,
        '& .MuiDrawer-paper': { width: DRAWER_WIDTH, boxSizing: 'border-box' },
        ...sx,
      }}
    >
      {content}
    </Drawer>
  );
}