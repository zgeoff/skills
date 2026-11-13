---
name: github-app
description:
  Creates a GitHub App for an agent through GitHub's manifest flow, so the human only clicks, stores
  its keys without printing a secret, and proves an installation token against a repo. Load it
  whenever an agent needs a GitHub App or its installation token, and when a fine-grained token gets
  403 on an endpoint it can't be granted, such as check runs on a private repo.
---

# Create a GitHub App

Set up a GitHub App so a job can mint its own tokens, with no secret passing through you or the
chat. You write a manifest and run [`scripts/github-app.ts`](./scripts/github-app.ts). The human
clicks **Create GitHub App** and **Install**. The script stores the keys and prints only the client
ID, App ID, slug and install link.

You're done when `verify` gets HTTP 200 with an installation token from the endpoint the job needs.
Hand back what the **Reply** line lists.

Keep to these:

- **Pick a new destination for the keys.** `create` refuses an existing file or item before the
  human clicks. After GitHub sends the code, a failed store leaves the keys in a rescue file.
- **Run `create` in the background.** Your shell's time limit stops a foreground run before the
  human clicks.
- **Never run `create` again while the first App exists.** You'd make a second App. Finish the first
  with `exchange`.
- **Grant only the permissions the job calls.** Each installation's owner accepts every one.

## Key rules

