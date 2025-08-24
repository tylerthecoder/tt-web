'use client';

import { formatDistance } from 'date-fns';
import Link from 'next/link';
import { FaArrowLeft, FaEdit } from 'react-icons/fa';
import ReactMarkdown from 'react-markdown';
import rehypeRaw from 'rehype-raw';
import remarkGfm from 'remark-gfm';

import { useNote } from '@/(panel)/hooks';

export default function NoteViewPage({ params }: { params: { id: string } }) {
  const { note, loading } = useNote(params.id);

  if (loading || !note) {
    return <div className="p-4 text-gray-300">Loading…</div>;
  }

  const lastModified = note.updatedAt || note.createdAt || new Date().toISOString();

  return (
    <div className="min-h-full bg-gray-900 text-white p-4 md:p-6">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <Link href="/notes" className="text-blue-400 hover:text-blue-300 flex items-center gap-2">
            <FaArrowLeft />
            Back to Notes
          </Link>
          <Link
            href={`/note/${note.id}/edit`}
            className="bg-gray-700 px-4 py-2 rounded-lg hover:bg-gray-600 transition-colors flex items-center gap-2"
          >
            <FaEdit />
            Edit
          </Link>
        </div>

        <h1 className="text-3xl md:text-4xl font-bold mb-4 text-red-400">{note.title}</h1>

        <div className="text-sm text-gray-400 mb-4">
          Last updated {formatDistance(new Date(lastModified), new Date(), { addSuffix: true })}
          {note.createdAt && note.createdAt !== lastModified && (
            <span>
              {' '}
              | Created {formatDistance(new Date(note.createdAt), new Date(), { addSuffix: true })}
            </span>
          )}
        </div>

        <div className="prose prose-invert prose-lg max-w-none bg-gray-800 p-6 rounded-lg shadow-inner prose-ul:m-0">
          <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeRaw]}>
            {note.content}
          </ReactMarkdown>
        </div>
      </div>
    </div>
  );
}
