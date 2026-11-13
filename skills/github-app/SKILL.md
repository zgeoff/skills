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

Create the App from a manifest you write, so the human clicks twice and types nothing: once on the
local page, once on GitHub's "Create GitHub App" button. The script receives the code, exchanges it
for the keys and stores them. You never see the client secret, the webhook secret or the private
key, and you never print them.

The common mistakes cost an App:

- a destination that fails after the exchange, when the code is spent;
- a server run in the foreground, which your shell kills before the human clicks;
- broader permissions than the job needs.

## Key rules

- [App or fine-grained token](#app-or-fine-grained-token): pick an App when a token can't hold the
  permission, or when the identity must not be a person.
- [Write the manifest](#write-the-manifest): the least permissions, no events, the webhook off.
- [Create it](#create-it): run the script in the background, hand the human one address.
- [When the callback never arrives](#when-the-callback-never-arrives): the human pastes the address
  GitHub sent them to.
- [Install and verify](#install-and-verify): the human installs from the link, you prove a token.
- [Change permissions later](#change-permissions-later): edit the App, then each installation's
  owner accepts.
- [Clean up](#clean-up): stop the server, delete the temporary files.

## App or fine-grained token

Pick an App when any of these is true:

- The job reads or writes check runs on a private repo. Fine-grained tokens have no Checks
  permission; an App token or a classic token with `repo` can read them. On a public repo, any token
  reads them.
- The work must not act as a person, or must outlive one person's access.
- The token must expire within an hour without a human renewing it.

Commit statuses are different: a fine-grained token reads them once it has the Commit statuses
permission. When a fine-grained token gets 403, compare the endpoint against GitHub's
[Permissions required for fine-grained personal access tokens](https://docs.github.com/en/rest/authentication/permissions-required-for-fine-grained-personal-access-tokens)
before you build an App. An endpoint missing from that page has no fine-grained permission.

## Write the manifest

Write it to a file in your scratch folder. Every key is in GitHub's
[manifest parameters](https://docs.github.com/en/apps/sharing-github-apps/registering-a-github-app-from-a-manifest#github-app-manifest-parameters).

```json
{
  "name": "kettle-ci-reader",
  "url": "https://github.com/acme/kettle",
  "public": false,
  "default_permissions": { "metadata": "read", "checks": "read", "pull_requests": "read" },
  "default_events": []
}
```

- **`name`:** unique across all of GitHub. The human can change it on GitHub's page when it's taken,
  so read the slug from the script's output.
- **`default_permissions`:** grant only what the job calls. The keys you'll need most are `metadata`
  (always read), `contents`, `pull_requests`, `checks`, `statuses` and `issues`, each `read` or
  `write`. GitHub's
  [Permissions required for GitHub Apps](https://docs.github.com/en/rest/authentication/permissions-required-for-github-apps)
  lists the permission for each endpoint.
- **`default_events`:** leave it empty unless a server will receive webhooks. The script turns the
  webhook off with `hook_attributes.active: false` when the manifest has no `hook_attributes`.
- **`public`:** `false` lets only the owner install it. Make it `true` only when other accounts must
  install it.
- **Owner:** the human's account by default. Pass `--org <org>` to create it under an org; the human
  must be an owner of that org.

## Create it

Pick the destination with the user:

- `op:<vault>/<item>`: a new 1Password item. Ask which vault. The script hands `op item create` a
  0600 template and deletes it, so no secret is on a command line.
- `file:<path>`: a new 0600 JSON file, outside every repo.

The script refuses a destination that already exists, before it serves anything.

1. Start the script in the background. Your shell's time limit ends a foreground run before the
   human clicks.

   ```bash
   bun <skill_dir>/scripts/github-app.ts create --manifest <manifest> --dest op:<vault>/<item>
   ```

   `<skill_dir>` is this skill's folder, such as `.agents/skills/github-app`. Expect
   `open http://127.0.0.1:<port>/ in a browser`.

2. Give the human that address. They click **Continue to GitHub**, then **Create GitHub App**. Under
   WSL, a Windows browser reaches the server on `127.0.0.1`, so give the address. A
   `\\wsl.localhost\…` file path fails to open the page.
3. Wait for the script to exit. Expect the client ID, App ID, slug and an install link on stdout,
   and exit code 0.

The server ignores a callback whose `state` differs from the one it put in the form. It exits after
the first good callback, or after `--timeout` minutes (30 by default).

When it exits 1 with a "rescued" path, the store failed after the exchange. Move the keys from that
0600 file into the destination, then delete the file.

## When the callback never arrives

GitHub's docs don't say whether it accepts a loopback `redirect_url`. If GitHub refuses it, or the
browser can't reach the server:

1. Run `create` again with `--redirect-url https://github.com/<owner>/<repo>`, any https page the
   human can open.
2. After **Create GitHub App**, GitHub sends the browser there with `?code=…&state=…`. Ask the human
   to paste the whole address into the chat. The code works once, within an hour of the form.
3. Pipe it in on stdin, with the same destination:

   ```bash
   printf '%s\n' '<address>' | bun <skill_dir>/scripts/github-app.ts exchange --dest op:<vault>/<item>
   ```

`exchange` checks the state that `create` saved.

## Install and verify

1. Give the human the install link, `https://github.com/apps/<slug>/installations/new`. Ask them to
   pick **Only select repositories** and the repos the job needs.
2. When they're done, prove it:

   ```bash
   bun <skill_dir>/scripts/github-app.ts verify --dest op:<vault>/<item> --repo <owner>/<repo>
   ```

   Expect the installation ID and `HTTP 200`. The script signs a JWT with the client ID as `iss`, as
   GitHub recommends. It finds the installation on `<owner>`, records `installation_id` beside the
   keys, and calls the repo with an installation token.

An installation token lasts one hour. A job mints its own each time from the client ID, the private
key and the installation ID.

## Change permissions later

The human edits the App at **Settings → Developer settings → GitHub Apps → `<slug>` → Permissions &
events**. Each installation keeps the old permissions until its owner accepts the new ones, from the
request GitHub sends them or the installation's settings page. Run `verify` after they accept.

## Clean up

The script stops its server and deletes its template and state file when it exits. Then:

- Delete the manifest from your scratch folder.
- If the script was killed, delete the state file at `~/.cache/github-app/state.json`.
- If an attempt left an App the human doesn't want, ask them to delete it from its settings page.

**Reply:** the App's slug, client ID and App ID, the destination, the installation ID and the
`verify` result, and anything the human still has to accept.
