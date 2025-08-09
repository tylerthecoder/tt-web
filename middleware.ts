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

    // Check for authentication
    const googleUserId = request.cookies.get('googleUserId');
    const userEmail = request.cookies.get('userEmail');
    const adminEmail = process.env.ADMIN_EMAIL;

    if (!googleUserId || !googleUserId.value || !userEmail || !userEmail.value) {
        return NextResponse.redirect(new URL('/login', request.url));
    }

    // Validate admin email
    if (adminEmail && userEmail.value !== adminEmail) {
        // Clear invalid cookies and redirect to login
        const response = NextResponse.redirect(new URL('/login?error=unauthorized_email', request.url));
        response.cookies.delete('googleUserId');
        response.cookies.delete('userEmail');
        return response;
    }

    return NextResponse.next();
}

export const config = {
    matcher: ['/panel/:path*', '/notes/:path*', '/lists/:path*']
};