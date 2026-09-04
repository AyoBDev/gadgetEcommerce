'use client';

import { useState } from 'react';
import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import Stack from '@mui/material/Stack';
import Alert from '@mui/material/Alert';
import { koboToNaira, nairaToKobo, formatNaira } from '@/lib/money';

export type SettingsData = {
  whatsappNumber: string;
  businessName: string;
  businessAddress?: string | null;
  businessPhone?: string | null;
  deliveryFeeLagos: number;
  deliveryFeeOther: number;
  supportEmail: string;
};

type Props = {
  initial: SettingsData;
  onSave: (data: SettingsData) => Promise<void>;
};

export function SettingsForm({ initial, onSave }: Props) {
  const [whatsappNumber, setWhatsappNumber] = useState(initial.whatsappNumber);
  const [businessName, setBusinessName] = useState(initial.businessName);
  const [businessAddress, setBusinessAddress] = useState(initial.businessAddress ?? '');
  const [businessPhone, setBusinessPhone] = useState(initial.businessPhone ?? '');
  const [deliveryFeeLagos, setDeliveryFeeLagos] = useState(String(koboToNaira(initial.deliveryFeeLagos)));
  const [deliveryFeeOther, setDeliveryFeeOther] = useState(String(koboToNaira(initial.deliveryFeeOther)));
  const [supportEmail, setSupportEmail] = useState(initial.supportEmail);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSaved(false);
    try {
      await onSave({
        whatsappNumber,
        businessName,
        businessAddress: businessAddress || null,
        businessPhone: businessPhone || null,
        deliveryFeeLagos: nairaToKobo(Number(deliveryFeeLagos)),
        deliveryFeeOther: nairaToKobo(Number(deliveryFeeOther)),
        supportEmail,
      });
      setSaved(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Save failed.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <Box component="form" onSubmit={handleSubmit} noValidate sx={{ maxWidth: 640 }}>
      {saved && <Alert severity="success" sx={{ mb: 2 }}>Settings saved. Storefront refreshed.</Alert>}
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      <Paper elevation={0} sx={{ p: 3, border: 1, borderColor: 'divider' }}>
        <Typography variant="h6" fontWeight={700} sx={{ mb: 2 }}>
          Store details
        </Typography>
        <Stack spacing={2}>
          <TextField label="WhatsApp number (E.164, no +)" value={whatsappNumber} onChange={(e) => setWhatsappNumber(e.target.value)} required fullWidth />
          <TextField label="Business name" value={businessName} onChange={(e) => setBusinessName(e.target.value)} required fullWidth />
          <TextField label="Business address" value={businessAddress} onChange={(e) => setBusinessAddress(e.target.value)} multiline minRows={2} fullWidth />
          <TextField label="Business phone" value={businessPhone} onChange={(e) => setBusinessPhone(e.target.value)} fullWidth />
          <TextField
            label="Delivery fee — Lagos (₦)"
            type="number"
            inputProps={{ step: '0.01', min: 0 }}
            value={deliveryFeeLagos}
            onChange={(e) => setDeliveryFeeLagos(e.target.value)}
            helperText={deliveryFeeLagos ? formatNaira(nairaToKobo(Number(deliveryFeeLagos))) : 'Enter the amount in Naira'}
            required
            fullWidth
          />
          <TextField
            label="Delivery fee — other states (₦)"
            type="number"
            inputProps={{ step: '0.01', min: 0 }}
            value={deliveryFeeOther}
            onChange={(e) => setDeliveryFeeOther(e.target.value)}
            helperText={deliveryFeeOther ? formatNaira(nairaToKobo(Number(deliveryFeeOther))) : 'Enter the amount in Naira'}
            required
            fullWidth
          />
          <TextField label="Support email" type="email" value={supportEmail} onChange={(e) => setSupportEmail(e.target.value)} required fullWidth />
          <Box>
            <Button type="submit" variant="contained" size="large" disabled={saving}>
              {saving ? 'Saving…' : 'Save settings'}
            </Button>
          </Box>
        </Stack>
      </Paper>
    </Box>
  );
}