'use client';

import { useState } from 'react';
import Box from '@mui/material/Box';
import AppBar from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import IconButton from '@mui/material/IconButton';
import MenuIcon from '@mui/icons-material/Menu';
import Typography from '@mui/material/Typography';
import { AdminSidebar } from '@/components/admin/AdminSidebar';
import type { AdminUser } from '@/lib/admin-session';

const DRAWER_WIDTH = 240;

export function AdminShell({ user, children }: { user: AdminUser; children: React.ReactNode }) {
  const [drawerOpen, setDrawerOpen] = useState(false);

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      <AppBar
        position="fixed"
        color="inherit"
        elevation={0}
        sx={{ zIndex: (t) => t.zIndex.drawer + 1, borderBottom: 1, borderColor: 'divider' }}
      >
        <Toolbar>
          <IconButton
            edge="start"
            color="inherit"
            aria-label="Toggle navigation"
            onClick={() => setDrawerOpen(true)}
            sx={{ mr: 2, display: { md: 'none' } }}
          >
            <MenuIcon />
          </IconButton>
          <Typography variant="h6" component="div" sx={{ fontWeight: 700, flexGrow: 1 }}>
            Jaysmart Admin
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ display: { xs: 'none', sm: 'block' } }}>
            {user.name} · {user.role}
          </Typography>
        </Toolbar>
      </AppBar>
      <Box component="nav" aria-label="Admin navigation" sx={{ width: { md: DRAWER_WIDTH }, flexShrink: { md: 0 } }}>
        <AdminSidebar sx={{ display: { xs: 'none', md: 'block' } }} onNavigate={() => setDrawerOpen(false)} />
      </Box>
      <AdminSidebar
        variant="temporary"
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        onNavigate={() => setDrawerOpen(false)}
      />
      <Box component="main" sx={{ flexGrow: 1, p: { xs: 2, md: 3 }, pt: { xs: 9, md: 10 }, bgcolor: 'grey.50', minWidth: 0 }}>
        {children}
      </Box>
    </Box>
  );
}