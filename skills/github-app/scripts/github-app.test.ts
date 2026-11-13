import { expect, onTestFinished, test } from 'bun:test';
import { createVerify, generateKeyPairSync } from 'node:crypto';
import { chmod, mkdir, mkdtemp, readFile, rm, stat, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const scriptPath = fileURLToPath(new URL('github-app.ts', import.meta.url));

const secrets = {
  client_secret: 'stub-client-secret-7f3a',
  webhook_secret: 'stub-webhook-secret-91c2',
  token: 'ghs_stubInstallationToken55',
};

type Call = { method: string; path: string; authorization: string | null; body: string };

async function setupTest() {
  const directory = await mkdtemp(join(tmpdir(), 'github-app-'));
  const { privateKey, publicKey } = generateKeyPairSync('rsa', { modulusLength: 2048 });
  const pem = privateKey.export({ type: 'pkcs1', format: 'pem' }).toString();
  const calls: Call[] = [];
  let installed = true;
  // A first page of installations that belong to other accounts, as on an App installed widely.
  const otherInstallations = Array.from({ length: 30 }, (_, i) => ({
    id: i + 1,
    account: { login: `other-${i}` },
  }));

  // Stands in for both api.github.com and github.com, so no test touches the network.
  const github = Bun.serve({
    hostname: '127.0.0.1',
    port: 0,
    async fetch(request) {
      const url = new URL(request.url);
      calls.push({
        method: request.method,
        path: url.pathname,
        authorization: request.headers.get('authorization'),
        body: await request.text(),
      });
      if (url.pathname === '/app-manifests/good-code/conversions') {
        return Response.json(
          {
            id: 1234,
            slug: 'kettle-bot',
            client_id: 'Iv23liKettleBot',
            pem,
            ...secrets,
            token: undefined,
          },
          { status: 201 },
        );
      }
      if (url.pathname.startsWith('/app-manifests/')) return new Response('', { status: 404 });
      if (url.pathname === '/app/installations') return Response.json(otherInstallations);
      if (url.pathname === '/repos/acme/kettle/installation') {
        return installed
          ? Response.json({ id: 4242, account: { login: 'acme' } })
          : new Response('', { status: 404 });
      }
      if (url.pathname === '/app/installations/4242/access_tokens') {
        return Response.json({ token: secrets.token }, { status: 201 });
      }
      if (url.pathname === '/repos/acme/kettle') {
        const ok = request.headers.get('authorization') === `Bearer ${secrets.token}`;
        return Response.json({}, { status: ok ? 200 : 401 });
      }
      return new Response('', { status: 404 });
    },
  });

  // A stand-in for the 1Password CLI. It keeps a copy of each template it receives, with its mode.
  const bin = join(directory, 'bin');
  const opLog = join(directory, 'op.log');
  await Bun.write(
    join(bin, 'op'),
    `#!/usr/bin/env bash
echo "$*" >> ${JSON.stringify(opLog)}
case "$1 $2" in
  "vault get") exit 0 ;;
  "item get") [[ -f ${JSON.stringify(join(directory, 'op-item.json'))} ]] || exit 1
    jq '{fields: .fields}' ${JSON.stringify(join(directory, 'op-item.json'))} ;;
  "item create")
    [[ -n "\${OP_FAIL_CREATE:-}" ]] && { echo "vault is read-only" >&2; exit 1; }
    stat -c %a "$4" > ${JSON.stringify(join(directory, 'template.mode'))}
    echo "$4" > ${JSON.stringify(join(directory, 'template.path'))}
    cp "$4" ${JSON.stringify(join(directory, 'op-item.json'))} ;;
  "item edit") exit 0 ;;
  *) exit 2 ;;
esac
`,
  );
  await chmod(join(bin, 'op'), 0o755);

  onTestFinished(async () => {
    github.stop(true);
    await rm(directory, { recursive: true, force: true });
  });

  const env = {
    ...process.env,
    PATH: `${bin}:${process.env.PATH}`,
    GITHUB_API_URL: github.url.href,
    GITHUB_SERVER_URL: github.url.href,
    GITHUB_APP_STATE: join(directory, 'cache', 'state.json'),
  };

  const start = (args: readonly string[], extraEnv: Record<string, string> = {}) =>
    Bun.spawn(['bun', scriptPath, ...args], {
      cwd: directory,
      env: { ...env, ...extraEnv },
      stdout: 'pipe',
      stderr: 'pipe',
      stdin: 'pipe',
    });

  const run = async (args: readonly string[], stdin = '') => {
    const child = start(args);
    child.stdin.write(stdin);
    child.stdin.end();
    const [stdout, stderr, exitCode] = await Promise.all([
      new Response(child.stdout).text(),
      new Response(child.stderr).text(),
      child.exited,
    ]);
    return { exitCode, stdout, stderr: stderr.trim() };
  };

  // Starts create and waits for the line that gives the page's address.
  const serve = async (args: readonly string[], extraEnv: Record<string, string> = {}) => {
    const child = start(args, extraEnv);
    child.stdin.end();
    const reader = child.stdout.getReader();
    let stdout = '';
    while (!stdout.includes('in a browser')) {
      const { value, done } = await reader.read();
      if (done) break;
      stdout += new TextDecoder().decode(value);
    }
    const page = stdout.match(/open (http:\/\/127\.0\.0\.1:\d+)\//)?.[1];
    const finished = (async () => {
      for (;;) {
        const { value, done } = await reader.read();
        if (done) break;
        stdout += new TextDecoder().decode(value);
      }
      const [stderr, exitCode] = await Promise.all([
        new Response(child.stderr).text(),
        child.exited,
      ]);
      return { exitCode, stdout, stderr: stderr.trim() };
    })();
    onTestFinished(() => child.kill());
    return { page: page ?? '', finished };
  };

  const manifestPath = join(directory, 'manifest.json');
  await writeFile(
    manifestPath,
    JSON.stringify({
      name: 'kettle-bot',
      url: 'https://example.com/kettle',
      public: false,
      default_permissions: { metadata: 'read', checks: 'read' },
      default_events: [],
    }),
  );

  return {
    directory,
    calls,
    pem,
    publicKey,
    manifestPath,
    run,
    serve,
    setInstalled: (v: boolean) => (installed = v),
  };
}

function formOf(html: string) {
  const action = html.match(/action="([^"]+)"/)?.[1]?.replaceAll('&#38;', '&') ?? '';
  const manifest = JSON.parse(
    (html.match(/name="manifest" value="([^"]+)"/)?.[1] ?? '{}').replace(/&#(\d+);/g, (_, n) =>
      String.fromCharCode(Number(n)),
    ),
  );
  return { action: new URL(action), manifest };
}

