"use client";

import { Milkdown, MilkdownProvider, useEditor } from '@milkdown/react';
import { Crepe } from '@milkdown/crepe';
import { listenerCtx } from '@milkdown/plugin-listener';
import "@milkdown/crepe/theme/common/style.css";
import "@milkdown/crepe/theme/frame.css";
import { useEffect, useState } from 'react';
import { useNote, useUpdateNoteContent, usePullFromGoogleDoc } from '@/notes/hooks';
import { Note, isGoogleNote } from 'tt-services/src/client-index.ts';
import { GoogleDocModal } from './google-doc-modal';

const MilkdownEditorWithNote: React.FC<{ note: Note, hideTitle?: boolean }> = ({ note, hideTitle = false }) => {
	const { updateNote, isSyncing } = useUpdateNoteContent(note.id);
	const { pullContent, isPulling, error } = usePullFromGoogleDoc(note.id);
	const [isModalOpen, setIsModalOpen] = useState(false);

	const { get } = useEditor((root) => {
		return new Crepe({
			root,
			defaultValue: note.content,
		});
	});

	useEffect(() => {
		const editor = get();
		if (!editor) return;

		editor.action((ctx) => {
			ctx.get(listenerCtx)
				.markdownUpdated((ctx, markdown, prevMarkdown) => {
					if (markdown !== prevMarkdown) {
						updateNote(markdown);
					}
				});
		});
	}, [get, updateNote]);

	const handlePullContent = async () => {
		try {
			await pullContent();
		} catch (err) {
			// Error is already handled in the hook
			console.error('Failed to pull content:', err);
		}
	};

	return (
		<div className="h-full overflow-hidden">
			<div className="flex items-start justify-between px-3 md:px-4 py-2 bg-gray-700">
				{!hideTitle && (
					<div className="flex flex-col md:flex-row md:items-center gap-2 md:gap-3 flex-1 min-w-0">
						<h1 className="text-xl md:text-3xl text-gray-300 font-medium truncate">
							{note.title}
						</h1>
						{isGoogleNote(note) ? (
							<div className="flex items-center gap-2 flex-wrap">
								<span className="text-xs md:text-sm text-gray-300">
									<a
										href={`https://docs.google.com/document/d/${note.googleDocId}/edit`}
										target="_blank"
										rel="noopener noreferrer"
										className="text-xs md:text-sm text-blue-400 hover:underline break-all"
									>
										Google Doc
									</a>
								</span>
								<button
									onClick={handlePullContent}
									disabled={isPulling}
									className="text-xs md:text-sm text-green-400 hover:text-green-300 underline disabled:opacity-50 disabled:cursor-not-allowed"
								>
									{isPulling ? "Pulling..." : "Pull from Google"}
								</button>
								{error && (
									<span className="text-xs text-red-400">
										{error}
									</span>
								)}
							</div>
						) : (
							<span className="text-xs md:text-sm text-gray-300">
								Not a google note
								<button
									className="text-xs md:text-sm text-blue-400 hover:text-blue-300 ml-2 underline"
									onClick={() => setIsModalOpen(true)}
								>
									Sync with Google
								</button>
							</span>
						)}
						{note.tags && note.tags.length > 0 && (
							<div className="flex gap-1 flex-wrap">
								{note.tags.map((tag) => (
									<span
										key={tag}
										className="bg-blue-600 px-2 py-0.5 rounded-full text-xs font-medium text-white"
									>
										{tag}
									</span>
								))}
							</div>
						)}
					</div>
				)}
				<div className="flex items-center space-x-2 flex-shrink-0 ml-2">
					{isSyncing ? (
						<>
							<div className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse"></div>
							<span className="text-xs md:text-sm text-gray-300">Syncing...</span>
						</>
					) : (
						<>
							<div className="w-2 h-2 bg-green-400 rounded-full"></div>
							<span className="text-xs md:text-sm text-gray-300">Saved</span>
						</>
					)}
				</div>
			</div>
			<div className="bg-gray-800 overflow-hidden h-full">
				<div className="flex flex-col h-full [&>*]:h-full">
					<Milkdown />
				</div>
			</div>

			<GoogleDocModal
				isOpen={isModalOpen}
				onClose={() => setIsModalOpen(false)}
				noteId={note.id}
			/>
		</div>
	);
};

export const MilkdownEditor: React.FC<{ noteId: string, hideTitle?: boolean }> = ({ noteId, hideTitle = false }) => {
	const { note, loading } = useNote(noteId);

	if (loading) {
		return <div className="h-full flex items-center justify-center">Loading note...</div>;
	}

	if (!note) {
		return <div className="h-full flex items-center justify-center">Note not found</div>;
	}

	return (
		<MilkdownProvider>
			<MilkdownEditorWithNote note={note} hideTitle={hideTitle} />
		</MilkdownProvider>
	);
};