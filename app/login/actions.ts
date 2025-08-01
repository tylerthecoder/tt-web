'use server'

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

export async function logout() {
    try {
        const cookieStore = await cookies();
        
        // Clear the session cookie
        cookieStore.set('session', '', {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 0, // Expire immediately
            path: '/',
        });
        
        // Clear the Google userId cookie
        cookieStore.set('googleUserId', '', {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            maxAge: 0, // Expire immediately
            path: '/',
        });
        
        redirect('/login');
    } catch (error) {
        console.error('Logout error:', error);
        redirect('/login');
    }
}