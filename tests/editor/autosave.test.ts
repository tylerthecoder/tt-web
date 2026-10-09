import { describe, expect, test } from 'bun:test';
import { NoteAutosave } from '../../app/components/note-editor/autosave';

function deferred() {
  let resolve!: () => void;
  let reject!: () => void;
  const promise = new Promise<void>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}

describe('ordered note autosave', () => {
  test('flushes the last characters immediately on close', async () => {
    const writes: string[] = [];
    let draft: string | null = null;
    const saver = new NoteAutosave(
      async (content) => {
        writes.push(content);
      },
      (content) => {
        draft = content;
      },
    );
    saver.update('last character');
    expect(draft as string | null).toBe('last character');
    expect(saver.status).toBe('pending');
    expect(await saver.flush()).toBe(true);
    expect(writes).toEqual(['last character']);
    expect(draft as string | null).toBeNull();
    expect(saver.status).toBe('saved');
  });
  test('never sends concurrent writes; coalesces newer edits', async () => {
    const first = deferred();
    const writes: string[] = [];
    const saver = new NoteAutosave(
      async (content) => {
        writes.push(content);
        if (writes.length === 1) await first.promise;
      },
      () => {},
    );
    saver.update('old');
    const flushed = saver.flush();
    await Promise.resolve();
    saver.update('middle');
    saver.update('newest');
    expect(saver.flush()).toBe(flushed);
    expect(writes).toEqual(['old']);
    first.resolve();
    await flushed;
    expect(writes).toEqual(['old', 'newest']);
    expect(saver.status).toBe('saved');
  });
  test('failed writes retain the newest draft and retry without claiming saved', async () => {
    const first = deferred();
    let attempts = 0;
    let draft: string | null = null;
    const writes: string[] = [];
    const saver = new NoteAutosave(
      async (content) => {
        writes.push(content);
        if (++attempts === 1) await first.promise;
      },
      (content) => {
        draft = content;
      },
    );
    saver.update('old');
    const flushed = saver.flush();
    await Promise.resolve();
    saver.update('newer');
    first.reject();
    expect(await flushed).toBe(false);
    expect(saver.status).toBe('error');
    expect(draft as string | null).toBe('newer');
    expect(await saver.flush()).toBe(true);
    expect(writes).toEqual(['old', 'newer']);
    expect(draft as string | null).toBeNull();
  });
  test('storage failure does not stop server saving', async () => {
    const writes: string[] = [];
    const saver = new NoteAutosave(
      async (content) => {
        writes.push(content);
      },
      () => {
        throw new Error('quota');
      },
    );
    saver.update('keep this');
    expect(saver.recoveryAvailable).toBe(false);
    expect(await saver.flush()).toBe(true);
    expect(writes).toEqual(['keep this']);
  });
});
