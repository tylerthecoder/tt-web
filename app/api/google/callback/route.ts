import { NextRequest, NextResponse } from 'next/server';
import { getTT } from '@/utils/utils';
import { isPreviewOrigin, signSessionHandoff } from '@/utils/auth';

export async function GET(req: NextRequest) {
    try {
        const url = new URL(req.url);
        const code = url.searchParams.get('code');
        const error = url.searchParams.get('error');
        const state = url.searchParams.get('state');

        if (error) {
            console.error('Google auth error:', error);
            return NextResponse.redirect(new URL('/login?error=' + error, url.origin));
        }

        if (!code) {
            console.error('No code parameter received');
            return NextResponse.redirect(new URL('/login?error=no_code', url.origin));
        }

        const tt = await getTT();

        const redirectUrl = `${url.origin}/api/google/callback`;

        // Exchange the code for tokens
        const token = await tt.google.getTokens(code, redirectUrl);

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

        // Create DB-backed session
        const session = await tt.sessions.createSession({
            userId: token.userId,
            userEmail,
            userAgent: req.headers.get('user-agent') || undefined,
            ip: req.headers.get('x-forwarded-for') || undefined,
        });


        // If state contains a preview domain, redirect back there via a bridge endpoint
        if (state) {
            try {
                const decoded = JSON.parse(Buffer.from(state, 'base64url').toString('utf8')) as { returnOrigin?: string };
                const returnOrigin = decoded?.returnOrigin;
                if (!returnOrigin) {
                    console.error('No returnOrigin in state');
                    return NextResponse.redirect(new URL('/login?error=no_return_origin', url.origin));
                }
                if (!isPreviewOrigin(returnOrigin)) {
                    console.error('Invalid returnOrigin in state');
                    return NextResponse.redirect(new URL('/login?error=invalid_return_origin', url.origin));
                }

                // Send the user back to the preview environment with signed params
                const bridgeUrl = new URL('/api/google/bridge', returnOrigin);

                const ts = Date.now().toString();
                const sid = session.sessionId;
                const sig = signSessionHandoff(sid, ts);
                bridgeUrl.searchParams.set('sid', sid);
                bridgeUrl.searchParams.set('ts', ts);
                bridgeUrl.searchParams.set('sig', sig);

                return NextResponse.redirect(bridgeUrl);

            } catch (e) {
                console.warn('Failed to parse state:', e);
            }
        }

        // Otherwise, set opaque cookie on prod and redirect to panel
        const finalRedirect = new URL('/panel', url.origin);
        const response = NextResponse.redirect(finalRedirect);
        response.cookies.set('tt_session', session.sessionId, {
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