import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Container from '@mui/material/Container';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import CompareArrowsIcon from '@mui/icons-material/CompareArrows';

export function CompareTeaser() {
  return (
    <Box sx={{ bgcolor: 'grey.100', py: 8 }}>
      <Container maxWidth="xl">
        <Paper
          variant="outlined"
          sx={{
            p: { xs: 4, md: 6 },
            display: 'flex',
            flexDirection: { xs: 'column', md: 'row' },
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 4,
          }}
        >
          <Stack spacing={1} sx={{ maxWidth: 360 }}>
            <Typography variant="h2">Compare Laptops Before You Buy</Typography>
            <Typography variant="body1" sx={{ color: 'text.secondary' }}>
              See detailed specs side-by-side to make the right choice.
            </Typography>
          </Stack>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems="center" sx={{ width: '100%', flex: 1 }}>
            <Box
              component="select"
              sx={{
                width: '100%',
                flex: 1,
                py: 1.5,
                px: 2,
                borderRadius: 2,
                border: 1,
                borderColor: 'divider',
                fontFamily: 'inherit',
                fontSize: 16,
              }}
              defaultValue=""
            >
              <option value="" disabled>Select laptop A</option>
            </Box>
            <Box
              sx={{
                width: 40,
                height: 40,
                borderRadius: '50%',
                bgcolor: 'grey.200',
                color: 'text.secondary',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <CompareArrowsIcon fontSize="small" />
            </Box>
            <Box
              component="select"
              sx={{
                width: '100%',
                flex: 1,
                py: 1.5,
                px: 2,
                borderRadius: 2,
                border: 1,
                borderColor: 'divider',
                fontFamily: 'inherit',
                fontSize: 16,
              }}
              defaultValue=""
            >
              <option value="" disabled>Select laptop B</option>
            </Box>
            <Button variant="contained" sx={{ width: { xs: '100%', sm: 'auto' }, flexShrink: 0 }}>
              Compare now
            </Button>
          </Stack>
        </Paper>
      </Container>
    </Box>
  );
}