function expectNoSecret(text: string, pem: string) {
  for (const value of [...Object.values(secrets), pem.split('\n')[1]])
    expect(text).not.toContain(value);
}

test('it serves a form that posts the manifest and a state to the new-App page, with its own callback', async () => {
  const ctx = await setupTest();
  const { page } = await ctx.serve([
    'create',
    '--manifest',
    ctx.manifestPath,
    '--dest',
    `file:${join(ctx.directory, 'app.json')}`,
  ]);

  const { action, manifest } = formOf(await (await fetch(`${page}/`)).text());

  expect(action.pathname).toBe('/settings/apps/new');
  expect(action.searchParams.get('state')).toMatch(/^[0-9a-f]{48}$/);
  expect(manifest.redirect_url).toBe(`${page}/callback`);
  expect(manifest.hook_attributes).toStrictEqual({
    url: 'https://example.com/kettle',
    active: false,
  });
});

test('it posts to the organization page when --org names one', async () => {
  const ctx = await setupTest();
  const { page } = await ctx.serve([
    'create',
    '--manifest',
    ctx.manifestPath,
    '--org',
    'acme',
    '--dest',
    `file:${join(ctx.directory, 'app.json')}`,
  ]);

  const { action } = formOf(await (await fetch(`${page}/`)).text());

  expect(action.pathname).toBe('/organizations/acme/settings/apps/new');
});

