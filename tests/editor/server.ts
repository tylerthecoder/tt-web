import { mkdir, readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';

const output = await mkdir(join(tmpdir(), 'tt-web-editor-tests'), { recursive: true }).then(() =>
  join(tmpdir(), 'tt-web-editor-tests'),
);
const mock = await readFile('tests/editor/mock-actions.ts', 'utf8');
const realActions = await readFile('app/(panel)/actions.ts', 'utf8');
const missing = [...realActions.matchAll(/export async function (\w+)/g)]
  .map((match) => match[1])
  .filter((name) => !mock.includes(`function ${name}(`));
const result = await Bun.build({
  entrypoints: ['tests/editor/fixture.tsx'],
  outdir: output,
  target: 'browser',
  define: { 'process.env.NODE_ENV': JSON.stringify('development') },
  plugins: [
    {
      name: 'mock-server-actions',
      setup(build) {
        build.onLoad({ filter: /\/app\/\(panel\)\/actions\.ts$/ }, () => ({
          loader: 'ts',
          contents:
            mock +
            '\n' +
            missing
              .map(
                (name) =>
                  `export async function ${name}() { throw new Error('Unexpected fixture action: ${name}'); }`,
              )
              .join('\n'),
        }));
        build.onLoad({ filter: /\/app\/google\/docs\/actions\.ts$/ }, () => ({
          loader: 'ts',
          contents:
            'export async function getGoogleDriveFileById() { return { success: true, file: null }; }',
        }));
      },
    },
  ],
});
if (!result.success) {
  console.error(result.logs);
  process.exit(1);
}
const css = Bun.spawn(
  ['bun', 'x', 'tailwindcss', '-i', 'app/global.css', '-o', join(output, 'global.css')],
  { stdout: 'ignore', stderr: 'inherit' },
);
if (await css.exited) process.exit(1);
Bun.serve({
  hostname: '127.0.0.1',
  port: 4319,
  fetch(request) {
    const pathname = new URL(request.url).pathname;
    if (pathname === '/')
      return new Response(
        '<!doctype html><html><head><meta name="viewport" content="width=device-width,initial-scale=1"><link rel="stylesheet" href="/fixture.css"><link rel="stylesheet" href="/global.css"></head><body><div id="root"></div><script type="module" src="/fixture.js"></script></body></html>',
        { headers: { 'content-type': 'text/html' } },
      );
    if (['/fixture.js', '/fixture.css', '/global.css'].includes(pathname))
      return new Response(Bun.file(join(output, pathname.slice(1))));
    return new Response('Not found', { status: 404 });
  },
});
console.log('Editor fixture at http://127.0.0.1:4319');
