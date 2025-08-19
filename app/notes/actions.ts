'use server'

import { revalidatePath } from "next/cache";
import { requireAuth, getGoogleUserId } from "../utils/auth";
import { getTT } from "@/utils/utils";


export async function deleteNote(noteId: string) {
    await requireAuth();

    const tt = await getTT();
    await tt.notes.softDeleteNote(noteId);
    revalidatePath('/notes');
}

export async function createNote(title: string) {
    await requireAuth();

    const tt = await getTT();
    const note = await tt.notes.createNote({
        title,
        content: '',
        date: new Date().toISOString(),
    });
    revalidatePath('/notes');
    return note;
}

export async function addTagToNote(noteId: string, tag: string) {
    await requireAuth();

    const tt = await getTT();

    try {
        await tt.notes.addTag(noteId, tag);

        revalidatePath('/notes');
        return { success: true };
    } catch (error) {
        console.error('Error adding tag:', error);
        return { success: false, error: 'Failed to add tag' };
    }
}

export async function removeTagFromNote(noteId: string, tag: string) {
    await requireAuth();

    const tt = await getTT();

    try {
        await tt.notes.removeTag(noteId, tag);

        revalidatePath('/notes');
        return { success: true };
    } catch (error) {
        console.error('Error removing tag:', error);
        return { success: false, error: 'Failed to remove tag' };
    }
}

export async function getAllTags() {
    await requireAuth();

    const tt = await getTT();

    try {
        const tags = await tt.notes.getAllTags();
        return { success: true, tags };
    } catch (error) {
        console.error('Error fetching tags:', error);
        return { success: false, error: 'Failed to fetch tags', tags: [] };
    }
}

export async function pushNoteToGoogleDrive(noteId: string, options: {
    convertToGoogleNote?: boolean;
    tabName?: string;
} = {}) {
    await requireAuth();

    const userId = await getGoogleUserId();
    if (!userId) {
        return { success: false, error: 'Google authentication required' };
    }

    const tt = await getTT();

    try {
        const result = await tt.googlePush.pushNoteToGoogleDrive(noteId, userId, options);

        if (result.success) {
            revalidatePath('/notes');
            revalidatePath(`/notes/${noteId}`);
            revalidatePath(`/notes/${noteId}/edit`);
        }

        return result;
    } catch (error) {
        console.error('Error pushing note to Google Drive:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Failed to push to Google Drive',
            googleDocId: '',
            googleDocUrl: '',
            isNewDocument: false
        };
    }
}