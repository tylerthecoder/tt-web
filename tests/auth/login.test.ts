import { afterEach, beforeEach, describe, expect, mock, spyOn, test } from 'bun:test';
import { createHash } from 'crypto';
import { NextRequest } from 'next/server';

const admin = 'admin@example.test';
const originalEnv = { ...process.env };
let sessionCookie: string | undefined;
const getSession = mock(async (_id: string): Promise<any> => null);
const createSession = mock(async (_data: unknown) => ({
  sessionId: 'fake-new-session',
  expiresAt: new Date(Date.now() + 86400000),
}));
const getTokens = mock(async (..._args: any[]) => ({ userId: admin }));
let notes: any[] = [];
const getTT = mock(async () => ({
  sessions: { getSession, createSession },
  notes: {
    getPublishedNotes: async () => notes,
    getNoteMetadataById: async () => notes[0],
    getNoteById: async () => notes[0],
  },
  google: {
    getAuthUrl: (redirect: string, state: string) =>
      `https://accounts.google.com/o/oauth2/auth?redirect_uri=${encodeURIComponent(redirect)}&state=${state}`,
    getTokens,
  },
}));
mock.module('../../app/utils/utils', () => ({ getTT }));
mock.module('next/headers', () => ({
  cookies: async () => ({ get: () => (sessionCookie ? { value: sessionCookie } : undefined) }),
}));
const auth = await import('../../app/utils/auth');
const policy = await import('../../app/utils/auth-policy');
const oauth = await import('../../app/utils/oauth');
const start = (await import('../../app/api/google/auth/route')).GET;
const callback = (await import('../../app/api/google/callback/route')).GET;
const bridge = (await import('../../app/api/google/bridge/route')).GET;

beforeEach(() => {
  Object.assign(process.env, { NODE_ENV: 'production' });
  process.env.ADMIN_EMAIL = admin;
  delete process.env.AUTH_DISABLED;
  delete process.env.VERCEL;
  delete process.env.VERCEL_ENV;
  sessionCookie = undefined;
  getSession.mockReset();
  getSession.mockResolvedValue(null);
  getTokens.mockReset();
  getTokens.mockResolvedValue({ userId: admin });
  getTT.mockClear();
  createSession.mockClear();
});
afterEach(() => {
  mock.restore();
  for (const key of ['NODE_ENV', 'ADMIN_EMAIL', 'AUTH_DISABLED', 'VERCEL', 'VERCEL_ENV']) {
    if (originalEnv[key] === undefined) delete process.env[key];
    else process.env[key] = originalEnv[key];
  }
});
const req = (path: string, cookie?: string) =>
  new NextRequest(`https://www.tylertracy.com${path}`, {
    headers: cookie ? { cookie: `${oauth.oauthCookieName()}=${cookie}` } : {},
  });
const callbackReq = (attempt = oauth.createOAuthAttempt()) =>
  req(`/api/google/callback?code=fake-code&state=${attempt.state}`, attempt.cookie);

function record(overrides = {}) {
  return { userId: admin, userEmail: admin, expiresAt: new Date(Date.now() + 60000), ...overrides };
}

