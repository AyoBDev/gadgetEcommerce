import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import ChatIcon from '@mui/icons-material/Chat';

export default function WhatsAppCallout({ href }: { href: string }) {
  return (
    <Paper variant="outlined" sx={{ p: 4, textAlign: 'center', bgcolor: 'grey.50' }}>
      <Stack spacing={2} alignItems="center">
        <Typography variant="h2">Still confused? Chat with us before buying</Typography>
        <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 640 }}>
          Our laptop experts are online to answer any questions about specs, condition, or shipping.
        </Typography>
        <Button component="a" href={href} target="_blank" rel="noopener" startIcon={<ChatIcon />}
          variant="contained" size="large"
          sx={{ bgcolor: 'success.main', '&:hover': { bgcolor: 'success.dark' }, borderRadius: 999 }}>
          Chat on WhatsApp
        </Button>
      </Stack>
    </Paper>
  );
}
