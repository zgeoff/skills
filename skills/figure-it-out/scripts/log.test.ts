import { expect, onTestFinished, test } from 'bun:test';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { $ } from 'bun';

async function setupTest() {
  const directory = await mkdtemp(join(tmpdir(), 'log-'));

  onTestFinished(() => rm(directory, { recursive: true, force: true }));

  const scriptPath = fileURLToPath(new URL('log.sh', import.meta.url));
  const logPath = join(directory, 'nested', 'decisions.tsv');

  const run = (...args: readonly string[]) =>
    $`bash ${scriptPath} ${args}`.cwd(directory).nothrow().quiet();

  // Replaces each timestamp, which changes on every run.
  const readLog = async () =>
    (await readFile(logPath, 'utf8')).replaceAll(/^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\dZ\t/gm, 'TS\t');

  return { logPath, run, readLog };
}

test('it writes the header once and appends a row per call', async () => {
  const ctx = await setupTest();

  await ctx.run(ctx.logPath, 'plan', 'counted the pages', 'size the run', 'commit 1a2b3c', 'open');
  const result = await ctx.run(
    ctx.logPath,
    'pr-1',
    'moved the footer',
    'smallest change',
    'PR 12',
    'tests green',
  );

  expect({ exitCode: result.exitCode, log: await ctx.readLog() }).toStrictEqual({
    exitCode: 0,
    log:
      'ts\tphase\tdecision\twhy\tevidence\tresult\n' +
      'TS\tplan\tcounted the pages\tsize the run\tcommit 1a2b3c\topen\n' +
      'TS\tpr-1\tmoved the footer\tsmallest change\tPR 12\ttests green\n',
  });
});

test('it flattens tabs and newlines and quotes a cell a spreadsheet reads as a formula', async () => {
  const ctx = await setupTest();

  const result = await ctx.run(
    ctx.logPath,
    'pr-2',
    'split\tthe\nform',
    '=SUM(A1)',
    '@author',
    '-1 rows',
  );

  expect({ exitCode: result.exitCode, log: await ctx.readLog() }).toStrictEqual({
    exitCode: 0,
    log:
      'ts\tphase\tdecision\twhy\tevidence\tresult\n' +
      "TS\tpr-2\tsplit the form\t'=SUM(A1)\t'@author\t'-1 rows\n",
  });
});

test('it fails with the usage line when a cell is missing', async () => {
  const ctx = await setupTest();

  const result = await ctx.run(ctx.logPath, 'plan', 'counted the pages');

  expect({
    exitCode: result.exitCode,
    stdout: result.stdout.toString(),
    stderr: result.stderr.toString(),
  }).toStrictEqual({
    exitCode: 2,
    stdout: '',
    stderr: 'usage: log.sh <logfile> <phase> <decision> <why> <evidence> <result>\n',
  });
});
