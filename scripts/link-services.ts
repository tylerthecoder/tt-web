import { resolve } from 'node:path';
import { $ } from 'bun';

// Keep the sibling checkout explicit: Bun's global link registry can point elsewhere.
const root = resolve(import.meta.dir, '..');
const local = resolve(root, process.argv[2] ?? '../tt-services');
const patch = resolve(root, 'patches/tt-services.patch');
const check = await $`git -C ${local} apply --reverse --check ${patch}`.quiet().nothrow();
if (check.exitCode !== 0) {
  throw new Error(
    `Local tt-services needs the compatibility changes in ${patch}. Review and apply that patch in ${local} before linking. No files were changed.`,
  );
}
const manifestFile = Bun.file(resolve(root, 'package.json'));
const lockFile = Bun.file(resolve(root, 'bun.lock'));
const originalManifest = await manifestFile.text();
const originalLock = await lockFile.text();
const manifest = JSON.parse(originalManifest);
manifest.dependencies['tt-services'] = `link:${local}`;
for (const key of Object.keys(manifest.patchedDependencies ?? {})) {
  if (key.startsWith('tt-services@')) delete manifest.patchedDependencies[key];
}
try {
  await Bun.write(manifestFile, `${JSON.stringify(manifest, null, 2)}\n`);
  await $`bun install --ignore-scripts`.cwd(root);
  await $`bun run typecheck`.cwd(root);
  console.log(`Linked ${local}. Keep this local manifest and lockfile change out of commits.`);
} catch (error) {
  await Bun.write(manifestFile, originalManifest);
  await Bun.write(lockFile, originalLock);
  await $`bun install --frozen-lockfile --ignore-scripts`.cwd(root);
  throw error;
}
