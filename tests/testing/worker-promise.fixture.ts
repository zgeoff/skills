import '@zgeoff/bun-test-extended';
import { expect, onTestFinished, test } from 'bun:test';
import { once } from 'node:events';
import { Worker } from 'node:worker_threads';

async function setupTest() {
  const worker = new Worker(new URL('echo-worker.ts', import.meta.url));

  onTestFinished(() => worker.terminate());

  // The hang needs a worker that has already answered once.
  await readWorkerReply(worker);

  return { worker };
}

async function readWorkerReply(worker: Worker): Promise<unknown> {
  const reply = once(worker, 'message');

  worker.postMessage('ping');

  const [message] = await reply;

  return message;
}

async function runFailingStart(worker: Worker): Promise<never> {
  await readWorkerReply(worker);

  throw new Error('the start config is unreadable');
}

test('rejects', async () => {
  const ctx = await setupTest();

  expect(runFailingStart(ctx.worker)).rejects.toThrow('the start config is unreadable');
});

test('awaited rejects', async () => {
  const ctx = await setupTest();

  await expect(runFailingStart(ctx.worker)).rejects.toThrow('the start config is unreadable');
});

test('resolves', async () => {
  const ctx = await setupTest();

  expect(readWorkerReply(ctx.worker)).resolves.toBe('ping');
});

test('toReject', async () => {
  const ctx = await setupTest();

  await expect(runFailingStart(ctx.worker)).toReject();
});

test('toResolve', async () => {
  const ctx = await setupTest();

  await expect(readWorkerReply(ctx.worker)).toResolve();
});

test('allSettled', async () => {
  const ctx = await setupTest();

  const [started] = await Promise.allSettled([runFailingStart(ctx.worker)]);

  expect(started).toStrictEqual({
    status: 'rejected',
    reason: new Error('the start config is unreadable'),
  });
});
