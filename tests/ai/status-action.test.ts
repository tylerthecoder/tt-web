import { expect, test } from 'bun:test';

test('status action authenticates concurrent reads without acquiring a held lease', async () => {
  // Isolate server dependency mocks from the rest of the test suite.
  const subprocess = Bun.spawn(
    [process.execPath, `${import.meta.dir}/fixtures/status-action.ts`],
    {
      cwd: `${import.meta.dir}/../..`,
      stdout: 'pipe',
      stderr: 'pipe',
    },
  );
  const [exitCode, stderr] = await Promise.all([
    subprocess.exited,
    new Response(subprocess.stderr).text(),
  ]);
  expect(stderr).toBe('');
  expect(exitCode).toBe(0);
});
