import { NextRequest, NextResponse } from 'next/server';
import { DatabaseSingleton, TylersThings } from 'tt-services';

export async function GET(req: NextRequest) {
    try {
        const url = new URL(req.url);
        const code = url.searchParams.get('code');
        const error = url.searchParams.get('error');

        if (error) {
            console.error('Google auth error:', error);
            return NextResponse.redirect(new URL('/login?error=' + error, url.origin));
        }

        if (!code) {
            console.error('No code parameter received');
            return NextResponse.redirect(new URL('/login?error=no_code', url.origin));
        }

        // Get the service through TylersThings
        const db = await DatabaseSingleton.getInstance();
        const services = await TylersThings.make(db);

        // Exchange the code for tokens
        const token = await services.google.getTokens(code);

        // Store both the googleUserId and set session as authenticated
        const response = NextResponse.redirect(new URL('/panel', url.origin));
        
        // Set the Google userId cookie for Google services
        response.cookies.set('googleUserId', token.userId, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            maxAge: 30 * 24 * 60 * 60, // 30 days
            path: '/',
        });
        
        // Set the session cookie for general authentication
        response.cookies.set('session', 'authenticated', {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 30 * 24 * 60 * 60, // 30 days
            path: '/',
        });

        return response;
    } catch (error) {
        console.error('Error in Google callback:', error);
        return NextResponse.redirect(new URL('/login?error=callback_failed', req.url));
    }
}