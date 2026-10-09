'use client';

import { commandsCtx, editorViewCtx } from '@milkdown/kit/core';
import type { Ctx } from '@milkdown/kit/ctx';
import { redoCommand, undoCommand } from '@milkdown/kit/plugin/history';
import {
  bulletListSchema,
  headingSchema,
  inlineCodeSchema,
  listItemSchema,
  orderedListSchema,
  paragraphSchema,
  setBlockTypeCommand,
  toggleEmphasisCommand,
  toggleInlineCodeCommand,
  toggleStrongCommand,
  wrapInBlockTypeCommand,
} from '@milkdown/kit/preset/commonmark';
import { redoDepth, undoDepth } from '@milkdown/kit/prose/history';
import type { EditorState } from '@milkdown/kit/prose/state';
import { Bold, Code, Italic, List, ListOrdered, ListTodo, Redo2, Undo2 } from 'lucide-react';
import type { ReactNode } from 'react';

export function EditorToolbar({
  state,
  run,
  saveStatus,
}: {
  saveStatus?: ReactNode;
  state?: EditorState;
  run: (command: (ctx: Ctx) => void) => void;
}) {
  const marks = state?.storedMarks ?? state?.selection.$from.marks() ?? [];
  const marked = (name: string) =>
    state && !state.selection.empty
      ? state.doc.rangeHasMark(
          state.selection.from,
          state.selection.to,
          state.schema.marks[name],
        )
      : marks.some((mark) => mark.type.name === name);
  const buttons = [
    {
      label: 'Bold',
      Icon: Bold,
      active: marked('strong'),
      action: (ctx: Ctx) => ctx.get(commandsCtx).call(toggleStrongCommand.key),
    },
    {
      label: 'Italic',
      Icon: Italic,
      active: marked('emphasis'),
      action: (ctx: Ctx) => ctx.get(commandsCtx).call(toggleEmphasisCommand.key),
    },
    {
      label: 'Inline code',
      Icon: Code,
      active: marked('inlineCode'),
      action: (ctx: Ctx) => {
        const view = ctx.get(editorViewCtx);
        if (!view.state.selection.empty)
          return ctx.get(commandsCtx).call(toggleInlineCodeCommand.key);
        const mark = inlineCodeSchema.type(ctx);
        const current = view.state.storedMarks ?? view.state.selection.$from.marks();
        view.dispatch(
          current.some((m) => m.type === mark)
            ? view.state.tr.removeStoredMark(mark)
            : view.state.tr.addStoredMark(mark.create()),
        );
      },
    },
    {
      label: 'Bullet list',
      Icon: List,
      action: (ctx: Ctx) =>
        ctx
          .get(commandsCtx)
          .call(wrapInBlockTypeCommand.key, { nodeType: bulletListSchema.type(ctx) }),
    },
    {
      label: 'Numbered list',
      Icon: ListOrdered,
      action: (ctx: Ctx) =>
        ctx
          .get(commandsCtx)
          .call(wrapInBlockTypeCommand.key, { nodeType: orderedListSchema.type(ctx) }),
    },
    {
      label: 'Checklist',
      Icon: ListTodo,
      action: (ctx: Ctx) =>
        ctx.get(commandsCtx).call(wrapInBlockTypeCommand.key, {
          nodeType: listItemSchema.type(ctx),
          attrs: { checked: false },
        }),
    },
    {
      label: 'Undo',
      Icon: Undo2,
      disabled: !state || !undoDepth(state),
      action: (ctx: Ctx) => ctx.get(commandsCtx).call(undoCommand.key),
    },
    {
      label: 'Redo',
      Icon: Redo2,
      disabled: !state || !redoDepth(state),
      action: (ctx: Ctx) => ctx.get(commandsCtx).call(redoCommand.key),
    },
  ];
  const heading = state?.selection.$from.parent;
  return (
    // biome-ignore lint/a11y/useSemanticElements: A toolbar group is not a form fieldset.
    <div
      role="group"
      aria-label="Formatting"
      className="flex shrink-0 items-start border-b border-gray-700 bg-gray-900 px-2 py-1"
    >
      <div className="flex min-w-0 flex-1 flex-wrap items-center gap-0.5">
        <select
          aria-label="Paragraph style"
          disabled={!state}
          value={heading?.type.name === 'heading' ? heading.attrs.level : 0}
          className="min-h-11 rounded-sm bg-gray-800 px-2 text-base text-gray-100"
          onChange={(event) => {
            const level = Number(event.target.value);
            run((ctx) => {
              ctx.get(commandsCtx).call(setBlockTypeCommand.key, {
                nodeType: level ? headingSchema.type(ctx) : paragraphSchema.type(ctx),
                attrs: level ? { level } : undefined,
              });
            });
          }}
        >
          <option value="0">Paragraph</option>
          {[1, 2, 3, 4, 5, 6].map((level) => (
            <option key={level} value={level}>
              Heading {level}
            </option>
          ))}
        </select>
        {buttons.map(({ label, Icon, action, active, disabled }) => (
          <button
            key={label}
            type="button"
            aria-label={label}
            title={label}
            aria-pressed={active}
            disabled={!state || disabled}
            className={`flex h-11 w-11 items-center justify-center rounded-sm hover:bg-gray-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-300 disabled:opacity-30 ${active ? 'bg-blue-900 text-blue-100' : 'text-gray-300'}`}
            onPointerDown={(event) => event.preventDefault()}
            onClick={() => run(action)}
          >
            <Icon size={19} aria-hidden="true" />
          </button>
        ))}
      </div>
      {saveStatus && (
        <div className="ml-auto flex h-11 shrink-0 items-center pl-2">{saveStatus}</div>
      )}
    </div>
  );
}
