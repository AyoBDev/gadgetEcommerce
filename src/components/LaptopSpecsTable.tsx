import Paper from '@mui/material/Paper';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableRow from '@mui/material/TableRow';
import Typography from '@mui/material/Typography';
import type { Laptop } from '@/payload-types';

export function LaptopSpecsTable({ laptop }: { laptop: Laptop }) {
  const s = laptop.specs ?? {};
  const rows: [string, string | number | undefined][] = [
    ['Processor', s.processor ?? undefined],
    ['RAM', s.ram ? `${s.ram}GB` : undefined],
    ['Storage', s.storage ?? undefined],
    ['Screen', s.screenSize ? `${s.screenSize}"` : undefined],
    ['Battery health', s.batteryHealth ? `${s.batteryHealth}%` : undefined],
    ['Operating system', s.os ?? undefined],
    ['Condition', { 'grade-a': 'Grade A (like new)', 'grade-b': 'Grade B (light wear)', 'grade-c': 'Grade C (visible wear)' }[laptop.condition]],
    ['Warranty', `${laptop.warrantyDays}-day warranty`],
  ];
  return (
    <Paper variant="outlined" elevation={0}>
      <Table size="small">
        <TableBody>
          {rows.filter(([, v]) => v !== undefined).map(([k, v]) => (
            <TableRow key={k}>
              <TableCell sx={{ color: 'text.secondary', width: 180 }}>{k}</TableCell>
              <TableCell><Typography variant="body2">{v}</Typography></TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Paper>
  );
}
