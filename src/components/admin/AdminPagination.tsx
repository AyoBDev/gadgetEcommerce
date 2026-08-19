'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import TablePagination from '@mui/material/TablePagination';

type Props = {
  totalDocs: number;
  page: number;
  limit: number;
};

export function AdminPagination({ totalDocs, page, limit }: Props) {
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
    <TablePagination
      component="div"
      count={totalDocs}
      page={Math.max(0, page - 1)}
      onPageChange={handlePageChange}
      rowsPerPage={limit}
      rowsPerPageOptions={[]}
      labelRowsPerPage=""
    />
  );
}