import { parentPort } from 'node:worker_threads';

parentPort?.on('message', (message: unknown) => parentPort?.postMessage(message));
