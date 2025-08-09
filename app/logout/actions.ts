'use server'

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

export async function logoutAction() {
    try {
        const cookieStore = await cookies();
        cookieStore.delete('googleUserId');
        
        // Redirect to login page after logout
        redirect('/login');
    } catch (error) {
        console.error('Error during logout:', error);
        throw error;
    }
}