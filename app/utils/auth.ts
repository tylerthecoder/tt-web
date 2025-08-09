import { cookies } from 'next/headers';

function isLocalhost(): boolean {
    // Check if we're running on localhost
    return process.env.NODE_ENV === 'development' || 
           process.env.VERCEL_URL?.includes('localhost') ||
           process.env.HOST?.includes('localhost') ||
           typeof window !== 'undefined' && window.location.hostname === 'localhost';
}

function isAuthDisabled(): boolean {
    // Auth is disabled on localhost by default, unless FORCE_AUTH_LOCALLY is set to 'true'
    if (isLocalhost()) {
        return process.env.FORCE_AUTH_LOCALLY !== 'true';
    }
    return false;
}

export async function getAuthenticatedUserEmail(): Promise<string | null> {
    try {
        // If auth is disabled (localhost), return a mock email
        if (isAuthDisabled()) {
            return process.env.ADMIN_EMAIL || 'admin@localhost';
        }

        const cookieStore = await cookies();
        const userEmail = cookieStore.get('userEmail');
        return userEmail?.value || null;
    } catch (error) {
        console.error('Error getting authenticated user email:', error);
        return null;
    }
}

export async function getAuthenticatedUserId(): Promise<string | null> {
    try {
        // If auth is disabled (localhost), return a mock ID
        if (isAuthDisabled()) {
            return 'localhost-user';
        }

        const cookieStore = await cookies();
        const googleUserId = cookieStore.get('googleUserId');
        return googleUserId?.value || null;
    } catch (error) {
        console.error('Error getting authenticated user ID:', error);
        return null;
    }
}

export async function requireAuth(): Promise<string> {
    // If auth is disabled (localhost), return mock ID
    if (isAuthDisabled()) {
        return 'localhost-user';
    }

    const userEmail = await getAuthenticatedUserEmail();
    const adminEmail = process.env.ADMIN_EMAIL;

    if (!adminEmail) {
        throw new Error('ADMIN_EMAIL environment variable not set');
    }

    if (!userEmail) {
        throw new Error('Authentication required');
    }

    if (userEmail !== adminEmail) {
        throw new Error('Access denied: unauthorized email');
    }

    // Return the userId for backwards compatibility
    const userId = await getAuthenticatedUserId();
    if (!userId) {
        throw new Error('Authentication required');
    }

    return userId;
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
        cookieStore.delete('googleUserId');
        cookieStore.delete('userEmail');
    } catch (error) {
        console.error('Error during logout:', error);
    }
}