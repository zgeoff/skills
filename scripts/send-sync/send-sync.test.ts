import { expect, onTestFinished, test } from 'bun:test';
import { chmod, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { $ } from 'bun';

async function setupTest() {
  const directory = await mkdtemp(join(tmpdir(), 'send-sync-'));

  onTestFinished(() => rm(directory, { recursive: true, force: true }));

  const callsPath = join(directory, 'gh-calls.log');

  await writeFile(
    join(directory, 'gh'),
    [
      '#!/usr/bin/env bash',
      `printf '%s %s\\n' "$GH_TOKEN" "$*" >> '${callsPath}'`,
      'if [[ "$2" == */commits/* ]]; then echo "$GH_STUB_HEAD"; fi',
      '',
    ].join('\n'),
  );
  await chmod(join(directory, 'gh'), 0o755);

  const run = async (env: Record<string, string>) => {
    const result = await $`bun ${join(import.meta.dir, 'send-sync.ts')}`
      .env({ ...process.env, PATH: `${directory}:${process.env['PATH']}`, ...env })
      .nothrow()
      .quiet();

    return {
      exitCode: result.exitCode,
      stdout: result.stdout.toString(),
      stderr: result.stderr.toString(),
    };
  };

  const readCalls = async () => (await readFile(callsPath, 'utf8').catch(() => '')).split('\n');

  return { run, readCalls };
}

test('it sends the commit to zgeoff/tools when the commit is the branch head', async () => {
  const ctx = await setupTest();

  const result = await ctx.run({
    GITHUB_SHA: 'a1b2c3d',
    GITHUB_REPOSITORY: 'acme/widgets',
    GITHUB_REF_NAME: 'main',
    GH_TOKEN: 'repo-token',
    TOOLS_TOKEN: 'tools-token',
    GH_STUB_HEAD: 'a1b2c3d',
  });

  expect(result).toStrictEqual({
    exitCode: 0,
    stdout: 'sent a1b2c3d to zgeoff/tools\n',
    stderr: '',
  });
  expect(await ctx.readCalls()).toStrictEqual([
    'repo-token api repos/acme/widgets/commits/main --jq .sha',
    'tools-token api --silent repos/zgeoff/tools/dispatches -f event_type=zgeoff-skills-sync -f client_payload[sha]=a1b2c3d',
    '',
  ]);
});

test('it sends nothing when a newer commit is the branch head', async () => {
  const ctx = await setupTest();

  const result = await ctx.run({
    GITHUB_SHA: 'a1b2c3d',
    GITHUB_REPOSITORY: 'acme/widgets',
    GITHUB_REF_NAME: 'main',
    GH_TOKEN: 'repo-token',
    TOOLS_TOKEN: 'tools-token',
    GH_STUB_HEAD: 'e4f5a6b',
  });

  expect(result).toStrictEqual({
    exitCode: 0,
    stdout: 'skipped a1b2c3d: the branch head is now e4f5a6b, whose run sends it\n',
    stderr: '',
  });
  expect(await ctx.readCalls()).toStrictEqual([
    'repo-token api repos/acme/widgets/commits/main --jq .sha',
    '',
  ]);
});

test('it stops before it calls GitHub when the tools token is unset', async () => {
  const ctx = await setupTest();

  const result = await ctx.run({
    GITHUB_SHA: 'a1b2c3d',
    GITHUB_REPOSITORY: 'acme/widgets',
    GITHUB_REF_NAME: 'main',
    GH_TOKEN: 'repo-token',
    TOOLS_TOKEN: '',
    GH_STUB_HEAD: 'a1b2c3d',
  });

  expect({ exitCode: result.exitCode, stdout: result.stdout }).toStrictEqual({
    exitCode: 1,
    stdout: '',
  });
  expect(result.stderr).toContain('send-sync: set TOOLS_TOKEN');
  expect(await ctx.readCalls()).toStrictEqual(['']);
});
