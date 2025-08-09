import { cookies } from 'next/headers';

export async function getAuthenticatedUserId(): Promise<string | null> {
    try {
        const cookieStore = await cookies();
        const googleUserId = cookieStore.get('googleUserId');
        return googleUserId?.value || null;
    } catch (error) {
        console.error('Error getting authenticated user ID:', error);
        return null;
    }
}

export async function requireAuth(): Promise<string> {
    const userId = await getAuthenticatedUserId();
    if (!userId) {
        throw new Error('Authentication required');
    }
    return userId;
}

export async function logout(): Promise<void> {
    try {
        const cookieStore = await cookies();
        cookieStore.delete('googleUserId');
    } catch (error) {
        console.error('Error during logout:', error);
    }
}