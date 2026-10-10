import { describe, expect, test } from 'bun:test';
import { MockLanguageModelV4 } from 'ai/test';
import type { Chat, ChatMessage } from 'tt-services';
import { createConversation, readConversationStatus } from '../../app/(panel)/ai/conversation';
import { type RunLease, withChatRun } from '../../app/services/chat-run';

type GenerateResult = Awaited<ReturnType<MockLanguageModelV4['doGenerate']>>;
const response = (content: GenerateResult['content']): GenerateResult => ({
  content,
  finishReason: {
    unified: content.some((part) => part.type === 'tool-call') ? 'tool-calls' : 'stop',
    raw: undefined,
  },
  usage: {
    inputTokens: { total: 1, noCache: 1, cacheRead: 0, cacheWrite: 0 },
    outputTokens: { total: 1, text: 1, reasoning: 0 },
  },
  warnings: [],
});
const update = (id: string, noteId = 'note') => ({
  type: 'tool-call' as const,
  toolCallId: id,
  toolName: 'update_note',
  input: JSON.stringify({ noteId, title: id }),
});
const answer = response([{ type: 'text', text: 'Done.' }]);
function fixture(results: GenerateResult[], state?: unknown) {
  const chat: Chat = { id: 'chat', createdAt: '', updatedAt: '', messages: [], state };
  const writes: Array<{ id: string; update: unknown }> = [];
  const services = {
    chats: {
      getChatById: async () => structuredClone(chat),
      commitRun: async (
        _id: string,
        _token: string,
        state: unknown,
        messages: Array<Omit<ChatMessage, 'id' | 'createdAt'>> = [],
      ) => {
        chat.state = structuredClone(state);
        for (const message of messages)
          chat.messages.push({ ...message, id: String(chat.messages.length), createdAt: '' });
        return structuredClone(chat);
      },
      appendMessage: async (
        _id: string,
        message: { role: 'user' | 'assistant' | 'tool' | 'system'; content: string },
      ) => {
        chat.messages.push({ ...message, id: String(chat.messages.length), createdAt: '' });
        return structuredClone(chat);
      },
    },
    notes: {
      getNoteById: async (id: string) => ({ id, content: 'Example' }),
      getAllNotesMetadata: async () => [],
      getNotesByIds: async (ids: string[]) => ids.map((id) => ({ id })),
      updateNote: async (id: string, update: unknown) => {
        writes.push({ id, update });
        return { id, ...(update as object) };
      },
    },
  };
  const model = new MockLanguageModelV4({ doGenerate: results });
  const lease: RunLease = {
    token: 'lease',
    signal: new AbortController().signal,
    assertOwned: async () => {},
  };
  const engine = () =>
    createConversation(
      services as unknown as Parameters<typeof createConversation>[0],
      model,
      lease,
    );
  return { engine, writes, model, services, lease, chat: () => chat };
}

