import '@zgeoff/bun-test-extended';
import { expect, onTestFinished, test } from 'bun:test';
import { once } from 'node:events';
import { readFile } from 'node:fs/promises';
import { Worker } from 'node:worker_threads';
import { $ } from 'bun';

async function setupTest() {
  const threadWorker = new Worker(new URL('echo-worker.ts', import.meta.url));

  onTestFinished(() => threadWorker.terminate());

  const server = Bun.serve({ port: 0, fetch: () => new Response('pong') });

  onTestFinished(() => server.stop(true));

  const readWorkerReply = async (worker: Worker): Promise<unknown> => {
    const reply = once(worker, 'message');

    worker.postMessage('ping');

    const [message] = await reply;

    return message;
  };

  const runFailingStart = async (worker: Worker): Promise<never> => {
    await readWorkerReply(worker);

    throw new Error('the start config is unreadable');
  };

  // The matchers hang only on a Worker that has already answered once.
  await readWorkerReply(threadWorker);

  return { threadWorker, readWorkerReply, runFailingStart, serverURL: server.url };
}

test('rejects', async () => {
  const ctx = await setupTest();

  expect(ctx.runFailingStart(ctx.threadWorker)).rejects.toThrow('the start config is unreadable');
});

test('awaited rejects', async () => {
  const ctx = await setupTest();

  await expect(ctx.runFailingStart(ctx.threadWorker)).rejects.toThrow(
    'the start config is unreadable',
  );
});

test('resolves', async () => {
  const ctx = await setupTest();

  expect(ctx.readWorkerReply(ctx.threadWorker)).resolves.toBe('ping');
});

test('toReject', async () => {
  const ctx = await setupTest();

  await expect(ctx.runFailingStart(ctx.threadWorker)).toReject();
});

test('toResolve', async () => {
  const ctx = await setupTest();

  await expect(ctx.readWorkerReply(ctx.threadWorker)).toResolve();
});

test('allSettled', async () => {
  const ctx = await setupTest();

  const [started] = await Promise.allSettled([ctx.runFailingStart(ctx.threadWorker)]);

  expect(started).toStrictEqual({
    status: 'rejected',
    reason: new Error('the start config is unreadable'),
  });
});

test('rejects after a file read', async () => {
  await setupTest();

  const reading = readFile(new URL('missing-config.json', import.meta.url));

  expect(reading).rejects.toMatchObject({ code: 'ENOENT' });
});

test('rejects after a fetch', async () => {
  const ctx = await setupTest();

  const reading = fetch(ctx.serverURL).then(() => {
    throw new Error('the reply was refused');
  });

  expect(reading).rejects.toThrow('the reply was refused');
});

test('rejects after a subprocess', async () => {
  await setupTest();

  expect($`exit 3`.quiet()).rejects.toMatchObject({ exitCode: 3 });
});
