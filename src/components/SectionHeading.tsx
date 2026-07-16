import Typography from '@mui/material/Typography';
import type { SxProps, Theme } from '@mui/material/styles';
import type { ReactNode } from 'react';

/** Section h2 with a short brand-red accent bar underneath. */
export function SectionHeading({ children, center = false, sx }: { children: ReactNode; center?: boolean; sx?: SxProps<Theme> }) {
  return (
    <Typography
      variant="h2"
      sx={[
        {
          '&::after': {
            content: '""',
            display: 'block',
            width: 32,
            height: 4,
            bgcolor: 'primary.main',
            borderRadius: 2,
            mt: 1.5,
            mx: center ? 'auto' : 0,
          },
        },
        center && { textAlign: 'center' },
        ...(Array.isArray(sx) ? sx : [sx]),
      ]}
    >
      {children}
    </Typography>
  );
}
