---
name: npm-publish
description:
  Gets a package that is new to npm ready for its first publish, hands the publisher one line to
  run, then sets up trusted publishing (OIDC) so CI publishes every later version with provenance.
  Load it before the first publish of any package, when a new npm scope or org is needed, and when a
  CI publish fails with ENEEDAUTH, 404 or 403.
---

# First publish to npm

The publisher publishes each package's first version from their own machine, and CI publishes the
rest through OIDC. npm adds a trusted publisher only to a package already on the registry. The
publisher is the user, or another person the user names, with 2FA on npm. You do the prep. The
publisher runs `npm-first-publish` and answers npm's prompts. To add the trusted publisher later,
they run `npm-first-publish trust`. You never see a token or a one-time code.

You're done when `npm view` finds each package, or you've said which ones still 404, and you've
cleaned up.

Every local check passes, and the first CI release still fails, when someone else owns the scope,
the trusted publisher allows only `npm stage publish`, or the trusted publisher expired before CI
used it.

## Prep, then hand off one line

[`scripts/first-publish.sh`](./scripts/first-publish.sh) does every step, run as `npm-first-publish`
from `~/.local/bin`. If the link is missing:
`ln -s <skill_dir>/scripts/first-publish.sh ~/.local/bin/npm-first-publish`.

| Command                                                     | Who runs it                 | What it does                                             |
| ----------------------------------------------------------- | --------------------------- | -------------------------------------------------------- |
| `npm-first-publish check <pkg-dir>... [workflow] [--trust]` | you, at the repo root       | Checks, builds, packs, dry-runs. No login. Saves a plan. |
| `npm-first-publish`                                         | publisher, in a terminal    | Shows the plan, asks once, logs in, publishes, verifies. |
| `npm-first-publish trust <pkg-dir>... [workflow]`           | publisher, at the repo root | Adds the trusted publisher to packages already on npm.   |

`workflow` is the file in `.github/workflows/` whose run starts the publish (for a reusable
workflow, the caller's file); it defaults to `main.yml`. Pass `--trust` only when the first CI
release is less than 2 days away; ask the user when that is.

1. Find each package: every `package.json` under the workspaces without `"private": true`, and the
   release workflow that starts the publish job. `check` stops on a package already on npm.
2. If the code isn't on `main` yet, run from a detached worktree:
   `git worktree add --detach .worktrees/<branch> origin/<branch>`.
3. Run `check` with every package in one call. When it fails, fix the cause through a PR, never by
   editing the package locally. A new commit after `check` stops the publisher's run: check again.
4. Tell the publisher to type `npm-first-publish` in their own terminal. Never run it through your
   shell tool: npm prompts for login and 2FA only on a terminal.
5. When they're done, check the publish and clean up, below.

The script packs with `bun pm pack`, which rewrites `workspace:` and `catalog:` ranges that
`npm pack` ships raw, then publishes the tarball with npm.

## Scope and org

A scope is a user name or an org. `check` reports a 404 when nobody holds it: ask the publisher to
create a free org with that name at <https://www.npmjs.com/org/create>. The publisher's run stops
unless `npm org ls` shows them as a member. A free org publishes public packages only, so the CI
publish needs `"publishConfig": { "access": "public" }`.

## Trusted publishing

- A trusted publisher made after 3 Sep 2026 allows only `npm stage publish` unless made with
  `--allow-publish`; without it CI's `npm publish` fails with ENEEDAUTH. The script passes it.
- An unused trusted publisher expires after 2 days and can't be edited. If the release pipeline
  isn't ready, publish without `--trust` and run `trust` when the first release PR is ready.
- For a reusable workflow, npm checks the caller's file, and both need `id-token: write`.
- `npm trust` needs npm 11.15.0 or later; the script runs it through `npx`. If it fails, add the
  publisher by hand at `https://www.npmjs.com/package/<name>/access`.

## Provenance

npm adds provenance to an OIDC publish from a public repo on GitHub-hosted runners. The manual first
version has none, so publish a placeholder such as `0.0.1` and let CI publish the first real one.

## Check the publish

Ask the publisher to paste the `+ <name>@<version>` line and the list under Done. That line proves
the publish. A new package's `npm view` and page can 404 for minutes after the publish. Don't wait
for them, and never publish a package again once it has that line. Run `npm view <name>` before you
hand back, and say so if it still 404s.

## Clean up

The script removes its temporary files whether the run succeeds or fails. When the publisher's run
fails partway, ask them to run `npm-first-publish` again. The script keeps the plan, and publishes
only the packages that aren't on npm yet. After the last publish (and `trust`, if it ran):

1. `git worktree remove .worktrees/<branch>`. If `git -C .worktrees/<branch> status` shows a change,
   it isn't yours: stop and ask.
2. Offer `npm logout`, which revokes the token `npm login` saved, unless more first publishes are
   planned.

## What goes wrong

- **`ENEEDAUTH` in CI:** the trusted publisher is set to another file or repo, lacks
  `--allow-publish`, or expired. The publisher runs `npx -y npm@latest trust list <name>`, revokes
  it with `npx -y npm@latest trust revoke`, and runs `npm-first-publish trust`.
- **`E404` or `E403` on the first CI publish:** `npm view <name>`. A 404 means the manual publish
  never happened; otherwise no trusted publisher exists, so run `trust`.
- **`E402 Payment Required`:** a scoped publish without public access; add `publishConfig` through a
  PR.
- **`check` stops on `repository.url`:** it must name the GitHub repo the workflow runs in.
- **`bun publish` in the workflow:** no OIDC support. Publish with npm from Node 24.

**Reply:** each package and version, whether trusted publishing is on, and what's left after the
first CI release: lock the package ("Require two-factor authentication and disallow tokens"; trusted
publishing still works), check the provenance badge, and run `npm audit signatures` in a project
that installs it.
