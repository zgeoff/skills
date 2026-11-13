#!/usr/bin/env bun
// Creates a GitHub App from a manifest, stores its keys, then proves an installation token.
//
//   github-app.ts create --manifest <file> --dest <dest> [--org <org>] [--port <n>]
//                        [--redirect-url <https-url>] [--timeout <minutes>]
//       serves the form on 127.0.0.1, takes GitHub's callback, exchanges the code, stores the keys
//   github-app.ts exchange --dest <dest>
//       reads the address GitHub redirected to from stdin, for when the callback never reached us
//   github-app.ts verify --dest <dest> --repo <owner>/<name> [--path <api-path>]
//       signs a JWT, finds the installation, records its ID, and GETs the path (default: the
//       repo itself) with an installation token; {repo} in the path stands for owner/name
//   github-app.ts import --from <rescued-file> --dest <dest>
//       stores keys that a failed store left in a rescue file, then deletes that file
//
// <dest> is op:<vault>/<item> (a 1Password item) or file:<path> (a 0600 JSON file).
// Nothing here prints a secret: stdout carries the client ID, App ID, slug and URLs only.
// GITHUB_API_URL and GITHUB_SERVER_URL point the script at another host, as the test does.

import { createSign, randomBytes } from 'node:crypto';
import { chmod, mkdir, mkdtemp, readFile, rm, stat, writeFile } from 'node:fs/promises';
import { homedir, tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { parseArgs } from 'node:util';

const api = (process.env.GITHUB_API_URL ?? 'https://api.github.com').replace(/\/$/, '');
const web = (process.env.GITHUB_SERVER_URL ?? 'https://github.com').replace(/\/$/, '');
const statePath =
  process.env.GITHUB_APP_STATE ??
  join(process.env.XDG_CACHE_HOME ?? join(homedir(), '.cache'), 'github-app', 'state.json');

type App = {
  app_id: number;
  client_id: string;
  slug: string;
  client_secret: string;
  webhook_secret: string | null;
  private_key: string;
  installation_id?: number;
};

type Dest = { kind: 'op'; vault: string; item: string } | { kind: 'file'; path: string };

class Stop extends Error {}

function stop(message: string): never {
  throw new Stop(message);
}

function say(line: string) {
  process.stdout.write(`${line}\n`);
}

function parseDest(raw: string | undefined): Dest {
  if (raw?.startsWith('op:')) {
    const [vault, ...rest] = raw.slice(3).split('/');
    const item = rest.join('/');
    if (vault && item) return { kind: 'op', vault, item };
  }
  if (raw?.startsWith('file:') && raw.length > 5) return { kind: 'file', path: raw.slice(5) };
  return stop('name a destination: --dest op:<vault>/<item> or --dest file:<path>');
}

function describe(dest: Dest) {
  return dest.kind === 'op' ? `1Password item "${dest.item}" in vault "${dest.vault}"` : dest.path;
}

async function op(args: readonly string[]) {
  const child = Bun.spawn(['op', ...args], { stdout: 'pipe', stderr: 'pipe', stdin: 'ignore' });
  const [stdout, stderr, code] = await Promise.all([
    new Response(child.stdout).text(),
    new Response(child.stderr).text(),
    child.exited,
  ]);
  return { code, stdout, stderr: stderr.trim() };
}

async function exists(path: string) {
  return stat(path).then(
    () => true,
    () => false,
  );
}

// Checked before the human clicks: the code works once, so a store that fails after the
// exchange loses the private key.
async function checkDest(dest: Dest) {
  if (dest.kind === 'file') {
    if (await exists(dest.path)) stop(`${dest.path} already exists; pick a new path`);
    await mkdir(dirname(dest.path), { recursive: true });
    return;
  }
  const vault = await op(['vault', 'get', dest.vault, '--format', 'json']);
  if (vault.code !== 0) stop(`op cannot open vault "${dest.vault}": ${vault.stderr}`);
  const item = await op(['item', 'get', dest.item, '--vault', dest.vault, '--format', 'json']);
  if (item.code === 0)
    stop(`"${dest.item}" already exists in vault "${dest.vault}"; pick a new name`);
}

async function writePrivate(path: string, body: string) {
  await writeFile(path, body, { mode: 0o600, flag: 'wx' });
  await chmod(path, 0o600);
}

async function store(dest: Dest, app: App) {
  if (dest.kind === 'file') {
    await writePrivate(dest.path, `${JSON.stringify(app, null, 2)}\n`);
    return;
  }
  const field = (id: string, value: string, type: 'STRING' | 'CONCEALED') => ({
    id,
    label: id,
    type,
    value,
  });
  const template = {
    title: dest.item,
    category: 'SECURE_NOTE',
    fields: [
      field('app_id', String(app.app_id), 'STRING'),
      field('client_id', app.client_id, 'STRING'),
      field('slug', app.slug, 'STRING'),
      field('client_secret', app.client_secret, 'CONCEALED'),
      field('webhook_secret', app.webhook_secret ?? '', 'CONCEALED'),
      field('private_key', app.private_key, 'CONCEALED'),
    ],
  };
  // The secrets go to op in a 0600 file, never as arguments: other processes can read argv.
  const folder = await mkdtemp(join(tmpdir(), 'github-app-'));
  try {
    const file = join(folder, 'item.json');
    await writePrivate(file, JSON.stringify(template));
    const made = await op([
      'item',
      'create',
      '--template',
      file,
      '--vault',
      dest.vault,
      '--format',
      'json',
    ]);
    if (made.code !== 0) throw new Error(`op item create failed: ${made.stderr}`);
  } finally {
    await rm(folder, { recursive: true, force: true });
  }
}

async function load(dest: Dest): Promise<App> {
  if (dest.kind === 'file') return JSON.parse(await readFile(dest.path, 'utf8'));
  // op read returns a multi-line PEM intact; verify needs only these three fields.
  const read = async (field: string) => {
    const got = await op(['read', `op://${dest.vault}/${dest.item}/${field}`]);
    if (got.code !== 0) stop(`op cannot read ${field} of "${dest.item}": ${got.stderr}`);
    return got.stdout.trim();
  };
  return {
    app_id: 0,
    client_id: await read('client_id'),
    slug: await read('slug'),
    client_secret: '',
    webhook_secret: null,
    private_key: await read('private_key'),
  };
}

async function recordInstallation(dest: Dest, app: App, id: number) {
  if (dest.kind === 'file') {
    await writeFile(dest.path, `${JSON.stringify({ ...app, installation_id: id }, null, 2)}\n`, {
      mode: 0o600,
    });
    return;
  }
  const edit = await op([
    'item',
    'edit',
    dest.item,
    '--vault',
    dest.vault,
    `installation_id[text]=${id}`,
    '--format',
    'json',
  ]);
  if (edit.code !== 0) stop(`op item edit failed: ${edit.stderr}`);
}

async function exchange(code: string, dest: Dest) {
  // The code works once, so make the rescue file before spending it. When even that fails, the
  // code stays unspent and exchange can run again.
  const rescue = join(dirname(statePath), `rescued-${randomBytes(6).toString('hex')}.json`);
  try {
    await mkdir(dirname(rescue), { recursive: true });
    await writePrivate(rescue, '');
  } catch (error) {
    stop(`cannot write ${rescue}, so the code is still unspent: ${(error as Error).message}`);
  }
  const response = await fetch(`${api}/app-manifests/${encodeURIComponent(code)}/conversions`, {
    method: 'POST',
    headers: { accept: 'application/vnd.github+json', 'x-github-api-version': '2022-11-28' },
  });
  if (response.status !== 201) {
    await rm(rescue, { force: true });
    stop(
      `GitHub refused the code (HTTP ${response.status}). GitHub sends one code per App, and the flow must finish within an hour of the click`,
    );
  }
  const body = await response.json();
  const app: App = {
    app_id: body.id,
    client_id: body.client_id,
    slug: body.slug,
    client_secret: body.client_secret,
    webhook_secret: body.webhook_secret ?? null,
    private_key: body.pem,
  };
  try {
    await store(dest, app);
  } catch (error) {
    await writeFile(rescue, `${JSON.stringify(app, null, 2)}\n`);
    stop(
      `${(error as Error).message}. The keys are in ${rescue} (0600); move them, then delete the file`,
    );
  }
  await rm(rescue, { force: true });
  await rm(statePath, { force: true });
  say(`stored the keys in ${describe(dest)}`);
  say(`client ID: ${app.client_id}`);
  say(`App ID: ${app.app_id}`);
  say(`slug: ${app.slug}`);
  say(`install: ${web}/apps/${app.slug}/installations/new`);
  return app;
}

function escape(text: string) {
  return text.replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);
}