- [App or fine-grained token](#app-or-fine-grained-token): build an App when no fine-grained
  permission covers the endpoint.
- [Write the manifest](#write-the-manifest): the least permissions, no events, the webhook off.
- [Create it](#create-it): pick the destination, run `create` in the background, hand the human one
  address.
- [When no callback reaches the server](#when-no-callback-reaches-the-server): take the address from
  the browser and run `exchange`.
- [Install and verify](#install-and-verify): the human installs from the link, `verify` proves a
  token.
- [Change permissions later](#change-permissions-later): the human edits the App, each
  installation's owner accepts.
- [Clean up](#clean-up): delete the manifest and the saved state.

## App or fine-grained token

Before you build an App, look up the endpoint that got 403 in GitHub's
[Permissions required for fine-grained personal access tokens](https://docs.github.com/en/rest/authentication/permissions-required-for-fine-grained-personal-access-tokens).

- When the page lists the endpoint, grant that permission to the token. For example, the token reads
  `commits/{ref}/statuses` once it has Commit statuses read.
- When the page leaves the endpoint out, a fine-grained token can't call it on a private repo. Check
  runs and check suites are such endpoints. Build an App. A classic token with `repo` also works,
  but it reaches every repo its owner can.

On a public repo, any token reads check runs. Build an App also when the work must not act as a
person, or must outlive one person's access. The job mints a one-hour token for each run, and nobody
renews a token.

## Write the manifest

Write `manifest.json` in a folder from `mktemp -d`, outside the repo. GitHub's
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

- Pick a `name` no other App on GitHub has, such as the repo's name plus the job's. Warn the human
  that GitHub may call it taken. They can change it on GitHub's page.
- Take the slug, the App's name in its URLs, from the script's output. GitHub makes it from the
  final name.
- Set `url`, the App's homepage, to the repo the job serves.
- Grant in `default_permissions` only what the job calls, each `read` or `write`. Put
  `"metadata": "read"` in every App. GitHub's
  [Permissions required for GitHub Apps](https://docs.github.com/en/rest/authentication/permissions-required-for-github-apps)
  gives the permission for each endpoint.
- Leave `default_events` empty unless a server will receive webhooks. Without `hook_attributes`, the
  script turns the webhook off. For a server, add `hook_attributes` with its `url`.
- Set `public` to `false`, so only the owner can install the App. Set it to `true` only when other
  accounts must install it.
- Leave out `redirect_url`. The script sets it.

## Create it

1. Ask the human where the keys go, and pass it as `<dest>`. With no preference, use a file.
   - For a new 0600 JSON file outside every repo, pass `file:<path>`.
   - For a new 1Password item, pass `op:<vault>/<item>`. Run `op whoami` first. When it fails, ask
     the human to sign `op` in.

2. Ask the human whether the App belongs to their own account or to an org they own. For an org, add
   `--org <org>`. Then start `create` in the background:

   ```bash
   bun <skill_dir>/scripts/github-app.ts create --manifest <manifest> --dest <dest>
   ```

   `<skill_dir>` is this skill's folder, such as `.agents/skills/github-app`. Wait for the line
   `open http://127.0.0.1:<port>/ in a browser`.

3. Give the human that address. They click **Continue to GitHub**, then **Create GitHub App**, and
   tell you if GitHub shows an error. The address opens only on your machine. For a browser on
   another machine, have the human forward the port first:
   `ssh -L <port>:127.0.0.1:<port> <your-host>`.
4. Check the run's output every 2 minutes. `create` waits up to 30 minutes, or the minutes
   `--timeout` gives. Expect exit code 0, with the client ID, App ID, slug and install link.

When `create` exits 1, find the case that matches its last line:

- When it reads `The keys are in <rescue-file>`, the store failed. Fix the cause, such as an expired
  `op` session. Then move the keys with `import`, which deletes the rescue file:

  ```bash
  bun <skill_dir>/scripts/github-app.ts import --from <rescue-file> --dest <dest>
  ```

- When it ends `the code is still unspent`, the script couldn't write in `~/.cache/github-app/`.
  Free the disk space or fix the folder. Then take the address from the browser, as
  [the next section](#when-no-callback-reaches-the-server) shows.
- When it starts `no callback reached the server`, `create` timed out. Go on to the next section.

## When no callback reaches the server

When `create` times out, or the human reports an error from GitHub, ask what the browser's address
bar shows. After an error, stop `create` first.

- When the address holds `?code=` and `state=`, GitHub made the App. Ask the human to paste the
  whole address into the chat. Within an hour of their click, pipe it into `exchange` with the same
  `<dest>`. `exchange` checks it against the state that `create` saved in
  `~/.cache/github-app/state.json`:

  ```bash
  printf '%s\n' '<address>' | bun <skill_dir>/scripts/github-app.ts exchange --dest <dest>
  ```

- After an hour, the code is dead and you can't get the keys. Ask the human to delete the App from
  its settings page, then run `create` again.
- When the address holds no code, GitHub made no App. Ask the human what GitHub's page said, such as
  a permission key it refused. Fix the manifest, then run `create` again.

## Install and verify

1. Give the human the install link, `https://github.com/apps/<slug>/installations/new`. Ask them to
   pick **Only select repositories** and the repos the job needs.
2. When they're done, run `verify` with the endpoint the App exists for. `{repo}` in `--path` stands
   for `<owner>/<repo>`. Without `--path`, `verify` reads the repo itself.

   ```bash
   bun <skill_dir>/scripts/github-app.ts verify --dest <dest> --repo <owner>/<repo> \
     --path '/repos/{repo}/commits/<branch>/check-runs'
   ```

   `<branch>` is a branch that exists, such as the repo's default branch. Expect the installation ID
   and `HTTP 200`. When the App isn't installed on the repo, `verify` prints the install link: send
   it to the human again.

`verify` saves `installation_id` in `<dest>`, beside `client_id` and `private_key`. The job reads
all three. For each run, it signs a JWT with the client ID as issuer, and trades it at
`POST /app/installations/<installation_id>/access_tokens` for a token. `signJwt` in
[the script](./scripts/github-app.ts) shows the claims. In GitHub Actions,
`actions/create-github-app-token` does both steps.

## Change permissions later

The human edits the App's **Permissions & events** page, at
`https://github.com/settings/apps/<slug>/permissions`. For an org's App, the address starts
`https://github.com/organizations/<org>/settings/apps/<slug>`. Each installation keeps the old
permissions until its owner accepts the new ones, from GitHub's email or the installation's settings
page. After they accept, run `verify` with a `--path` that needs the new permission.

## Clean up

After `verify` passes:

- Delete the manifest's folder.
- Delete `~/.cache/github-app/state.json`, if it's there. A timeout or a kill leaves it behind.
- Check that no rescue file is left.
- When an attempt left an App the human doesn't want, ask them to delete it from its settings page.

**Reply:** the App's slug, client ID and App ID, the destination, the installation ID, the `verify`
result, and any permission change an installation owner still has to accept.
