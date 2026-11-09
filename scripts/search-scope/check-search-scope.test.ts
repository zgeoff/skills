import { expect, onTestFinished, test } from 'bun:test';
import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { $ } from 'bun';

async function setupTest() {
  const directory = await mkdtemp(join(tmpdir(), 'search-scope-'));

  onTestFinished(() => rm(directory, { recursive: true, force: true }));

  await $`git init -q`.cwd(directory);

  const scriptPath = fileURLToPath(new URL('check-search-scope.ts', import.meta.url));

  const writeRepoFile = async (path: string, text: string) => {
    await mkdir(dirname(join(directory, path)), { recursive: true });
    await writeFile(join(directory, path), text);
  };
  const run = () => $`bun ${scriptPath} ${directory}`.nothrow().quiet();

  return { writeRepoFile, run };
}

test('it fails and lists each author-only search in the repo', async () => {
  const ctx = await setupTest();
  await ctx.writeRepoFile('docs/report.md', '# Report\n\n`gh search prs --author pip-moss`\n');
  await ctx.writeRepoFile('docs/scoped.md', '`gh search prs --author pip-moss --owner acme`\n');

  const result = await ctx.run();

  expect({
    exitCode: result.exitCode,
    stdout: result.stdout.toString(),
    stderr: result.stderr.toString(),
  }).toStrictEqual({
    exitCode: 1,
    stdout:
      'docs/report.md:3: `gh search prs --author pip-moss`\n' +
      'Each GitHub search above filters by author with no owner, so it returns PRs and issues from every org the author works in. Add an owner:, user:, org: or repo: qualifier, or the --owner or --repo flag, on the same line.\n',
    stderr: '',
  });
});

test('it passes a repo whose searches each name an owner', async () => {
  const ctx = await setupTest();
  await ctx.writeRepoFile('docs/scoped.md', '`gh search prs --author pip-moss --owner acme`\n');

  const result = await ctx.run();

  expect({
    exitCode: result.exitCode,
    stdout: result.stdout.toString(),
    stderr: result.stderr.toString(),
  }).toStrictEqual({ exitCode: 0, stdout: '', stderr: '' });
});

test('it skips its own tests, which hold author-only searches', async () => {
  const ctx = await setupTest();
  await ctx.writeRepoFile(
    'scripts/search-scope/example.test.ts',
    "const line = 'gh search prs --author pip-moss';\n",
  );

  const result = await ctx.run();

  expect({ exitCode: result.exitCode, stdout: result.stdout.toString() }).toStrictEqual({
    exitCode: 0,
    stdout: '',
  });
});
