'use server';

import { revalidatePath } from 'next/cache';
import { requireAuth } from '../utils/auth';
import { getTT } from '@/utils/utils';

export async function createJotAction(formData: FormData) {
    await requireAuth();

    const text = formData.get('jotText') as string;

    if (!text || typeof text !== 'string' || text.trim().length === 0) {
        return { error: 'Jot text cannot be empty.' };
    }

    try {
        const tt = await getTT();
        await tt.jots.createJot(text.trim());
        revalidatePath('/jot'); // Revalidate the page to potentially show new jots if displayed
        return { success: true };
    } catch (error) {
        console.error('Failed to create jot:', error);
        return { error: 'Failed to save jot. Please try again.' };
    }
}