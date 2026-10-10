import { NextRequest, NextResponse } from 'next/server';

import {
  createOAuthAttempt,
  isLoginOrigin,
  OAUTH_TTL_SECONDS,
  oauthCookieName,
  privateAuthResponse,
} from '@/utils/oauth';
import { getTT } from '@/utils/utils';

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  if (!isLoginOrigin(url)) {
    return privateAuthResponse(
      NextResponse.json(
        { error: 'Login is only available on the production site or localhost.' },
        { status: 403 },
      ),
    );
  }
  try {
    if (!process.env.ADMIN_EMAIL?.trim()) throw new Error('Admin email is not configured');
    const tt = await getTT();
    const attempt = createOAuthAttempt();
    const authUrl = new URL(
      tt.google.getAuthUrl(`${url.origin}/api/google/callback`, attempt.state),
    );
    authUrl.searchParams.set('code_challenge', attempt.challenge);
    authUrl.searchParams.set('code_challenge_method', 'S256');
    const response = NextResponse.redirect(authUrl);
    response.cookies.set(oauthCookieName(), attempt.cookie, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: OAUTH_TTL_SECONDS,
      path: '/',
    });
    return privateAuthResponse(response);
  } catch {
    console.error('Failed to initiate Google authentication');
    return privateAuthResponse(
      NextResponse.json({ error: 'Failed to initiate Google authentication' }, { status: 500 }),
    );
  }
}
