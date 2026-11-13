---
name: github-app
description:
  Creates a GitHub App for an agent through GitHub's manifest flow, so the human only clicks, stores
  its keys in 1Password or a 0600 file without printing a secret, and proves an installation token
  against a repo. Load it whenever an agent needs a GitHub App or its installation token, and when a
  fine-grained token gets 403 on an endpoint it can't be granted, such as check runs on a private
  repo.
---

# Create a GitHub App

Create the App from a manifest you write. The human clicks through two pages to create it and one to
install it, and types nothing. After the human creates the App, GitHub sends back a one-time code.
[`scripts/github-app.ts`](./scripts/github-app.ts) exchanges that code for the App's keys and stores
them. You never see the client secret, the webhook secret or the private key, and you never print
them.

You're done when `verify` returns HTTP 200, with an installation token, from the endpoint the App
exists for. Then hand back what the **Reply** line at the end lists.

Avoid these:

- **Let `create` check the destination before the human clicks.** GitHub sends one code per App, so
  a store that fails after the exchange leaves the keys only in a rescue file.
- **Run `create` in the background.** Your shell's time limit stops a foreground run before the
  human clicks.
- **Never run `create` again once GitHub made the App.** That makes a second App. Finish the first
  one with `exchange`.
- **Grant only the permissions the job calls for.** Every installation's owner has to trust each
  one.

## Key rules

