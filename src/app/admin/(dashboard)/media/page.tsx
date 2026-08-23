import { Suspense } from 'react';
import { getPayloadClient } from '@/lib/payload';
import type { Where } from 'payload';
import { AdminListTable, type AdminColumn } from '@/components/admin/AdminListTable';
import { AdminDeleteButton } from '@/components/admin/AdminDeleteButton';
import { MediaToolbar } from '@/components/admin/MediaToolbar';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Avatar from '@mui/material/Avatar';
import type { Media } from '@/payload-types';

const LIMIT = 20;

function formatBytes(bytes?: number | null): string {
  if (bytes == null) return '—';
  const units = ['B', 'KB', 'MB', 'GB'];
  let n = bytes;
  let i = 0;
  while (n >= 1024 && i < units.length - 1) {
    n /= 1024;
    i += 1;
  }
  return `${n.toFixed(i === 0 ? 0 : 1)} ${units[i]}`;
}

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

export default async function AdminMediaPage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  const payload = await getPayloadClient();
  const search = typeof params.search === 'string' ? params.search : undefined;
  const page = Math.max(1, parseInt(typeof params.page === 'string' ? params.page : '1', 10) || 1);

  const where: Where = search ? { or: [{ alt: { contains: search } }, { filename: { contains: search } }] } : {};

  const result = await payload.find({
    collection: 'media',
    where,
    sort: '-updatedAt',
    limit: LIMIT,
    page,
    depth: 0,
    select: {
      alt: true,
      caption: true,
      filename: true,
      url: true,
      thumbnailURL: true,
      filesize: true,
      updatedAt: true,
    },
  });

  const columns: AdminColumn<Media>[] = [
    {
      key: 'preview',
      label: 'Preview',
      render: (row) => (
        <Avatar src={row.thumbnailURL ?? row.url ?? undefined} variant="rounded" sx={{ width: 56, height: 56 }} />
      ),
    },
    { key: 'alt', label: 'Alt text', render: (row) => <Typography variant="body2">{row.alt}</Typography> },
    { key: 'filename', label: 'Filename', render: (row) => <Typography variant="body2">{row.filename}</Typography> },
    { key: 'size', label: 'Size', render: (row) => <Typography variant="body2">{formatBytes(row.filesize)}</Typography> },
    {
      key: 'updatedAt',
      label: 'Updated',
      render: (row) => <Typography variant="body2">{new Date(row.updatedAt).toLocaleDateString()}</Typography>,
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (row) => <AdminDeleteButton collection="media" id={row.id} />,
    },
  ];

  return (
    <Box>
      <Typography variant="h4" component="h1" fontWeight={700} sx={{ mb: 2 }}>
        Media
      </Typography>
      <AdminListTable
        columns={columns}
        rows={result.docs as unknown as Media[]}
        rowKey={(row) => row.id}
        totalDocs={result.totalDocs}
        page={page}
        limit={LIMIT}
        toolbar={
          <Suspense fallback={null}>
            <MediaToolbar />
          </Suspense>
        }
        emptyText="No media found. Upload an image above."
      />
    </Box>
  );
}