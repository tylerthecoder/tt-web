'use server'

import { DatabaseSingleton } from "tt-services/src/connections/mongo";
import { TylersThings } from "tt-services";
import { revalidatePath } from "next/cache";

// ... existing actions ...

export async function deleteNote(noteId: string) {
    const db = await DatabaseSingleton.getInstance();
    const services = await TylersThings.make(db);
    await services.notes.softDeleteNote(noteId);
    revalidatePath('/notes');
}