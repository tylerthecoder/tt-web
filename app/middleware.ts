import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { cookies } from 'next/headers';

async function hasSessionCookie(): Promise<boolean> {
    const cookieStore = await cookies();
    return cookieStore.get('tt_session') !== null;
}

export async function middleware(request: NextRequest) {
    // Protect panel, notes, and lists routes
    if (!request.nextUrl.pathname.startsWith('/panel') &&
        !request.nextUrl.pathname.startsWith('/notes') &&
        !request.nextUrl.pathname.startsWith('/lists')) {
        return NextResponse.next();
    }

    if (!await hasSessionCookie()) {
        return NextResponse.redirect(new URL('/login', request.url));
    }

    return NextResponse.next();
}

export const config = {
    matcher: ['/panel/:path*', '/notes/:path*', '/lists/:path*']
};