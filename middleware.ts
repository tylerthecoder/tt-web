import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

import { isAuthDisabled } from './app/utils/auth-policy';

function hasSessionCookieFromRequest(request: NextRequest): boolean {
  return Boolean(request.cookies.get('tt_session')?.value);
}

export function middleware(request: NextRequest) {
  if (isAuthDisabled() || hasSessionCookieFromRequest(request)) {
    return NextResponse.next();
  }

  return NextResponse.redirect(new URL('/login', request.url));
}

export const config = {
  matcher: [
    '/panel/:path*',
    '/notes/:path*',
    '/note/:path*',
    '/lists/:path*',
    '/list/:path*',
    '/agent/:path*',
    '/daily/:path*',
    '/jots/:path*',
    '/jot/:path*',
    '/todos/:path*',
    '/time/:path*',
    '/ai/:path*',
    '/b/redwood/:path*',
  ],
};
