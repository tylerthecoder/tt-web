'use server'

import { cookies } from 'next/headers';
import { DatabaseSingleton, TylersThings } from 'tt-services';

/**
 * Server action to sync a Google Doc with our notes system
 */
export async function syncGoogleDoc(docId: string) {
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

        // Get all services through TylersThings
        const db = await DatabaseSingleton.getInstance();
        const services = await TylersThings.make(db);

        // Create or update the Google Note
        const note = await services.googleNotes.createGoogleNote(userId, docId);

        return { success: true, note };
    } catch (error) {
        console.error('Error syncing Google Doc:', error);
        const errorMessage = error instanceof Error ? error.message : 'Failed to sync Google Doc';
        return { success: false, error: errorMessage };
    }
}