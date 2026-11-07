import { expect, onTestFinished, test } from 'bun:test';
import { fileURLToPath } from 'node:url';

function setupTest() {
  // A form that hangs never returns, so each fixture test runs in a child `bun test`. A child with a
  // web Worker keeps running after its test times out, so the spawn timeout kills it.
  const runFixtureTest = async (fixture: string, name: string) => {
    const child = Bun.spawn(
      [
        process.execPath,
        'test',
        fileURLToPath(new URL(fixture, import.meta.url)),
        '--timeout',
        '1000',
        '-t',
        `^${name}$`,
      ],
      { stdout: 'ignore', stderr: 'pipe', timeout: 3000 },
    );

    onTestFinished(() => child.kill());

    const stderr = await new Response(child.stderr).text();

    await child.exited;

    return {
      exitCode: child.exitCode,
      signalCode: child.signalCode,
      timedOut: stderr.includes('this test timed out after 1000ms'),
    };
  };

  return { runFixtureTest };
}

test.each(['rejects', 'awaited rejects', 'resolves', 'toReject', 'toResolve'])(
  'it times out the %s form on a promise that waits on a worker_threads Worker that answered before',
  async (name) => {
    const ctx = setupTest();

    expect(await ctx.runFixtureTest('worker-promise.fixture.ts', name)).toStrictEqual({
      exitCode: 1,
      signalCode: null,
      timedOut: true,
    });
  },
);

test('it keeps the test process alive after the rejects form times out on a web Worker that answered before', async () => {
  const ctx = setupTest();

  expect(await ctx.runFixtureTest('web-worker-promise.fixture.ts', 'rejects')).toStrictEqual({
    exitCode: null,
    signalCode: 'SIGTERM',
    timedOut: true,
  });
});

test('it settles Promise.allSettled on a promise that waits on a Worker that answered before', async () => {
  const ctx = setupTest();

  expect(await ctx.runFixtureTest('worker-promise.fixture.ts', 'allSettled')).toStrictEqual({
    exitCode: 0,
    signalCode: null,
    timedOut: false,
  });
});

test.each(['file read', 'fetch', 'subprocess'])(
  'it settles the rejects form on a promise that waits on a %s',
  async (work) => {
    const ctx = setupTest();

    expect(
      await ctx.runFixtureTest('worker-promise.fixture.ts', `rejects after a ${work}`),
    ).toStrictEqual({
      exitCode: 0,
      signalCode: null,
      timedOut: false,
    });
  },
);
