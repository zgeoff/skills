# Agent Guidelines

This repo, `zgeoff/skills`, holds every agent skill of the zgeoff GitHub account. People and agents
install them with `npx skills add zgeoff/skills`, and
[repo-sync](https://github.com/zgeoff/tools/blob/main/docs/architecture/repo-sync.md) in
`zgeoff/tools` copies some of them into other repos. Treat every skill here as one a reader in
another repo may load: invent each example, and use no term that only one repo uses.

When you change a skill here, repo-sync carries the change to the other repos in its own PRs. You
open none of them.

## Required reading

Before you write or edit any prose in this repo, read the rules files in this repo. An installed
copy may be out of date, and the file you edit may be the one that changes the rules.

- For any prose: [skills/docs-writing/SKILL.md](skills/docs-writing/SKILL.md).
- For a skill, also: [skills/skill-writing/SKILL.md](skills/skill-writing/SKILL.md),
  [skills/cold-read/SKILL.md](skills/cold-read/SKILL.md) and
  [skills/deslop/SKILL.md](skills/deslop/SKILL.md).

## Skill pull requests

When you write or edit a skill, do every step in skill-writing's "Check it" section. Then give the
proof in the PR description under three `##` headings: "Skill checks", "Cold read" and "Deslop". The
repo has no PR template.

Under "Skill checks", give the output of `bun run check`. It runs the checks in skill-writing's
"Check it" section, and the README checks.

## Repo structure

```text
skills/<name>/      one skill per folder: SKILL.md, plus any references/ and helper scripts/ it uses
```

The skills CLI finds a skill at `skills/<name>/SKILL.md`, and the folder name matches the `name` in
its frontmatter. Keep `SKILL.md` out of the repo root, because the CLI reads a root `SKILL.md` as
the repo's only skill.

## Checks

Run `bun install` once in each new worktree. It installs the pre-commit hook, which runs oxfmt on
the staged files. The formatter rewraps each Markdown paragraph at 100 columns, so you need not wrap
prose by hand.

Run these from the repo root. CI runs the same three on each pull request and each push to `main`:

```bash
bun run format:check
bun run check
bun run test
```

- `bun run check` runs the [`@zgeoff/chex`](https://github.com/zgeoff/tools/tree/main/packages/chex)
  docs checks that [package.json](package.json) lists.
- `bun run test` runs the test beside each script that a skill keeps in its `scripts/` folder.

The skills give paths for a repo that installs them, under `.agents/skills/`. In this repo, the same
files sit under `skills/`, so run `bun x @zgeoff/chex skill skills/<skill>` in place of
`bun x @zgeoff/chex skill .agents/skills/<skill>`.

## Commits

Work on a branch, and open a pull request into `main`. Your work is done when CI is green and the PR
description holds its proof. The repo owner reviews and merges each PR by squash.

Write each commit message and each PR title as a Conventional Commit in the imperative mood, such as
"add X", never "added X". Use the skill's folder name as the scope, or `skills` for a change to
several skills. Add no attribution lines.
