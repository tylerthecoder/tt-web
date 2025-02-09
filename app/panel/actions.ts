'use server'

import { DatabaseSingleton } from "tt-services/src/connections/mongo";
import { TylersThings } from "tt-services";

async function getServices() {
    const db = await DatabaseSingleton.getInstance();
    return TylersThings.make(db);
}

export async function getCurrentWeek() {
    const services = await getServices();
    return services.weekly.getCurrentWeek();
}

export async function addTodo(weekId: string, content: string) {
    const services = await getServices();
    return services.weekly.addTodo(weekId, content);
}

export async function toggleTodo(weekId: string, todoId: string, checked: boolean) {
    const services = await getServices();
    return services.weekly.toggleTodo(weekId, todoId, checked);
}

export async function updateTodoContent(weekId: string, todoId: string, content: string) {
    const services = await getServices();
    return services.weekly.updateTodoContent(weekId, todoId, content);
}

export async function getNoteContent(noteId: string) {
    const db = await DatabaseSingleton.getInstance();
    const services = await TylersThings.make(db);
    const note = await services.notes.getNoteById(noteId);
    console.log("Note content", note);
    return note?.content || '';
}

export async function updateNoteContent(noteId: string, content: string) {
    const db = await DatabaseSingleton.getInstance();
    const services = await TylersThings.make(db);
    await services.notes.updateNote(noteId, { content });
    console.log("Updated note content", noteId, content);
}