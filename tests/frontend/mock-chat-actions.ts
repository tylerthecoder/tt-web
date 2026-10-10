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
let statusRequests = 0;
let failedOnce = false;
let decisionFailed = false;
let decisionResolved = false;
let pauseRecovery = false;
export const chatTest = {
  statusRequests: 0,
  releaseRecovery: () => {},
};
export async function getConversationStatus(id: string) {
  Object.assign(window, { chatTest });
  statusRequests++;
  chatTest.statusRequests = statusRequests;
  if (pauseRecovery) {
    pauseRecovery = false;
    await new Promise<void>((resolve) => {
      chatTest.releaseRecovery = resolve;
    });
  }
  if (mode === 'stale-initial-status' && statusRequests === 1) {
    const chat = structuredClone(chats[id]);
    await new Promise((resolve) => setTimeout(resolve, 500));
    return { chat, approvals: [], ready: false };
  }
  if (new URLSearchParams(location.search).get('status') === 'unavailable') {
    throw new Error('Status unavailable');
  }
  if (new URLSearchParams(location.search).get('status') === 'fail-once' && !failedOnce) {
    failedOnce = true;
    throw new Error('Status unavailable');
  }
  if (failStatus) {
    failStatus = false;
    throw new Error('Status unavailable');
  }
  const approvals =
    new URLSearchParams(location.search).has('approval') && !decisionResolved
      ? [
          {
            index: 0,
            name: 'update_note',
            args: { noteId: 'example-note', title: 'New title' },
          },
        ]
      : [];
  return { chat: structuredClone(chats[id]), approvals, ready: ready.has(id) };
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
async function decideTool() {
  if (mode?.startsWith('decision-') && !decisionFailed) {
    decisionFailed = true;
    failStatus = mode === 'decision-double-failure';
    pauseRecovery = mode === 'decision-paused-recovery';
    throw new Error('Decision unavailable');
  }
  decisionResolved = true;
  return { approvals: [] };
}
export async function approveTool() {
  return decideTool();
}
export async function rejectTool() {
  return decideTool();
}