describe('native AI tool approvals', () => {
  test('read tools run without approval', async () => {
    const f = fixture([
      response([
        { type: 'tool-call', toolCallId: 'read', toolName: 'get_note', input: '{"id":"note"}' },
      ]),
      answer,
    ]);
    const result = await f.engine().send('chat', 'Read my note');
    expect(result.done).toBe(true);
    expect(f.writes).toHaveLength(0);
    expect(f.chat().messages.some((message) => message.role === 'tool')).toBe(true);
  });
  test('two decisions survive reload and only the approved change executes', async () => {
    const f = fixture([response([update('first'), update('second')]), answer]);
    const sent = await f.engine().send('chat', 'Update notes');
    expect(f.writes).toHaveLength(0);
    await expect(f.engine().send('chat', 'Skip approvals')).rejects.toThrow('Finish');
    await expect(f.engine().resume('chat')).rejects.toThrow('Resolve');
    await f.engine().decide('chat', sent.approvals[0].index, true);
    const pending = await f.engine().pending('chat');
    expect(pending[0].index).toBe(sent.approvals[1].index);
    await expect(f.engine().decide('chat', sent.approvals[0].index, true)).rejects.toThrow(
      'no longer',
    );
    await f.engine().decide('chat', pending[0].index, false);
    expect((await f.engine().resume('chat')).done).toBe(true);
    expect(f.writes).toEqual([{ id: 'note', update: { title: 'first' } }]);
    await f.engine().resume('chat');
    expect(f.writes).toHaveLength(1);
  });
  test('multiple approvals are batched into one continuation', async () => {
    const f = fixture([response([update('first'), update('second')]), answer]);
    const sent = await f.engine().send('chat', 'Update notes');
    for (const item of sent.approvals) await f.engine().decide('chat', item.index, true);
    await f.engine().resume('chat');
    expect(f.writes).toHaveLength(2);
    expect(f.chat().messages.filter((message) => message.role === 'tool')).toHaveLength(2);
  });
  test('legacy pending changes remain reviewable and rejectable', async () => {
    const f = fixture([answer], {
      pendingTools: [{ name: 'update_note', args: { noteId: 'note', title: 'Old proposal' } }],
    });
    const [pending] = await f.engine().pending('chat');
    await f.engine().decide('chat', pending.index, false);
    await f.engine().resume('chat');
    expect(f.writes).toHaveLength(0);
  });
  test('unknown legacy tools and Agent states fail before modifying the transcript', async () => {
    for (const state of [
      'serialized-agent-state',
      { pendingTools: [{ name: 'delete_all', args: {} }] },
    ]) {
      const f = fixture([], state);
      await expect(f.engine().send('chat', 'Hello')).rejects.toThrow();
      expect(f.chat().messages).toHaveLength(0);
    }
  });
  test('failed model continuation does not repeat a completed write', async () => {
    const f = fixture([response([update('first')])]);
    const sent = await f.engine().send('chat', 'Update');
    await f.engine().decide('chat', sent.approvals[0].index, true);
    f.model.doGenerate = async () => {
      throw new Error('Provider unavailable');
    };
    await expect(f.engine().resume('chat')).rejects.toThrow('Provider unavailable');
    expect(f.writes).toHaveLength(1);
    f.model.doGenerate = async () => answer;
    await f.engine().resume('chat');
    expect(f.writes).toHaveLength(1);
  });
});

