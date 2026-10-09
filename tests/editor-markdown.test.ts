import { describe, expect, test } from 'bun:test';
import type { MarkdownNode } from '@milkdown/kit/transformer';
import { toMarkdown } from 'mdast-util-to-markdown';
import remarkParse from 'remark-parse';
import remarkStringify from 'remark-stringify';
import { unified } from 'unified';
import {
  noteRootHandler,
  noteTextHandler,
  preserveNoteBlankLines,
} from '../app/components/note-editor/markdown';

const handlers = { root: noteRootHandler, text: noteTextHandler };
const processor = unified().use(remarkParse).use(remarkStringify, { handlers });
function roundTrip(source: string) {
  const tree = processor.parse(source);
  preserveNoteBlankLines(tree as MarkdownNode, source);
  return processor.stringify(tree);
}
function textMarkdown(value: string) {
  return toMarkdown(
    {
      type: 'root',
      children: [
        {
          type: 'paragraph',
          children: [{ type: 'text', value }],
        },
      ],
    },
    { handlers },
  );
}

describe('note Markdown spacing', () => {
  for (const source of [
    'First\n\nSecond\n',
    'First\n\n\nSecond\n',
    '\n\nFirst\n\n\n\nSecond\n\n\n',
    '# Heading\n\n\nParagraph\n\n\n',
    '\n',
    '\n\n\n',
    '',
    ' First \n',
    '**Bold** \n',
  ]) {
    test(`retains top-level blank lines ${JSON.stringify(source)}`, () => {
      expect(roundTrip(source)).toBe(source);
      expect(roundTrip(roundTrip(source))).toBe(source);
    });
  }

  test('new empty paragraphs become Markdown blank lines', () => {
    expect(
      toMarkdown(
        {
          type: 'root',
          children: [
            { type: 'paragraph', children: [{ type: 'text', value: 'First' }] },
            { type: 'paragraph', children: [] },
            { type: 'paragraph', children: [{ type: 'text', value: 'Second' }] },
            { type: 'paragraph', children: [] },
          ],
        },
        { handlers },
      ),
    ).toBe('First\n\n\nSecond\n\n');
  });

  test('a single empty editor paragraph is an empty note', () => {
    expect(
      toMarkdown(
        { type: 'root', children: [{ type: 'paragraph', children: [] }] },
        { handlers },
      ),
    ).toBe('');
  });

  test('ordinary boundary spaces stay ordinary spaces', () => {
    expect(textMarkdown('First ')).toBe('First \n');
    expect(textMarkdown(' First')).toBe(' First\n');
    expect(textMarkdown(' First ')).toBe(' First \n');
  });

  test('syntax-protecting escapes remain for indentation and hard breaks', () => {
    expect(textMarkdown('    First')).toContain('&#x20;');
    expect(textMarkdown('First  ')).toContain('&#x20;');
  });

  test('literal entity text is not decoded', () => {
    const result = textMarkdown('Literal &#x20; and &nbsp; ');
    expect(result).toContain('\\&#x20;');
    expect(result).toContain('\\&nbsp;');
    expect(result).toEndWith(' \n');
  });

  test('preserves authored HTML and code contents', () => {
    const source = 'Before\n\n<br />\n\nAfter\n\n```html\n<br />\n&#x20;\n\n\n```\n';
    expect(roundTrip(source)).toBe(source);
  });

  test('nested structures retain normal Markdown semantics', () => {
    const source = '> Quoted\n>\n> Paragraph\n\n* List item\n\n  Another paragraph\n';
    const result = roundTrip(source);
    const semanticTree = (markdown: string) =>
      JSON.parse(
        JSON.stringify(processor.parse(markdown), (key, value) =>
          key === 'position' ? undefined : value,
        ),
      );
    expect(semanticTree(result)).toEqual(semanticTree(source));
    expect(roundTrip(result)).toBe(result);
  });

  test('hard breaks stay hard breaks', () => {
    expect(roundTrip('First\\\nSecond\n')).toBe('First\\\nSecond\n');
  });
});
