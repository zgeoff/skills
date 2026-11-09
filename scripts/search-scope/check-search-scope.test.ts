import { expect, onTestFinished, test } from 'bun:test';
import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { $ } from 'bun';

async function setupTest() {
  const directory = await mkdtemp(join(tmpdir(), 'search-scope-'));

  onTestFinished(() => rm(directory, { recursive: true, force: true }));

  const repoPath = join(directory, 'repo');
  const plainPath = join(directory, 'plain');
  await mkdir(repoPath);
  await mkdir(plainPath);
  await $`git init -q`.cwd(repoPath);

  const scriptPath = join(import.meta.dir, 'check-search-scope.ts');

  const writeRepoFile = async (path: string, text: string) => {
    await mkdir(dirname(join(repoPath, path)), { recursive: true });
    await writeFile(join(repoPath, path), text);
  };
  // The ceiling keeps git from finding a repo above the temp folder, such as the checkout.
  const run = (...args: readonly string[]) =>
    $`bun ${scriptPath} ${args}`
      .env({ ...process.env, GIT_CEILING_DIRECTORIES: directory })
      .nothrow()
      .quiet();

  return { repoPath, plainPath, writeRepoFile, run };
}

test('it fails and lists each unscoped search in the repo', async () => {
  const ctx = await setupTest();
  await ctx.writeRepoFile('docs/report.md', '# Report\n\n`gh search prs --author pip-moss`\n');
  await ctx.writeRepoFile('docs/scoped.md', '`gh search prs --author pip-moss --owner acme`\n');

  const result = await ctx.run(ctx.repoPath);

  expect({
    exitCode: result.exitCode,
    stdout: result.stdout.toString(),
    stderr: result.stderr.toString(),
  }).toStrictEqual({
    exitCode: 1,
    stdout:
      'docs/report.md:3: `gh search prs --author pip-moss`\n' +
      'Each GitHub search above filters by a person, such as with author: or --involves, and names no owner, so it returns results from every org that person works in. Add an owner:, user:, org: or repo: qualifier, or the --owner or --repo flag, to the same command.\n',
    stderr: '',
  });
});

test('it passes a repo whose searches each name an owner', async () => {
  const ctx = await setupTest();
  await ctx.writeRepoFile('docs/scoped.md', '`gh search prs --author pip-moss --owner acme`\n');

  const result = await ctx.run(ctx.repoPath);

  expect({
    exitCode: result.exitCode,
    stdout: result.stdout.toString(),
    stderr: result.stderr.toString(),
  }).toStrictEqual({ exitCode: 0, stdout: '', stderr: '' });
});

test('it skips its own tests, which hold unscoped searches', async () => {
  const ctx = await setupTest();
  await ctx.writeRepoFile(
    'scripts/search-scope/example.test.ts',
    "const line = 'gh search prs --author pip-moss';\n",
  );

  const result = await ctx.run(ctx.repoPath);

  expect({
    exitCode: result.exitCode,
    stdout: result.stdout.toString(),
    stderr: result.stderr.toString(),
  }).toStrictEqual({ exitCode: 0, stdout: '', stderr: '' });
});

test('it exits 2 with its usage when no repo root is given', async () => {
  const ctx = await setupTest();

  const result = await ctx.run();

  expect({
    exitCode: result.exitCode,
    stdout: result.stdout.toString(),
    stderr: result.stderr.toString(),
  }).toStrictEqual({
    exitCode: 2,
    stdout: '',
    stderr: 'usage: bun scripts/search-scope/check-search-scope.ts <repo root>\n',
  });
});

test('it exits with git grep’s error when the root is not a git repo', async () => {
  const ctx = await setupTest();

  const result = await ctx.run(ctx.plainPath);

  expect({
    exitCode: result.exitCode,
    stdout: result.stdout.toString(),
    stderr: result.stderr.toString(),
  }).toStrictEqual({
    exitCode: 128,
    stdout: '',
    stderr: expect.stringContaining('not a git repository'),
  });
});
