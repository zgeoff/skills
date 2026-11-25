---
name: repo-standard
description:
  "Sets up a repo the way the zgeoff repos are set up: a Bun workspace on the shared configs from
  zgeoff/tools, the checks and hooks, the agent files, the GitHub settings and ruleset, repo-sync,
  Renovate, and an npm release through OIDC, in the order you do them, with a check after each step.
  Load it before you create a repo for the owner, before you bring an existing repo up to the
  standard, and for 'set up a new repo' or 'scaffold a CLI'."
---

# Repo standard

Set up a repo the way every repo of the owner is set up, or bring an existing repo up to it. Copy
only from this skill and the files it links. Copy no other file from an older repo: each older repo
carries leftovers that aren't part of the standard. Do the steps in order, because a later step
needs what an earlier one made, and run each step's check before a step that depends on it. When a
check fails, fix the cause and run the check again. When only the owner can do a step, such as the
Renovate App install, ask them, go on with the steps that don't depend on it, and list it in your
reply.

The owner reads your reply to see what's done and what waits on them. Hand back the repo's URL, the
pull requests you opened, the result of each check, and each step you skipped or left to the owner,
with its reason.

When a step sends you to another skill or doc, follow it for that step, then come back here for the
next step.

## Key rules

- [Start the repo](#start-the-repo): a public MIT repo, scaffolded on your machine, with its first
  commit straight to `main`.
- [Workspace and package](#workspace-and-package): Bun pinned twice, the gates in `bunfig.toml`, and
  a workspace with one catalog, even for one package.
- [Checks and hooks](#checks-and-hooks): the shared configs from zgeoff/tools, the six scripts CI
  runs, and the chex baseline.
- [Agent files and docs](#agent-files-and-docs): `AGENTS.md` and `CLAUDE.md` from the template, and
  a README by the docs-writing rules.
- [Push the first commit](#push-the-first-commit): every check passes on your machine first.
- [GitHub settings](#github-settings): squash merges only, auto-merge on, merged branches deleted.
- [Sync and updates](#sync-and-updates): wire repo-sync with the tools runbook, then add Renovate.
- [The ruleset](#the-ruleset): require `pr / checks` once the synced `pr.yml` is on `main`.
- [Release and publish](#release-and-publish): release-please, a release pull request a person
  merges, and an OIDC publish.

## References

- [Files](./references/files.md): the content of each config file the first three steps write.
- [AGENTS.md template](./references/agents-md.md): writing `AGENTS.md` and `CLAUDE.md`.
- [GitHub](./references/github.md): the settings commands and the ruleset.
- [Release](./references/release.md): the release config, the `main.yml` jobs and the order of the
  first publish.

## Start the repo

1. Pick the repo's name, `<repo>`, and the package's npm name, `@<scope>/<name>`. Ask the owner when
   either isn't given.
2. Create the repo as public, with no template, README or licence from GitHub. You add each file
   yourself:

   ```bash
   gh repo create <owner>/<repo> --public --clone
   ```

   Expect: an empty clone in `<repo>/`.

3. Add the MIT licence as `LICENSE` at the root, and the `.gitignore` that
   [Files](./references/files.md#root-files) gives.

An empty repo has no `main` to branch from and no ruleset yet, so build the first commit in the
clone and push it straight to `main`. Every later change goes through a pull request.

To bring an existing repo up to the standard, skip this step and
[Push the first commit](#push-the-first-commit). Run each other step's check, and fix what fails in
a pull request.

## Workspace and package

Make the repo a Bun workspace, even when it holds one package. Every repo of the owner is a
workspace with one version catalog in the root `package.json`, so a second package costs no change
of shape. Put the package in `packages/<name>/`.

1. Pin Bun in `.bun-version` and in `packageManager` in the root `package.json`, to the same
   version.
2. Write `bunfig.toml` with the content in [Files](./references/files.md#bunfigtoml): the isolated
   linker, exact versions, a 7-day `minimumReleaseAge`, and the first-party excludes, which you list
   by hand. `chex dependency-gates` reads `bun.lock`, so it lists nothing until the first install.
3. Write the root `package.json` and the package's `package.json` with the fields in
   [Files](./references/files.md#packagejson). Put each dependency's version in the catalog, and
   write `catalog:` in the package.
4. Ship the CLI as TypeScript source: point `bin` at `src/cli.ts`, and start that file with
   `#!/usr/bin/env bun`. Build to `dist` only when the CLI must run under Node, with a `build`
   script that bundles with `--target node`.
5. Write `tsconfig.base.json` and `tsconfig.json` as [Files](./references/files.md#tsconfig) gives.
   Type-check with `tsrs --fast`.
6. Write `lefthook.yml` as [Files](./references/files.md#lefthookyml) gives, before the first
   `bun install`. The install runs lefthook, which writes a sample `lefthook.yml` when the repo has
   none.
7. Run `bun install`, then `bun x @zgeoff/chex dependency-gates`, and add each package it lists, as
   [First-party packages](../ci-design/SKILL.md#first-party-packages) in ci-design says.

Check: `bun x @zgeoff/chex dependency-gates` passes, and `bun packages/<name>/src/cli.ts --help`
runs.

## Checks and hooks

Install each shared config with the line in its README in zgeoff/tools, and write its config file as
[Files](./references/files.md#tool-configs) gives:

- [`@zgeoff/oxfmt-config`](https://github.com/zgeoff/tools/blob/main/packages/oxfmt-config/README.md),
  in an `oxfmt.config.ts` that spreads it;
- [`@zgeoff/format-codemod`](https://github.com/zgeoff/tools/blob/main/packages/format-codemod/README.md),
  which runs after oxfmt;
- [`@zgeoff/oxlint-config`](https://github.com/zgeoff/tools/blob/main/packages/oxlint-config/README.md),
  extended from `.oxlintrc.json`. Its install line adds `@stylistic/eslint-plugin`, which the shared
  config loads;
- [`@zgeoff/commitlint-config`](https://github.com/zgeoff/tools/blob/main/packages/commitlint-config/README.md),
  extended from `commitlint.config.js`.

Then:

1. Define the six scripts that the shared CI runs: `audit`, `deadcode`, `format:check`, `lint`,
   `typecheck` and `test`. CI fails before it runs anything when one is missing. Add `lint:full`
   too, the type-aware lint, which CI runs only once the [GitHub settings](#github-settings) step
   lists it. [Files](./references/files.md#packagejson) gives each command.
2. Take the pre-push baseline from chex with
   [Taking the baseline from chex](https://github.com/zgeoff/tools/blob/main/docs/runbooks/downstream-repo-setup.md#taking-the-baseline-from-chex)
   in the tools runbook. It adds the baseline to your `lefthook.yml`, and adds `check:docs`. The
   baseline holds no commit-msg hook and no pre-commit fixer, so keep the ones your `lefthook.yml`
   already runs.
3. Set up the tests with `bun x rig init`, as the [testing](../testing/SKILL.md) skill says. Load
   testing before you write the first test.

Check: `bun run format:check`, `bun run lint`, `bun run typecheck`, `bun run test` and
`bun run deadcode` pass.

## Agent files and docs

1. Copy the template in [AGENTS.md template](./references/agents-md.md) into `AGENTS.md`, fill in
   each placeholder, and write the one-line `CLAUDE.md` it gives.
2. Load [docs-writing](../docs-writing/SKILL.md), and write the root README and the package's README
   by its README rules. When the repo publishes one package, add the published-package sections to
   both. Copy `LICENSE` into the package folder: npm packs only the files in that folder.

Check: `bun run check:docs` passes, and `bun x @zgeoff/chex prose AGENTS.md` passes.

## Push the first commit

Commit the scaffold as `chore: set up the workspace`. The commit-msg hook runs commitlint.

The pre-push hook can't pass on an empty remote: `chex commits` and `chex local-paths` find no
branch on the remote to compare with. Run each check from the last two steps by hand, then push with
the hooks off:

```bash
LEFTHOOK=0 git push -u origin main
```

Check: `git log origin/main --oneline` shows the one commit.

## GitHub settings

Allow squash merges only, turn on auto-merge, delete each branch on merge, and set the
`BUN_CHECK_SCRIPTS` variable, with the commands in [GitHub](./references/github.md#repo-settings).
Allow no other merge type: a squash makes the pull request title the commit subject, and CI checks
that title as a Conventional Commit.

Check: the command's output shows each setting.

## Sync and updates

1. Do every step of
   [Wiring up a downstream repo](https://github.com/zgeoff/tools/blob/main/docs/runbooks/downstream-repo-setup.md#wiring-up-a-downstream-repo)
   in the tools runbook. Set its two secrets with the guarded commands in
   [GitHub](./references/github.md#repo-sync-secrets). In the `include` list of `repo-sync.yml`, opt
   in to `workflow-bun-pr`, `workflow-audit-fix`, `knip-runner`, `hook-start` and an entry for each
   skill the repo uses, such as `skill-testing`, `skill-code-style`, `skill-docs-writing`,
   `skill-skill-writing` and `skill-ci-design`. The sync pull request brings `pr.yml`, the PR
   template, `socket.yml` and `.editorconfig`. Sync copies no design-docs skill, so the AGENTS.md
   template points at zgeoff/skills for it.
2. Opt in to the agent hooks and the knip runner with the two sections that follow it in the
   runbook.
3. Add `renovate.json` with only `{ "extends": ["github>zgeoff/tools"] }`, and ask the owner to
   install the Renovate GitHub App on the repo. Renovate skips a repo without both.

A pull request opened before `pr.yml` reached `main` gets no `pr / checks` until its branch moves.
Run `gh pr update-branch <number> -R <owner>/<repo>` on each one.

Check: the sync pull request merged, and `pr / checks` passed on it.

## The ruleset

Add the ruleset in [GitHub](./references/github.md#the-ruleset) only after the synced `pr.yml` is on
`main`. A ruleset that requires `pr / checks` before then blocks every pull request, because nothing
reports that check.

Require a pull request and the one check `pr / checks`. Do not require an up-to-date branch, and
give nobody a bypass. Load [ci-design](../ci-design/SKILL.md) before you require another check.

Check: `gh api repos/<owner>/<repo>/rulesets` lists one active ruleset.

## Release and publish

Load [npm-publish](../npm-publish/SKILL.md) before this step: it owns the first publish and trusted
publishing. Then follow [Release](./references/release.md) to add the release config and the release
and publish jobs in `main.yml`, in the order that keeps the trusted publisher from expiring.

The release job runs with `merge: false`, so each release pull request waits for a merge, which
release.md step 6 covers.

Check: `npm view @<scope>/<name> version` prints the version CI released.

**Reply:** the repo's URL; each pull request you opened; each step's check and its result; each step
you skipped or left to the owner, with its reason.
