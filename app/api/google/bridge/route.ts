import { NextRequest, NextResponse } from 'next/server';
import { getTT } from '@/utils/utils';
import { isPreviewHost, verifySessionHandoff } from '@/utils/auth';

export async function GET(req: NextRequest) {
    const url = new URL(req.url);
    const sid = url.searchParams.get('sid') || '';
    const ts = url.searchParams.get('ts') || '';
    const sig = url.searchParams.get('sig') || '';

    // Validate preview domain to avoid abuse
    const host = url.hostname;
    if (!isPreviewHost(host)) {
        return NextResponse.json({ error: 'invalid_host' }, { status: 400 });
    }

    if (!sid || !ts) {
        return NextResponse.json({ error: 'missing_params' }, { status: 400 });
    }

    const ver = verifySessionHandoff(sid, ts, sig);
    if (!ver.ok) return NextResponse.json({ error: ver.reason || 'invalid' }, { status: 401 });

    // Validate the session exists and is not expired before setting the cookie
    const tt = await getTT();
    const rec = await tt.sessions.getSession(sid);
    if (!rec) {
        return NextResponse.redirect(new URL('/login?error=session_invalid', url.origin));
    }

    const response = NextResponse.redirect(new URL('/panel', url.origin));
    response.cookies.set('tt_session', sid, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 30 * 24 * 60 * 60,
        path: '/',
    });
    return response;
}


