type Message = { id: string; role: 'user' | 'assistant'; content: string; createdAt: string };
const mode = new URLSearchParams(location.search).get('mode');
export const chats: Record<
  string,
  { id: string; createdAt: string; updatedAt: string; messages: Message[] }
> = Object.fromEntries(
  ['one', 'two'].map((id) => [id, { id, createdAt: '', updatedAt: '', messages: [] }]),
);
const ready = new Set(mode === 'reload' ? ['one'] : []);
let failStatus = false;
export async function getConversationStatus(id: string) {
  if (failStatus) {
    failStatus = false;
    throw new Error('Status unavailable');
  }
  return { chat: structuredClone(chats[id]), approvals: [], ready: ready.has(id) };
}
export async function sendUserMessage(id: string, content: string) {
  if (mode === 'reject') throw new Error('Request not accepted');
  chats[id].messages.push({ id: 'user', role: 'user', content, createdAt: '' });
  ready.add(id);
  if (mode === 'double-failure') {
    failStatus = true;
    throw new Error('Provider unavailable');
  }
  if (mode === 'accepted') throw new Error('Provider unavailable');
  if (mode === 'slow') await new Promise((resolve) => setTimeout(resolve, 500));
  return continueAfterApprovals(id);
}
export async function continueAfterApprovals(id: string) {
  ready.delete(id);
  chats[id].messages.push({
    id: 'assistant',
    role: 'assistant',
    content: `Reply for ${id}`,
    createdAt: '',
  });
  return { ...(await getConversationStatus(id)), done: true };
}
export async function approveTool() {
  return { approvals: [] };
}
export async function rejectTool() {
  return { approvals: [] };
}
