import { expect, onTestFinished, test } from 'bun:test';
import { once } from 'node:events';

async function setupTest() {
  const worker = new Worker(new URL('echo-worker.ts', import.meta.url));

  onTestFinished(() => worker.terminate());

  const runFailingStart = async (): Promise<never> => {
    const reply = once(worker, 'message');

    worker.postMessage('ping');
    await reply;

    throw new Error('the start config is unreadable');
  };

  // The matchers hang only on a Worker that has already answered once.
  await runFailingStart().catch(() => undefined);

  return { runFailingStart };
}

test('rejects', async () => {
  const ctx = await setupTest();

  expect(ctx.runFailingStart()).rejects.toThrow('the start config is unreadable');
});
