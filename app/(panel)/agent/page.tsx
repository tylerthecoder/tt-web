import { requireAuth } from '@/utils/auth';

import { createChat, getChat, listChats } from './actions';
import Client from './Client';

export default async function AgentPage() {
  await requireAuth();

  const chats = await listChats();
  const current = chats.length > 0 ? await getChat(chats[0].id) : await createChat('New Chat');

  return (
    <div className="min-h-full bg-gray-900 text-white p-4 md:p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl md:text-3xl font-bold">Agent</h1>
      </div>
      <div className="rounded-lg border border-white/10 bg-gray-800/50 backdrop-blur p-3 md:p-4">
        {current && <Client initialChat={current} initialChats={chats} />}
      </div>
    </div>
  );
}
