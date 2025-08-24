import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

function hasSessionCookieFromRequest(req: NextRequest): boolean {
  const cookie = req.cookies.get('tt_session');
  return cookie !== undefined && cookie !== null;
}

const PANEL_PATHS = ['/panel', '/notes', '/lists', '/agent', '/daily', '/jot'];

export async function middleware(request: NextRequest) {
  if (!PANEL_PATHS.some((path) => request.nextUrl.pathname.startsWith(path))) {
    return NextResponse.next();
  }

  if (!hasSessionCookieFromRequest(request)) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/panel/:path*', '/notes/:path*', '/lists/:path*'],
};
