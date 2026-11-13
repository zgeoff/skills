#!/usr/bin/env bun
// Creates a GitHub App from a manifest, stores its keys, then proves an installation token.
//
//   github-app.ts create --manifest <file> --dest <dest> [--org <org>] [--port <n>]
//                        [--redirect-url <https-url>] [--timeout <minutes>]
//       serves the form on 127.0.0.1, takes GitHub's callback, exchanges the code, stores the keys
//   github-app.ts exchange --dest <dest>
//       reads the address GitHub redirected to from stdin, for when the callback never reached us
//   github-app.ts verify --dest <dest> --repo <owner>/<name>
//       signs a JWT, finds the installation, records its ID, and calls the repo with a token
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
  const got = await op([
    'item',
    'get',
    dest.item,
    '--vault',
    dest.vault,
    '--reveal',
    '--format',
    'json',
  ]);
  if (got.code !== 0) stop(`op cannot read "${dest.item}": ${got.stderr}`);
  const fields: { id?: string; label?: string; value?: string }[] =
    JSON.parse(got.stdout).fields ?? [];
  const value = (name: string) =>
    fields.find((f) => f.label === name || f.id === name)?.value ?? '';
  return {
    app_id: Number(value('app_id')),
    client_id: value('client_id'),
    slug: value('slug'),
    client_secret: value('client_secret'),
    webhook_secret: value('webhook_secret'),
    private_key: value('private_key'),
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
  const response = await fetch(`${api}/app-manifests/${encodeURIComponent(code)}/conversions`, {
    method: 'POST',
    headers: { accept: 'application/vnd.github+json', 'x-github-api-version': '2022-11-28' },
  });
  if (response.status !== 201) {
    stop(
      `GitHub refused the code (HTTP ${response.status}). A code works once, for one hour: create the App again`,
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
    // The code is spent, so keep the key somewhere before giving up.
    const rescue = join(dirname(statePath), `rescued-${app.slug}.json`);
    await mkdir(dirname(rescue), { recursive: true });
    await writePrivate(rescue, `${JSON.stringify(app, null, 2)}\n`);
    stop(
      `${(error as Error).message}. The keys are in ${rescue} (0600); move them, then delete the file`,
    );
  }
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
    async fetch(request) {
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
        return html(500, 'The App was created, but the agent could not finish. Tell the agent.');
      }
    },
  });
  manifest.redirect_url = values['redirect-url'] ?? `http://127.0.0.1:${server.port}/callback`;
  say(`open http://127.0.0.1:${server.port}/ in a browser`);
  const timer = setTimeout(
    () => {
      process.stderr.write(
        'no callback reached the server. If GitHub showed an address with ?code=, copy it and run: github-app.ts exchange --dest <dest>\n',
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
    options: { dest: { type: 'string' }, repo: { type: 'string' } },
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

  const list = await fetch(`${api}/app/installations`, { headers: headers(jwt) });
  if (list.status !== 200) stop(`GET /app/installations returned HTTP ${list.status}`);
  const installations: { id: number; account?: { login?: string } }[] = await list.json();
  const installation = installations.find(
    (i) => i.account?.login?.toLowerCase() === owner.toLowerCase(),
  );
  if (!installation)
    stop(
      `the App has no installation on ${owner}. Install it: ${web}/apps/${app.slug}/installations/new`,
    );
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
  const probe = await fetch(`${api}/repos/${owner}/${repo}`, { headers: headers(token) });
  say(`GET /repos/${owner}/${repo} with an installation token: HTTP ${probe.status}`);
  return probe.status === 200 ? 0 : 1;
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
    default:
      return stop(
        'usage: github-app.ts create|exchange|verify (see the comment at the top of the script)',
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
