import { DatabaseSingleton } from "tt-services/src/connections/mongo";
import { TylersThings } from "tt-services";
import { MilkdownEditorWrapper } from "../../../panel/markdown-editor";

async function getNote(id: string) {
    const db = await DatabaseSingleton.getInstance();
    const services = await TylersThings.make(db);
    return services.notes.getNoteById(id);
}

export default async function NoteEditPage({ params }: { params: { id: string } }) {
    const note = await getNote(params.id);
    if (!note) {
        return <div>Note not found</div>;
    }

    return (
        <div className="min-h-screen bg-gray-900 text-white">
            <div className="mb-8">
                <div className="flex gap-2 mt-4">
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

            <div className="h-[calc(100vh-16rem)]">
                <MilkdownEditorWrapper noteId={note.id} />
            </div>
        </div>
    );
}