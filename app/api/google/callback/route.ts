import { NextRequest, NextResponse } from 'next/server';
import { DatabaseSingleton, TylersThings } from 'tt-services';

export async function GET(req: NextRequest) {
    try {
        const url = new URL(req.url);
        const code = url.searchParams.get('code');
        const error = url.searchParams.get('error');

        if (error) {
            console.error('Google auth error:', error);
            return NextResponse.redirect(new URL('/google/auth?error=' + error, url.origin));
        }

        if (!code) {
            console.error('No code parameter received');
            return NextResponse.redirect(new URL('/google/auth?error=no_code', url.origin));
        }

        // Get the service through TylersThings
        const db = await DatabaseSingleton.getInstance();
        const services = await TylersThings.make(db);

        // Exchange the code for tokens
        const token = await services.google.getTokens(code);

        // Store the userId in a cookie so we can identify the user
        const response = NextResponse.redirect(new URL('/notes', url.origin));
        response.cookies.set('googleUserId', token.userId, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            maxAge: 30 * 24 * 60 * 60, // 30 days
            path: '/',
        });

        return response;
    } catch (error) {
        console.error('Error in Google callback:', error);
        return NextResponse.redirect(new URL('/google/auth?error=callback_failed', req.url));
    }
}