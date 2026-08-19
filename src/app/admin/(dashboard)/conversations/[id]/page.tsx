import { notFound } from 'next/navigation';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Chip from '@mui/material/Chip';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Link from 'next/link';
import { getPayloadClient } from '@/lib/payload';
import { ConversationInbox } from '@/components/admin/ConversationInbox';

export default async function AdminConversationThreadPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const conversationId = Number(id);
  if (!Number.isInteger(conversationId)) notFound();

  const payload = await getPayloadClient();
  const convo = await payload
    .findByID({ collection: 'conversations', id: conversationId, depth: 0 })
    .catch(() => null);
  if (!convo) notFound();

  return (
    <Box>
      <Typography variant="h4" component="h1" fontWeight={700} sx={{ mb: 1 }}>
        {convo.title ?? convo.laptopSummary ?? `Conversation #${convo.id}`}
      </Typography>
      <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', mb: 2, flexWrap: 'wrap' }}>
        <Chip
          label={convo.status}
          size="small"
          color={convo.status === 'open' ? 'primary' : 'default'}
          variant={convo.status === 'open' ? 'filled' : 'outlined'}
        />
        {convo.laptopUrl && (
          <Chip
            component={Link}
            href={convo.laptopUrl}
            target="_blank"
            rel="noreferrer"
            label="View laptop"
            size="small"
            variant="outlined"
            clickable
          />
        )}
      </Box>
      <Card elevation={0} sx={{ border: 1, borderColor: 'divider' }}>
        <CardContent>
          <ConversationInbox conversationId={conversationId} />
        </CardContent>
      </Card>
    </Box>
  );
}