describe('AI persistence and recovery', () => {
  test('concurrent status reads preserve fresh and legacy chats without writes', async () => {
    for (const state of [
      undefined,
      { pendingTools: [{ name: 'update_note', args: { noteId: 'note', title: 'Proposal' } }] },
    ]) {
      const f = fixture([], state);
      f.chat().updatedAt = '2026-10-01T12:00:00.000Z';
      const before = structuredClone(f.chat());
      f.services.chats.commitRun = async () => {
        throw new Error('Status must not write');
      };
      f.lease.assertOwned = async () => {
        throw new Error('Status must not need a lease');
      };
      const [first, second] = await Promise.all([
        readConversationStatus(f.services.chats, 'chat'),
        f.engine().status('chat'),
      ]);
      expect(first).toEqual(second);
      expect(first.chat).toEqual(before);
      expect(f.chat()).toEqual(before);
      expect(f.model.doGenerateCalls).toHaveLength(0);
    }
  });
  test('status remains readable while another request holds the chat lease', async () => {
    const f = fixture([]);
    const store = {
      ...f.services.chats,
      async acquireRun(_id: string, token: string, expiresAt: string) {
        if (f.chat().runLease) return false;
        f.chat().runLease = { token, expiresAt };
        return true;
      },
      async renewRun() {
        return true;
      },
      async releaseRun() {
        delete f.chat().runLease;
      },
    };
    await withChatRun(store, 'chat', async () => {
      const before = structuredClone(f.chat());
      await expect(withChatRun(store, 'chat', async () => {})).rejects.toThrow(
        'already processing',
      );
      const results = await Promise.all([
        readConversationStatus(store, 'chat'),
        readConversationStatus(store, 'chat'),
      ]);
      expect(results[0]).toEqual(results[1]);
      expect(results[0].chat).toEqual(before);
      expect(f.chat()).toEqual(before);
    });
  });
  test('legacy previews stay stable until a decision persists their migration', async () => {
    const legacy = {
      pendingTools: [
        { name: 'update_note', args: { noteId: 'note', title: 'First' } },
        { name: 'update_note', args: { noteId: 'note', title: 'Second' } },
      ],
    };
    const f = fixture([answer], legacy);
    const first = await readConversationStatus(f.services.chats, 'chat');
    const reloaded = await readConversationStatus(f.services.chats, 'chat');
    expect(first.approvals).toEqual(reloaded.approvals);
    expect(first.approvals.map((item) => item.approvalId)).toEqual([
      'legacy-chat-0',
      'legacy-chat-1',
    ]);
    expect(f.chat().state).toEqual(legacy);
    await f.engine().decide('chat', first.approvals[0].index, false);
    const migrated = await readConversationStatus(f.services.chats, 'chat');
    expect(migrated.approvals).toEqual([reloaded.approvals[1]]);
    await f.engine().decide('chat', reloaded.approvals[1].index, true);
    expect((await readConversationStatus(f.services.chats, 'chat')).ready).toBe(true);
    await f.engine().resume('chat');
    expect(f.writes).toEqual([{ id: 'note', update: { title: 'Second' } }]);
    expect((await readConversationStatus(f.services.chats, 'chat')).ready).toBe(false);
  });
  test('the status exposes an accepted turn after a provider failure', async () => {
    const f = fixture([]);
    f.model.doGenerate = async () => {
      throw new Error('offline');
    };
    await expect(f.engine().send('chat', 'Hello')).rejects.toThrow('offline');
    const status = await f.engine().status('chat');
    expect(status.ready).toBe(true);
    expect(status.chat.messages.map((message) => message.content)).toEqual(['Hello']);
  });
  test('failed initial commit leaves neither message nor pending state', async () => {
    const f = fixture([]);
    f.services.chats.commitRun = async () => {
      throw new Error('database unavailable');
    };
    await expect(f.engine().send('chat', 'Hello')).rejects.toThrow('database unavailable');
    expect(f.chat().messages).toHaveLength(0);
    expect(f.chat().state).toBeUndefined();
  });
  test('ambiguous completed commit is safe to retry without a duplicate message', async () => {
    const f = fixture([answer]);
    const commit = f.services.chats.commitRun;
    let calls = 0;
    f.services.chats.commitRun = async (...args) => {
      const result = await commit(...args);
      if (++calls === 2) throw new Error('response lost');
      return result;
    };
    await expect(f.engine().send('chat', 'Hello')).rejects.toThrow('response lost');
    await f.engine().resume('chat');
    expect(f.chat().messages.map((message) => message.content)).toEqual(['Hello', 'Done.']);
  });
  test('failed final commit adds no partial transcript and retry reuses completed writes', async () => {
    const f = fixture([response([update('first')]), answer, answer]);
    const sent = await f.engine().send('chat', 'Update');
    await f.engine().decide('chat', sent.approvals[0].index, true);
    const commit = f.services.chats.commitRun;
    let fail = true;
    f.services.chats.commitRun = async (...args) => {
      if (fail && args[3]?.some((message) => message.role === 'assistant')) {
        fail = false;
        throw new Error('commit unavailable');
      }
      return commit(...args);
    };
    await expect(f.engine().resume('chat')).rejects.toThrow('commit unavailable');
    expect(f.chat().messages.filter((message) => message.role === 'tool')).toHaveLength(0);
    await f.engine().resume('chat');
    expect(f.writes).toHaveLength(1);
    expect(f.chat().messages.filter((message) => message.role === 'tool')).toHaveLength(1);
    expect(f.chat().messages.filter((message) => message.role === 'assistant')).toHaveLength(1);
  });
  test('a write failure produces a fixed warning even when the model claims success', async () => {
    const f = fixture([response([update('first')]), answer]);
    const sent = await f.engine().send('chat', 'Update');
    await f.engine().decide('chat', sent.approvals[0].index, true);
    f.services.notes.updateNote = async () => {
      throw new Error('connection lost');
    };
    const result = await f.engine().resume('chat');
    expect(result.chat?.messages.at(-1)?.content).toContain('could not be confirmed');
    expect(result.chat?.messages.at(-1)?.content).not.toBe('Done.');
    expect(result.chat?.messages.find((message) => message.role === 'tool')?.content).toContain(
      'connection lost',
    );
    expect((await f.engine().status('chat')).ready).toBe(false);
  });
  test('an old uncertain write does not hide later replies or new approvals', async () => {
    const f = fixture([
      response([update('first')]),
      answer,
      response([
        { type: 'tool-call', toolCallId: 'read', toolName: 'get_note', input: '{"id":"note"}' },
      ]),
      response([{ type: 'text', text: 'Here is the current note.' }]),
      response([update('second')]),
      answer,
    ]);
    const sent = await f.engine().send('chat', 'Update');
    await f.engine().decide('chat', sent.approvals[0].index, true);
    const updateNote = f.services.notes.updateNote;
    f.services.notes.updateNote = async () => {
      throw new Error('connection lost');
    };
    await f.engine().resume('chat');
    f.services.notes.updateNote = updateNote;

    const read = await f.engine().send('chat', 'Read the note so I can check it');
    expect(read.chat?.messages.at(-1)?.content).toBe('Here is the current note.');
    const proposal = await f.engine().send('chat', 'Make this new change');
    expect(proposal.approvals).toHaveLength(1);
    expect(proposal.chat?.messages.at(-1)?.content).toBe('Make this new change');
    await f.engine().decide('chat', proposal.approvals[0].index, true);
    const completed = await f.engine().resume('chat');
    expect(completed.chat?.messages.at(-1)?.content).toBe('Done.');
    expect(f.writes).toEqual([{ id: 'note', update: { title: 'second' } }]);
    expect((f.chat().state as { writes: Record<string, unknown> }).writes.first).toEqual({
      status: 'started',
    });
  });
  test('retrying a failed continuation still warns and never repeats its uncertain write', async () => {
    const f = fixture([response([update('first')])]);
    const sent = await f.engine().send('chat', 'Update');
    await f.engine().decide('chat', sent.approvals[0].index, true);
    let attempted = 0;
    f.services.notes.updateNote = async () => {
      attempted++;
      throw new Error('connection lost');
    };
    f.model.doGenerate = async () => {
      throw new Error('provider unavailable');
    };
    await expect(f.engine().resume('chat')).rejects.toThrow('provider unavailable');
    f.model.doGenerate = async () => answer;
    const retried = await f.engine().resume('chat');
    expect(attempted).toBe(1);
    expect(retried.chat?.messages.at(-1)?.content).toContain('could not be confirmed');
  });
  test('receipt save rejection does not poison subsequent saves', async () => {
    const f = fixture([response([update('first')]), answer]);
    const sent = await f.engine().send('chat', 'Update');
    await f.engine().decide('chat', sent.approvals[0].index, true);
    const commit = f.services.chats.commitRun;
    let fail = true;
    f.services.chats.commitRun = async (...args) => {
      if (fail) {
        fail = false;
        throw new Error('receipt unavailable');
      }
      return commit(...args);
    };
    const result = await f.engine().resume('chat');
    expect(f.writes).toHaveLength(0);
    expect(result.chat?.messages.at(-1)?.content).toContain('could not be confirmed');
  });
  test('same-note writes finish in proposal order even when the first is slower', async () => {
    const f = fixture([response([update('first'), update('second')]), answer]);
    const sent = await f.engine().send('chat', 'Update');
    for (const item of sent.approvals) await f.engine().decide('chat', item.index, true);
    const order: string[] = [];
    f.services.notes.updateNote = async (id, input) => {
      const update = input as { title: string };
      if (update.title === 'first') await new Promise((resolve) => setTimeout(resolve, 15));
      order.push(update.title);
      return { id, ...update };
    };
    await f.engine().resume('chat');
    expect(order).toEqual(['first', 'second']);
  });
  test('lost ownership prevents note mutation and transcript commits', async () => {
    const f = fixture([response([update('first')]), answer]);
    const sent = await f.engine().send('chat', 'Update');
    await f.engine().decide('chat', sent.approvals[0].index, true);
    let checks = 0;
    f.lease.assertOwned = async () => {
      if (++checks >= 2) throw new Error('ownership lost');
    };
    await expect(f.engine().resume('chat')).rejects.toThrow('ownership lost');
    expect(f.writes).toHaveLength(0);
    expect(f.chat().messages).toHaveLength(1);
  });
  test('denied writes produce a persisted denied tool result', async () => {
    const f = fixture([response([update('first')]), answer]);
    const sent = await f.engine().send('chat', 'Update');
    await f.engine().decide('chat', sent.approvals[0].index, false);
    await f.engine().resume('chat');
    expect(f.chat().messages.find((message) => message.role === 'tool')?.content).toContain(
      'execution-denied',
    );
    expect(f.writes).toHaveLength(0);
  });
});
