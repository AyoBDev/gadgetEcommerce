'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Box from '@mui/material/Box';
import TextField from '@mui/material/TextField';
import InputLabel from '@mui/material/InputLabel';
import MenuItem from '@mui/material/MenuItem';
import FormControl from '@mui/material/FormControl';
import Select from '@mui/material/Select';
import Button from '@mui/material/Button';

export function LaptopListToolbar() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [search, setSearch] = useState(searchParams.get('search') ?? '');

  function update(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (!value || value === 'all') {
      params.delete(key);
    } else {
      params.set(key, value);
    }
    params.delete('page');
    router.push(`?${params.toString()}`);
  }

  return (
    <Box component="form" sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center' }}>
      <TextField
        label="Search"
        size="small"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            e.preventDefault();
            update('search', search);
          }
        }}
        sx={{ minWidth: 220 }}
      />
      <FormControl size="small" sx={{ minWidth: 150 }}>
        <InputLabel>Status</InputLabel>
        <Select
          label="Status"
          value={searchParams.get('status') ?? 'all'}
          onChange={(e) => update('status', String(e.target.value))}
        >
          <MenuItem value="all">All statuses</MenuItem>
          <MenuItem value="draft">Draft</MenuItem>
          <MenuItem value="published">Published</MenuItem>
          <MenuItem value="sold">Sold</MenuItem>
        </Select>
      </FormControl>
      <FormControl size="small" sx={{ minWidth: 150 }}>
        <InputLabel>Stock</InputLabel>
        <Select
          label="Stock"
          value={searchParams.get('stock') ?? 'all'}
          onChange={(e) => update('stock', String(e.target.value))}
        >
          <MenuItem value="all">All stock</MenuItem>
          <MenuItem value="out">Out of stock</MenuItem>
          <MenuItem value="low">Low (1–2)</MenuItem>
        </Select>
      </FormControl>
      <Box sx={{ flexGrow: 1 }} />
      <Button component={Link} href="/admin/laptops/new" variant="contained">
        Add laptop
      </Button>
    </Box>
  );
}