async function create(argv: string[]) {
  const { values } = parseArgs({
    args: argv,
    options: {
      manifest: { type: 'string' },
      dest: { type: 'string' },
      org: { type: 'string' },
      port: { type: 'string', default: '0' },
      'redirect-url': { type: 'string' },
      timeout: { type: 'string', default: '30' },
    },
  });
  if (!values.manifest) stop('name the manifest: --manifest <file>');
  const dest = parseDest(values.dest);
  const manifest = JSON.parse(await readFile(values.manifest, 'utf8'));
  if (!manifest.name || !manifest.url) stop('the manifest needs a name and a url');
  manifest.hook_attributes ??= { url: manifest.url, active: false };
  await checkDest(dest);

  const state = randomBytes(24).toString('hex');
  await mkdir(dirname(statePath), { recursive: true });
  await rm(statePath, { force: true });
  await writePrivate(statePath, JSON.stringify({ state }));
  const newApp = values.org
    ? `${web}/organizations/${encodeURIComponent(values.org)}/settings/apps/new`
    : `${web}/settings/apps/new`;

  let finish: (code: number) => void = () => {};
  const done = new Promise<number>((resolve) => {
    finish = resolve;
  });
  const server = Bun.serve({
    hostname: '127.0.0.1',
    port: Number(values.port),
    async fetch(request, self) {
      // Answer only to the loopback address, so a page that rebinds its own DNS name to
      // 127.0.0.1 can't read the state or post a callback.
      if (request.headers.get('host') !== `127.0.0.1:${self.port}`) {
        return new Response('Wrong host.', { status: 421 });
      }
      const url = new URL(request.url);
      const html = (status: number, body: string) =>
        new Response(
          `<!doctype html><meta charset="utf-8"><title>GitHub App</title><body>${body}`,
          {
            status,
            headers: { 'content-type': 'text/html; charset=utf-8' },
          },
        );
      if (url.pathname === '/') {
        return html(
          200,
          `<form method="post" action="${escape(`${newApp}?state=${state}`)}">` +
            `<input type="hidden" name="manifest" value="${escape(JSON.stringify(manifest))}">` +
            `<p>Create the GitHub App <b>${escape(manifest.name)}</b> on GitHub.</p>` +
            '<button type="submit">Continue to GitHub</button></form>',
        );
      }
      if (url.pathname !== '/callback') return html(404, 'Not found.');
      if (url.searchParams.get('state') !== state) {
        process.stderr.write('ignored a callback with the wrong state\n');
        return html(
          400,
          'This address does not match the page you opened. Start again from the agent.',
        );
      }
      try {
        const app = await exchange(url.searchParams.get('code') ?? '', dest);
        const install = `${web}/apps/${app.slug}/installations/new`;
        finish(0);
        return html(
          200,
          `<p>Created ${escape(app.slug)}.</p><p><a href="${escape(install)}">Install it on your repositories</a>, then tell the agent.</p>`,
        );
      } catch (error) {
        process.stderr.write(`${(error as Error).message}\n`);
        finish(1);
        return html(
          500,
          'The agent could not finish. Tell the agent what this page says, and keep the address.',
        );
      }
    },
  });
  manifest.redirect_url = values['redirect-url'] ?? `http://127.0.0.1:${server.port}/callback`;
  say(`open http://127.0.0.1:${server.port}/ in a browser`);
  const timer = setTimeout(
    () => {
      process.stderr.write(
        'no callback reached the server. If the browser shows an address with ?code=, pipe it to: github-app.ts exchange --dest <dest>\n',
      );
      finish(1);
    },
    Number(values.timeout) * 60_000,
  );
  const code = await done;
  clearTimeout(timer);
  // Let the browser receive the last page before the server goes.
  await Bun.sleep(200);
  server.stop(true);
  return code;
}

