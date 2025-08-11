import { DatabaseSingleton } from "tt-services/src/connections/mongo";
import { TylersThings } from "tt-services";
import { cookies } from "next/headers";
import { NotesPageClient } from "./NotesPageClient.tsx";
import { NoteMetadata } from "tt-services/src/client-index.ts";
import type { GoogleDriveFile } from "../types/google";

export type NoteDisplayItem = {
    id: string;
    title: string;
    modifiedTime: string;
    type: 'note';
    originalItem: NoteMetadata;
};

export type GoogleDocDisplayItem = {
    id: string;
    title: string;
    modifiedTime: string;
    type: 'google-doc';
    originalItem: GoogleDriveFile;
};

export type DisplayItem = NoteDisplayItem | GoogleDocDisplayItem;


export default async function NotesPage({ searchParams }: { searchParams: Promise<{ [key: string]: string | string[] | undefined }> }) {
    const db = await DatabaseSingleton.getInstance();
    const services = await TylersThings.make(db);

    // Get Google user ID from cookies
    const cookieStore = await cookies();
    const userId = cookieStore.get('googleUserId')?.value;

    // Fetch all regular notes
    const [allTags, notesAndUntrackedGoogleDocs] = await Promise.all([
        services.notes.getAllTags(),
        userId ? services.googleNotes.getAllNotesAndUntrackedGoogleDocs(userId) : Promise.resolve({ notes: [], googleDocs: [] })
    ]);

    // Build combined list of items to display
    const displayItems: DisplayItem[] = [];

    // Add regular notes (includes tracked Google notes that are already in the system)
    notesAndUntrackedGoogleDocs.notes
        .forEach(note => {
            displayItems.push({
                id: note.id,
                title: note.title,
                modifiedTime: note.updatedAt || note.createdAt || new Date().toISOString(),
                type: 'note',
                originalItem: note
            });
        });

    // Add not tracked Google Docs
    notesAndUntrackedGoogleDocs.googleDocs.forEach(doc => {
        displayItems.push({
            id: doc.id || "",
            title: doc.name || "",
            modifiedTime: doc.modifiedTime || new Date().toISOString(),
            type: 'google-doc',
            originalItem: doc
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