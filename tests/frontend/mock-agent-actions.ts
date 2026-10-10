const timestamp = '2026-10-10T12:00:00.000Z';
export const initialChat = {
  id: 'agent-chat',
  title: 'Agent regression',
  createdAt: timestamp,
  updatedAt: timestamp,
  messages: [
    {
      id: 'user',
      role: 'user' as 'user' | 'assistant',
      content: 'Initial message\n'.repeat(20),
      createdAt: timestamp,
    },
  ],
};
export const secondChat = {
  ...structuredClone(initialChat),
  id: 'second-chat',
  title: 'Longer chat',
  messages: [
    {
      ...initialChat.messages[0],
      content: `${'Longer existing message\n'.repeat(120)}Second chat complete`,
    },
  ],
};
let chat = structuredClone(initialChat);
let pending = true;
export async function getPendingApprovals() {
  return pending ? [{ index: 0, name: 'update_note', args: { title: 'Updated title' } }] : [];
}
export async function listChats() {
  return [chat, secondChat];
}
export async function getChat(id: string) {
  return id === secondChat.id ? secondChat : chat;
}
export async function createChat() {
  return chat;
}
async function finish() {
  if (new URLSearchParams(location.search).get('mode') === 'replacement-approval') {
    return {
      done: false,
      approvals: [
        {
          index: 0,
          name: 'update_note',
          args: Object.fromEntries([
            ...Array.from({ length: 120 }, (_, index) => [
              `line_${index}`,
              `Replacement content ${index}`,
            ]),
            ['end', 'Replacement approval complete'],
          ]),
        },
      ],
    };
  }
  pending = false;
  chat = {
    ...chat,
    messages: [
      ...chat.messages,
      {
        id: 'assistant',
        role: 'assistant',
        content: `${'Long reply\n'.repeat(120)}Reply complete`,
        createdAt: timestamp,
      },
    ],
  };
  return { chat, done: true, approvals: [] };
}
export async function approveTool() {
  return finish();
}
export async function rejectTool() {
  return finish();
}
export async function sendUserMessage() {
  return finish();
}
