import Paper from '@mui/material/Paper';
import Grid from '@mui/material/Grid2';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import type { Laptop } from '@/payload-types';

const CONDITION: Record<Laptop['condition'], string> = {
  'grade-a': 'Grade A',
  'grade-b': 'Grade B',
  'grade-c': 'Grade C',
};

export default function KeySpecs({ laptop }: { laptop: Laptop }) {
  const s = laptop.specs ?? {};
  const rows: { label: string; value: string }[] = [];
  if (s.processor) rows.push({ label: 'Processor', value: s.processor });
  if (typeof s.ram === 'number') rows.push({ label: 'RAM', value: `${s.ram}GB` });
  if (s.storage) rows.push({ label: 'Storage', value: s.storage });
  if (typeof s.screenSize === 'number') rows.push({ label: 'Screen Size', value: `${s.screenSize}"` });
  rows.push({ label: 'Condition', value: CONDITION[laptop.condition] });
  if (typeof s.batteryHealth === 'number') rows.push({ label: 'Battery Health', value: `${s.batteryHealth}%+` });
  if (s.os) rows.push({ label: 'OS', value: s.os });

  return (
    <Paper variant="outlined" sx={{ p: { xs: 3, md: 4 } }}>
      <Typography variant="h2" sx={{ mb: 3, pb: 2, borderBottom: 1, borderColor: 'divider' }}>
        Key Specifications
      </Typography>
      <Grid container spacing={4}>
        {rows.map((r) => (
          <Grid key={r.label} size={{ xs: 6, md: 3 }}>
            <Stack spacing={0.5}>
              <Typography variant="button" color="text.secondary">{r.label}</Typography>
              <Typography variant="body2" sx={{ fontWeight: 600 }}>{r.value}</Typography>
            </Stack>
          </Grid>
        ))}
      </Grid>
    </Paper>
  );
}
