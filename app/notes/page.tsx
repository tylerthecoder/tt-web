import { DatabaseSingleton } from "tt-services/src/connections/mongo";
import { TylersThings } from "tt-services";
import Link from "next/link";
import { cookies } from "next/headers";
import { NotesPageClient } from "./NotesPageClient.tsx";
import { Note, GoogleNote } from "tt-services/src/services/notes";

// Helper type to represent either a note or a Google Doc
type DisplayItem = {
    id: string;
    title: string;
    modifiedTime: string;
    type: 'note' | 'google-doc';
    originalItem: Note | GoogleNote | any; // The original item data
};

// Helper function to check if an item is a Google Note
const isGoogleNote = (item: any): boolean => {
    return item.googleDocId !== undefined;
};


async function tryCatch<T>(fn: () => Promise<T>): Promise<{ success: boolean, data: T | null, error: any | null }> {
    try {
        const data = await fn();
        return { success: true, data, error: null };
    } catch (error) {
        console.error(error);
        return { success: false, data: null, error };
    }
}


export default async function NotesPage({ searchParams }: { searchParams: Promise<{ [key: string]: string | string[] | undefined }> }) {
    const db = await DatabaseSingleton.getInstance();
    const services = await TylersThings.make(db);

    // Get Google user ID from cookies
    const cookieStore = await cookies();
    const userId = cookieStore.get('googleUserId')?.value;

    // Fetch all regular notes
    const [notes, googleNotes, allTags, googleDocs] = await Promise.all([
        services.notes.getAllNotesMetadata(),
        services.googleNotes.getAllGoogleNotes(),
        services.notes.getAllTags(),
        userId ? services.google.getUserDocs(userId) : []
    ]);

    // Create a map of Google Notes by their Google Doc ID for easy lookup
    const googleNotesByDocId = new Map();
    googleNotes.forEach(note => {
        if (note.googleDocId) {
            googleNotesByDocId.set(note.googleDocId, note);
        }
    });

    // Build combined list of items to display
    const displayItems: DisplayItem[] = [];

    // Add regular notes (excluding Google Notes since they'll be handled with their corresponding Google Doc)
    notes
        .filter(note => !isGoogleNote(note))
        .forEach(note => {
            displayItems.push({
                id: note.id,
                title: note.title,
                modifiedTime: note.updatedAt || note.createdAt || new Date().toISOString(),
                type: 'note',
                originalItem: note
            });
        });

    // Add Google Docs, with their corresponding note data if available
    googleDocs.forEach(doc => {
        const correspondingNote = googleNotesByDocId.get(doc.id);

        displayItems.push({
            id: doc.id || "",
            title: doc.name || "",
            modifiedTime: doc.modifiedTime || new Date().toISOString(),
            type: 'google-doc',
            originalItem: {
                ...doc,
                isSynced: !!correspondingNote,
                syncedDoc: correspondingNote
            }
        });
    });

    // Sort all items by modification time (newest first)
    displayItems.sort((a, b) => {
        return new Date(b.modifiedTime).getTime() - new Date(a.modifiedTime).getTime();
    });

    // Await searchParams and get the search parameters to pass to client
    const resolvedSearchParams = await searchParams;
    const initialSearch = typeof resolvedSearchParams.search === 'string' ? resolvedSearchParams.search : '';
    const initialShownTags = typeof resolvedSearchParams.shownTags === 'string' ? resolvedSearchParams.shownTags.split(',').filter(Boolean) : [];
    const initialHiddenTags = typeof resolvedSearchParams.hiddenTags === 'string' ? resolvedSearchParams.hiddenTags.split(',').filter(Boolean) : [];

    // remove _id from displayItems
    displayItems.forEach(item => {
        delete item.originalItem._id;
    });

    return (
        <NotesPageClient
            displayItems={displayItems}
            availableTags={allTags}
            initialSearch={initialSearch}
            initialShownTags={initialShownTags}
            initialHiddenTags={initialHiddenTags}
            showGoogleNotice={!userId}
        />
    );
}