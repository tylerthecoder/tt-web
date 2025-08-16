import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

function isLocalhost(request: NextRequest): boolean {
    // Check if we're running on localhost
    return process.env.NODE_ENV === 'development' ||
        request.nextUrl.hostname === 'localhost' ||
        request.nextUrl.hostname === '127.0.0.1';
}

function isAuthDisabled(request: NextRequest): boolean {
    // Auth is disabled on localhost by default, unless FORCE_AUTH_LOCALLY is set to 'true'
    if (isLocalhost(request)) {
        return process.env.FORCE_AUTH_LOCALLY !== 'true';
    }
    return false;
}

export async function middleware(request: NextRequest) {
    // Protect panel, notes, and lists routes
    if (!request.nextUrl.pathname.startsWith('/panel') &&
        !request.nextUrl.pathname.startsWith('/notes') &&
        !request.nextUrl.pathname.startsWith('/lists')) {
        return NextResponse.next();
    }

    // If auth is disabled (localhost), allow access
    if (isAuthDisabled(request)) {
        return NextResponse.next();
    }

    // Check for authentication via opaque session
    const sessionCookie = request.cookies.get('tt_session');
    const adminEmail = process.env.ADMIN_EMAIL;

    if (!sessionCookie || !sessionCookie.value) {
        return NextResponse.redirect(new URL('/login', request.url));
    }

    // We cannot validate the session in middleware without a DB call conveniently.
    // Lightweight check: allow the request through. Server routes/pages must validate session before sensitive operations.
    // If you want stricter blocking, add an edge endpoint to validate the signature of a JWT; we're using DB-backed session, so we defer.

    return NextResponse.next();
}

export const config = {
    matcher: ['/panel/:path*', '/notes/:path*', '/lists/:path*']
};