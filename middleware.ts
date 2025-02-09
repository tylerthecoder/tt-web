import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
    // Protect both panel and notes routes
    if (!request.nextUrl.pathname.startsWith('/panel') &&
        !request.nextUrl.pathname.startsWith('/notes')) {
        return NextResponse.next();
    }

    const session = request.cookies.get('session');

    if (!session || session.value !== 'authenticated') {
        return NextResponse.redirect(new URL('/login', request.url));
    }

    return NextResponse.next();
}

export const config = {
    matcher: ['/panel/:path*', '/notes/:path*']
};