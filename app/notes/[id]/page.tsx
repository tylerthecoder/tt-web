import { DatabaseSingleton } from "tt-services/src/connections/mongo";
import { TylersThings } from "tt-services";
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { FaArrowLeft, FaEdit } from 'react-icons/fa';
import { formatDistance } from 'date-fns';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

async function getNote(id: string) {
    try {
        const db = await DatabaseSingleton.getInstance();
        const services = await TylersThings.make(db);
        const note = await services.notes.getNoteById(id);
        return note;
    } catch (error) {
        console.error("Failed to fetch note:", error);
        return null; // Handle potential errors during fetching
    }
}

export default async function NoteViewPage({ params }: { params: { id: string } }) {
    const note = await getNote(params.id);

    if (!note) {
        notFound(); // Use Next.js notFound helper
    }

    const lastModified = note.updatedAt || note.createdAt || new Date().toISOString();

    return (
        <div className="min-h-screen bg-gray-900 text-white p-8">
            <div className="max-w-4xl mx-auto">
                <div className="flex justify-between items-center mb-6">
                    <Link href="/notes" className="text-blue-400 hover:text-blue-300 flex items-center gap-2">
                        <FaArrowLeft />
                        Back to Notes
                    </Link>
                    <Link
                        href={`/notes/${note.id}/edit`}
                        className="bg-gray-700 px-4 py-2 rounded-lg hover:bg-gray-600 transition-colors flex items-center gap-2"
                    >
                        <FaEdit />
                        Edit
                    </Link>
                </div>

                <h1 className="text-4xl font-bold mb-4 text-red-400">{note.title}</h1>

                <div className="text-sm text-gray-400 mb-4">
                    Last updated {formatDistance(new Date(lastModified), new Date(), { addSuffix: true })}
                    {note.createdAt && note.createdAt !== lastModified && (
                        <span> | Created {formatDistance(new Date(note.createdAt), new Date(), { addSuffix: true })}</span>
                    )}
                </div>


                <div className="flex gap-2 mb-6">
                    {note.tags?.map((tag) => (
                        <span
                            key={tag}
                            className="bg-blue-600 px-3 py-1 rounded-full text-sm font-medium"
                        >
                            {tag}
                        </span>
                    ))}
                    {(!note.tags || note.tags.length === 0) && (
                        <span className="text-gray-500 italic text-sm">No tags</span>
                    )}
                </div>


                <div className="prose prose-invert prose-lg max-w-none bg-gray-800 p-6 rounded-lg shadow-inner">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                        {note.content || '*No content*'}
                    </ReactMarkdown>
                </div>
            </div>
        </div>
    );
}