import { DatabaseSingleton } from "tt-services/src/connections/mongo";
import { TylersThings } from "tt-services";
import Link from "next/link";
import { DeleteNoteButton } from "./delete-note-button";

async function getNotes() {
    const db = await DatabaseSingleton.getInstance();
    const services = await TylersThings.make(db);
    return services.notes.getAllNotesMetadata();
}

export default async function NotesPage() {
    const notes = await getNotes();

    return (
        <div className="min-h-screen bg-gray-900 text-white p-8">
            <h1 className="text-4xl font-bold mb-8">Notes</h1>

            <div className="grid gap-4">
                {notes.map((note) => (
                    <div
                        key={note.id}
                        className="bg-gray-800 p-4 rounded-lg flex justify-between items-center"
                    >
                        <div>
                            <h2 className="text-xl font-semibold">{note.title}</h2>
                            <div className="flex gap-2 mt-2">
                                {note.tags?.map((tag) => (
                                    <span
                                        key={tag}
                                        className="bg-blue-500 px-2 py-1 rounded-full text-sm"
                                    >
                                        {tag}
                                    </span>
                                ))}
                            </div>
                        </div>
                        <div className="flex gap-2">
                            <Link
                                href={`/notes/${note.id}/edit`}
                                className="bg-blue-500 px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors"
                            >
                                Edit
                            </Link>
                            <DeleteNoteButton noteId={note.id} title={note.title} />
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}