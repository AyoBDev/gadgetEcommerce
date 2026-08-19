'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Box from '@mui/material/Box';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import TablePagination from '@mui/material/TablePagination';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';

export type AdminColumn<T> = {
  key: string;
  label: string;
  render: (row: T) => React.ReactNode;
};

type AdminListTableProps<T> = {
  columns: AdminColumn<T>[];
  rows: T[];
  rowKey: (row: T) => string | number;
  rowHref?: (row: T) => string;
  totalDocs: number;
  page: number;
  limit: number;
  toolbar?: React.ReactNode;
  emptyText?: string;
};

export function AdminListTable<T>({
  columns,
  rows,
  rowKey,
  rowHref,
  totalDocs,
  page,
  limit,
  toolbar,
  emptyText,
}: AdminListTableProps<T>) {
  const router = useRouter();
  const searchParams = useSearchParams();

  function handlePageChange(_event: React.MouseEvent<HTMLButtonElement> | null, newPage: number) {
    const params = new URLSearchParams(searchParams.toString());
    if (newPage <= 0) {
      params.delete('page');
    } else {
      params.set('page', String(newPage + 1));
    }
    router.push(`?${params.toString()}`);
  }

  return (
    <Box>
      {toolbar && <Box sx={{ mb: 2 }}>{toolbar}</Box>}
      <TableContainer sx={{ border: 1, borderColor: 'divider', borderRadius: 1, bgcolor: 'background.paper' }}>
        <Table size="small">
          <TableHead>
            <TableRow>
              {columns.map((c) => (
                <TableCell key={c.key}>{c.label}</TableCell>
              ))}
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {rows.length === 0 && (
              <TableRow>
                <TableCell colSpan={columns.length + 1}>
                  <Typography color="text.secondary" sx={{ py: 2 }}>
                    {emptyText ?? 'No results.'}
                  </Typography>
                </TableCell>
              </TableRow>
            )}
            {rows.map((row) => (
              <TableRow
                key={rowKey(row)}
                hover
                sx={{ cursor: rowHref ? 'pointer' : 'default' }}
                onClick={rowHref ? () => router.push(rowHref(row)) : undefined}
              >
                {columns.map((c) => (
                  <TableCell key={c.key}>{c.render(row)}</TableCell>
                ))}
                <TableCell align="right">
                  {rowHref && (
                    <Button size="small" component={Link} href={rowHref(row)} onClick={(e) => e.stopPropagation()}>
                      Edit
                    </Button>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
      <TablePagination
        component="div"
        count={totalDocs}
        page={Math.max(0, page - 1)}
        onPageChange={handlePageChange}
        rowsPerPage={limit}
        rowsPerPageOptions={[]}
        labelRowsPerPage=""
      />
    </Box>
  );
}