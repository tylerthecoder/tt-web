import { NextResponse } from 'next/server';
import { getTT } from '@/utils/utils';

export async function GET() {
    try {
        const tt = await getTT();

        // Fetch all notes metadata
        const notes = await tt.notes.getAllNotesMetadata();

        // Transform to the format needed by the command menu
        const commandMenuNotes = notes.map((note) => ({
            id: note.id,
            title: note.title,
            modifiedTime: note.updatedAt || note.createdAt || new Date().toISOString(),
        }));

        // Sort by modification time (newest first)
        commandMenuNotes.sort((a, b) => {
            return new Date(b.modifiedTime).getTime() - new Date(a.modifiedTime).getTime();
        });

        return NextResponse.json(commandMenuNotes);
    } catch (error) {
        console.error('Error fetching notes for command menu:', error);
        return NextResponse.json([], { status: 500 });
    }
}