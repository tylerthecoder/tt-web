'use server'

import { cookies } from 'next/headers';
import { getTT } from '@/utils/utils';
import { redirect } from 'next/navigation';

export async function logoutAction() {
    try {
        const cookieStore = await cookies();
        const session = cookieStore.get('tt_session');
        if (session?.value) {
            const tt = await getTT();
            await tt.sessions.deleteSession(session.value);
        }
        cookieStore.delete('tt_session');

        // Redirect to login page after logout
        redirect('/login');
    } catch (error) {
        console.error('Error during logout:', error);
        throw error;
    }
}