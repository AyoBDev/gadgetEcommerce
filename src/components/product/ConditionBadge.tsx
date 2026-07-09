import Chip from '@mui/material/Chip';
import VerifiedIcon from '@mui/icons-material/Verified';
import type { Laptop } from '@/payload-types';

const LABEL: Record<Laptop['condition'], string> = {
  'grade-a': 'Grade A',
  'grade-b': 'Grade B',
  'grade-c': 'Grade C',
};

export default function ConditionBadge({ condition }: { condition: Laptop['condition'] }) {
  return (
    <Chip
      icon={<VerifiedIcon />}
      label={LABEL[condition]}
      color="primary"
      size="small"
      sx={{ textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.05em' }}
    />
  );
}
