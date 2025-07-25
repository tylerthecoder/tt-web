"use client";

import { useNote, useUpdateNoteContent } from "@/panel/markdown-editor";
import { Plate, usePlateEditor } from "platejs/react";
import { useEffect, useState } from "react";
import { Note } from "tt-services/src/services/NotesService";
import { MarkdownPlugin, remarkMention, remarkMdx } from '@platejs/markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import {
  BlockquotePlugin,
  BoldPlugin,
  H1Plugin,
  H2Plugin,
  H3Plugin,
  ItalicPlugin,
  UnderlinePlugin,
} from '@platejs/basic-nodes/react';
import { BlockquoteElement } from '@/components/ui/blockquote-node';
import { Editor, EditorContainer } from '@/components/ui/editor';
import { H1Element, H2Element, H3Element } from '@/components/ui/heading-node';
import { ListKit } from '@/components/editor/plugins/list-classic-kit';




interface PlateEditorProps {
	noteId: string;
}


const PlateEditorWithNote = ({ note }: { note: Note }) => {
	const { updateNote, isSyncing } = useUpdateNoteContent(note.id);
	console.log("PlateEditorWithNote: note", note);
	const editor = usePlateEditor({
		// value: "Tyler",
		value: (editor) => {
			const value = editor.getApi(MarkdownPlugin).markdown.deserialize(note.content);
			console.log("PlateEditorWithNote: value", value);
			return value;
		},
		plugins: [
			...ListKit,
			BoldPlugin,
      ItalicPlugin,
      UnderlinePlugin,
      H1Plugin.withComponent(H1Element),
      H2Plugin.withComponent(H2Element),
      H3Plugin.withComponent(H3Element),
      BlockquotePlugin.withComponent(BlockquoteElement),

MarkdownPlugin.configure({
	options: {
		// Add remark plugins for syntax extensions (GFM, Math, MDX)
		remarkPlugins: [remarkMath, remarkGfm, remarkMdx, remarkMention],
		// Define custom rules if needed
		rules: {
			// date: { /* ... rule implementation ... */ },
		},
	},
}),
		]
	}); // Initializes the editor instance

	return (
		<div className="h-full overflow-hidden">
			<div className="flex items-start justify-between px-3 md:px-4 py-2 bg-card border-b border-border">
				<div className="flex flex-col md:flex-row md:items-center gap-2 md:gap-3 flex-1 min-w-0">
					<h1 className="text-xl md:text-3xl text-foreground font-medium truncate">
						{note.title}
					</h1>
					{note.tags && note.tags.length > 0 && (
						<div className="flex gap-1 flex-wrap">
							{note.tags.map((tag) => (
								<span
									key={tag}
									className="bg-primary px-2 py-0.5 rounded-full text-xs font-medium text-primary-foreground"
								>
									{tag}
								</span>
							))}
						</div>
					)}
				</div>
				<div className="flex items-center space-x-2 flex-shrink-0 ml-2">
					{isSyncing ? (
						<>
							<div className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse"></div>
							<span className="text-xs md:text-sm text-muted-foreground">Syncing...</span>
						</>
					) : (
						<>
							<div className="w-2 h-2 bg-green-400 rounded-full"></div>
							<span className="text-xs md:text-sm text-muted-foreground">Saved</span>
						</>
					)}
				</div>
			</div>
			<div className="bg-background overflow-hidden h-full">
				<Plate editor={editor}
					onChange={(editor) => {

						// const markdownOutput = editor.api.markdown.serialize();
						// console.info(markdownOutput);
					}}
				>
					<EditorContainer className="h-full">
						<Editor
							placeholder="Start writing..."
							className="min-h-full bg-background text-foreground border-0 focus-visible:ring-0"
						/>
					</EditorContainer>
				</Plate>
			</div>
		</div>
	);
}



export const TTNoteEditor = ({ noteId }: PlateEditorProps) => {
	const { note, loading } = useNote(noteId);

	if (loading) {
		return <div>Loading...</div>;
	}

	if (!note) {
		return <div>Note not found</div>;
	}

	return <div>
		<PlateEditorWithNote note={note} />;
	</div>

}