async function exchangeFromStdin(argv: string[]) {
  const { values } = parseArgs({ args: argv, options: { dest: { type: 'string' } } });
  const dest = parseDest(values.dest);
  if (!(await exists(statePath))) stop('no saved state; run create first');
  const { state } = JSON.parse(await readFile(statePath, 'utf8'));
  const input = (await new Response(Bun.stdin.stream()).text()).trim();
  let address: URL;
  try {
    address = new URL(input);
  } catch {
    return stop('paste the whole address from the browser, starting with http');
  }
  if (address.searchParams.get('state') !== state)
    stop('the address does not carry the state create saved; run create again');
  const code = address.searchParams.get('code');
  if (!code) stop('the address has no code');
  await checkDest(dest);
  await exchange(code, dest);
  return 0;
}

function base64url(data: string | Buffer) {
  return Buffer.from(data).toString('base64url');
}

export function signJwt(clientId: string, privateKey: string, now = Math.floor(Date.now() / 1000)) {
  // GitHub recommends the client ID as iss, iat 60 s back for clock drift, and exp at most 10 min.
  const head = base64url(JSON.stringify({ alg: 'RS256', typ: 'JWT' }));
  const body = base64url(JSON.stringify({ iat: now - 60, exp: now + 540, iss: clientId }));
  const signature = createSign('RSA-SHA256').update(`${head}.${body}`).sign(privateKey);
  return `${head}.${body}.${base64url(signature)}`;
}

