import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

export async function requireAuth(): Promise<void> {
    const cookieStore = await cookies();
    const session = cookieStore.get('session');
    
    if (!session || session.value !== 'authenticated') {
        redirect('/login');
    }
}

export async function getAuthenticatedUser(): Promise<{ isAuthenticated: boolean; googleUserId?: string }> {
    const cookieStore = await cookies();
    const session = cookieStore.get('session');
    const googleUserId = cookieStore.get('googleUserId');
    
    const isAuthenticated = session?.value === 'authenticated';
    
    return {
        isAuthenticated,
        googleUserId: googleUserId?.value
    };
}