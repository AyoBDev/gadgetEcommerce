'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogActions from '@mui/material/DialogActions';
import Typography from '@mui/material/Typography';
import { formatApiError } from '@/lib/api-error';

type Props = {
  collection: string;
  id: string | number;
  label?: string;
};

export function AdminDeleteButton({ collection, id, label = 'Delete' }: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function confirm() {
    setDeleting(true);
    setError(null);
    try {
      const res = await fetch(`/api/${collection}/${id}`, { method: 'DELETE' });
      if (!res.ok) {
        const j = await res.json().catch(() => null);
        setError(formatApiError(j, 'Delete failed.'));
        return;
      }
      setOpen(false);
      router.refresh();
    } catch {
      // Without this the dialog stays stuck on "Deleting…" after a network drop.
      setError('Network error. Could not reach the API.');
    } finally {
      setDeleting(false);
    }
  }

  return (
    <>
      <Button size="small" color="error" onClick={() => setOpen(true)}>
        {label}
      </Button>
      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>Delete this record?</DialogTitle>
        <DialogContent>
          <DialogContentText>This action cannot be undone.</DialogContentText>
          {error && (
            <Typography color="error" variant="body2" sx={{ mt: 1 }}>
              {error}
            </Typography>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)}>Cancel</Button>
          <Button color="error" onClick={confirm} disabled={deleting}>
            {deleting ? 'Deleting…' : 'Delete'}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}