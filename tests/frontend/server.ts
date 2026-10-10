import { mkdir, readFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import tailwind from '@tailwindcss/postcss';
import postcss from 'postcss';

const output = join(tmpdir(), 'tt-web-frontend-tests');
await mkdir(output, { recursive: true });
const result = await Bun.build({
  entrypoints: [
    'tests/frontend/fixture.tsx',
    'tests/frontend/chat-fixture.tsx',
    'tests/frontend/agent-fixture.tsx',
  ],
  outdir: output,
  target: 'browser',
  define: { 'process.env.NODE_ENV': JSON.stringify('development') },
  plugins: [
    {
      name: 'isolated-navigation-and-notes',
      setup(build) {
        build.onLoad({ filter: /\/next\/link\.js$/ }, () => ({
          loader: 'js',
          contents:
            'import { createElement } from "react"; export default function Link({href,children,...props}) { return createElement("a", {...props,href}, children); }',
        }));
        build.onLoad({ filter: /\/app\/\(panel\)\/ai\/actions\.ts$/ }, async () => ({
          loader: 'ts',
          contents: await readFile('tests/frontend/mock-chat-actions.ts', 'utf8'),
        }));
        build.onLoad({ filter: /\/app\/\(panel\)\/agent\/actions\.ts$/ }, async () => ({
          loader: 'ts',
          contents: await readFile('tests/frontend/mock-agent-actions.ts', 'utf8'),
        }));
        build.onLoad({ filter: /\/app\/\(panel\)\/hooks\.ts$/ }, () => ({
          loader: 'ts',
          contents:
            'export function useNotesIndex() { return { data: { notes: [] } }; } export function useNoteMetadata() { return { data: null }; }',
        }));
        build.onLoad({ filter: /\/next\/navigation\.js$/ }, () => ({
          loader: 'js',
          contents:
            'export function useRouter() { return { push(path) { window.testNavigation = path; } }; }',
        }));
      },
    },
  ],
});
if (!result.success) throw new Error(String(result.logs));
const css = await postcss([tailwind()]).process(await readFile('app/global.css', 'utf8'), {
  from: 'app/global.css',
});
await Bun.write(join(output, 'global.css'), css.css);
Bun.serve({
  hostname: '127.0.0.1',
  port: 4320,
  fetch(request) {
    const pathname = new URL(request.url).pathname;
    if (pathname === '/' || pathname === '/chat' || pathname === '/agent')
      return new Response(
        '<!doctype html><html><head><meta name="viewport" content="width=device-width,initial-scale=1"><link rel="stylesheet" href="/global.css"></head><body><div id="root"></div><script type="module" src="/' +
          (pathname === '/chat'
            ? 'chat-fixture'
            : pathname === '/agent'
              ? 'agent-fixture'
              : 'fixture') +
          '.js"></script></body></html>',
        { headers: { 'content-type': 'text/html' } },
      );
    if (
      ['/fixture.js', '/chat-fixture.js', '/agent-fixture.js', '/global.css'].includes(pathname)
    )
      return new Response(Bun.file(join(output, pathname.slice(1))));
    return new Response('Not found', { status: 404 });
  },
});
