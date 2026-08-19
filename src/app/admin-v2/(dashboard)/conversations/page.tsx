import Link from 'next/link';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Stack from '@mui/material/Stack';
import Chip from '@mui/material/Chip';
import Badge from '@mui/material/Badge';
import { getPayloadClient } from '@/lib/payload';

export default async function AdminConversationsPage() {
  const payload = await getPayloadClient();
  const result = await payload.find({
    collection: 'conversations',
    sort: '-lastMessageAt',
    limit: 100,
    depth: 0,
    select: {
      title: true,
      laptopSummary: true,
      laptopUrl: true,
      status: true,
      unreadForAdmin: true,
      lastMessageAt: true,
    },
  });

  return (
    <Box>
      <Typography variant="h4" component="h1" fontWeight={700} sx={{ mb: 2 }}>
        Conversations
      </Typography>
      {result.docs.length === 0 && (
        <Typography color="text.secondary">No conversations yet.</Typography>
      )}
      <Stack spacing={1.5}>
        {result.docs.map((convo) => (
          <Card
            key={convo.id}
            elevation={0}
            component={Link}
            href={`/admin-v2/conversations/${convo.id}`}
            sx={{
              border: 1,
              borderColor: 'divider',
              textDecoration: 'none',
              color: 'inherit',
              '&:hover': { borderColor: 'primary.main' },
            }}
          >
            <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2, py: 1.5, '&:last-child': { pb: 1.5 } }}>
              <Badge color="error" variant="dot" invisible={!convo.unreadForAdmin} overlap="circular">
                <Box
                  sx={{
                    width: 10,
                    height: 10,
                    borderRadius: '50%',
                    bgcolor: (convo.unreadForAdmin ?? 0) > 0 ? 'error.main' : 'divider',
                  }}
                />
              </Badge>
              <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                <Typography
                  variant="body1"
                  fontWeight={(convo.unreadForAdmin ?? 0) > 0 ? 700 : 500}
                  noWrap
                >
                  {convo.title ?? convo.laptopSummary ?? `Conversation #${convo.id}`}
                </Typography>
                {convo.laptopSummary && (
                  <Typography variant="body2" color="text.secondary" noWrap>
                    {convo.laptopSummary}
                  </Typography>
                )}
              </Box>
              <Chip
                label={convo.status}
                size="small"
                color={convo.status === 'open' ? 'primary' : 'default'}
                variant={convo.status === 'open' ? 'filled' : 'outlined'}
              />
              <Typography variant="caption" color="text.secondary" sx={{ whiteSpace: 'nowrap' }}>
                {convo.lastMessageAt ? new Date(convo.lastMessageAt).toLocaleString() : ''}
              </Typography>
            </CardContent>
          </Card>
        ))}
      </Stack>
    </Box>
  );
}