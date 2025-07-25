"use client";

import { Milkdown, MilkdownProvider, useEditor } from '@milkdown/react';
import { Crepe } from '@milkdown/crepe';
import { listenerCtx } from '@milkdown/plugin-listener';
import "@milkdown/crepe/theme/common/style.css";
import "@milkdown/crepe/theme/frame.css";
import { useEffect } from 'react';
import { useNote, useUpdateNoteContent } from '@/notes/hooks';
import { Note } from 'tt-services';

const MilkdownEditorWithNote: React.FC<{ note: Note, hideTitle?: boolean }> = ({ note, hideTitle = false }) => {
	const { updateNote, isSyncing } = useUpdateNoteContent(note.id);

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
						console.log("MilkdownEditorWithNote: markdownUpdated", markdown);
						updateNote(markdown);
					}
				});
		});
	}, [get, updateNote]);

	return (
		<div className="h-full overflow-hidden">
			<div className="flex items-start justify-between px-3 md:px-4 py-2 bg-gray-700">
				{!hideTitle && (
					<div className="flex flex-col md:flex-row md:items-center gap-2 md:gap-3 flex-1 min-w-0">
						<h1 className="text-xl md:text-3xl text-gray-300 font-medium truncate">
							{note.title}
						</h1>
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
				<div className="flex flex-col h-full">
					<Milkdown />
				</div>
			</div>
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