'use server'

import { DatabaseSingleton } from "tt-services/src/connections/mongo";
import { TylersThings } from "tt-services";
import { revalidatePath } from "next/cache";

export async function createList(name: string) {
    const db = await DatabaseSingleton.getInstance();
    const services = await TylersThings.make(db);
    const list = await services.lists.createList(name);
    revalidatePath('/lists');
    return list;
}

export async function addItemToList(listId: string, content: string) {
    const db = await DatabaseSingleton.getInstance();
    const services = await TylersThings.make(db);
    await services.lists.addItemToList(listId, content);
    revalidatePath(`/lists/${listId}`);
}

export async function toggleItemCheck(listId: string, itemId: string) {
    const db = await DatabaseSingleton.getInstance();
    const services = await TylersThings.make(db);
    await services.lists.toggleItemCheck(listId, itemId);
    revalidatePath(`/lists/${listId}`);
}

export async function addNoteToItem(listId: string, itemId: string, noteId: string) {
    const db = await DatabaseSingleton.getInstance();
    const services = await TylersThings.make(db);
    await services.lists.addNoteToItem(listId, itemId, noteId);
    revalidatePath(`/lists/${listId}`);
}

export async function deleteListItem(listId: string, itemId: string) {
    const db = await DatabaseSingleton.getInstance();
    const services = await TylersThings.make(db);
    await services.lists.deleteItem(listId, itemId);
    revalidatePath(`/lists/${listId}`);
}