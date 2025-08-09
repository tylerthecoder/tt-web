'use server'

import { DatabaseSingleton, TylersThings } from 'tt-services';
import { requireAuth } from '../../utils/auth';

/**
 * Server action to track a Google Doc with our notes system
 */
export async function trackGoogleDoc(docId: string) {
    try {
        // Use the auth utility instead of manual check
        const userId = await requireAuth();

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