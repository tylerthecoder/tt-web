'use client';

import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useMemo, useState, useTransition } from 'react';

import { createChat, getChat, listChats } from './actions';
import ChatColumn from './ChatColumn';

type Chat = {
  id: string;
  title?: string;
  createdAt: string;
  updatedAt: string;
  messages: Array<{
    id: string;
    role: 'user' | 'assistant' | 'tool' | 'system';
    content: string;
    createdAt: string;
    metadata?: Record<string, unknown>;
  }>;
  state?: unknown;
};

export default function Client({
  initialChat,
  initialChats,
}: {
  initialChat: Chat;
  initialChats: Chat[];
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [chat, setChat] = useState<Chat>(initialChat);
  const [chats, setChats] = useState<Chat[]>(initialChats);
  const [isPending, startTransition] = useTransition();

  // Stable date formatter to avoid hydration mismatches between server/client
  const updatedAtFormatter = useMemo(
    () =>
      new Intl.DateTimeFormat('en-US', {
        dateStyle: 'short',
        timeStyle: 'medium',
        timeZone: 'UTC',
      }),
    [],
  );

  const onNewChat = () => {
    startTransition(async () => {
      const c = await createChat('New Chat');
      setChat(c as Chat);
      const freshList = await listChats();
      setChats(freshList as Chat[]);
      router.push(`/ai/${(c as any).id}`);
    });
  };

  const onSelectChat = (id: string) => {
    startTransition(async () => {
      const c = await getChat(id);
      if (c) setChat(c as Chat);
      if (!pathname?.endsWith(id)) router.push(`/ai/${id}`);
    });
  };

  return (
    <div className="h-full min-h-0">
      <div className="grid grid-cols-4 gap-3 md:gap-4 h-full min-h-0">
        {/* Sidebar */}
        <div className="col-span-4 md:col-span-1 h-full min-h-0 flex flex-col">
          <div className="flex gap-2">
            <button
              onClick={onNewChat}
              className="flex-1 py-2 px-3 rounded bg-blue-600 hover:bg-blue-500 text-white disabled:opacity-50"
              disabled={isPending}
            >
              New chat
            </button>
          </div>
          <div className="mt-2 flex-1 min-h-0 overflow-y-auto pr-1">
            {chats.map((c: Chat) => (
              <button
                key={c.id}
                onClick={() => onSelectChat(c.id)}
                className={`w-full text-left px-3 py-2 rounded transition ${c.id === chat.id ? 'bg-blue-600/20 text-blue-200' : 'hover:bg-white/5 text-gray-200'}`}
              >
                <div className="truncate font-medium">{c.title || 'Untitled'}</div>
                <div className="text-xs text-gray-400">
                  {updatedAtFormatter.format(new Date(c.updatedAt))}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Chat column */}
        <ChatColumn chat={chat} />
      </div>
    </div>
  );
}
