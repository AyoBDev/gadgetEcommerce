'use client';
import { createContext, useContext } from 'react';
import { useChat } from './useChat';
import { ChatLauncher } from './ChatLauncher';
import { ChatPanel } from './ChatPanel';

type Laptop = { id: number; title: string; price: number; url: string };
type ChatCtx = ReturnType<typeof useChat> & { openChatWith: (laptop?: Laptop) => void };

const Ctx = createContext<ChatCtx | null>(null);

export function ChatProvider({ children }: { children: React.ReactNode }) {
  const chat = useChat();
  const openChatWith = (laptop?: Laptop) => {
    // Laptop context is applied only for brand-new conversations by the
    // create path; a restored/existing conversation keeps its own context.
    void chat.openChat(laptop);
  };
  const value: ChatCtx = { ...chat, openChatWith };
  return (
    <Ctx.Provider value={value}>
      {children}
      <ChatLauncher />
      <ChatPanel chat={chat} laptopSummary={chat.laptopSummary} />
    </Ctx.Provider>
  );
}

export function useChatContext(): ChatCtx {
  const v = useContext(Ctx);
  if (!v) throw new Error('useChatContext must be used within ChatProvider');
  return v;
}

export function useChatLauncher() {
  const { openChatWith } = useChatContext();
  return { openChat: openChatWith };
}
