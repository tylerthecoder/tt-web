import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl;
    
    // Define public routes that don't require authentication
    const publicRoutes = [
        '/login',
        '/api/google/auth',
        '/api/google/callback',
        '/',
        '/projects',
        '/blog'
    ];
    
    // Check if the current path is a public route
    const isPublicRoute = publicRoutes.some(route => {
        if (route === '/') {
            return pathname === '/';
        }
        return pathname.startsWith(route);
    });
    
    // Skip authentication for public routes
    if (isPublicRoute) {
        return NextResponse.next();
    }
    
    // Check for authentication session
    const session = request.cookies.get('session');
    
    if (!session || session.value !== 'authenticated') {
        return NextResponse.redirect(new URL('/login', request.url));
    }
    
    return NextResponse.next();
}

export const config = {
    matcher: [
        /*
         * Match all request paths except for the ones starting with:
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         * - public files (images, etc.)
         */
        '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
    ]
};