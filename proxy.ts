import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

function hasSessionCookieFromRequest(request: NextRequest): boolean {
  return request.cookies.has('tt_session');
}

function isAuthDisabled(): boolean {
  return process.env.AUTH_DISABLED === 'true' || process.env.NODE_ENV === 'development';
}

export function proxy(request: NextRequest) {
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
