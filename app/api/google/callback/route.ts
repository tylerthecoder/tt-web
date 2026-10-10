import { NextRequest, NextResponse } from 'next/server';

import { isAdminEmail } from '@/utils/auth-policy';
import {
  clearOAuthAttempt,
  isLoginOrigin,
  oauthCookieName,
  validateOAuthAttempt,
} from '@/utils/oauth';
import { getTT } from '@/utils/utils';

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const fail = (reason: string) =>
    clearOAuthAttempt(NextResponse.redirect(new URL(`/login?error=${reason}`, url.origin)));

  if (!isLoginOrigin(url)) return fail('invalid_origin');
  const verifier = validateOAuthAttempt(
    url.searchParams.get('state'),
    req.cookies.get(oauthCookieName())?.value,
  );
  if (!verifier) return fail('invalid_state');
  if (url.searchParams.has('error')) return fail('access_denied');
  const code = url.searchParams.get('code');
  if (!code) return fail('no_code');
  const adminEmail = process.env.ADMIN_EMAIL?.trim();
  if (!adminEmail) return fail('admin_email_not_configured');

  try {
    const tt = await getTT();
    // Authorize this exchange's identity before storing credentials. Never look
    // identity up again through a shared, mutable OAuth client.
    const token = await tt.google.getTokens(code, `${url.origin}/api/google/callback`, {
      expectedEmail: adminEmail,
      codeVerifier: verifier,
    });
    if (!isAdminEmail(token.userId)) return fail('unauthorized_email');

    const session = await tt.sessions.createSession({
      userId: token.userId,
      userEmail: token.userId,
      userAgent: req.headers.get('user-agent') || undefined,
    });
    const response = NextResponse.redirect(new URL('/panel', url.origin));
    response.cookies.set('tt_session', session.sessionId, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      expires: session.expiresAt,
      path: '/',
    });
    return clearOAuthAttempt(response);
  } catch {
    // Provider exceptions can contain codes and credentials.
    console.error('Google authentication callback failed');
    return fail('callback_failed');
  }
}
