'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid';
import TextField from '@mui/material/TextField';
import InputLabel from '@mui/material/InputLabel';
import MenuItem from '@mui/material/MenuItem';
import FormControl from '@mui/material/FormControl';
import Select from '@mui/material/Select';
import Checkbox from '@mui/material/Checkbox';
import FormControlLabel from '@mui/material/FormControlLabel';
import Button from '@mui/material/Button';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import Alert from '@mui/material/Alert';

export type AdminFieldConfig = {
  key: string;
  label: string;
  type: 'text' | 'textarea' | 'number' | 'select' | 'checkbox' | 'relationship' | 'password' | 'date';
  options?: { label: string; value: string }[];
  relationshipOptions?: { id: number | string; name: string }[];
  helperText?: string;
  required?: boolean;
  hidden?: boolean;
};

type Props = {
  collection: string;
  id?: string;
  fields: AdminFieldConfig[];
  initial?: Record<string, unknown>;
  cancelHref: string;
};

export function AdminEditForm({ collection, id, fields, initial = {}, cancelHref }: Props) {
  const router = useRouter();
  const [values, setValues] = useState<Record<string, string | boolean | number>>(() => {
    const v: Record<string, string | boolean | number> = {};
    for (const f of fields) {
      const raw = initial[f.key];
      if (f.type === 'checkbox') v[f.key] = raw === undefined ? false : Boolean(raw);
      else if (f.type === 'number' || f.type === 'relationship') v[f.key] = raw == null ? '' : String(typeof raw === 'object' ? (raw as { id: number }).id : raw);
      else if (f.type === 'date') v[f.key] = raw == null ? new Date().toISOString().slice(0, 10) : String(raw).slice(0, 10);
      else v[f.key] = raw == null ? '' : String(raw);
    }
    return v;
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function set(key: string, value: string | boolean) {
    setValues((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    const body: Record<string, unknown> = {};
    for (const f of fields) {
      const val = values[f.key];
      if (f.type === 'password') {
        if (String(val)) body[f.key] = String(val);
        continue;
      }
      if (f.type === 'checkbox') {
        body[f.key] = Boolean(val);
        continue;
      }
      if (f.type === 'number' || f.type === 'relationship') {
        body[f.key] = val === '' ? null : Number(val);
        continue;
      }
      if (f.type === 'date') {
        body[f.key] = val ? new Date(String(val)).toISOString() : null;
        continue;
      }
      body[f.key] = String(val ?? '');
    }
    const url = id ? `/api/${collection}/${id}` : `/api/${collection}`;
    const res = await fetch(url, {
      method: id ? 'PATCH' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      const j = await res.json().catch(() => null);
      const msg = j?.errors?.[0]?.message ?? `${id ? 'Update' : 'Create'} failed.`;
      setError(msg);
      setSaving(false);
      return;
    }
    router.push(cancelHref);
    router.refresh();
  }

  function renderField(f: AdminFieldConfig) {
    const value = String(values[f.key] ?? '');
    switch (f.type) {
      case 'textarea':
        return (
          <TextField label={f.label} multiline minRows={3} value={value} onChange={(e) => set(f.key, e.target.value)} fullWidth required={f.required} helperText={f.helperText} />
        );
      case 'select':
        return (
          <FormControl fullWidth required={f.required}>
            <InputLabel>{f.label}</InputLabel>
            <Select label={f.label} value={value} onChange={(e) => set(f.key, e.target.value)}>
              {f.options?.map((o) => (
                <MenuItem key={o.value} value={o.value}>
                  {o.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        );
      case 'relationship':
        return (
          <FormControl fullWidth required={f.required}>
            <InputLabel>{f.label}</InputLabel>
            <Select label={f.label} value={value} onChange={(e) => set(f.key, e.target.value)}>
              {f.relationshipOptions?.map((o) => (
                <MenuItem key={o.id} value={String(o.id)}>
                  {o.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        );
      case 'checkbox':
        return (
          <FormControlLabel
            control={<Checkbox checked={Boolean(values[f.key])} onChange={(e) => set(f.key, e.target.checked)} />}
            label={f.label}
          />
        );
      case 'password':
        return (
          <TextField label={f.label} type="password" value={value} onChange={(e) => set(f.key, e.target.value)} fullWidth required={f.required} helperText={f.helperText} />
        );
      case 'number':
        return (
          <TextField label={f.label} type="number" value={value} onChange={(e) => set(f.key, e.target.value)} fullWidth required={f.required} helperText={f.helperText} />
        );
      case 'date':
        return (
          <TextField
            label={f.label}
            type="date"
            value={value.slice(0, 10)}
            onChange={(e) => set(f.key, e.target.value)}
            fullWidth
            required={f.required}
            helperText={f.helperText}
            InputLabelProps={{ shrink: true }}
          />
        );
      default:
        return (
          <TextField label={f.label} value={value} onChange={(e) => set(f.key, e.target.value)} fullWidth required={f.required} helperText={f.helperText} />
        );
    }
  }

  return (
    <Box component="form" onSubmit={handleSubmit} noValidate sx={{ maxWidth: 640 }}>
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}
      <Paper elevation={0} sx={{ p: 3, border: 1, borderColor: 'divider' }}>
        <Grid container spacing={2}>
          {fields.map((f) => (
            <Grid key={f.key} xs={12}>
              {renderField(f)}
            </Grid>
          ))}
          <Grid xs={12}>
            <Stack direction="row" spacing={2}>
              <Button type="submit" variant="contained" disabled={saving}>
                {saving ? 'Saving…' : 'Save'}
              </Button>
              <Button component={Link} href={cancelHref}>
                Cancel
              </Button>
            </Stack>
          </Grid>
        </Grid>
      </Paper>
    </Box>
  );
}