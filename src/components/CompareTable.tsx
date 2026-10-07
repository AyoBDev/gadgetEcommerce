'use client';

import Link from 'next/link';
import Image from 'next/image';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableRow from '@mui/material/TableRow';
import Typography from '@mui/material/Typography';
import CloseIcon from '@mui/icons-material/Close';
import { formatNaira } from '@/lib/money';
import { useStore } from '@/components/StoreProvider';
import type { Laptop } from '@/payload-types';

const GRADE_LABEL: Record<Laptop['condition'], string> = {
  'grade-a': 'Grade A',
  'grade-b': 'Grade B',
  'grade-c': 'Grade C',
};

const DASH = '—';

type Row = {
  label: string;
  render: (laptop: Laptop) => string;
  /** Returns the value used to pick the "best" column; higher wins unless `lowerIsBetter`. */
  rank?: (laptop: Laptop) => number | null;
  lowerIsBetter?: boolean;
};

const ROWS: Row[] = [
  {
    label: 'Price',
    render: (l) => formatNaira(l.price),
    rank: (l) => l.price,
    lowerIsBetter: true,
  },
  { label: 'Condition', render: (l) => GRADE_LABEL[l.condition] },
  { label: 'Processor', render: (l) => l.specs?.processor || DASH },
  {
    label: 'RAM',
    render: (l) => (l.specs?.ram ? `${l.specs.ram} GB` : DASH),
    rank: (l) => l.specs?.ram ?? null,
  },
  { label: 'Storage', render: (l) => l.specs?.storage || DASH },
  {
    label: 'Screen',
    render: (l) => (l.specs?.screenSize ? `${l.specs.screenSize}"` : DASH),
  },
  {
    label: 'Battery health',
    render: (l) => (l.specs?.batteryHealth != null ? `${l.specs.batteryHealth}%` : DASH),
    rank: (l) => l.specs?.batteryHealth ?? null,
  },
  { label: 'Operating system', render: (l) => l.specs?.os || DASH },
  {
    label: 'Warranty',
    render: (l) => `${l.warrantyDays} days`,
    rank: (l) => l.warrantyDays,
  },
  {
    label: 'Availability',
    render: (l) => (l.stock > 0 ? `${l.stock} in stock` : 'Out of stock'),
  },
];

/** Indexes of the winning column(s) for a row, or an empty set when there is nothing to rank. */
function bestIndexes(row: Row, laptops: Laptop[]): Set<number> {
  if (!row.rank || laptops.length < 2) return new Set();
  const values = laptops.map((l) => row.rank!(l));
  const present = values.filter((v): v is number => v !== null);
  if (present.length < 2) return new Set();
  const best = row.lowerIsBetter ? Math.min(...present) : Math.max(...present);
  // Every column tied means no column stands out.
  if (present.every((v) => v === best)) return new Set();
  return new Set(values.flatMap((v, i) => (v === best ? [i] : [])));
}

const LABEL_WIDTH = 132;
const COL_MIN_WIDTH = 200;

export function CompareTable({ laptops }: { laptops: Laptop[] }) {
  const { toggleCompare } = useStore();

  return (
    <TableContainer sx={{ border: 1, borderColor: 'divider', borderRadius: 2 }}>
      <Table sx={{ minWidth: LABEL_WIDTH + COL_MIN_WIDTH * laptops.length, tableLayout: 'fixed' }}>
        <TableBody>
          <TableRow>
            <LabelCell />
            {laptops.map((laptop) => {
              const image = typeof laptop.gallery?.[0]?.image === 'object' ? laptop.gallery[0].image : null;
              const imgUrl = image?.sizes?.card?.url ?? image?.url ?? '/laptop-placeholder.jpg';
              const brand = typeof laptop.brand === 'object' ? laptop.brand.name : null;
              return (
                <TableCell key={laptop.id} sx={{ verticalAlign: 'top', p: 2, position: 'relative' }}>
                  <IconButton
                    size="small"
                    aria-label={`Remove ${laptop.title} from compare`}
                    onClick={() => toggleCompare(laptop.id)}
                    sx={{ position: 'absolute', top: 8, right: 8, zIndex: 1, bgcolor: 'background.paper' }}
                  >
                    <CloseIcon fontSize="small" />
                  </IconButton>
                  <Link href={`/laptops/${laptop.slug}`} style={{ display: 'block', textDecoration: 'none', color: 'inherit' }}>
                    <Box sx={{ position: 'relative', height: 140, mb: 1.5, bgcolor: 'grey.50', borderRadius: 1, overflow: 'hidden' }}>
                      <Image
                        src={imgUrl}
                        alt={image?.alt ?? laptop.title}
                        fill
                        sizes="240px"
                        style={{ objectFit: 'cover' }}
                      />
                    </Box>
                    {brand && (
                      <Typography variant="caption" sx={{ color: 'text.secondary', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                        {brand}
                      </Typography>
                    )}
                    <Typography variant="subtitle2" sx={{ fontWeight: 700, lineHeight: 1.3 }}>
                      {laptop.title}
                    </Typography>
                  </Link>
                </TableCell>
              );
            })}
          </TableRow>

          {ROWS.map((row) => {
            const best = bestIndexes(row, laptops);
            return (
              <TableRow key={row.label} hover>
                <LabelCell>{row.label}</LabelCell>
                {laptops.map((laptop, i) => (
                  <TableCell
                    key={laptop.id}
                    sx={{
                      fontWeight: best.has(i) ? 700 : 400,
                      color: best.has(i) ? 'primary.main' : 'text.primary',
                    }}
                  >
                    {row.render(laptop)}
                  </TableCell>
                ))}
              </TableRow>
            );
          })}

          <TableRow>
            <LabelCell />
            {laptops.map((laptop) => (
              <TableCell key={laptop.id}>
                <Button component={Link} href={`/laptops/${laptop.slug}`} variant="outlined" size="small" fullWidth>
                  View details
                </Button>
              </TableCell>
            ))}
          </TableRow>
        </TableBody>
      </Table>
    </TableContainer>
  );
}

/** Sticky first column so spec labels stay visible while the table scrolls sideways on phones. */
function LabelCell({ children }: { children?: React.ReactNode }) {
  return (
    <TableCell
      component="th"
      scope="row"
      sx={{
        width: LABEL_WIDTH,
        position: 'sticky',
        left: 0,
        zIndex: 2,
        bgcolor: 'background.paper',
        borderRight: 1,
        borderColor: 'divider',
        fontWeight: 600,
        color: 'text.secondary',
        verticalAlign: 'top',
      }}
    >
      {children}
    </TableCell>
  );
}
