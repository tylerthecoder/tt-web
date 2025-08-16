import { cookies } from 'next/headers';
import { getTT } from '@/utils/utils';
import { createHmac } from 'crypto';
import { SessionRecord } from 'tt-services';


export function isLocalhost(): boolean {
    // Check if we're running on localhost
    return process.env.NODE_ENV === 'development' ||
        process.env.VERCEL_URL?.includes('localhost') ||
        process.env.HOST?.includes('localhost') ||
        typeof window !== 'undefined' && window.location.hostname === 'localhost';
}

export function isAuthDisabled(): boolean {
    // Auth is disabled on localhost by default, unless FORCE_AUTH_LOCALLY is set to 'true'
    if (isLocalhost()) {
        return process.env.FORCE_AUTH_LOCALLY !== 'true';
    }
    return false;
}

export async function getSession(): Promise<SessionRecord | null> {
    if (isAuthDisabled()) {
        return null;
    }

    const cookieStore = await cookies();
    const session = cookieStore.get('tt_session');
    if (!session?.value) return null;
    const tt = await getTT();
    const record = await tt.sessions.getSession(session.value);

    if (!record) {
        return null;
    }

    // If the session is expired, delete it
    if (record.expiresAt < new Date()) {
        console.log('Session expired, deleting');
        await tt.sessions.deleteSession(session.value);
        return null;
    }

    return record;
}

export async function getIsLoggedIn(): Promise<boolean> {
    if (isAuthDisabled()) {
        return true;
    }
    const session = await getSession();
    const adminEmail = process.env.ADMIN_EMAIL;
    return session?.userEmail === adminEmail;
}

export async function getGoogleUserId(): Promise<string | null> {
    const session = await getSession();
    return session?.userId ?? null;
}

export async function requireAuth(): Promise<void> {
    if (isAuthDisabled()) {
        return;
    }

    const session = await getSession();

    if (!session) {
        throw new Error('Authentication required');
    }
}

export function isPreviewHost(hostname: string): boolean {
    return /^[a-zA-Z0-9-]+-tyler-tracys-projects\.vercel\.app$/.test(hostname);
}

export function isPreviewOrigin(origin: string): boolean {
    try {
        const u = new URL(origin);
        return isPreviewHost(u.hostname);
    } catch {
        return false;
    }
}

export function signSessionHandoff(sessionId: string, ts: string): string {
    const secret = process.env.AUTH_SIGNING_SECRET || '';
    if (!secret) return '';
    return createHmac('sha256', secret).update(`${sessionId}|${ts}`).digest('base64url');
}

export function verifySessionHandoff(sessionId: string, ts: string, sig: string | null | undefined): { ok: boolean; reason?: string } {
    const secret = process.env.AUTH_SIGNING_SECRET || '';
    if (!secret) return { ok: true };
    try {
        const expected = createHmac('sha256', secret).update(`${sessionId}|${ts}`).digest('base64url');
        if (expected !== sig) return { ok: false, reason: 'invalid_signature' };
        const tsNum = parseInt(ts, 10);
        if (!Number.isFinite(tsNum)) return { ok: false, reason: 'invalid_ts' };
        if (Math.abs(Date.now() - tsNum) > 5 * 60 * 1000) return { ok: false, reason: 'expired' };
        return { ok: true };
    } catch {
        return { ok: false, reason: 'signature_error' };
    }
}

export async function isAuthenticated(): Promise<boolean> {
    try {
        await requireAuth();
        return true;
    } catch {
        return false;
    }
}

export async function logout(): Promise<void> {
    try {
        const cookieStore = await cookies();
        const session = cookieStore.get('tt_session');
        if (session?.value) {
            const tt = await getTT();
            await tt.sessions.deleteSession(session.value);
        }
        cookieStore.delete('tt_session');
    } catch (error) {
        console.error('Error during logout:', error);
    }
}