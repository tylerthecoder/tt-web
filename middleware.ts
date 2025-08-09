import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
    // Protect panel, notes, and lists routes
    if (!request.nextUrl.pathname.startsWith('/panel') &&
        !request.nextUrl.pathname.startsWith('/notes') &&
        !request.nextUrl.pathname.startsWith('/lists')) {
        return NextResponse.next();
    }

    const googleUserId = request.cookies.get('googleUserId');

    if (!googleUserId || !googleUserId.value) {
        return NextResponse.redirect(new URL('/login', request.url));
    }

    return NextResponse.next();
}

export const config = {
    matcher: ['/panel/:path*', '/notes/:path*', '/lists/:path*']
};