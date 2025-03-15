import { DatabaseSingleton } from "tt-services/src/connections/mongo";
import { TylersThings } from "tt-services";
import Link from "next/link";
import { cookies } from "next/headers";
import { NotesPageClient } from "./NotesPageClient.tsx";
import { Note } from "tt-services/src/services/NotesService";
import { GoogleNote } from "tt-services/src/services/GoogleNoteService";

// Helper type to represent either a note or a Google Doc
type DisplayItem = {
    id: string;
    title: string;
    modifiedTime: string;
    type: 'note' | 'google-doc';
    originalItem: Note | GoogleNote | any; // The original item data
};

// Helper function to check if an item is a Google Doc
const isGoogleDoc = (item: any): boolean => {
    return item.name !== undefined && item.id !== undefined;
};

// Helper function to check if an item is a Google Note
const isGoogleNote = (item: any): boolean => {
    return item.googleDocId !== undefined;
};

export default async function NotesPage({ searchParams }: { searchParams: { [key: string]: string | string[] | undefined } }) {
    const db = await DatabaseSingleton.getInstance();
    const services = await TylersThings.make(db);

    // Fetch all regular notes
    const notes = await services.notes.getAllNotesMetadata();

    // Fetch all Google notes
    const googleNotes = await services.googleNotes.getAllGoogleNotes();

    // Fetch all available tags
    const allTags = await services.notes.getAllTags();

    // Get Google user ID from cookies
    const cookieStore = cookies();
    const userId = cookieStore.get('googleUserId')?.value;

    // Fetch Google Docs if user is authenticated
    let googleDocs: any[] = [];
    if (userId) {
        try {
            googleDocs = await services.google.getUserDocs(userId);
        } catch (error) {
            console.error("Error fetching Google Docs:", error);
        }
    }

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
            id: doc.id,
            title: doc.name,
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

    // Get the search parameters to pass to client
    const initialSearch = typeof searchParams.search === 'string' ? searchParams.search : '';
    const initialShownTags = typeof searchParams.shownTags === 'string' ? searchParams.shownTags.split(',').filter(Boolean) : [];
    const initialHiddenTags = typeof searchParams.hiddenTags === 'string' ? searchParams.hiddenTags.split(',').filter(Boolean) : [];

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