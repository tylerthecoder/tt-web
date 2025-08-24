'use server';

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

/**
 * Fetch a Google Drive file's metadata by id for the current user
 */
export async function getGoogleDriveFileById(docId: string) {
  try {
    const userId = await getGoogleUserId();
    if (!userId) {
      throw new Error('User not found');
    }

    if (!docId) {
      return { success: false, error: 'Document ID is required' };
    }

    const tt = await getTT();

    const file = await tt.google.getDriveFileMetadata(userId, docId);

    return { success: true, file };
  } catch (error) {
    console.error('Error fetching Drive file by id:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to fetch Drive file';
    return { success: false, error: errorMessage };
  }
}