test('it ignores a callback with the wrong state and never exchanges its code', async () => {
  const ctx = await setupTest();
  const { page } = await ctx.serve([
    'create',
    '--manifest',
    ctx.manifestPath,
    '--dest',
    `file:${join(ctx.directory, 'app.json')}`,
  ]);

  const response = await fetch(`${page}/callback?code=good-code&state=forged`);

  expect(response.status).toBe(400);
  expect(ctx.calls.filter((c) => c.path.startsWith('/app-manifests/'))).toStrictEqual([]);
});

test('it exchanges the code, writes a 0600 file and prints no secret', async () => {
  const ctx = await setupTest();
  const destPath = join(ctx.directory, 'keys', 'app.json');
  const { page, finished } = await ctx.serve([
    'create',
    '--manifest',
    ctx.manifestPath,
    '--dest',
    `file:${destPath}`,
  ]);
  const { action } = formOf(await (await fetch(`${page}/`)).text());

  const response = await fetch(
    `${page}/callback?code=good-code&state=${action.searchParams.get('state')}`,
  );
  const result = await finished;

  expect(response.status).toBe(200);
  expect(result.exitCode).toBe(0);
  expect((await stat(destPath)).mode & 0o777).toBe(0o600);
  expect(JSON.parse(await readFile(destPath, 'utf8'))).toStrictEqual({
    app_id: 1234,
    client_id: 'Iv23liKettleBot',
    slug: 'kettle-bot',
    client_secret: secrets.client_secret,
    webhook_secret: secrets.webhook_secret,
    private_key: ctx.pem,
  });
  expect(result.stdout).toContain('client ID: Iv23liKettleBot');
  expect(result.stdout).toContain('/apps/kettle-bot/installations/new');
  expectNoSecret(result.stdout + result.stderr, ctx.pem);
});

test('it hands 1Password a 0600 template with concealed secrets, then deletes the template', async () => {
  const ctx = await setupTest();
  const { page, finished } = await ctx.serve([
    'create',
    '--manifest',
    ctx.manifestPath,
    '--dest',
    'op:Agents/kettle-bot',
  ]);
  const { action } = formOf(await (await fetch(`${page}/`)).text());

  await fetch(`${page}/callback?code=good-code&state=${action.searchParams.get('state')}`);
  const result = await finished;
  const item = JSON.parse(await readFile(join(ctx.directory, 'op-item.json'), 'utf8'));
  const templatePath = (await readFile(join(ctx.directory, 'template.path'), 'utf8')).trim();

  expect(result.exitCode).toBe(0);
  expect((await readFile(join(ctx.directory, 'template.mode'), 'utf8')).trim()).toBe('600');
  expect(await Bun.file(templatePath).exists()).toBe(false);
  expect(
    Object.fromEntries(item.fields.map((f: { id: string; type: string }) => [f.id, f.type])),
  ).toStrictEqual({
    app_id: 'STRING',
    client_id: 'STRING',
    slug: 'STRING',
    client_secret: 'CONCEALED',
    webhook_secret: 'CONCEALED',
    private_key: 'CONCEALED',
  });
  expect(await readFile(join(ctx.directory, 'op.log'), 'utf8')).not.toContain(
    secrets.client_secret,
  );
  expectNoSecret(result.stdout + result.stderr, ctx.pem);
});

test('it keeps the keys in a 0600 rescue file when 1Password refuses them', async () => {
  const ctx = await setupTest();
  const { page, finished } = await ctx.serve(
    ['create', '--manifest', ctx.manifestPath, '--dest', 'op:Agents/kettle-bot'],
    {
      OP_FAIL_CREATE: '1',
    },
  );
  const { action } = formOf(await (await fetch(`${page}/`)).text());

  await fetch(`${page}/callback?code=good-code&state=${action.searchParams.get('state')}`);
  const result = await finished;
  const rescue = result.stderr.match(/keys are in (\S+) \(0600\)/)?.[1] ?? '';

  expect(result.exitCode).toBe(1);
  expect(rescue.startsWith(join(ctx.directory, 'cache', 'rescued-kettle-bot-'))).toBe(true);
  expect((await stat(rescue)).mode & 0o777).toBe(0o600);
  expectNoSecret(result.stdout + result.stderr, ctx.pem);
});

