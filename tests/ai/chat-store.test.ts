import { expect, test } from 'bun:test';
import { ChatsService } from 'tt-services/src/services/ChatsService';

const chatId = '000000000000000000000001';

test('Mongo commit atomically updates state and transcript under a live ownership fence', async () => {
  const calls: Array<{ filter: any; update: any; options: any }> = [];
  const collection = {
    async findOneAndUpdate(filter: any, update: any, options: any) {
      calls.push({ filter, update, options });
      return { _id: chatId, messages: update.$push.messages.$each, ...update.$set };
    },
  };
  const chats = new ChatsService(
    collection as unknown as ConstructorParameters<typeof ChatsService>[0],
  );
  const chat = await chats.commitRun(chatId, 'owner', { ready: false }, [
    { role: 'assistant', content: 'Saved' },
  ]);
  expect(calls).toHaveLength(1);
  expect(calls[0].filter['runLease.token']).toBe('owner');
  expect(calls[0].filter['runLease.expiresAt'].$gt).toBe(calls[0].update.$set.updatedAt);
  expect(calls[0].update.$set.state).toEqual({ ready: false });
  expect(chat.messages[0].content).toBe('Saved');
  expect(chat.messages[0].id).toBeString();
  expect(calls[0].options.returnDocument).toBe('after');
});

test('a stale Mongo commit fails instead of falling back to an unfenced write', async () => {
  let calls = 0;
  const chats = new ChatsService({
    async findOneAndUpdate() {
      calls++;
      return null;
    },
  } as unknown as ConstructorParameters<typeof ChatsService>[0]);
  await expect(chats.commitRun(chatId, 'old-worker', {}, [])).rejects.toThrow(
    'ownership was lost',
  );
  expect(calls).toBe(1);
});

test('completing an Agent run removes its saved approvals and appends the reply atomically', async () => {
  const document: Record<string, any> = {
    _id: chatId,
    state: 'serialized-agent-state-with-pending-approval',
    messages: [],
  };
  const calls: Array<{ filter: any; update: any }> = [];
  const chats = new ChatsService({
    async findOneAndUpdate(filter: any, update: any) {
      calls.push({ filter, update });
      // Model Mongo's ignoreUndefined option: an explicit $unset must clear state.
      for (const [key, value] of Object.entries(update.$set ?? {})) {
        if (value !== undefined) document[key] = value;
      }
      for (const key of Object.keys(update.$unset ?? {})) delete document[key];
      document.messages.push(...(update.$push?.messages.$each ?? []));
      return structuredClone(document);
    },
  } as unknown as ConstructorParameters<typeof ChatsService>[0]);
  const chat = await chats.commitRun(chatId, 'owner', undefined, [
    { role: 'assistant', content: 'Finished' },
  ]);
  expect(calls).toHaveLength(1);
  expect(calls[0].filter['runLease.token']).toBe('owner');
  expect(calls[0].filter['runLease.expiresAt'].$gt).toBe(calls[0].update.$set.updatedAt);
  expect(calls[0].update.$unset).toEqual({ state: '' });
  expect(calls[0].update.$set).not.toHaveProperty('state');
  expect(chat).not.toHaveProperty('state');
  expect(chat.messages.map((message) => message.content)).toEqual(['Finished']);
});

test('Mongo renewal requires a live token and release only removes its own token', async () => {
  const calls: Array<{ filter: any; update: any }> = [];
  const chats = new ChatsService({
    async updateOne(filter: any, update: any) {
      calls.push({ filter, update });
      return { matchedCount: 0 };
    },
  } as unknown as ConstructorParameters<typeof ChatsService>[0]);
  expect(await chats.renewRun(chatId, 'old-worker', new Date().toISOString())).toBe(false);
  expect(calls[0].filter['runLease.token']).toBe('old-worker');
  expect(calls[0].filter['runLease.expiresAt'].$gt).toBeString();
  await chats.releaseRun(chatId, 'old-worker');
  expect(calls[1].filter['runLease.token']).toBe('old-worker');
  expect(calls[1].update).toEqual({ $unset: { runLease: '' } });
});
