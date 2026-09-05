'use client';

import { useState } from 'react';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import FormControl from '@mui/material/FormControl';
import FormHelperText from '@mui/material/FormHelperText';
import InputLabel from '@mui/material/InputLabel';
import MenuItem from '@mui/material/MenuItem';
import Select from '@mui/material/Select';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import AddIcon from '@mui/icons-material/Add';
import { formatApiError } from '@/lib/api-error';
import type { LaptopFormOption } from '@/components/admin/LaptopForm';

type Props = {
  label: string;
  /** Categories collection `type` this picker creates and lists. */
  categoryType: 'brand' | 'useCase';
  value: string;
  options: LaptopFormOption[];
  required?: boolean;
  /** Shown as the "none" choice; omit for a required field. */
  emptyLabel?: string;
  onChange: (id: string) => void;
  onCreated: (option: LaptopFormOption) => void;
};

/**
 * Relationship picker that can create a new Category without leaving the
 * laptop form — adding a brand no longer means abandoning a half-filled
 * product, creating the category, and starting over.
 */
export function CategoryPickerField({
  label,
  categoryType,
  value,
  options,
  required,
  emptyLabel,
  onChange,
  onCreated,
}: Props) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function close() {
    setOpen(false);
    setName('');
    setError(null);
  }

  async function handleCreate() {
    const trimmed = name.trim();
    if (!trimmed || saving) return;
    setSaving(true);
    setError(null);
    try {
      const res = await fetch('/api/categories', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        credentials: 'include',
        // `slug` is filled in by the collection's beforeValidate hook.
        body: JSON.stringify({ name: trimmed, type: categoryType }),
      });
      const json = await res.json().catch(() => null);
      if (!res.ok) {
        setError(formatApiError(json, 'Could not create.'));
        return;
      }
      const doc = json?.doc ?? json;
      onCreated({ id: doc.id, name: doc.name });
      onChange(String(doc.id));
      close();
    } catch {
      setError('Network error. Could not reach the API.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'flex-start', width: '100%' }}>
        <FormControl required={required} sx={{ flex: 1, minWidth: 0 }}>
          <InputLabel>{label}</InputLabel>
          <Select label={label} value={value} onChange={(e) => onChange(String(e.target.value))}>
            {emptyLabel && <MenuItem value="">{emptyLabel}</MenuItem>}
            {options.map((o) => (
              <MenuItem key={o.id} value={String(o.id)}>{o.name}</MenuItem>
            ))}
          </Select>
        </FormControl>
        <Button
          variant="outlined"
          onClick={() => setOpen(true)}
          startIcon={<AddIcon />}
          sx={{ flexShrink: 0, height: 56, whiteSpace: 'nowrap' }}
        >
          New
        </Button>
      </Box>

      <Dialog open={open} onClose={close} maxWidth="xs" fullWidth>
        <DialogTitle>New {label.replace(/\s*\*$/, '').toLowerCase()}</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField
              label="Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); void handleCreate(); } }}
              autoFocus
              fullWidth
            />
            {error && <FormHelperText error>{error}</FormHelperText>}
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={close}>Cancel</Button>
          <Button
            variant="contained"
            onClick={handleCreate}
            disabled={!name.trim() || saving}
            startIcon={saving ? <CircularProgress size={16} /> : null}
          >
            {saving ? 'Creating…' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
