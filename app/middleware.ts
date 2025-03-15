import { NextRequest, NextResponse } from 'next/server';

export function middleware(request: NextRequest) {
    // Only apply to Google Docs page
    if (request.nextUrl.pathname === '/google/docs') {
        // Check if the user has the googleUserId cookie
        const googleUserId = request.cookies.get('googleUserId')?.value;

        console.log("REQUEST COOKIES", request.cookies);

        if (!googleUserId) {
            // Redirect to the auth page if not authenticated
            const url = request.nextUrl.clone();
            url.pathname = '/google/auth';
            return NextResponse.redirect(url);
        }
    }

    return NextResponse.next();
}

export const config = {
    matcher: ['/google/docs']
};