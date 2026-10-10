import { createHash, randomBytes, timingSafeEqual } from 'crypto';
import { NextResponse } from 'next/server';

export const OAUTH_TTL_SECONDS = 5 * 60;

export function oauthCookieName(): string {
  return process.env.NODE_ENV === 'production' ? '__Host-tt_oauth' : 'tt_oauth';
}

export function isLoginOrigin(url: URL): boolean {
  if (process.env.VERCEL_ENV === 'preview') return false;
  if (url.origin === 'https://www.tylertracy.com' || url.origin === 'https://tylertracy.com') {
    return true;
  }
  return (
    process.env.NODE_ENV === 'development' &&
    !process.env.VERCEL &&
    url.protocol === 'http:' &&
    (url.hostname === 'localhost' || url.hostname === '127.0.0.1')
  );
}

export function createOAuthAttempt() {
  const state = randomBytes(32).toString('base64url');
  const verifier = randomBytes(32).toString('base64url');
  return {
    state,
    challenge: createHash('sha256').update(verifier).digest('base64url'),
    cookie: Buffer.from(JSON.stringify({ state, verifier, createdAt: Date.now() })).toString(
      'base64url',
    ),
  };
}

export function validateOAuthAttempt(
  state: string | null,
  cookie: string | undefined,
): string | null {
  if (!state || !cookie || state.length !== 43 || cookie.length > 512) return null;
  try {
    const attempt = JSON.parse(Buffer.from(cookie, 'base64url').toString('utf8'));
    if (
      typeof attempt.state !== 'string' ||
      !/^[A-Za-z0-9_-]{43}$/.test(attempt.state) ||
      typeof attempt.verifier !== 'string' ||
      !/^[A-Za-z0-9_-]{43}$/.test(attempt.verifier) ||
      !Number.isSafeInteger(attempt.createdAt) ||
      Date.now() < attempt.createdAt ||
      Date.now() - attempt.createdAt > OAUTH_TTL_SECONDS * 1000
    ) {
      return null;
    }
    const supplied = Buffer.from(state);
    const expected = Buffer.from(attempt.state);
    return supplied.length === expected.length &&
      timingSafeEqual(new Uint8Array(supplied), new Uint8Array(expected))
      ? attempt.verifier
      : null;
  } catch {
    return null;
  }
}

export function privateAuthResponse(response: NextResponse): NextResponse {
  response.headers.set('Cache-Control', 'no-store');
  response.headers.set('Referrer-Policy', 'no-referrer');
  return response;
}

export function clearOAuthAttempt(response: NextResponse): NextResponse {
  response.cookies.set(oauthCookieName(), '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 0,
  });
  return privateAuthResponse(response);
}
