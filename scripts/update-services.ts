// Changes local files only. The workflow validates them before opening a PR.
const manifest = await Bun.file('package.json').json();
const response = await fetch(
  'https://api.github.com/repos/tylerthecoder/tt-services/commits/main',
  {
    headers: process.env.GH_TOKEN ? { Authorization: `Bearer ${process.env.GH_TOKEN}` } : {},
  },
);
if (!response.ok) throw new Error(`GitHub returned ${response.status}`);
const { sha } = (await response.json()) as { sha: string };
if (!/^[a-f0-9]{40}$/.test(sha)) throw new Error('GitHub did not return a valid commit SHA');
manifest.dependencies['tt-services'] = `github:tylerthecoder/tt-services#${sha}`;
const patches = manifest.patchedDependencies ?? {};
for (const key of Object.keys(patches)) {
  if (key.startsWith('tt-services@')) {
    const patch = patches[key];
    delete patches[key];
    patches[`tt-services@github:tylerthecoder/tt-services#${sha.slice(0, 7)}`] = patch;
  }
}
await Bun.write('package.json', `${JSON.stringify(manifest, null, 2)}\n`);
console.log(`Prepared tt-services revision ${sha}`);

export {};
