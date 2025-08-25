import { redirect } from 'next/navigation';

import { requireAuth } from '@/utils/auth';

import { createChat, getChat, listChats } from './actions';
import Client from './Client';

export default async function AiPage() {
  await requireAuth();

  const chats = await listChats();
  const current = chats.length > 0 ? await getChat(chats[0].id) : await createChat('New Chat');
  if (!current) {
    const created = await createChat('New Chat');
    redirect(`/ai/${created.id}`);
  }
  redirect(`/ai/${current.id}`);
}


