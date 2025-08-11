import { NextRequest, NextResponse } from 'next/server';
import { getTT } from '@/utils/utils';

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

        const tt = await getTT();

        // Exchange the code for tokens
        const token = await tt.google.getTokens(code);

        // Get user info to check email
        const userInfo = await tt.google.getUserInfo(token.userId);
        const userEmail = userInfo?.email;

        // Check if this is the admin email
        const adminEmail = process.env.ADMIN_EMAIL;
        if (!adminEmail) {
            console.error('ADMIN_EMAIL environment variable not set');
            return NextResponse.redirect(new URL('/login?error=admin_email_not_configured', url.origin));
        }

        if (!userEmail) {
            console.error('Could not get user email from Google');
            return NextResponse.redirect(new URL('/login?error=no_email', url.origin));
        }

        if (userEmail !== adminEmail) {
            console.error(`Unauthorized email attempted login: ${userEmail}`);
            return NextResponse.redirect(new URL('/login?error=unauthorized_email', url.origin));
        }

        // Store both userId and email in cookies
        const response = NextResponse.redirect(new URL('/panel', url.origin));

        response.cookies.set('googleUserId', token.userId, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 30 * 24 * 60 * 60, // 30 days
            path: '/',
        });

        response.cookies.set('userEmail', userEmail, {
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