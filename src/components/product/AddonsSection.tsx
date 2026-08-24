'use client';

import Paper from '@mui/material/Paper';
import Grid from '@mui/material/Grid2';
import Stack from '@mui/material/Stack';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import type { SvgIconProps } from '@mui/material/SvgIcon';
import Work from '@mui/icons-material/Work';
import Backpack from '@mui/icons-material/Backpack';
import Mouse from '@mui/icons-material/Mouse';
import Memory from '@mui/icons-material/Memory';
import Keyboard from '@mui/icons-material/Keyboard';
import Headphones from '@mui/icons-material/Headphones';
import Cable from '@mui/icons-material/Cable';
import Storage from '@mui/icons-material/Storage';
import Laptop from '@mui/icons-material/Laptop';
import AddShoppingCart from '@mui/icons-material/AddShoppingCart';
import { formatNaira } from '@/lib/money';
import { useChatLauncher } from '@/components/chat/ChatContext';
import type { Addon } from '@/payload-types';

type IconComponent = React.ComponentType<SvgIconProps>;

const ADDON_ICON_MAP: Record<string, IconComponent> = {
  work: Work,
  case: Work,
  bag: Backpack,
  backpack: Backpack,
  mouse: Mouse,
  memory: Memory,
  ram: Memory,
  upgrade: Memory,
  keyboard: Keyboard,
  headphones: Headphones,
  headset: Headphones,
  audio: Headphones,
  cable: Cable,
  charger: Cable,
  power: Cable,
  storage: Storage,
  ssd: Storage,
  disk: Storage,
  laptop: Laptop,
};

function getAddonIcon(icon?: string | null): IconComponent {
  const key = icon?.toLowerCase().trim();
  if (key && ADDON_ICON_MAP[key]) return ADDON_ICON_MAP[key];
  return AddShoppingCart;
}

export default function AddonsSection({
  addons, whatsappNumber, laptopId, laptopTitle, laptopPrice, url,
}: {
  addons: Addon[];
  whatsappNumber: string;
  laptopId: number;
  laptopTitle: string;
  laptopPrice: number;
  url: string;
}) {
  const { openChat } = useChatLauncher();
  if (addons.length === 0) return null;

  return (
    <Paper variant="outlined" sx={{ p: { xs: 3, md: 4 }, bgcolor: 'grey.50' }}>
      <Typography variant="h2" sx={{ mb: 3 }}>Essential Add-ons</Typography>
      <Grid container spacing={3}>
        {addons.map((addon) => {
          const AddonIcon = getAddonIcon(addon.icon);
          return (
            <Grid key={addon.id} size={{ xs: 12, md: 4 }}>
              <Paper variant="outlined" sx={{ p: 2 }}>
                <Stack direction="row" spacing={2} alignItems="center" justifyContent="space-between">
                  <Stack direction="row" spacing={2} alignItems="center">
                    <Box sx={{ display: 'flex', color: 'primary.main' }}>
                      <AddonIcon sx={{ fontSize: 36 }} />
                    </Box>
                    <Stack>
                      <Typography variant="h3">{addon.name}</Typography>
                      <Typography variant="button" className="price" sx={{ color: 'secondary.main' }}>
                        +{formatNaira(addon.price)}
                      </Typography>
                    </Stack>
                  </Stack>
                  <Button onClick={() => openChat({ id: laptopId, title: laptopTitle, price: laptopPrice, url })}
                    variant="contained" size="small">
                    ADD
                  </Button>
                </Stack>
              </Paper>
            </Grid>
          );
        })}
      </Grid>
    </Paper>
  );
}
