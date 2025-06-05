'use server'

import { cookies } from 'next/headers';
import bcrypt from 'bcrypt';

export async function login(formData: FormData): Promise<{ success: boolean, error?: string }> {
    const password = formData.get('password') as string;

    const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;

    if (!ADMIN_PASSWORD) {
        throw new Error('ADMIN_PASSWORD is not defined');
    }

    try {
        console.log(ADMIN_PASSWORD, password);
        if (ADMIN_PASSWORD !== password) {
            return { success: false, error: 'Invalid password' };
        }

        // Set a simple session cookie
        (await cookies()).set('session', 'authenticated', {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 60 * 60 * 24 * 7, // 1 week
            path: '/',
        });

        return { success: true };
    } catch (error) {
        console.error('Login error:', error);
        return { success: false, error: 'Internal server error' };
    }
}