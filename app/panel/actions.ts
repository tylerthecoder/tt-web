'use server'

import { DatabaseSingleton, TylersThings } from "tt-services";
import { revalidatePath } from 'next/cache';
import { requireAuth } from '../utils/auth';

async function getServices() {
    const db = await DatabaseSingleton.getInstance();
    return TylersThings.make(db);
}

export async function getCurrentWeek() {
    await requireAuth(); // Add authentication check
    
    const services = await getServices();
    return services.weekly.getCurrentWeek();
}

export async function addTodo(weekId: string, content: string) {
    await requireAuth(); // Add authentication check
    
    const services = await getServices();
    return services.weekly.addTodo(weekId, content);
}

export async function toggleTodo(weekId: string, todoId: string, checked: boolean) {
    await requireAuth(); // Add authentication check
    
    const services = await getServices();
    return services.weekly.toggleTodo(weekId, todoId, checked);
}

export async function updateTodoContent(weekId: string, todoId: string, content: string) {
    await requireAuth(); // Add authentication check
    
    const services = await getServices();
    return services.weekly.updateTodoContent(weekId, todoId, content);
}

export async function getNote(noteId: string) {
    await requireAuth(); // Add authentication check
    
    const db = await DatabaseSingleton.getInstance();
    const services = await TylersThings.make(db);
    return services.notes.getNoteById(noteId);
}

export async function getNoteContent(noteId: string) {
    await requireAuth(); // Add authentication check
    
    const db = await DatabaseSingleton.getInstance();
    const services = await TylersThings.make(db);
    const note = await services.notes.getNoteById(noteId);
    console.log("Note content", note);
    return note?.content || '';
}

export async function updateNoteContent(noteId: string, content: string) {
    await requireAuth(); // Add authentication check
    
    const db = await DatabaseSingleton.getInstance();
    const services = await TylersThings.make(db);
    await services.notes.updateNote(noteId, { content });
    console.log("Updated note content", noteId, content);
}

export async function deleteTodo(weekId: string, todoId: string) {
    await requireAuth(); // Add authentication check
    
    const services = await getServices();
    return services.weekly.deleteTodo(weekId, todoId);
}

export async function deleteJotAction(jotId: string) {
    await requireAuth(); // Add authentication check
    
    if (!jotId || typeof jotId !== 'string') {
        return { error: 'Invalid Jot ID.' };
    }

    try {
        const db = await DatabaseSingleton.getInstance();
        const tt = await TylersThings.make(db);
        const success = await tt.jots.deleteJot(jotId);

        if (success) {
            revalidatePath('/panel'); // Revalidate the panel page to update the jots list
            return { success: true };
        } else {
            return { error: 'Jot not found or could not be deleted.' };
        }
    } catch (error) {
        console.error('Failed to delete jot:', error);
        return { error: 'Failed to delete jot. Please try again.' };
    }
}

export async function assignGoogleDocIdToNote(noteId: string, googleDocId: string) {
    await requireAuth(); // Add authentication check
    
    const db = await DatabaseSingleton.getInstance();
    const services = await TylersThings.make(db);
    const note = await services.notes.getNoteById(noteId);
    if (!note) {
        throw new Error('Note not found');
    }
    return services.googleNotes.assignGoogleDocIdToNote(note, googleDocId);
}

export async function pullContentFromGoogleDoc(noteId: string) {
    try {
        // Use the auth utility instead of manual check
        const userId = await requireAuth();

        const db = await DatabaseSingleton.getInstance();
        const services = await TylersThings.make(db);

        // Pull content from Google Doc and save to note
        await services.googleNotes.saveContentFromGoogleDoc(noteId, userId);

        // Return the updated note
        return services.notes.getNoteById(noteId);
    } catch (error) {
        console.error('Error pulling content from Google Doc:', error);
        throw error;
    }
}