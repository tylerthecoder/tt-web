import { DatabaseSingleton } from "tt-services/src/connections/mongo";
import { TylersThings } from "tt-services";
import { MilkdownEditorWrapper } from "../../../panel/markdown-editor";

async function getNote(id: string) {
    const db = await DatabaseSingleton.getInstance();
    const services = await TylersThings.make(db);
    return services.notes.getNoteById(id);
}

export default async function NoteEditPage({ params }: { params: Promise<{ id: string }> }) {
    const resolvedParams = await params;
    return (
        <MilkdownEditorWrapper noteId={resolvedParams.id} />
    );
}