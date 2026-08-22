import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createConversation, fetchMessages, sendMessage, getExistingConversation } from '@/lib/chat-client';

beforeEach(() => { vi.restoreAllMocks(); });

describe('chat-client', () => {
  it('createConversation posts laptop and returns conversationId', async () => {
    const fetchMock = vi.fn(async (_input: RequestInfo | URL, _init?: RequestInit) => new Response(
      JSON.stringify({ conversationId: 'c1', messages: [] }), { status: 201 }));
    vi.stubGlobal('fetch', fetchMock);
    const r = await createConversation({ id: 1, title: 'X', price: 100, url: 'u' });
    expect(r.conversationId).toBe('c1');
    const [url, init] = fetchMock.mock.calls[0]!;
    expect(url).toBe('/api/chat');
    expect(init).toMatchObject({ method: 'POST', credentials: 'same-origin' });
  });

  it('fetchMessages returns parsed messages', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => new Response(
      JSON.stringify({ status: 'open', messages: [{ id: 'm1', sender: 'admin', text: 'hi', createdAt: 't' }] }),
      { status: 200 })));
    const r = await fetchMessages('c1');
    expect(r.messages[0]?.text).toBe('hi');
  });

  it('sendMessage returns the created message', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => new Response(
      JSON.stringify({ message: { id: 'm2', sender: 'buyer', text: 'yo', createdAt: 't' } }),
      { status: 201 })));
    const m = await sendMessage('c1', 'yo');
    expect(m).toMatchObject({ id: 'm2', sender: 'buyer', text: 'yo' });
  });

  it('getExistingConversation returns the restored conversation on success', async () => {
    const payload = { conversationId: '42', status: 'open', messages: [{ id: '1', sender: 'buyer' as const, text: 'hi', createdAt: 'x' }] };
    vi.stubGlobal('fetch', vi.fn(async () => new Response(
      JSON.stringify(payload), { status: 200 })));
    const res = await getExistingConversation();
    expect(res.conversationId).toBe('42');
    expect(res.messages).toHaveLength(1);
  });

  it('getExistingConversation returns null conversation on error (never throws)', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => new Response('{}', { status: 500 })));
    const res = await getExistingConversation();
    expect(res.conversationId).toBeNull();
    expect(res.messages).toEqual([]);
  });

  it('getExistingConversation returns null conversation on network throw', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => { throw new Error('offline'); }));
    const res = await getExistingConversation();
    expect(res.conversationId).toBeNull();
  });
});
