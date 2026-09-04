'use client';

import { useRef, useState } from 'react';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import FormControl from '@mui/material/FormControl';
import FormHelperText from '@mui/material/FormHelperText';
import InputLabel from '@mui/material/InputLabel';
import MenuItem from '@mui/material/MenuItem';
import Select from '@mui/material/Select';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import { formatApiError } from '@/lib/api-error';
import type { LaptopFormOption } from '@/components/admin/LaptopForm';

type Props = {
  label: string;
  value: string;
  media: LaptopFormOption[];
  onChange: (mediaId: string) => void;
  /** Called with the newly uploaded option so the parent can extend its list. */
  onUploaded: (option: LaptopFormOption) => void;
};

/**
 * Media field that can either pick an existing upload or take a brand-new file
 * straight from the product form — so adding a product photo no longer means
 * leaving the page for /admin/media and coming back.
 */
export function MediaPickerField({ label, value, media, onChange, onUploaded }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleFile(file: File | undefined) {
    if (!file) return;
    setUploading(true);
    setError(null);
    try {
      const form = new FormData();
      form.append('file', file);
      // Alt is required by the Media collection. Strip the extension for a
      // readable default, but never send an empty string — a name like
      // ".png" (or a file with no stem) would otherwise fail validation.
      const stem = file.name.replace(/\.[^.]+$/, '').trim();
      // Payload's REST API reads document fields from a JSON string in
      // `_payload`; sibling form fields are ignored, which surfaces as
      // "The following field is invalid: Alt".
      form.append('_payload', JSON.stringify({ alt: stem || file.name || 'Product photo' }));

      const res = await fetch('/api/media', { method: 'POST', body: form, credentials: 'include' });
      const json = await res.json().catch(() => null);
      if (!res.ok) {
        setError(formatApiError(json, 'Upload failed.'));
        return;
      }

      const doc = json?.doc ?? json;
      const option: LaptopFormOption = {
        id: doc.id,
        name: doc.alt || doc.filename || `Media ${doc.id}`,
        thumbnailURL: doc.sizes?.thumbnail?.url ?? doc.url ?? null,
      };
      onUploaded(option);
      onChange(String(option.id));
    } catch {
      setError('Network error. Could not upload the image.');
    } finally {
      setUploading(false);
      // Clear the input so re-picking the same file still fires onChange.
      if (inputRef.current) inputRef.current.value = '';
    }
  }

  const selected = media.find((m) => String(m.id) === value);

  return (
    <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'flex-start', width: '100%' }}>
      {selected?.thumbnailURL && (
        <Box
          component="img"
          src={selected.thumbnailURL}
          alt=""
          sx={{
            width: 56,
            height: 56,
            flexShrink: 0,
            objectFit: 'cover',
            borderRadius: 1,
            border: 1,
            borderColor: 'divider',
            bgcolor: 'action.hover',
          }}
        />
      )}
      <FormControl error={Boolean(error)} sx={{ flex: 1, minWidth: 0 }}>
        <InputLabel>{label}</InputLabel>
        <Select label={label} value={value} onChange={(e) => onChange(String(e.target.value))}>
          <MenuItem value="">None</MenuItem>
          {media.map((m) => (
            <MenuItem key={m.id} value={String(m.id)}>{m.name}</MenuItem>
          ))}
        </Select>
        {error && <FormHelperText>{error}</FormHelperText>}
      </FormControl>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        style={{ display: 'none' }}
        onChange={(e) => handleFile(e.target.files?.[0])}
      />
      <Button
        variant="outlined"
        onClick={() => inputRef.current?.click()}
        disabled={uploading}
        startIcon={uploading ? <CircularProgress size={16} /> : <UploadFileIcon />}
        sx={{ flexShrink: 0, height: 56, whiteSpace: 'nowrap' }}
      >
        {uploading ? 'Uploading…' : 'Upload'}
      </Button>
    </Box>
  );
}
