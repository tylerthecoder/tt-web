'use server'

import { DatabaseSingleton } from "tt-services/src/connections/mongo";
import { TylersThings } from "tt-services";
import { revalidatePath } from "next/cache";
import { requireAuth } from "../utils/auth";


export async function deleteNote(noteId: string) {
    await requireAuth(); // Add authentication check
    
    const db = await DatabaseSingleton.getInstance();
    const services = await TylersThings.make(db);
    await services.notes.softDeleteNote(noteId);
    revalidatePath('/notes');
}

export async function createNote(title: string) {
    await requireAuth(); // Add authentication check
    
    const db = await DatabaseSingleton.getInstance();
    const services = await TylersThings.make(db);
    const note = await services.notes.createNote({
        title,
        content: '',
        date: new Date().toISOString(),
    });
    revalidatePath('/notes');
    return note;
}

export async function addTagToNote(noteId: string, tag: string) {
    await requireAuth(); // Add authentication check
    
    const db = await DatabaseSingleton.getInstance();
    const services = await TylersThings.make(db);

    try {
        await services.notes.addTag(noteId, tag);

        revalidatePath('/notes');
        return { success: true };
    } catch (error) {
        console.error('Error adding tag:', error);
        return { success: false, error: 'Failed to add tag' };
    }
}

export async function removeTagFromNote(noteId: string, tag: string) {
    await requireAuth(); // Add authentication check
    
    const db = await DatabaseSingleton.getInstance();
    const services = await TylersThings.make(db);

    try {
        await services.notes.removeTag(noteId, tag);

        revalidatePath('/notes');
        return { success: true };
    } catch (error) {
        console.error('Error removing tag:', error);
        return { success: false, error: 'Failed to remove tag' };
    }
}