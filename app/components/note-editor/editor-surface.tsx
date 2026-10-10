'use client';

import '@milkdown/crepe/theme/common/style.css';
import '@milkdown/crepe/theme/frame-dark.css';

import { Crepe } from '@milkdown/crepe';
import { editorViewCtx, editorViewOptionsCtx, serializerCtx } from '@milkdown/kit/core';
import type { Ctx } from '@milkdown/kit/ctx';
import { uploadConfig } from '@milkdown/kit/plugin/upload';
import { docSchema, remarkPreserveEmptyLinePlugin } from '@milkdown/kit/preset/commonmark';
import { type EditorState, Plugin } from '@milkdown/kit/prose/state';
import { $prose } from '@milkdown/kit/utils';
import { Milkdown, MilkdownProvider, useEditor } from '@milkdown/react';
import { type ReactNode, useEffect, useRef, useState } from 'react';

import { EditorToolbar } from './editor-toolbar';
import { configureNoteMarkdown, noteMarkdownPlugins } from './markdown';

export interface EditorSurfaceProps {
  initialContent: string;
  saveStatus?: ReactNode;
  readOnly?: boolean;
  onChange: (content: string) => void;
  onSave: () => void;
}

function Surface({
  initialContent,
  onChange,
  onSave,
  readOnly = false,
  saveStatus,
}: EditorSurfaceProps) {
  const [editorError, setEditorError] = useState<string | null>(null);
  const crepeRef = useRef<Crepe | undefined>(undefined);
  const callbacks = useRef({ onChange, onSave });
  callbacks.current = { onChange, onSave };
  const [state, setState] = useState<EditorState>();
  const { loading, get } = useEditor((root) => {
    const rejectLocalImage = async () => {
      setEditorError(
        'Image files are not uploaded by this app. Insert a hosted image link instead.',
      );
      return '';
    };
    const crepe = new Crepe({
      root,
      defaultValue: initialContent,
      featureConfigs: { [Crepe.Feature.ImageBlock]: { onUpload: rejectLocalImage } },
    });
    void crepe.editor.remove([docSchema, ...remarkPreserveEmptyLinePlugin]);
    crepe.editor
      .use(noteMarkdownPlugins)
      .config(configureNoteMarkdown)
      .config((ctx) => {
        ctx.update(uploadConfig.key, (options) => ({
          ...options,
          uploader: async () => {
            await rejectLocalImage();
            return [];
          },
        }));
        ctx.update(editorViewOptionsCtx, (options) => ({
          ...options,
          attributes: {
            'aria-label': 'Note content',
            'aria-multiline': 'true',
            spellcheck: 'true',
          },
        }));
      });
    // Capture each document transaction, rather than the debounced listener:
    // closing a modal immediately after typing must not lose the final characters.
    crepe.editor.use(
      $prose(
        (ctx) =>
          new Plugin({
            props: {
              handleKeyDown: (_view, event) => {
                if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 's') {
                  event.preventDefault();
                  callbacks.current.onSave();
                  return true;
                }
                return false;
              },
            },
            view: (view) => {
              setState(view.state);
              return {
                update: (view, previous) => {
                  setState(view.state);
                  if (!view.state.doc.eq(previous.doc)) {
                    callbacks.current.onChange(ctx.get(serializerCtx)(view.state.doc));
                  }
                },
              };
            },
          }),
      ),
    );
    crepeRef.current = crepe;
    return crepe;
  });

  useEffect(() => {
    if (!loading) crepeRef.current?.setReadonly(readOnly);
  }, [readOnly, loading]);

  const run = (command: (ctx: Ctx) => void) =>
    get()?.action((ctx) => {
      command(ctx);
      ctx.get(editorViewCtx).focus();
    });
  return (
    <>
      {editorError && (
        <div
          role="alert"
          className="flex items-center justify-between gap-2 bg-amber-950 px-3 py-2 text-sm text-amber-100"
        >
          {editorError}
          <button type="button" className="editor-button" onClick={() => setEditorError(null)}>
            Dismiss
          </button>
        </div>
      )}
      <EditorToolbar saveStatus={saveStatus} state={readOnly ? undefined : state} run={run} />
      <div className="note-editor-surface relative min-h-0 flex-1" aria-busy={loading}>
        {loading && (
          <div className="p-4 text-gray-400" role="status">
            Loading editor…
          </div>
        )}
        <Milkdown />
      </div>
    </>
  );
}

export function EditorSurface(props: EditorSurfaceProps) {
  return (
    <MilkdownProvider>
      <Surface {...props} />
    </MilkdownProvider>
  );
}
