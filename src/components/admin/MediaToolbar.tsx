'use client';

import { useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import Box from '@mui/material/Box';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import Alert from '@mui/material/Alert';
import { formatApiError } from '@/lib/api-error';

export function MediaToolbar() {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [alt, setAlt] = useState('');
  const [caption, setCaption] = useState('');
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleUpload() {
    if (!file) return;
    setUploading(true);
    setError(null);
    const form = new FormData();
    form.append('file', file);
    // Payload's REST API reads document fields from a JSON string in
    // `_payload`; sibling form fields are ignored, which surfaces as
    // "The following field is invalid: Alt".
    const fallbackAlt = file.name.replace(/\.[^.]+$/, '').trim() || file.name || 'Image';
    form.append(
      '_payload',
      JSON.stringify({
        alt: alt.trim() || fallbackAlt,
        ...(caption.trim() ? { caption: caption.trim() } : {}),
      }),
    );
    try {
      const res = await fetch('/api/media', { method: 'POST', body: form });
      if (!res.ok) {
        const j = await res.json().catch(() => null);
        setError(formatApiError(j, 'Upload failed.'));
        return;
      }
      setFile(null);
      setAlt('');
      setCaption('');
      if (inputRef.current) inputRef.current.value = '';
      router.refresh();
    } catch {
      // Without this the button stays stuck on "Uploading…" after a drop.
      setError('Network error. Could not upload the image.');
    } finally {
      setUploading(false);
    }
  }

  return (
    <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center' }}>
      {error && <Alert severity="error">{error}</Alert>}
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        style={{ display: 'none' }}
        onChange={(e) => setFile(e.target.files?.[0] ?? null)}
        id="media-file-input"
      />
      <Button component="label" htmlFor="media-file-input" variant="outlined" size="small">
        {file ? `Selected: ${file.name}` : 'Choose image…'}
      </Button>
      <TextField label="Alt text" size="small" value={alt} onChange={(e) => setAlt(e.target.value)} sx={{ width: 220 }} />
      <TextField label="Caption" size="small" value={caption} onChange={(e) => setCaption(e.target.value)} sx={{ width: 220 }} />
      <Button variant="contained" size="small" onClick={handleUpload} disabled={!file || uploading}>
        {uploading ? 'Uploading…' : 'Upload'}
      </Button>
    </Box>
  );
}