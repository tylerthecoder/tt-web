import { createHmac } from 'node:crypto';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import type { SessionRecord } from 'tt-services';

import { getTT } from '@/utils/utils';

export function isAuthDisabled(): boolean {
  const isAuthDisabled =
    process.env.AUTH_DISABLED === 'true' || process.env.NODE_ENV === 'development';
  if (isAuthDisabled) {
    console.log('AUTH DISABLED');
  }
  return isAuthDisabled;
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
    redirect('/login');
  }

  // Enforce admin email restriction for all authenticated access
  const adminEmail = process.env.ADMIN_EMAIL;
  if (adminEmail && session.userEmail !== adminEmail) {
    redirect('/login?error=unauthorized_email');
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

export function verifySessionHandoff(
  sessionId: string,
  ts: string,
  sig: string | null | undefined,
): { ok: boolean; reason?: string } {
  const secret = process.env.AUTH_SIGNING_SECRET || '';
  if (!secret) return { ok: true };
  try {
    const expected = createHmac('sha256', secret)
      .update(`${sessionId}|${ts}`)
      .digest('base64url');
    if (expected !== sig) return { ok: false, reason: 'invalid_signature' };
    const tsNum = parseInt(ts, 10);
    if (!Number.isFinite(tsNum)) return { ok: false, reason: 'invalid_ts' };
    if (Math.abs(Date.now() - tsNum) > 5 * 60 * 1000) return { ok: false, reason: 'expired' };
    return { ok: true };
  } catch {
    return { ok: false, reason: 'signature_error' };
  }
}
