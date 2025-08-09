'use server'

import { cookies } from 'next/headers';
import { DatabaseSingleton, TylersThings } from 'tt-services';

/**
 * Server action to track a Google Doc with our notes system
 */
export async function trackGoogleDoc(docId: string) {
    try {
        // Check authentication
        const cookieStore = await cookies();
        const userId = cookieStore.get('googleUserId')?.value;

        if (!userId) {
            return { success: false, error: 'Not authenticated with Google' };
        }

        if (!docId) {
            return { success: false, error: 'Document ID is required' };
        }

        const db = await DatabaseSingleton.getInstance();
        const services = await TylersThings.make(db);

        const note = await services.googleNotes.createGoogleNoteFromGoogleDocId(userId, docId);

        return { success: true, note };
    } catch (error) {
        console.error('Error syncing Google Doc:', error);
        const errorMessage = error instanceof Error ? error.message : 'Failed to sync Google Doc';
        return { success: false, error: errorMessage };
    }
}