import { describe, expect, test } from 'bun:test';
import { withChatRun } from '../../app/services/chat-run';

function storeFixture() {
  let held: { token: string; expiresAt: string } | undefined;
  let renewals = 0;
  const store = {
    async acquireRun(_id: string, token: string, expiresAt: string) {
      if (held && held.expiresAt > new Date().toISOString()) return false;
      held = { token, expiresAt };
      return true;
    },
    async renewRun(_id: string, token: string, expiresAt: string) {
      renewals++;
      if (!held || held.token !== token || held.expiresAt <= new Date().toISOString())
        return false;
      held.expiresAt = expiresAt;
      return true;
    },
    async releaseRun(_id: string, token: string) {
      if (held?.token === token) held = undefined;
    },
  };
  return {
    store,
    renewals: () => renewals,
    held: () => held,
    steal: () => {
      held = { token: 'new-worker', expiresAt: new Date(Date.now() + 60_000).toISOString() };
    },
  };
}

const pause = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

describe('chat run lease', () => {
  test('separate callers cannot run the same chat concurrently', async () => {
    const f = storeFixture();
    let entered!: () => void;
    const started = new Promise<void>((resolve) => {
      entered = resolve;
    });
    let finish!: () => void;
    const gate = new Promise<void>((resolve) => {
      finish = resolve;
    });
    const first = withChatRun(f.store, 'chat', async () => {
      entered();
      await gate;
    });
    await started;
    await expect(withChatRun(f.store, 'chat', async () => {})).rejects.toThrow(
      'already processing',
    );
    finish();
    await first;
    expect(f.held()).toBeUndefined();
    await withChatRun(f.store, 'chat', async (lease) => {
      await lease.assertOwned();
    });
  });

  test('heartbeat renews during work and stops after release', async () => {
    const f = storeFixture();
    await withChatRun(
      f.store,
      'chat',
      async () => {
        await pause(25);
      },
      { durationMs: 500, heartbeatMs: 5 },
    );
    expect(f.renewals()).toBeGreaterThan(0);
    const count = f.renewals();
    await pause(15);
    expect(f.renewals()).toBe(count);
  });

  test('ownership loss aborts work and stale release preserves the new owner', async () => {
    const f = storeFixture();
    await expect(
      withChatRun(f.store, 'chat', async (lease) => {
        f.steal();
        await expect(lease.assertOwned()).rejects.toThrow('ownership was lost');
        expect(lease.signal.aborted).toBe(true);
        // Even an operation that swallows its abort cannot report success.
        return 'incorrect success';
      }),
    ).rejects.toThrow('ownership was lost');
    expect(f.held()?.token).toBe('new-worker');
  });

  test('heartbeat aborts a blocked model call without waiting for its next write', async () => {
    const f = storeFixture();
    await expect(
      withChatRun(
        f.store,
        'chat',
        async (lease) => {
          f.steal();
          await new Promise<void>((_resolve, reject) => {
            lease.signal.addEventListener('abort', () => reject(lease.signal.reason), {
              once: true,
            });
          });
        },
        { durationMs: 500, heartbeatMs: 5 },
      ),
    ).rejects.toThrow('ownership was lost');
  });

  test('renewal database errors abort the operation and release its own lease', async () => {
    const f = storeFixture();
    f.store.renewRun = async () => {
      throw new Error('database offline');
    };
    await expect(withChatRun(f.store, 'chat', (lease) => lease.assertOwned())).rejects.toThrow(
      'database offline',
    );
    expect(f.held()).toBeUndefined();
  });
});
