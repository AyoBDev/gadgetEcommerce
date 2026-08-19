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

export function OrderListToolbar() {
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
        label="Search buyer"
        size="small"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            e.preventDefault();
            update('search', search);
          }
        }}
      />
      <FormControl size="small" sx={{ minWidth: 160 }}>
        <InputLabel>Payment</InputLabel>
        <Select
          label="Payment"
          value={searchParams.get('payment') ?? 'all'}
          onChange={(e) => update('payment', e.target.value)}
        >
          <MenuItem value="all">All payments</MenuItem>
          <MenuItem value="pending">Pending</MenuItem>
          <MenuItem value="paid">Paid</MenuItem>
        </Select>
      </FormControl>
      <FormControl size="small" sx={{ minWidth: 160 }}>
        <InputLabel>Delivery</InputLabel>
        <Select
          label="Delivery"
          value={searchParams.get('delivery') ?? 'all'}
          onChange={(e) => update('delivery', e.target.value)}
        >
          <MenuItem value="all">All deliveries</MenuItem>
          <MenuItem value="pending">Pending</MenuItem>
          <MenuItem value="delivered">Delivered</MenuItem>
        </Select>
      </FormControl>
      <Button component={Link} href="/admin-v2/orders/new" variant="contained" size="small">
        Record a sale
      </Button>
    </Box>
  );
}