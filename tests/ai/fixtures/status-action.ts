import { mock } from 'bun:test';
import assert from 'node:assert/strict';

const chat = {
  id: 'chat',
  messages: [],
  createdAt: '2026-10-01T12:00:00.000Z',
  updatedAt: '2026-10-01T12:00:00.000Z',
  runLease: { token: 'active-worker', expiresAt: '2099-01-01T00:00:00.000Z' },
};
let authorized = true;
let authentications = 0;
let reads = 0;
let acquisitions = 0;
let commits = 0;
let models = 0;
mock.module('@/utils/auth', () => ({
  async requireAuth() {
    authentications++;
    if (!authorized) throw new Error('Unauthorized');
  },
}));
mock.module('@/utils/utils', () => ({
  async getTT() {
    return {
      chats: {
        async getChatById(id: string) {
          assert.equal(id, chat.id);
          reads++;
          return structuredClone(chat);
        },
        async acquireRun() {
          acquisitions++;
          return false;
        },
        async commitRun() {
          commits++;
          throw new Error('Status must not write');
        },
      },
    };
  },
}));
mock.module('@ai-sdk/openai', () => ({
  openai() {
    models++;
    throw new Error('Status must not initialize a model');
  },
}));

const { getConversationStatus } = await import('../../../app/(panel)/ai/actions');
const results = await Promise.all([
  getConversationStatus('chat'),
  getConversationStatus('chat'),
]);
assert.deepEqual(results, [
  { chat, approvals: [], ready: false },
  { chat, approvals: [], ready: false },
]);
assert.equal(authentications, 2);
assert.equal(reads, 2);
assert.equal(acquisitions, 0);
assert.equal(commits, 0);
assert.equal(models, 0);
authorized = false;
await assert.rejects(getConversationStatus('chat'), /Unauthorized/);
assert.equal(authentications, 3);
assert.equal(reads, 2);
