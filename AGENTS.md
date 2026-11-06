# Agent Guidelines

This repo holds every agent skill of the zgeoff GitHub account. Write each skill for a reader in
another repo: invent each example, and never use a term that only one repo uses. Hand back a pull
request into `main` with green CI, and for a skill change, a `## Checks` section in the PR
description, as [Skill pull requests](#skill-pull-requests) says.

Never open a pull request in another repo to deliver your change.
[repo-sync](https://github.com/zgeoff/tools/blob/main/docs/architecture/repo-sync.md) in
`zgeoff/tools` copies the skills each repo takes, from the commit of this repo that `zgeoff/tools`
pins, and opens those pull requests itself. Anyone outside the zgeoff repos installs the skills with
`npx skills add zgeoff/skills`.

## Required reading

Read the copies in this repo, never an installed copy. An installed copy may be out of date, and the
file you edit may be the one that changes the rules.

- Before you write or edit any prose, read [docs-writing](skills/docs-writing/SKILL.md).
- Before you write or edit a skill, also read [skill-writing](skills/skill-writing/SKILL.md).
- Before you check a skill change, read [deslop](skills/deslop/SKILL.md) and
  [cold-read](skills/cold-read/SKILL.md). You run both in the "Check it" section of skill-writing.

## Repo structure

```text
skills/<name>/      one skill per folder: SKILL.md, plus any references/ and helper scripts/ it uses
```

A Claude Code hook refuses an edit of a skill's `SKILL.md`, or of a file under its `references/`,
until the session loads `skill-writing`, `docs-writing` and `deslop`. `.claude/skill-gate.json`
holds that rule, and `.claude/skills` links to `skills/`, so the hook finds the three skills. Run
`bun install` before you edit a skill: while the hook's package, `@zgeoff/skill-gate`, is missing,
the hook refuses every edit.

The skills CLI finds a skill at `skills/<name>/SKILL.md`, and the folder name matches the `name` in
its frontmatter. Keep `SKILL.md` out of the repo root, because the CLI reads a root `SKILL.md` as
the repo's only skill.

A repo that installs the skills keeps them under `.agents/skills/`, and the skills give paths there.
In this repo the same files sit under `skills/`, so run `bun x @zgeoff/chex skill skills/<skill>` in
place of `bun x @zgeoff/chex skill .agents/skills/<skill>`.

## Checks

Work in a git worktree, and run `bun install` once in it. That installs the pre-commit hook, which
runs oxfmt on the staged files and rewraps each Markdown paragraph at 100 columns. Write each
paragraph as one line, and let the hook wrap it.

Run these from the repo root. CI runs the same three on each pull request and each push to `main`:

```bash
bun run format:check
bun run check
bun run test
```

`bun run check` runs the [`@zgeoff/chex`](https://github.com/zgeoff/tools/tree/main/packages/chex)
checks that [package.json](package.json) lists. `bun run test` runs the test beside each script in a
skill's `scripts/` folder.

## Skill pull requests

When your pull request changes a skill's `SKILL.md`, or a file under its `references/`, do every
step in the "Check it" section of [skill-writing](skills/skill-writing/SKILL.md). Run
`bun run check` for its chex checks. This repo has no PR template, so add a `## Checks` heading to
the PR description yourself. Under it, put the three ticked lines and the `Declined:` list from step
4 of "Check it", or `Declined: none.`

A pull request that changes no skill file needs only green CI.

## Commits and pull requests

Work on a branch, and open a pull request into `main`. The repo owner reviews it and squash-merges
it.

Write each commit message and each PR title as a Conventional Commit in the imperative mood, such as
"add X", never "added X". Use the skill's folder name as the scope, or `skills` for a change to
several skills. Never add attribution lines.
