import { expect, onTestFinished, test } from 'bun:test';
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { $ } from 'bun';

async function setupTest() {
  const directory = await mkdtemp(join(tmpdir(), 'first-publish-'));

  onTestFinished(() => rm(directory, { recursive: true, force: true }));

  const scriptPath = fileURLToPath(new URL('first-publish.sh', import.meta.url));
  const planPath = join(directory, 'plan.json');

  // stdin is a pipe, never a terminal, so the publisher's run stops before it logs in.
  const run = async (...args: readonly string[]) => {
    const result = await $`bash ${scriptPath} ${args} < /dev/null`
      .cwd(directory)
      .env({ ...process.env, NPM_FIRST_PUBLISH_PLAN: planPath })
      .nothrow()
      .quiet();

    return { exitCode: result.exitCode, stderr: result.stderr.toString().trim() };
  };

  return { directory, planPath, run };
}

test('it stops the publisher when no check saved a plan', async () => {
  const ctx = await setupTest();

  expect(await ctx.run()).toStrictEqual({
    exitCode: 1,
    stderr: '✗ no plan to publish. Ask the agent to run the check first',
  });
});

test('it stops the publisher outside a terminal, before it logs in', async () => {
  const ctx = await setupTest();
  await writeFile(
    ctx.planPath,
    JSON.stringify({
      repo: ctx.directory,
      slug: 'acme/kettle',
      ref: 'abc1234',
      workflow: 'release.yml',
      trust: false,
      packages: [{ dir: 'packages/kettle', name: '@acme/kettle', version: '0.0.1' }],
    }),
  );

  expect(await ctx.run()).toStrictEqual({
    exitCode: 1,
    stderr: '✗ run this in a terminal: npm needs one for login and 2FA',
  });
});

test('it asks for a package folder when check names none', async () => {
  const ctx = await setupTest();

  expect(await ctx.run('check', 'release.yml')).toStrictEqual({
    exitCode: 1,
    stderr: '✗ name at least one package folder, such as packages/core',
  });
});

test('it rejects a flag it does not know', async () => {
  const ctx = await setupTest();

  expect(await ctx.run('trust', 'packages/kettle', '--force')).toStrictEqual({
    exitCode: 1,
    stderr: '✗ unknown flag: --force',
  });
});

test('it prints the usage for an unknown command', async () => {
  const ctx = await setupTest();

  expect(await ctx.run('publish')).toStrictEqual({
    exitCode: 1,
    stderr: '✗ usage: first-publish.sh [check|trust <pkg-dir>... [workflow-file] [--trust]]',
  });
});
