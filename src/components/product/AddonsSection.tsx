'use client';

import Paper from '@mui/material/Paper';
import Grid from '@mui/material/Grid2';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import { formatNaira } from '@/lib/money';
import { buildWhatsAppLink, buildAddonWhatsAppMessage } from '@/lib/whatsapp';
import type { Addon } from '@/payload-types';

export default function AddonsSection({
  addons, whatsappNumber, laptopTitle, laptopPrice, url,
}: {
  addons: Addon[];
  whatsappNumber: string;
  laptopTitle: string;
  laptopPrice: number;
  url: string;
}) {
  if (addons.length === 0) return null;

  return (
    <Paper sx={{ p: { xs: 3, md: 4 }, bgcolor: 'grey.50' }}>
      <Typography variant="h2" sx={{ mb: 3 }}>Essential Add-ons</Typography>
      <Grid container spacing={3}>
        {addons.map((addon) => {
          const href = buildWhatsAppLink(
            whatsappNumber,
            buildAddonWhatsAppMessage({
              title: laptopTitle, price: laptopPrice, url,
              addonName: addon.name, addonPrice: addon.price,
            }),
          );
          return (
            <Grid key={addon.id} size={{ xs: 12, md: 4 }}>
              <Paper variant="outlined" sx={{ p: 2 }}>
                <Stack direction="row" spacing={2} alignItems="center" justifyContent="space-between">
                  <Stack direction="row" spacing={2} alignItems="center">
                    <Stack>
                      <Typography variant="h3">{addon.name}</Typography>
                      <Typography variant="button" sx={{ color: 'secondary.main' }}>
                        +{formatNaira(addon.price)}
                      </Typography>
                    </Stack>
                  </Stack>
                  <Button component="a" href={href} target="_blank" rel="noopener" variant="contained" size="small">
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
