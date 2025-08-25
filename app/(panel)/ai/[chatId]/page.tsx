import { redirect } from 'next/navigation';

import { requireAuth } from '@/utils/auth';

import { getChat, listChats } from '../actions';
import Client from '../Client';

export default async function AiChatPage({ params }: { params: Promise<{ chatId: string }> }) {
  await requireAuth();

  const chats = await listChats();
  const { chatId } = await params;
  const current = await getChat(chatId);
  if (!current) {
    redirect('/ai');
  }

  return (
    <div className="h-full min-h-0 bg-gray-900 text-white">
      <div className="h-full bg-gray-800/50 backdrop-blur p-2 md:p-3">
        <Client initialChat={current as any} initialChats={chats as any} />
      </div>
    </div>
  );
}


