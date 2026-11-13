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
install it, and types nothing. [`scripts/github-app.ts`](./scripts/github-app.ts) receives GitHub's
code, exchanges it for the keys and stores them. You never see the client secret, the webhook secret
or the private key, and you never print them. You're done when `verify` returns HTTP 200 from the
repo with an installation token. Then hand back the App's IDs, where its keys are and the
installation ID.

Each of these mistakes leaves an App that the human deletes and creates again:

- a destination that `op` can't write to, found after GitHub spent the code;
- a `create` run in the foreground, which your shell's time limit stops before the human clicks;
- a second `create` after GitHub already made the App, which makes a second App;
- more permissions than the job calls for.

## Key rules

- [App or fine-grained token](#app-or-fine-grained-token): build an App when no fine-grained
  permission covers the endpoint.
- [Write the manifest](#write-the-manifest): the least permissions, no events, the webhook off.
- [Create it](#create-it): check the destination, run `create` in the background, hand the human one
  address.
- [When the callback never arrives](#when-the-callback-never-arrives): take the address from the
  browser and run `exchange`.
- [Install and verify](#install-and-verify): the human installs from the link, `verify` proves a
  token.
- [Change permissions later](#change-permissions-later): the human edits the App, each
  installation's owner accepts.
- [Clean up](#clean-up): delete the manifest, any rescue file, and any App nobody wants.

## App or fine-grained token

Before you build an App, look up the endpoint that got 403 in GitHub's
[Permissions required for fine-grained personal access tokens](https://docs.github.com/en/rest/authentication/permissions-required-for-fine-grained-personal-access-tokens).

- When the page lists the endpoint, grant that permission to the token. For example, the token reads
  `commits/{ref}/statuses` once it has Commit statuses read.
- When the page leaves the endpoint out, no fine-grained token can call it on a private repo. Check
  runs and check suites are such endpoints: build an App, or use a classic token with `repo`. On a
  public repo, any token reads them.

Build an App also when the work must not act as a person, or must outlive one person's access. The
job then mints its own token, which lasts one hour, and no person has a token to renew.

## Write the manifest

Write the manifest to a temporary folder outside the repo. GitHub's
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

- Pick a `name` that no other App on GitHub has. When it's taken, the human edits it on GitHub's
  page, so take the slug from the script's output.
- Set `url`, the App's homepage, to the repo the job serves.
- Grant in `default_permissions` only what the job calls, each `read` or `write`. Put
  `"metadata": "read"` in every App. The keys you'll use most are `contents`, `pull_requests`,
  `checks`, `statuses` and `issues`. GitHub's
  [Permissions required for GitHub Apps](https://docs.github.com/en/rest/authentication/permissions-required-for-github-apps)
  gives the permission for each endpoint.
- Leave `default_events` empty unless a server will receive webhooks. With no `hook_attributes` in
  the manifest, the script turns the webhook off.
- Set `public` to `false`, so only the owner can install the App. Set it to `true` only when other
  accounts must install it.

## Create it

1. Pick the destination with the human:
   - `op:<vault>/<item>`, a new 1Password item. Ask which vault, and name the item after the App.
     Run `op whoami` first: `create` stops when `op` can't open the vault or the item exists.
   - `file:<path>`, a new 0600 JSON file outside every repo. `create` stops when the file exists.
2. Start `create` with your shell tool's background mode. Add `--org <org>` to create the App under
   an org that the human owns.

   ```bash
   bun <skill_dir>/scripts/github-app.ts create --manifest <manifest> --dest op:<vault>/<item>
   ```

   `<skill_dir>` is this skill's folder, such as `.agents/skills/github-app`. Read the run's output
   for `open http://127.0.0.1:<port>/ in a browser`.

3. Give the human that address, even under WSL. A Windows browser reaches a server on WSL's
   `127.0.0.1`, while `explorer.exe` fails to open an HTML file by its `\\wsl.localhost\…` path.
   They click **Continue to GitHub**, then **Create GitHub App**.
4. Wait for `create` to exit. Expect exit code 0, with the client ID, App ID, slug and install link
   in its output.

When `create` exits 1 and names a rescue file, the store failed after GitHub spent the code. Fix the
cause, such as an `op` session that expired, then move the keys:

```bash
bun <skill_dir>/scripts/github-app.ts import --from <rescue-file> --dest op:<vault>/<item>
```

## When the callback never arrives

GitHub's docs don't say whether it accepts a loopback `redirect_url`. When `create` times out after
30 minutes, or GitHub's page reports an error, ask the human what the browser shows.

- **An address with `?code=` and `state=`:** GitHub made the App. Never run `create` again for it.
  Ask the human to paste the whole address into the chat, and pipe it in within an hour of the
  click. `exchange` checks the state that `create` saved:

  ```bash
  printf '%s\n' '<address>' | bun <skill_dir>/scripts/github-app.ts exchange --dest op:<vault>/<item>
  ```

- **No such address:** GitHub made no App. Run `create` again with
  `--redirect-url https://github.com/<owner>/<repo>`, or any https page the human can open. The
  human starts from the local page as before. GitHub then sends the browser to that page with the
  code. Take the address as in the bullet above, and stop the background `create` once `exchange`
  succeeds.

## Install and verify

1. Give the human the install link, `https://github.com/apps/<slug>/installations/new`. Ask them to
   pick **Only select repositories** and the repos the job needs.
2. When they're done, run:

   ```bash
   bun <skill_dir>/scripts/github-app.ts verify --dest op:<vault>/<item> --repo <owner>/<repo>
   ```

   Expect the installation ID and `HTTP 200`. When the App isn't installed on the repo, `verify`
   prints the install link: send it to the human again.

3. To prove the endpoint the App exists for, add `--path`, such as
   `--path '/repos/{repo}/commits/main/check-runs'`. The script puts `<owner>/<repo>` in place of
   `{repo}`.

`verify` records `installation_id` beside the keys. A job that uses the App reads the client ID, the
private key and the installation ID from there, signs a JWT as `signJwt` in the script does, and
mints a new token for each run.

## Change permissions later

The human edits the App at **Settings → Developer settings → GitHub Apps → `<slug>` → Permissions &
events**. Each installation keeps the old permissions until its owner accepts the new ones, from
GitHub's email or the installation's settings page. After they accept, run `verify` with a `--path`
that needs the new permission.

## Clean up

`create` stops its server when it exits. `exchange` and `create` delete the saved state after a good
exchange, and keep it after a timeout so `exchange` can still run. Then:

- Delete the manifest.
- Delete the saved state at `~/.cache/github-app/state.json` when no `exchange` is left to run.
- Make sure no rescue file is left at the path `create` printed.
- When an attempt left an App the human doesn't want, ask them to delete it from its settings page.

**Reply:** the App's slug, client ID and App ID, the destination, the installation ID and the
`verify` result, and any permission change an installation owner still has to accept.
