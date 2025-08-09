import { DatabaseSingleton } from "tt-services/src/connections/mongo";
import { TylersThings } from "tt-services";
import { NextResponse } from 'next/server';

export async function GET() {
    try {
        const db = await DatabaseSingleton.getInstance();
        const services = await TylersThings.make(db);
        
        // Fetch all notes metadata
        const notes = await services.notes.getAllNotesMetadata();
        
        // Transform to the format needed by the command menu
        const commandMenuNotes = notes.map(note => ({
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