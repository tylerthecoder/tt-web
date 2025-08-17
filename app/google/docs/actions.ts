'use server'

import { getTT } from '@/utils/utils';
import { getGoogleUserId } from '../../utils/auth';

/**
 * Server action to track a Google Doc with our notes system
 */
export async function trackGoogleDoc(docId: string) {
    try {
        const userId = await getGoogleUserId();
        if (!userId) {
            throw new Error('User not found');
        }

        if (!docId) {
            return { success: false, error: 'Document ID is required' };
        }

        const tt = await getTT();

        const note = await tt.googleNotes.createGoogleNoteFromGoogleDocId(userId, docId);

        return { success: true, note };
    } catch (error) {
        console.error('Error syncing Google Doc:', error);
        const errorMessage = error instanceof Error ? error.message : 'Failed to sync Google Doc';
        return { success: false, error: errorMessage };
    }
}