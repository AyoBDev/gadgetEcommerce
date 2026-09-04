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
  /** Right-align numeric columns (prices, counts) for easier scanning. */
  align?: 'left' | 'right' | 'center';
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
      <TableContainer
        sx={{
          border: 1,
          borderColor: 'divider',
          borderRadius: 2,
          bgcolor: 'background.paper',
          overflowX: 'auto',
        }}
      >
        <Table
          size="small"
          sx={{
            // Column separators are drawn only between cells, never on the
            // outer edge, so they read as a grid inside the container border.
            '& td, & th': { borderRight: 1, borderRightColor: 'divider' },
            '& td:last-of-type, & th:last-of-type': { borderRight: 0 },
          }}
        >
          <TableHead>
            <TableRow
              sx={{
                bgcolor: 'grey.50',
                '& th': {
                  py: 1.5,
                  fontWeight: 700,
                  fontSize: 12,
                  letterSpacing: '0.04em',
                  textTransform: 'uppercase',
                  color: 'text.secondary',
                  whiteSpace: 'nowrap',
                  borderBottom: 2,
                  borderBottomColor: 'divider',
                },
              }}
            >
              {columns.map((c) => (
                <TableCell key={c.key} align={c.align ?? 'left'}>{c.label}</TableCell>
              ))}
              {rowHref && <TableCell align="right">Actions</TableCell>}
            </TableRow>
          </TableHead>
          <TableBody>
            {rows.length === 0 && (
              <TableRow>
                <TableCell colSpan={columns.length + (rowHref ? 1 : 0)} sx={{ borderRight: 0 }}>
                  <Typography color="text.secondary" align="center" sx={{ py: 5 }}>
                    {emptyText ?? 'No results.'}
                  </Typography>
                </TableCell>
              </TableRow>
            )}
            {rows.map((row) => (
              <TableRow
                key={rowKey(row)}
                hover
                sx={{
                  '& td': { py: 1.5, borderBottom: 1, borderBottomColor: 'divider' },
                  // The last row sits on the container border already.
                  '&:last-of-type td': { borderBottom: 0 },
                  transition: 'background-color 120ms ease',
                }}
              >
                {columns.map((c) => (
                  <TableCell key={c.key} align={c.align ?? 'left'}>{c.render(row)}</TableCell>
                ))}
                {rowHref && (
                  <TableCell align="right" sx={{ whiteSpace: 'nowrap' }}>
                    <Button size="small" variant="outlined" component={Link} href={rowHref(row)}>
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