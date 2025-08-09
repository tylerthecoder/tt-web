import { DatabaseSingleton } from "tt-services/src/connections/mongo";
import { TylersThings } from "tt-services";
import { cookies } from "next/headers";
import { NotesPageClient } from "./NotesPageClient.tsx";
import { NoteMetadata, isGoogleNoteMetadata } from "tt-services/src/client-index";
import { drive_v3 } from "googleapis/build/src/apis/drive/v3";

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
    originalItem: drive_v3.Schema$File;
};

export type DisplayItem = NoteDisplayItem | GoogleDocDisplayItem;


export default async function NotesPage({ searchParams }: { searchParams: Promise<{ [key: string]: string | string[] | undefined }> }) {
    const db = await DatabaseSingleton.getInstance();
    const services = await TylersThings.make(db);

    // Get Google user ID from cookies
    const cookieStore = await cookies();
    const userId = cookieStore.get('googleUserId')?.value;

    // Fetch all regular notes
    const [notes, allTags, googleDocs] = await Promise.all([
        services.notes.getAllNotesMetadata(),
        services.notes.getAllTags(),
        userId ? services.google.getUserDocs(userId) : []
    ]);

    // Filter out Google notes that are already in the system
    const notTrackedGoogleNotes = googleDocs.filter(doc => {
        for (const note of notes) {
            if (!isGoogleNoteMetadata(note)) {
                continue;
            }
            if (note.googleDocId === doc.id) {
                return false;
            }
        }
        return true;
    });

    // Build combined list of items to display
    const displayItems: DisplayItem[] = [];

    // Add regular notes (includes tracked Google notes that are already in the system)
    notes
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
    notTrackedGoogleNotes.forEach(doc => {
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