describe('authorization fails closed', () => {
  test('missing admin configuration does not log anonymous users in', async () => {
    delete process.env.ADMIN_EMAIL;
    expect(await auth.getIsLoggedIn()).toBe(false);
    expect(await auth.hasSessionCookie()).toBe(false);
    expect(await auth.isAuthenticated()).toBe(false);
  });
  test('production ignores AUTH_DISABLED; development requires explicit local opt-in', () => {
    process.env.AUTH_DISABLED = 'true';
    expect(policy.isAuthDisabled()).toBe(false);
    Object.assign(process.env, { NODE_ENV: 'development' });
    delete process.env.AUTH_DISABLED;
    expect(policy.isAuthDisabled()).toBe(false);
    process.env.AUTH_DISABLED = 'true';
    expect(policy.isAuthDisabled()).toBe(true);
    process.env.VERCEL = '1';
    expect(policy.isAuthDisabled()).toBe(false);
  });
  test('forged, expired, malformed, non-admin and revoked-admin sessions are rejected', async () => {
    sessionCookie = 'fake-session';
    for (const value of [
      null,
      record({ expiresAt: new Date(0) }),
      record({ expiresAt: new Date('invalid') }),
      record({ expiresAt: '2099-01-01' }),
      record({ userEmail: 'other@example.test' }),
    ]) {
      getSession.mockResolvedValue(value);
      expect(await auth.getIsLoggedIn()).toBe(false);
      expect(await auth.isAuthenticated()).toBe(false);
      expect(await auth.getGoogleUserId()).toBe(null);
    }
    getSession.mockResolvedValue(record());
    delete process.env.ADMIN_EMAIL;
    expect(await auth.isAuthenticated()).toBe(false);
    expect(await auth.getGoogleUserId()).toBe(null);
  });
  test('valid administrator session retains access', async () => {
    sessionCookie = 'fake-session';
    getSession.mockResolvedValue(record());
    expect(await auth.isAuthenticated()).toBe(true);
    expect(await auth.getGoogleUserId()).toBe(admin);
  });
});

describe('OAuth browser binding', () => {
  test('start sets fresh protected cookie and S256 challenge', async () => {
    const response = await start(req('/api/google/auth'));
    const cookie = response.cookies.get(oauth.oauthCookieName())!;
    const url = new URL(response.headers.get('location')!);
    const verifier = oauth.validateOAuthAttempt(url.searchParams.get('state'), cookie.value)!;
    expect(verifier).toBeTruthy();
    expect(cookie.httpOnly).toBe(true);
    expect(cookie.secure).toBe(true);
    expect(cookie.sameSite).toBe('lax');
    expect(cookie.maxAge).toBe(300);
    expect(url.searchParams.get('code_challenge_method')).toBe('S256');
    expect(url.searchParams.get('code_challenge')).toBe(
      createHash('sha256').update(verifier).digest('base64url'),
    );
    expect(response.headers.get('cache-control')).toBe('no-store');
  });
  test('callback rejects absent, mismatched, malformed and expired state before any service call', async () => {
    const attempt = oauth.createOAuthAttempt();
    const data = JSON.parse(Buffer.from(attempt.cookie, 'base64url').toString());
    const encoded = (value: unknown) => Buffer.from(JSON.stringify(value)).toString('base64url');
    const cases = [
      req('/api/google/callback?code=fake'),
      req(`/api/google/callback?code=fake&state=${attempt.state}`),
      req(`/api/google/callback?code=fake&state=${'x'.repeat(43)}`, attempt.cookie),
      req(`/api/google/callback?code=fake&state=${attempt.state}`, 'malformed'),
      req(
        `/api/google/callback?code=fake&state=${attempt.state}`,
        encoded({ ...data, createdAt: Date.now() - 301000 }),
      ),
      req(
        `/api/google/callback?code=fake&state=${attempt.state}`,
        encoded({ ...data, createdAt: Date.now() + 60000 }),
      ),
    ];
    for (const request of cases) {
      const response = await callback(request);
      expect(response.headers.get('location')).toContain('invalid_state');
      expect(response.cookies.get(oauth.oauthCookieName())?.maxAge).toBe(0);
      expect(response.cookies.get('tt_session')).toBeUndefined();
    }
    expect(getTT).not.toHaveBeenCalled();
  });
  test('successful callback passes browser verifier and admin restriction, then issues an opaque cookie', async () => {
    const attempt = oauth.createOAuthAttempt();
    const response = await callback(callbackReq(attempt));
    expect(getTokens).toHaveBeenCalledWith(
      'fake-code',
      'https://www.tylertracy.com/api/google/callback',
      {
        expectedEmail: admin,
        codeVerifier: oauth.validateOAuthAttempt(attempt.state, attempt.cookie),
      },
    );
    expect(createSession.mock.calls[0][0]).toMatchObject({ userId: admin, userEmail: admin });
    const cookie = response.cookies.get('tt_session')!;
    expect(cookie.value).toBe('fake-new-session');
    expect(cookie.httpOnly).toBe(true);
    expect(cookie.secure).toBe(true);
    expect(response.headers.get('location')).toBe('https://www.tylertracy.com/panel');
    expect(response.headers.get('location')).not.toContain('fake-new-session');
    expect(response.headers.get('referrer-policy')).toBe('no-referrer');
    expect(response.cookies.get(oauth.oauthCookieName())?.maxAge).toBe(0);
  });
  test('non-admin identity and missing config never issue sessions', async () => {
    getTokens.mockResolvedValue({ userId: 'attacker@example.test' });
    expect((await callback(callbackReq())).headers.get('location')).toContain('unauthorized_email');
    delete process.env.ADMIN_EMAIL;
    expect((await callback(callbackReq())).headers.get('location')).toContain(
      'admin_email_not_configured',
    );
    expect(createSession).not.toHaveBeenCalled();
  });
  test('provider errors are not logged and OAuth errors clear the cookie', async () => {
    const log = spyOn(console, 'error').mockImplementation(() => {});
    getTokens.mockRejectedValue(new Error('fake-sensitive-token'));
    expect((await callback(callbackReq())).headers.get('location')).toContain('callback_failed');
    expect(JSON.stringify(log.mock.calls)).not.toContain('fake-sensitive-token');
    const attempt = oauth.createOAuthAttempt();
    const response = await callback(
      req(`/api/google/callback?error=denied&state=${attempt.state}`, attempt.cookie),
    );
    expect(response.headers.get('location')).toContain('access_denied');
    expect(response.cookies.get(oauth.oauthCookieName())?.maxAge).toBe(0);
  });
  test('preview and untrusted origins cannot initiate or receive login; legacy bridge is gone', async () => {
    for (const origin of [
      'https://evil.example',
      'https://tt-web-test-tyler-tracys-projects.vercel.app',
      'http://www.tylertracy.com',
      'https://www.tylertracy.com:444',
      'http://localhost:3000',
    ]) {
      expect((await start(new NextRequest(`${origin}/api/google/auth`))).status).toBe(403);
      expect(
        (await callback(new NextRequest(`${origin}/api/google/callback?code=fake`))).headers.get(
          'location',
        ),
      ).toContain('invalid_origin');
    }
    process.env.VERCEL_ENV = 'preview';
    expect((await start(req('/api/google/auth'))).status).toBe(403);
    expect((await bridge()).status).toBe(410);
    expect(getTT).not.toHaveBeenCalled();
  });
});

