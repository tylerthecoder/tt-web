'use server'

import { revalidatePath } from 'next/cache';
import { requireAuth } from '../utils/auth';
import { getTT } from '@/utils/utils';
import { baseLogger } from '@/logger';

const logger = baseLogger.child({ module: 'panel-actions' });

export async function getCurrentWeek() {
    await requireAuth();

    const tt = await getTT();
    return tt.weekly.getCurrentWeek();
}

export async function addTodo(weekId: string, content: string) {
    await requireAuth();

    const tt = await getTT();
    return tt.weekly.addTodo(weekId, content);
}

export async function toggleTodo(weekId: string, todoId: string, checked: boolean) {
    await requireAuth();

    const tt = await getTT();
    return tt.weekly.toggleTodo(weekId, todoId, checked);
}

export async function updateTodoContent(weekId: string, todoId: string, content: string) {
    await requireAuth();

    const tt = await getTT();
    return tt.weekly.updateTodoContent(weekId, todoId, content);
}

export async function getNote(noteId: string) {
    await requireAuth();

    const tt = await getTT();
    return tt.notes.getNoteById(noteId);
}

export async function getNoteContent(noteId: string) {
    await requireAuth();

    const tt = await getTT();
    const note = await tt.notes.getNoteById(noteId);
    return note?.content || '';
}

export async function updateNoteContent(noteId: string, content: string) {
    await requireAuth();

    const tt = await getTT();
    await tt.notes.updateNote(noteId, { content });
}

export async function deleteTodo(weekId: string, todoId: string) {
    await requireAuth();

    const tt = await getTT();
    return tt.weekly.deleteTodo(weekId, todoId);
}

export async function deleteJotAction(jotId: string) {
    await requireAuth();

    if (!jotId || typeof jotId !== 'string') {
        return { error: 'Invalid Jot ID.' };
    }

    try {
        const tt = await getTT();
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
    await requireAuth();

    const tt = await getTT();
    const note = await tt.notes.getNoteById(noteId);
    if (!note) {
        throw new Error('Note not found');
    }
    return tt.googleNotes.assignGoogleDocIdToNote(note, googleDocId);
}

export async function pullContentFromGoogleDoc(noteId: string) {
    await requireAuth();
    try {
        // Use the auth utility instead of manual check
        const userId = await requireAuth();

        const tt = await getTT();

        // Pull content from Google Doc and save to note
        await tt.googleNotes.saveContentFromGoogleDoc(noteId, userId);

        // Return the updated note
        return tt.notes.getNoteById(noteId);
    } catch (error) {
        console.error('Error pulling content from Google Doc:', error);
        throw error;
    }
}