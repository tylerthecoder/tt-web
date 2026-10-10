import { remarkPluginsCtx, remarkStringifyOptionsCtx } from '@milkdown/kit/core';
import type { Ctx } from '@milkdown/kit/ctx';
import { trailingConfig } from '@milkdown/kit/plugin/trailing';
import { paragraphSchema } from '@milkdown/kit/preset/commonmark';
import type { MarkdownNode } from '@milkdown/kit/transformer';
import { $node } from '@milkdown/kit/utils';
import { defaultHandlers, type Handle, type Join } from 'mdast-util-to-markdown';

const blankLinesKey = 'noteBlankLines';

function isEmptyParagraph(node: { type: string; children?: unknown[] }) {
  return node.type === 'paragraph' && !node.children?.length;
}

/** CommonMark discards surplus blank lines. Keep them as editable empty paragraphs. */
export function preserveNoteBlankLines(tree: MarkdownNode, source: string) {
  if (tree.type !== 'root' || !tree.children) return;
  const children: MarkdownNode[] = [];
  const addBlankLines = (count: number) => {
    for (let index = 0; index < count; index++) {
      children.push({ type: 'paragraph', children: [], [blankLinesKey]: 1 });
    }
  };
  let previousEnd = 0;
  let seenBlock = false;
  for (const child of tree.children) {
    const start = child.position?.start.offset;
    const end = child.position?.end.offset;
    if (start !== undefined && end !== undefined) {
      const gap = source.slice(previousEnd, start);
      if (/^[\t \r\n]*$/.test(gap)) {
        const newlines = (gap.match(/\n/g) || []).length;
        addBlankLines(Math.max(0, newlines - (seenBlock ? 2 : 0)));
      }
      if (child.type === 'paragraph' && child.children?.length) {
        // CommonMark discards a literal edge space; restore the safe single-space
        // case so saving the newly readable Markdown again is stable.
        const lineStart = source.lastIndexOf('\n', start - 1) + 1;
        if (source.slice(lineStart, start) === ' ') {
          child.children.unshift({ type: 'text', value: ' ' });
        }
        const lastChild = child.children[child.children.length - 1];
        const inlineEnd = lastChild.position?.end.offset;
        if (inlineEnd !== undefined && source.slice(inlineEnd, end) === ' ') {
          child.children.push({ type: 'text', value: ' ' });
        }
      }
      previousEnd = end;
    }
    children.push(child);
    seenBlock = true;
  }
  const suffix = source.slice(previousEnd);
  if (/^[\t \r\n]*$/.test(suffix)) {
    addBlankLines(Math.max(0, (suffix.match(/\n/g) || []).length - (seenBlock ? 1 : 0)));
  }
  tree.children = children;
}

/** Preserve final blank paragraphs too; the upstream doc serializer always drops one. */
export const noteDocumentSchema = $node('doc', () => ({
  content: 'block+',
  parseMarkdown: {
    match: ({ type }) => type === 'root',
    runner: (state, node, type) => state.injectRoot(node, type),
  },
  toMarkdown: {
    match: (node) => node.type.name === 'doc',
    runner: (state, node) => {
      state.openNode('root');
      state.next(node.content);
    },
  },
}));

/** Only a single edge space is safe to emit literally. Keep syntax-protecting escapes. */
export const noteTextHandler: Handle = (node, parent, state, info) => {
  let result = defaultHandlers.text(node, parent, state, info);
  const value = 'value' in node && typeof node.value === 'string' ? node.value : '';
  if (/^ (?! )/.test(value) && result.startsWith('&#x20;')) {
    result = ` ${result.slice(6)}`;
  }
  if (/(?<! ) $/.test(value) && result.endsWith('&#x20;')) {
    result = `${result.slice(0, -6)} `;
  }
  return result;
};

/** Fold only structural empty paragraphs into newlines, never replace authored HTML. */
export const noteRootHandler: Handle = (node, parent, state, info) => {
  if (!('children' in node)) return defaultHandlers.root(node, parent, state, info);
  const children = node.children;
  const blocks: typeof children = [];
  const blankLinesBefore = new Map<object, number>();
  let pending = 0;
  let leading = 0;
  for (let index = 0; index < children.length; index++) {
    const child = children[index];
    if (isEmptyParagraph(child)) {
      const explicit = (child as unknown as MarkdownNode)[blankLinesKey];
      // A generated trailing typing area is not content. Once it is in the middle,
      // it represents a user-inserted paragraph and must contribute a blank line.
      const count = typeof explicit === 'number' ? explicit : 1;
      pending += count === 0 && index < children.length - 1 ? 1 : count;
    } else {
      if (!blocks.length) leading = pending;
      else blankLinesBefore.set(child, pending);
      pending = 0;
      blocks.push(child);
    }
  }
  if (!blocks.length) {
    // One unmarked empty paragraph is the empty document itself.
    const onlyDefaultEmpty =
      children.length === 1 && (children[0] as unknown as MarkdownNode)[blankLinesKey] == null;
    return '\n'.repeat(onlyDefaultEmpty ? 0 : pending);
  }

  const previousJoin = state.join;
  const addExtraBlankLines: Join = (left, right, container, currentState) => {
    const extra = blankLinesBefore.get(right) || 0;
    if (!extra) return;
    for (let index = previousJoin.length - 1; index >= 0; index--) {
      const result = previousJoin[index](left, right, container, currentState);
      // Keep the separator that prevents two lists/code blocks from merging.
      if (result === false) return false;
      if (result === true) return 1 + extra;
      if (typeof result === 'number') return result + extra;
    }
    return 1 + extra;
  };
  state.join = [...previousJoin, addExtraBlankLines];
  try {
    return (
      '\n'.repeat(leading) +
      defaultHandlers.root({ ...node, children: blocks }, parent, state, info) +
      '\n'.repeat(1 + pending)
    );
  } finally {
    state.join = previousJoin;
  }
};

export const noteMarkdownPlugins = [noteDocumentSchema];

export function configureNoteMarkdown(ctx: Ctx) {
  // Config runs before Milkdown's remark plugins register at InitReady. Preserve
  // spacing first: the image and math transforms replace nodes without positions.
  ctx.update(remarkPluginsCtx, (plugins) => [
    {
      plugin: () => (tree, file) => {
        preserveNoteBlankLines(tree as MarkdownNode, String(file));
      },
      options: {},
    },
    ...plugins,
  ]);
  ctx.update(paragraphSchema.key, (previous) => (context) => {
    const schema = previous(context);
    return {
      ...schema,
      attrs: { ...schema.attrs, [blankLinesKey]: { default: null } },
      parseMarkdown: {
        ...schema.parseMarkdown,
        runner: (state, node, type) => {
          if (!isEmptyParagraph(node)) return schema.parseMarkdown.runner(state, node, type);
          state.openNode(type, { [blankLinesKey]: node[blankLinesKey] ?? null });
          state.closeNode();
        },
      },
      toMarkdown: {
        ...schema.toMarkdown,
        runner: (state, node) => {
          if (node.content.size) return schema.toMarkdown.runner(state, node);
          state.addNode('paragraph', [], undefined, {
            [blankLinesKey]: node.attrs[blankLinesKey],
          });
        },
      },
    };
  });
  ctx.update(remarkStringifyOptionsCtx, (options) => ({
    ...options,
    handlers: { ...options.handlers, root: noteRootHandler, text: noteTextHandler },
  }));
  ctx.update(trailingConfig.key, (options) => ({
    ...options,
    getNode: (state) => state.schema.nodes.paragraph.create({ [blankLinesKey]: 0 }),
  }));
}
