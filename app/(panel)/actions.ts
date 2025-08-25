'use server';

import { revalidatePath } from 'next/cache';

import { baseLogger } from '@/utils/logger';
import { getTT } from '@/utils/utils';

import { getGoogleUserId, requireAuth } from '../utils/auth';

const logger = baseLogger.child({ module: 'panel-actions' });

export async function getCurrentWeek() {
  await requireAuth();

  const tt = await getTT();
  return tt.weekly.getCurrentWeek();
}

export async function getAllJots() {
  await requireAuth();

  const tt = await getTT();
  return tt.jots.getAllJots();
}

export async function getTodayDailyNote() {
  await requireAuth();

  const tt = await getTT();
  return tt.dailyNotes.getToday();
}

export async function getAllDailyNotesMetadata() {
  await requireAuth();

  const tt = await getTT();
  return tt.dailyNotes.getAllNotesMetadata();
}

export async function getAllLists() {
  await requireAuth();

  const tt = await getTT();
  return tt.lists.getAllLists();
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

export async function getNoteMetadataById(noteId: string) {
  await requireAuth();

  const tt = await getTT();
  return tt.notes.getNoteMetadataById(noteId);
}

export async function getNoteContent(noteId: string) {
  await requireAuth();

  const tt = await getTT();
  const note = await tt.notes.getNoteById(noteId);
  return note?.content || '';
}

export async function publishNote(noteId: string) {
  await requireAuth();

  const tt = await getTT();
  await tt.notes.publishNote(noteId);

  // Revalidate blog routes so newly published note appears
  revalidatePath('/blog');
  revalidatePath(`/blog/${noteId}`);
}

export async function unpublishNote(noteId: string) {
  await requireAuth();

  const tt = await getTT();
  await tt.notes.unpublishNote(noteId);

  // Revalidate blog routes so unpublished note disappears
  revalidatePath('/blog');
  revalidatePath(`/blog/${noteId}`);
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

// Jots create action from (panel)/jot/actions.ts (keeping original for /jot route)
export async function createJotAction(formData: FormData) {
  await requireAuth();

  const text = formData.get('jotText') as string;

  if (!text || typeof text !== 'string' || text.trim().length === 0) {
    return { error: 'Jot text cannot be empty.' };
  }

  try {
    const tt = await getTT();
    await tt.jots.createJot(text.trim());
    revalidatePath('/jot');
    return { success: true };
  } catch (error) {
    console.error('Failed to create jot:', error);
    return { error: 'Failed to save jot. Please try again.' };
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
    const userId = await getGoogleUserId();
    if (!userId) {
      throw new Error('User not found');
    }

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

export async function getNotesAndUntrackedGoogleDocs() {
  await requireAuth();

  const tt = await getTT();
  const userId = await getGoogleUserId();
  const result = userId
    ? await tt.googleNotes.getAllNotesAndUntrackedGoogleDocs(userId)
    : { notes: [], googleDocs: [] };
  return { ...result, showGoogleNotice: !userId };
}

export async function getListById(listId: string) {
  await requireAuth();

  const tt = await getTT();
  return tt.lists.getListById(listId);
}

// Lists actions moved from (panel)/lists/actions.ts

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

export async function archiveListItem(listId: string, itemId: string) {
  await requireAuth();
  const tt = await getTT();
  await tt.lists.archiveItem(listId, itemId);
  revalidatePath(`/lists/${listId}`);
}

export async function unarchiveListItem(listId: string, itemId: string) {
  await requireAuth();
  const tt = await getTT();
  await tt.lists.unarchiveItem(listId, itemId);
  revalidatePath(`/lists/${listId}`);
}

// Notes actions moved from (panel)/notes/actions.ts

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

export async function getNotesMetadataByTag(tag: string) {
  await requireAuth();
  const tt = await getTT();
  return tt.notes.getNotesMetadataByTag(tag);
}

// Time tracker actions
export async function getTimeBlocksForDay(dateIso: string) {
  await requireAuth();
  const tt = await getTT();
  return tt.timeTracker.getTimeBlocksForDay(dateIso);
}

export async function startTimeBlock(label: string, noteId?: string) {
  await requireAuth();
  const tt = await getTT();
  const block = await tt.timeTracker.startTimeBlock(label, noteId);
  revalidatePath('/time');
  return block;
}

export async function endTimeBlock() {
  await requireAuth();
  const tt = await getTT();
  const block = await tt.timeTracker.endTimeBlock();
  revalidatePath('/time');
  return block;
}

export async function getAllTimeBlocks() {
  await requireAuth();
  const tt = await getTT();
  return tt.timeTracker.getAllTimeBlocks();
}

export async function updateTimeBlock(
  blockId: string,
  updates: { startTime?: string; endTime?: string | null; label?: string; noteId?: string | null },
) {
  await requireAuth();
  const tt = await getTT();
  const block = await tt.timeTracker.updateTimeBlock(blockId, updates);
  revalidatePath('/time');
  return block;
}

export async function pushNoteToGoogleDrive(
  noteId: string,
  options: { convertToGoogleNote?: boolean; tabName?: string } = {},
) {
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
      isNewDocument: false,
    };
  }
}
