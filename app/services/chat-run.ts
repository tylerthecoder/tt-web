import { randomUUID } from 'node:crypto';

interface RunStore {
  acquireRun(id: string, token: string, expiresAt: string): Promise<boolean>;
  renewRun(id: string, token: string, expiresAt: string): Promise<boolean>;
  releaseRun(id: string, token: string): Promise<void>;
}

export interface RunLease {
  token: string;
  signal: AbortSignal;
  assertOwned(): Promise<void>;
}

/** A fenced Mongo lease shared by both chat UIs and all server workers. */
export async function withChatRun<T>(
  store: RunStore,
  id: string,
  operation: (lease: RunLease) => Promise<T>,
  timing = { durationMs: 10 * 60_000, heartbeatMs: 30_000 },
) {
  const token = randomUUID();
  const expiry = () => new Date(Date.now() + timing.durationMs).toISOString();
  if (!(await store.acquireRun(id, token, expiry()))) {
    throw new Error('This chat is already processing a request. Retry when it finishes.');
  }
  const controller = new AbortController();
  let renewal: Promise<void> | undefined;
  const assertOwned = async () => {
    controller.signal.throwIfAborted();
    // Share overlapping heartbeat and mutation checks rather than racing renewals.
    if (!renewal) {
      renewal = (async () => {
        try {
          if (!(await store.renewRun(id, token, expiry()))) {
            throw new Error('Chat ownership was lost. Reload before continuing.');
          }
        } catch (error) {
          controller.abort(error);
          throw error;
        }
      })().finally(() => {
        renewal = undefined;
      });
    }
    await renewal;
    controller.signal.throwIfAborted();
  };
  const heartbeat = setInterval(() => {
    // assertOwned records the failure and aborts the in-flight model call.
    void assertOwned().catch(() => undefined);
  }, timing.heartbeatMs);
  try {
    const result = await operation({ token, signal: controller.signal, assertOwned });
    controller.signal.throwIfAborted();
    return result;
  } finally {
    clearInterval(heartbeat);
    await renewal?.catch(() => undefined);
    await store.releaseRun(id, token);
  }
}
