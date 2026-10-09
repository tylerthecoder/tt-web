import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { SessionRecord } from 'tt-services';

import { getTT } from '@/utils/utils';

import { isAdminEmail, isAuthDisabled } from './auth-policy';

export { isAuthDisabled } from './auth-policy';

export async function hasSessionCookie(): Promise<boolean> {
  const cookieStore = await cookies();
  return Boolean(cookieStore.get('tt_session')?.value);
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

  // Fail closed for expired or malformed records, including legacy data.
  if (!(record.expiresAt instanceof Date) || !(record.expiresAt.getTime() > Date.now())) {
    return null;
  }

  // GoogleService keys users by email; reject identities mixed by legacy races.
  if (record.userId !== record.userEmail) return null;

  return record;
}

export async function getIsLoggedIn(): Promise<boolean> {
  if (isAuthDisabled()) {
    return true;
  }
  const session = await getSession();
  return isAdminEmail(session?.userEmail);
}

export async function getGoogleUserId(): Promise<string | null> {
  const session = await getSession();
  return session && isAdminEmail(session.userEmail) ? session.userId : null;
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
  if (!isAdminEmail(session.userEmail)) {
    redirect('/login?error=unauthorized_email');
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
