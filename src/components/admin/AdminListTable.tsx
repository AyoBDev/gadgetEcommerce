import Link from 'next/link';
import { Suspense } from 'react';
import Box from '@mui/material/Box';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import { AdminPagination } from '@/components/admin/AdminPagination';

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
              {rowHref && <TableCell align="right">Actions</TableCell>}
            </TableRow>
          </TableHead>
          <TableBody>
            {rows.length === 0 && (
              <TableRow>
                <TableCell colSpan={columns.length + (rowHref ? 1 : 0)}>
                  <Typography color="text.secondary" sx={{ py: 2 }}>
                    {emptyText ?? 'No results.'}
                  </Typography>
                </TableCell>
              </TableRow>
            )}
            {rows.map((row) => (
              <TableRow key={rowKey(row)} hover>
                {columns.map((c) => (
                  <TableCell key={c.key}>{c.render(row)}</TableCell>
                ))}
                {rowHref && (
                  <TableCell align="right">
                    <Button size="small" component={Link} href={rowHref(row)}>
                      Edit
                    </Button>
                  </TableCell>
                )}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
      <Suspense fallback={null}>
        <AdminPagination totalDocs={totalDocs} page={page} limit={limit} />
      </Suspense>
    </Box>
  );
}