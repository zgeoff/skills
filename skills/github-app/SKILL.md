---
name: github-app
description:
  Creates a GitHub App for an agent through GitHub's manifest flow, so the human only clicks, stores
  its keys without printing a secret, and proves an installation token against a repo. Load it
  whenever an agent needs a GitHub App or its installation token, and when a fine-grained token gets
  403 on an endpoint it can't be granted, such as check runs on a private repo.
---

# Create a GitHub App

Create the App from a manifest you write. When all goes well, the human clicks through two pages to
create it and one to install it, and types nothing. After the human creates the App, GitHub sends
back a one-time code. [`scripts/github-app.ts`](./scripts/github-app.ts) exchanges that code for the
App's keys and stores them. You never see the client secret, the webhook secret or the private key,
and you never print them.

You're done when `verify` returns HTTP 200, with an installation token, from the endpoint the App
exists for. Then hand back what the **Reply** line at the end lists.

Follow these rules to avoid the costliest mistakes:

- **Pick a destination that doesn't exist yet.** GitHub sends one code per App. `create` checks the
  destination before the human clicks, so a bad one costs nothing then. When the store fails after
  the exchange, the script puts the keys in a rescue file.
- **Run `create` in the background.** Your shell's time limit stops a foreground run before the
  human clicks.
- **Never run `create` again while the first App exists.** That makes a second App. Finish the first
  one with `exchange`.
- **Grant only the permissions the job calls for.** Every installation's owner has to trust each
  one.

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
person, or must outlive one person's access. Each run of the job then mints a token that lasts one
hour, and no person has a token to renew.

## Write the manifest

Make a folder with `mktemp -d`, and write `manifest.json` in it, so nobody commits it. GitHub's
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

- Pick a `name` that no other App on GitHub has, such as the repo's name and the job's. Tell the
  human that GitHub may say the name is taken, and that they can edit it on GitHub's page. GitHub
  makes the slug, the App's name in its URLs, from the final name, so take the slug from the
  script's output.
- Set `url`, the App's homepage, to the repo the job serves.
- Grant in `default_permissions` only what the job calls, each `read` or `write`. Put
  `"metadata": "read"` in every App. GitHub's
  [Permissions required for GitHub Apps](https://docs.github.com/en/rest/authentication/permissions-required-for-github-apps)
  gives the permission for each endpoint.
- Leave `default_events` empty unless a server will receive webhooks. With no `hook_attributes` in
  the manifest, the script turns the webhook off. For a server, add `hook_attributes` with its
  `url`, as GitHub's manifest parameters say.
- Set `public` to `false`, so only the owner can install the App. Set it to `true` only when other
  accounts must install it.
- Leave out `redirect_url`. The script points it at its own local server.

## Create it

1. Ask the human where the keys go. That place is `<dest>` in every command below. With no
   preference, use a file.
   - For a new 0600 JSON file outside every repo, pass `file:<path>`.
   - For a new 1Password item, pass `op:<vault>/<item>`. Run `op whoami` first. When it fails, ask
     the human to sign `op` in.

   `create` also stops when it can't open the vault.

2. Ask the human whether the App belongs to their own account or to an org they own. For an org, add
   `--org <org>`. Then start `create` in the background:

   ```bash
   bun <skill_dir>/scripts/github-app.ts create --manifest <manifest> --dest <dest>
   ```

   `<skill_dir>` is this skill's folder, such as `.agents/skills/github-app`. Read the run's output
   for `open http://127.0.0.1:<port>/ in a browser`.

3. Give the human that address. They click **Continue to GitHub**, then **Create GitHub App**. Ask
   them to tell you when GitHub's page shows an error. The address works only in a browser on your
   machine. When the human's browser runs on another machine, have them forward the port first, such
   as with `ssh -L <port>:127.0.0.1:<port> <your-host>`.
4. Check the run's output every 2 minutes. `create` waits up to 30 minutes, or the minutes
   `--timeout` gives. Expect exit code 0, with the client ID, App ID, slug and install link.

When `create` exits 1, find the case that matches its last line:

- When it reads `The keys are in <rescue-file>`, the keys didn't reach `<dest>`. Fix the cause, such
  as an expired `op` session. Then move the keys with `import`, which deletes the rescue file:

  ```bash
  bun <skill_dir>/scripts/github-app.ts import --from <rescue-file> --dest <dest>
  ```

- When it ends `the code is still unspent`, the script couldn't write in `~/.cache/github-app/`, so
  it never exchanged the code. Fix the folder, such as by freeing disk space. Then take the address
  from the browser, as [the next section](#when-no-callback-reaches-the-server) shows.
- When it starts `no callback reached the server`, `create` timed out. Go on to the next section.

## When no callback reaches the server

`create` gets no callback when it times out, or when GitHub's page shows the human an error. After
an error, stop the background `create`. Then ask the human what the browser's address bar shows.

- When the address carries `?code=` and `state=`, GitHub made the App. Ask the human to paste the
  whole address into the chat. Within an hour of their click, pipe it into `exchange`, with the same
  `<dest>`. `exchange` checks the address against the state that `create` saved in
  `~/.cache/github-app/state.json`:

  ```bash
  printf '%s\n' '<address>' | bun <skill_dir>/scripts/github-app.ts exchange --dest <dest>
  ```

- When an hour has passed, the code no longer works, and the App has no keys you can get. Ask the
  human to delete the App from its settings page, then run `create` again.
- When the address carries no code, GitHub made no App. Ask the human what GitHub's page said, such
  as a permission key it refused. Fix the manifest, then run `create` again.

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

`verify` records `installation_id` beside the keys. A job that uses the App reads `client_id`,
`private_key` and `installation_id` from `<dest>`: the keys of the JSON file, or the fields of the
1Password item. For each run, the job signs a JWT with the client ID as its issuer, then trades it
at `POST /app/installations/<installation_id>/access_tokens` for a token. `signJwt` in
[the script](./scripts/github-app.ts) shows the claims. In GitHub Actions, the
`actions/create-github-app-token` action does both steps.

## Change permissions later

The human edits the App's **Permissions & events** page, at
`https://github.com/settings/apps/<slug>/permissions`. For an org's App, the address starts
`https://github.com/organizations/<org>/settings/apps/<slug>`. Each installation keeps the old
permissions until its owner accepts the new ones, from GitHub's email or the installation's settings
page. After they accept, run `verify` with a `--path` that needs the new permission.

## Clean up

After `verify` passes:

- Delete the manifest's folder.
- Delete `~/.cache/github-app/state.json`, if it's there. The script deletes it after a good
  exchange, and keeps it after a timeout or a kill, for `exchange`.
- Check that no rescue file is left.
- When an attempt left an App the human doesn't want, ask them to delete it from its settings page.

**Reply:** the App's slug, client ID and App ID, the destination, the installation ID, the `verify`
result, and any permission change an installation owner still has to accept.