async function verify(argv: string[]) {
  const { values } = parseArgs({
    args: argv,
    options: { dest: { type: 'string' }, repo: { type: 'string' }, path: { type: 'string' } },
  });
  const dest = parseDest(values.dest);
  const [owner, repo] = values.repo?.split('/') ?? [];
  if (!owner || !repo) stop('name the repo: --repo <owner>/<name>');
  const app = await load(dest);
  if (!app.client_id || !app.private_key) stop(`${describe(dest)} has no client_id or private_key`);
  const headers = (token: string) => ({
    accept: 'application/vnd.github+json',
    authorization: `Bearer ${token}`,
    'x-github-api-version': '2022-11-28',
  });
  const jwt = signJwt(app.client_id, app.private_key);

  // The repo's own installation endpoint needs no paging, unlike GET /app/installations.
  const found = await fetch(`${api}/repos/${owner}/${repo}/installation`, {
    headers: headers(jwt),
  });
  if (found.status === 404) {
    stop(
      `the App is not installed on ${owner}/${repo}. Install it: ${web}/apps/${app.slug}/installations/new`,
    );
  }
  if (found.status !== 200)
    stop(`GET /repos/${owner}/${repo}/installation returned HTTP ${found.status}`);
  const installation: { id: number } = await found.json();
  await recordInstallation(dest, app, installation.id);
  say(`installation ID: ${installation.id} (recorded in ${describe(dest)})`);

  const minted = await fetch(`${api}/app/installations/${installation.id}/access_tokens`, {
    method: 'POST',
    headers: headers(jwt),
    body: JSON.stringify({ repositories: [repo] }),
  });
  if (minted.status !== 201)
    stop(
      `POST access_tokens returned HTTP ${minted.status}; is ${repo} one of the installation's repos?`,
    );
  const { token } = await minted.json();
  const path = (values.path ?? '/repos/{repo}').replaceAll('{repo}', `${owner}/${repo}`);
  const probe = await fetch(`${api}${path.startsWith('/') ? '' : '/'}${path}`, {
    headers: headers(token),
  });
  say(`GET ${path} with an installation token: HTTP ${probe.status}`);
  return probe.status === 200 ? 0 : 1;
}

async function importRescued(argv: string[]) {
  const { values } = parseArgs({
    args: argv,
    options: { from: { type: 'string' }, dest: { type: 'string' } },
  });
  if (!values.from) stop('name the rescue file: --from <file>');
  const dest = parseDest(values.dest);
  const app: App = JSON.parse(await readFile(values.from, 'utf8'));
  if (!app.client_id || !app.private_key) stop(`${values.from} has no client_id or private_key`);
  await checkDest(dest);
  await store(dest, app);
  await rm(values.from, { force: true });
  say(`stored the keys in ${describe(dest)} and deleted ${values.from}`);
  return 0;
}

async function main(argv: string[]) {
  const [command, ...rest] = argv;
  switch (command) {
    case 'create':
      return create(rest);
    case 'exchange':
      return exchangeFromStdin(rest);
    case 'verify':
      return verify(rest);
    case 'import':
      return importRescued(rest);
    default:
      return stop(
        'usage: github-app.ts create|exchange|verify|import (see the comment at the top of the script)',
      );
  }
}

if (import.meta.main) {
  try {
    process.exitCode = await main(process.argv.slice(2));
  } catch (error) {
    process.stderr.write(`✗ ${error instanceof Stop ? error.message : String(error)}\n`);
    process.exitCode = 1;
  }
}
