import { expect, onTestFinished, test } from 'bun:test';
import { once } from 'node:events';

async function setupTest() {
  const webWorker = new Worker(new URL('echo-worker.ts', import.meta.url));

  onTestFinished(() => webWorker.terminate());

  const runFailingStart = async (worker: Worker): Promise<never> => {
    const reply = once(worker, 'message');

    worker.postMessage('ping');
    await reply;

    throw new Error('the start config is unreadable');
  };

  // The matchers hang only on a Worker that has already answered once.
  await runFailingStart(webWorker).catch(() => undefined);

  return { webWorker, runFailingStart };
}

test('rejects', async () => {
  const ctx = await setupTest();

  expect(ctx.runFailingStart(ctx.webWorker)).rejects.toThrow('the start config is unreadable');
});