test('it refuses a destination file that already exists, before it serves the page', async () => {
  const ctx = await setupTest();
  const destPath = join(ctx.directory, 'app.json');
  await writeFile(destPath, '{}');

  expect(
    await ctx.run(['create', '--manifest', ctx.manifestPath, '--dest', `file:${destPath}`]),
  ).toStrictEqual({
    exitCode: 1,
    stdout: '',
    stderr: `✗ ${destPath} already exists; pick a new path`,
  });
});

test('it exchanges a pasted address when its state matches the saved one', async () => {
  const ctx = await setupTest();
  const destPath = join(ctx.directory, 'app.json');
  await Bun.write(join(ctx.directory, 'cache', 'state.json'), JSON.stringify({ state: 'abc123' }));

  const forged = await ctx.run(
    ['exchange', '--dest', `file:${destPath}`],
    'https://example.com/kettle?code=good-code&state=other',
  );
  const pasted = await ctx.run(
    ['exchange', '--dest', `file:${destPath}`],
    'https://example.com/kettle?code=good-code&state=abc123\n',
  );

  expect(forged.exitCode).toBe(1);
  expect(forged.stderr).toBe(
    '✗ the address does not carry the state create saved; run create again',
  );
  expect(pasted.exitCode).toBe(0);
  expect(pasted.stdout).toContain('App ID: 1234');
  expect(ctx.calls.filter((c) => c.path.startsWith('/app-manifests/'))).toHaveLength(1);
});

test('it signs the JWT with the client ID, records the installation and proves a token', async () => {
  const ctx = await setupTest();
  const destPath = join(ctx.directory, 'app.json');
  await writeFile(
    destPath,
    JSON.stringify({
      app_id: 1234,
      client_id: 'Iv23liKettleBot',
      slug: 'kettle-bot',
      private_key: ctx.pem,
    }),
    { mode: 0o600 },
  );

  const result = await ctx.run(['verify', '--dest', `file:${destPath}`, '--repo', 'acme/kettle']);
  const jwt = (
    ctx.calls.find((c) => c.path === '/repos/acme/kettle/installation')?.authorization ?? ''
  ).replace('Bearer ', '');
  const [head, body, signature] = jwt.split('.');
  const claims = JSON.parse(Buffer.from(body ?? '', 'base64url').toString());

  expect(result.exitCode).toBe(0);
  expect(
    createVerify('RSA-SHA256')
      .update(`${head}.${body}`)
      .verify(ctx.publicKey, signature ?? '', 'base64url'),
  ).toBe(true);
  expect(claims.iss).toBe('Iv23liKettleBot');
  expect(claims.exp - claims.iat).toBe(600);
  expect(
    JSON.parse(ctx.calls.find((c) => c.path.endsWith('/access_tokens'))?.body ?? '{}'),
  ).toStrictEqual({ repositories: ['kettle'] });
  expect(JSON.parse(await readFile(destPath, 'utf8')).installation_id).toBe(4242);
  expect(result.stdout).toContain('HTTP 200');
  expectNoSecret(result.stdout + result.stderr, ctx.pem);
});

test('it gives the install link when the App has no installation on the owner', async () => {
  const ctx = await setupTest();
  ctx.setInstalled(false);
  const destPath = join(ctx.directory, 'app.json');
  await writeFile(
    destPath,
    JSON.stringify({
      app_id: 1234,
      client_id: 'Iv23liKettleBot',
      slug: 'kettle-bot',
      private_key: ctx.pem,
    }),
  );

  const result = await ctx.run(['verify', '--dest', `file:${destPath}`, '--repo', 'acme/kettle']);

  expect(result.exitCode).toBe(1);
  expect(result.stderr).toContain('/apps/kettle-bot/installations/new');
});

