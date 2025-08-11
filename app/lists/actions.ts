'use server'

import { revalidatePath } from "next/cache";
import { requireAuth } from "../utils/auth";
import { getTT } from "@/utils/utils";

export async function createList(name: string) {
    await requireAuth();

    const tt = await getTT();
    const list = await tt.lists.createList(name);
    revalidatePath('/lists');
    return list;
}

export async function addItemToList(listId: string, content: string) {
    await requireAuth();

    const tt = await getTT();
    await tt.lists.addItemToList(listId, content);
    revalidatePath(`/lists/${listId}`);
}

export async function toggleItemCheck(listId: string, itemId: string) {
    await requireAuth();

    const tt = await getTT();
    await tt.lists.toggleItemCheck(listId, itemId);
    revalidatePath(`/lists/${listId}`);
}

export async function addNoteToItem(listId: string, itemId: string, noteId: string) {
    await requireAuth();

    const tt = await getTT();
    await tt.lists.addNoteToItem(listId, itemId, noteId);
    revalidatePath(`/lists/${listId}`);
}

export async function deleteListItem(listId: string, itemId: string) {
    await requireAuth();

    const tt = await getTT();
    await tt.lists.deleteItem(listId, itemId);
    revalidatePath(`/lists/${listId}`);
}