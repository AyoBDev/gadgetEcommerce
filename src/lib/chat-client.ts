export type ChatMessage = { id: string; sender: 'buyer' | 'admin'; text: string; createdAt: string };

export async function createConversation(
  laptop?: { id: number; title: string; price: number; url: string },
): Promise<{ conversationId: string }> {
  const res = await fetch('/api/chat', {
    method: 'POST',
    credentials: 'same-origin',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(laptop ? { laptop } : {}),
  });
  if (!res.ok) throw new Error(`createConversation failed: ${res.status}`);
  return res.json();
}

export async function fetchMessages(id: string): Promise<{ status: string; messages: ChatMessage[] }> {
  const res = await fetch(`/api/chat/${id}/messages`, { credentials: 'same-origin' });
  if (!res.ok) throw new Error(`fetchMessages failed: ${res.status}`);
  return res.json();
}

export async function sendMessage(id: string, text: string): Promise<ChatMessage> {
  const res = await fetch(`/api/chat/${id}/messages`, {
    method: 'POST',
    credentials: 'same-origin',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ text }),
  });
  if (!res.ok) throw new Error(`sendMessage failed: ${res.status}`);
  const { message } = await res.json();
  return message;
}

export async function getExistingConversation(): Promise<{
  conversationId: string | null;
  status?: string;
  laptopSummary?: string;
  messages: ChatMessage[];
}> {
  try {
    const res = await fetch('/api/chat', { credentials: 'same-origin' });
    if (!res.ok) return { conversationId: null, messages: [] };
    const data = await res.json();
    return {
      conversationId: data.conversationId ?? null,
      status: data.status,
      laptopSummary: data.laptopSummary,
      messages: Array.isArray(data.messages) ? data.messages : [],
    };
  } catch {
    return { conversationId: null, messages: [] };
  }
}