test('it imports a rescue file into 1Password and deletes the file', async () => {
  const ctx = await setupTest();
  const rescue = join(ctx.directory, 'rescued-kettle-bot.json');
  await writeFile(
    rescue,
    JSON.stringify({
      app_id: 1234,
      client_id: 'Iv23liKettleBot',
      slug: 'kettle-bot',
      client_secret: secrets.client_secret,
      webhook_secret: secrets.webhook_secret,
      private_key: ctx.pem,
    }),
    { mode: 0o600 },
  );

  const result = await ctx.run(['import', '--from', rescue, '--dest', 'op:Agents/kettle-bot']);
  const item = JSON.parse(await readFile(join(ctx.directory, 'op-item.json'), 'utf8'));

  expect(result.exitCode).toBe(0);
  expect(item.fields.find((f: { id: string }) => f.id === 'private_key').value).toBe(ctx.pem);
  expect(await Bun.file(rescue).exists()).toBe(false);
  expectNoSecret(result.stdout + result.stderr, ctx.pem);
});

test('it calls the path --path names with the installation token', async () => {
  const ctx = await setupTest();
  const destPath = join(ctx.directory, 'app.json');
  await writeFile(
    destPath,
    JSON.stringify({
      app_id: 1234,
      client_id: 'Iv23liKettleBot',
      slug: 'kettle-bot',
      private_key: ctx.pem,
    }),
  );

  const result = await ctx.run([
    'verify',
    '--dest',
    `file:${destPath}`,
    '--repo',
    'acme/kettle',
    '--path',
    '/repos/{repo}/commits/main/check-runs',
  ]);

  expect(ctx.calls.at(-1)?.path).toBe('/repos/acme/kettle/commits/main/check-runs');
  expect(result.stdout).toContain(
    'GET /repos/acme/kettle/commits/main/check-runs with an installation token: HTTP 404',
  );
  expect(result.exitCode).toBe(1);
});

test('it keeps the keys in a new rescue file when the usual rescue name is taken', async () => {
  const ctx = await setupTest();
  await mkdir(join(ctx.directory, 'cache', 'rescued-kettle-bot.json'), { recursive: true });
  const { page, finished } = await ctx.serve(
    ['create', '--manifest', ctx.manifestPath, '--dest', 'op:Agents/kettle-bot'],
    { OP_FAIL_CREATE: '1' },
  );
  const { action } = formOf(await (await fetch(`${page}/`)).text());

  await fetch(`${page}/callback?code=good-code&state=${action.searchParams.get('state')}`);
  const result = await finished;
  const rescue = result.stderr.match(/keys are in (\S+) \(0600\)/)?.[1] ?? '';

  expect(result.exitCode).toBe(1);
  expect((await stat(rescue)).mode & 0o777).toBe(0o600);
  expect(JSON.parse(await readFile(rescue, 'utf8')).private_key).toBe(ctx.pem);
});

test('it refuses a request whose Host is not its own loopback address', async () => {
  const ctx = await setupTest();
  const { page } = await ctx.serve([
    'create',
    '--manifest',
    ctx.manifestPath,
    '--dest',
    `file:${join(ctx.directory, 'app.json')}`,
  ]);
  const port = new URL(page).port;
  const asAttacker = { headers: { host: `attacker.example:${port}` } };

  const form = await fetch(`${page}/`, asAttacker);
  const callback = await fetch(`${page}/callback?code=good-code&state=any`, asAttacker);

  expect(form.status).toBe(421);
  expect(await form.text()).not.toMatch(/state=[0-9a-f]{48}/);
  expect(callback.status).toBe(421);
  expect(ctx.calls.filter((c) => c.path.startsWith('/app-manifests/'))).toStrictEqual([]);
});
