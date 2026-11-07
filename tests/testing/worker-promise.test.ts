import { expect, test } from 'bun:test';
import { fileURLToPath } from 'node:url';
import { $ } from 'bun';

const fixturePath = fileURLToPath(new URL('worker-promise.fixture.ts', import.meta.url));

// Each form that hangs never returns, so the fixture runs in a child `bun test` with a short
// timeout, and the parent reads whether the child's test timed out.
async function runFixtureTest(name: string) {
  const result = await $`${process.execPath} test ${fixturePath} --timeout 500 -t ${`^${name}$`}`
    .nothrow()
    .quiet();

  return {
    exitCode: result.exitCode,
    timedOut: result.stderr.toString().includes('this test timed out after 500ms'),
  };
}

test.each(['rejects', 'awaited rejects', 'resolves', 'toReject', 'toResolve'])(
  'it never settles the %s form on a promise that waits on a Worker',
  async (name) => {
    expect(await runFixtureTest(name)).toStrictEqual({ exitCode: 1, timedOut: true });
  },
);

test('it settles Promise.allSettled on a promise that waits on a Worker', async () => {
  expect(await runFixtureTest('allSettled')).toStrictEqual({ exitCode: 0, timedOut: false });
});
