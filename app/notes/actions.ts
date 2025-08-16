'use server'

import { revalidatePath } from "next/cache";
import { requireAuth } from "../utils/auth";
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