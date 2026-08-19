import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import { getPayloadClient } from '@/lib/payload';
import { getAdminUser } from '@/lib/admin-session';
import { SettingsForm, type SettingsData } from '@/components/admin/SettingsForm';

export const dynamic = 'force-dynamic';

async function saveSettings(data: SettingsData) {
  'use server';
  const user = await getAdminUser();
  if (!user) redirect('/admin-v2/login');
  const payload = await getPayloadClient();
  await payload.updateGlobal({ slug: 'settings', data });
  // Settings has no afterChange hook, so the storefront must be
  // revalidated explicitly for the new values to show up.
  revalidatePath('/');
  revalidatePath('/laptops');
}

export default async function AdminSettingsPage() {
  const payload = await getPayloadClient();
  const settings = await payload.findGlobal({ slug: 'settings' });

  return (
    <Box>
      <Typography variant="h4" component="h1" fontWeight={700} sx={{ mb: 2 }}>
        Settings
      </Typography>
      <SettingsForm initial={settings as unknown as SettingsData} onSave={saveSettings} />
    </Box>
  );
}