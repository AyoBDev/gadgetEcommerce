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

export function UserListToolbar() {
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
        label="Search name or email"
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
      <FormControl size="small" sx={{ minWidth: 140 }}>
        <InputLabel>Role</InputLabel>
        <Select
          label="Role"
          value={searchParams.get('role') ?? 'all'}
          onChange={(e) => update('role', e.target.value)}
        >
          <MenuItem value="all">All roles</MenuItem>
          <MenuItem value="admin">Admin</MenuItem>
          <MenuItem value="staff">Staff</MenuItem>
        </Select>
      </FormControl>
      <Button component={Link} href="/admin-v2/users/new" variant="contained" size="small">
        Add user
      </Button>
    </Box>
  );
}