- [App or fine-grained token](#app-or-fine-grained-token): build an App when no fine-grained
  permission covers the endpoint.
- [Write the manifest](#write-the-manifest): the least permissions, no events, the webhook off.
- [Create it](#create-it): pick the destination, run `create` in the background, hand the human one
  address.
- [When the callback never arrives](#when-the-callback-never-arrives): take the address from the
  browser and run `exchange`.
- [Install and verify](#install-and-verify): the human installs from the link, `verify` proves a
  token.
- [Change permissions later](#change-permissions-later): the human edits the App, each
  installation's owner accepts.
- [Clean up](#clean-up): delete the manifest and the saved state, import any rescue file.

## App or fine-grained token

Before you build an App, look up the endpoint that got 403 in GitHub's
[Permissions required for fine-grained personal access tokens](https://docs.github.com/en/rest/authentication/permissions-required-for-fine-grained-personal-access-tokens).

- When the page lists the endpoint, grant that permission to the token. For example, the token reads
  `commits/{ref}/statuses` once it has Commit statuses read.
- When the page leaves the endpoint out, a fine-grained token can't call it on a private repo. Check
  runs and check suites are such endpoints. Build an App. A classic token with `repo` also works,
  but it reaches every repo its owner can.

On a public repo, any token reads check runs. Build an App also when the work must not act as a
person, or must outlive one person's access. Each run of the job then mints a token that lasts one
hour, and no person has a token to renew.

## Write the manifest

Write the manifest to a temporary folder outside the repo, so nobody commits it. GitHub's
[manifest parameters](https://docs.github.com/en/apps/sharing-github-apps/registering-a-github-app-from-a-manifest#github-app-manifest-parameters)
list every key.

```json
{
  "name": "kettle-ci-reader",
  "url": "https://github.com/acme/kettle",
  "public": false,
  "default_permissions": { "metadata": "read", "checks": "read", "pull_requests": "read" },
  "default_events": []
}
```

- Pick a `name` that no other App on GitHub has, such as the repo's name and the job's. When it's
  taken, the human edits it on GitHub's page. GitHub makes the slug, the App's name in its URLs,
  from the final name, so take the slug from the script's output.
- Set `url`, the App's homepage, to the repo the job serves.
- Grant in `default_permissions` only what the job calls, each `read` or `write`. Put
  `"metadata": "read"` in every App. The keys you'll use most are `contents`, `pull_requests`,
  `checks`, `statuses` and `issues`. GitHub's
  [Permissions required for GitHub Apps](https://docs.github.com/en/rest/authentication/permissions-required-for-github-apps)
  gives the permission for each endpoint.
- Leave `default_events` empty unless a server will receive webhooks. With no `hook_attributes` in
  the manifest, the script turns the webhook off. For a server, add `hook_attributes` with its
  `url`, as GitHub's manifest parameters say.
- Set `public` to `false`, so only the owner can install the App. Set it to `true` only when other
  accounts must install it.

## Create it

1. Pick the destination with the human. Suggest 1Password first.
   - For a new 1Password item, pass `op:<vault>/<item>`. Ask which vault, and name the item after
     the App. Run `op whoami`, so you know `op` is signed in.
   - For a new 0600 JSON file outside every repo, pass `file:<path>`.

   Before it serves the page, `create` stops when it can't open the vault, or when the item or the
   file exists.

2. Start `create` with your shell tool's background mode. Add `--org <org>` to create the App under
   an org that the human owns.

   ```bash
   bun <skill_dir>/scripts/github-app.ts create --manifest <manifest> --dest op:<vault>/<item>
   ```

   `<skill_dir>` is this skill's folder, such as `.agents/skills/github-app`. Read the run's output
   for `open http://127.0.0.1:<port>/ in a browser`.

3. Give the human that address. They click **Continue to GitHub**, then **Create GitHub App**. Under
   WSL, a Windows browser reaches the address on WSL's `127.0.0.1`. Send the address, never the page
   as a file: Windows fails to open a file by its `\\wsl.localhost\…` path. When the human's browser
   runs on another machine, use [the https page](#when-the-callback-never-arrives) from the start.
4. Check the run's output every few minutes. `create` waits up to 30 minutes, or the minutes
   `--timeout` gives. Expect exit code 0, with the client ID, App ID, slug and install link.

When `create` exits 1, find the case that matches its last line:

- When it reads `The keys are in <rescue-file>`, fix the cause, such as an `op` session that
  expired. Then move the keys with `import`, which deletes the rescue file:

  ```bash
  bun <skill_dir>/scripts/github-app.ts import --from <rescue-file> --dest op:<vault>/<item>
  ```

- When it ends `the code is still unspent`, fix the cause, then run `exchange`, below.
- When it starts `no callback reached the server`, go on to the next section.

## When the callback never arrives

GitHub's docs don't say whether GitHub accepts a loopback `redirect_url`. When `create` times out,
or GitHub's page shows an error, stop the background `create` and ask the human what the browser's
address bar shows.

- When the address carries `?code=` and `state=`, GitHub made the App. Ask the human to paste the
  whole address into the chat. Within an hour of their click, pipe it in. `exchange` checks the
  state that `create` saved:

  ```bash
  printf '%s\n' '<address>' | bun <skill_dir>/scripts/github-app.ts exchange --dest op:<vault>/<item>
  ```

- When it carries no code, GitHub made no App. Run `create` again with
  `--redirect-url https://github.com/<owner>/<repo>`, or any https page the human can open. The
  human starts from the local address again. After they click **Create GitHub App**, GitHub sends
  the browser to the https page, with the code in the address. Take that address as in the bullet
  above, then stop the second `create`.

## Install and verify

1. Give the human the install link, `https://github.com/apps/<slug>/installations/new`. Ask them to
   pick **Only select repositories** and the repos the job needs.
2. When they're done, run `verify` with the endpoint the App exists for. `{repo}` in `--path` stands
   for `<owner>/<repo>`. Without `--path`, `verify` reads the repo itself.

   ```bash
   bun <skill_dir>/scripts/github-app.ts verify --dest op:<vault>/<item> --repo <owner>/<repo> \
     --path '/repos/{repo}/commits/main/check-runs'
   ```

   Expect the installation ID and `HTTP 200`. When the App isn't installed on the repo, `verify`
   prints the install link: send it to the human again.

`verify` records `installation_id` beside the keys. A job that uses the App reads the client ID, the
private key and the installation ID from there. It signs a JWT as `signJwt` in the script does, and
mints a new token for each run.

## Change permissions later

The human edits the App at **Settings → Developer settings → GitHub Apps → `<slug>` → Permissions &
events**. Each installation keeps the old permissions until its owner accepts the new ones, from
GitHub's email or the installation's settings page. After they accept, run `verify` with a `--path`
that needs the new permission.

## Clean up

After `verify` passes:

- Delete the manifest.
- Delete `~/.cache/github-app/state.json`, if it's there. The script deletes it after a good
  exchange, and keeps it after a timeout or a kill, for `exchange`.
- Import any rescue file that a failed run printed, then check that it's gone.
- When an attempt left an App the human doesn't want, ask them to delete it from its settings page.

`create` stops its own server when it exits.

**Reply:** the App's slug, client ID and App ID, the destination, the installation ID, the `verify`
result, and any permission change an installation owner still has to accept.
