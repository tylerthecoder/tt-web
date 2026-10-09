import { afterEach, beforeEach, describe, expect, mock, spyOn, test } from 'bun:test';
import type { OAuth2Client as OAuthClient } from 'google-auth-library';
import { createRequire } from 'module';
const serviceRequire = createRequire(import.meta.resolve('tt-services'));
const { OAuth2Client } = serviceRequire(
  'google-auth-library',
) as typeof import('google-auth-library');
import { GoogleService } from 'tt-services/src/connections/google';

const savedCreds = process.env.GOOGLE_CREDS;
const admin = 'admin@example.test';
const attacker = 'attacker@example.test';
const insertOne = mock(async () => ({ insertedId: 'fake-id' }));
const updateOne = mock(async () => ({}));
const findOne = mock(async ({ userId }: { userId: string }) =>
  userId
    ? {
        _id: 'fake-id',
        accessToken: userId,
        refreshToken: 'fake-refresh',
        expiryDate: Date.now() + 60000,
      }
    : null,
);
const db = { getGoogleTokenCollection: () => ({ findOne, insertOne, updateOne }) };
const logger = { info: mock(() => {}), error: mock(() => {}) };

beforeEach(() => {
  process.env.GOOGLE_CREDS = JSON.stringify({
    web: { client_id: 'fake-client', client_secret: 'fake-secret' },
  });
  insertOne.mockClear();
  updateOne.mockClear();
  findOne.mockClear();
  logger.error.mockClear();
});
afterEach(() => {
  mock.restore();
  if (savedCreds === undefined) delete process.env.GOOGLE_CREDS;
  else process.env.GOOGLE_CREDS = savedCreds;
});

function service() {
  return new GoogleService(db as any, logger as any);
}
function exchange(email = admin, verified: unknown = true) {
  const getToken = spyOn(OAuth2Client.prototype, 'getToken').mockImplementation(
    async () =>
      ({
        tokens: {
          access_token: 'fake-access',
          refresh_token: 'fake-refresh',
          expiry_date: Date.now() + 60000,
        },
      }) as any,
  );
  spyOn(OAuth2Client.prototype, 'getTokenInfo').mockResolvedValue({
    email,
    email_verified: verified,
    aud: 'fake-client',
  } as any);
  return getToken;
}

describe('patched Google service', () => {
  test('concurrent users never share credentials (regression for admin identity race)', async () => {
    spyOn(OAuth2Client.prototype, 'getAccessToken').mockImplementation(async function (
      this: OAuthClient,
    ) {
      await Promise.resolve();
      return { token: this.credentials.access_token };
    } as any);
    spyOn(OAuth2Client.prototype, 'getTokenInfo').mockImplementation(
      async (accessToken) => ({ email: accessToken }) as any,
    );
    const google = service();
    const [first, second] = await Promise.all([
      google.getUserInfo(attacker),
      google.getUserInfo(admin),
    ]);
    expect(first.email).toBe(attacker);
    expect(second.email).toBe(admin);
  });
  test('rejects a non-admin before touching the token database', async () => {
    exchange(attacker);
    await expect(
      service().getTokens('fake-code', 'https://example.test/callback', { expectedEmail: admin }),
    ).rejects.toThrow();
    expect(findOne).not.toHaveBeenCalled();
    expect(insertOne).not.toHaveBeenCalled();
    expect(updateOne).not.toHaveBeenCalled();
  });
  test('rejects unverified email', async () => {
    exchange(admin, false);
    await expect(
      service().getTokens('fake-code', 'https://example.test/callback', { expectedEmail: admin }),
    ).rejects.toThrow();
    expect(findOne).not.toHaveBeenCalled();
  });
  test('accepts the provider string true but rejects false or absent verification', async () => {
    exchange(admin, 'true');
    expect(
      (
        await service().getTokens('fake-code', 'https://example.test/callback', {
          expectedEmail: admin,
        })
      ).userId,
    ).toBe(admin);
    for (const value of ['false', false, null]) {
      exchange(admin, value);
      await expect(
        service().getTokens('fake-code', 'https://example.test/callback', { expectedEmail: admin }),
      ).rejects.toThrow();
    }
  });
  test('rejects a token issued to a different OAuth client', async () => {
    exchange();
    spyOn(OAuth2Client.prototype, 'getTokenInfo').mockResolvedValue({
      email: admin,
      email_verified: true,
      aud: 'another-client',
    } as any);
    await expect(
      service().getTokens('fake-code', 'https://example.test/callback', { expectedEmail: admin }),
    ).rejects.toThrow();
    expect(findOne).not.toHaveBeenCalled();
  });
  test('forwards PKCE verifier and stores only the verified identity without logging secrets', async () => {
    const getToken = exchange();
    const log = spyOn(console, 'log').mockImplementation(() => {});
    const token = await service().getTokens('fake-code', 'https://example.test/callback', {
      expectedEmail: admin,
      codeVerifier: 'fake-verifier',
    });
    expect(token.userId).toBe(admin);
    expect(getToken).toHaveBeenCalledWith({
      code: 'fake-code',
      redirect_uri: 'https://example.test/callback',
      codeVerifier: 'fake-verifier',
    });
    expect(log).not.toHaveBeenCalled();
  });
  test('provider errors cannot leak credentials through logger or thrown errors', async () => {
    spyOn(OAuth2Client.prototype, 'getToken').mockImplementation(async () => {
      throw new Error('fake-sensitive-access-token');
    });
    await expect(service().getTokens('fake-code', 'https://example.test/callback')).rejects.toThrow(
      'Google token exchange failed',
    );
    expect(JSON.stringify(logger.error.mock.calls)).not.toContain('fake-sensitive');
  });
});