describe('public data and server actions', () => {
  test('unpublished and deleted notes are never exposed by public blog actions', async () => {
    const blog = await import('../../app/(home)/blog/actions');
    for (const note of [{ published: false }, { published: true, deleted: true }, {}]) {
      notes = [note];
      await expect(blog.getBlogMetadata('fake-id')).rejects.toThrow();
      await expect(blog.getBlog('fake-id')).rejects.toThrow();
      expect(await blog.getBlogs()).toEqual([]);
    }
    notes = [{ published: true, deleted: false, title: 'Public post', content: 'Public text' }];
    expect((await blog.getBlogMetadata('fake-id')).title).toBe('Public post');
    expect((await blog.getBlog('fake-id')).content).toBe('Public text');
    expect(await blog.getBlogs()).toHaveLength(1);
  });
  test('direct calls to every private exported action reject anonymous requests before database access', async () => {
    const modules = await Promise.all([
      import('../../app/google/docs/actions'),
      import('../../app/(panel)/actions'),
      import('../../app/(panel)/ai/actions'),
      import('../../app/(panel)/agent/actions'),
    ]);
    for (const actions of modules) {
      for (const action of Object.values(actions)) {
        if (typeof action !== 'function') continue;
        await expect((action as Function)('fake-id')).rejects.toThrow();
      }
    }
    expect(getTT).not.toHaveBeenCalled();
  });
  test('old Google sessions with mixed identities cannot authenticate', async () => {
    sessionCookie = 'fake-session';
    getSession.mockResolvedValue(record({ userId: 'attacker@example.test' }));
    expect(await auth.isAuthenticated()).toBe(false);
    expect(await auth.getGoogleUserId()).toBe(null);
  });
});
