# Agent Guidelines

This repo, `zgeoff/skills`, holds every agent skill of the zgeoff GitHub account. People and agents
install them with `npx skills add zgeoff/skills`. A skill here is one of these:

- a user-level skill, which a person or an agent installs for their own use;
- a skill that the playbooks in [`zgeoff/hq`](https://github.com/zgeoff/hq) tell an agent to load;
- a shared skill, which
  [repo-sync](https://github.com/zgeoff/tools/blob/main/docs/architecture/repo-sync.md) in
  `zgeoff/tools` copies into other repos. A change to one reaches those repos only after repo-sync
  opens its PR in each of them.

## Required reading

Before you write or edit any skill or any prose in this repo, read the copies in this repo, not an
installed one. The file you edit may be the one that changes the rules.

- For any prose: [skills/docs-writing/SKILL.md](skills/docs-writing/SKILL.md).
- For a skill, also: [skills/skill-writing/SKILL.md](skills/skill-writing/SKILL.md),
  [skills/cold-read/SKILL.md](skills/cold-read/SKILL.md) and
  [skills/deslop/SKILL.md](skills/deslop/SKILL.md).

When you write or edit a skill, do every step in skill-writing's "Check it" section. Under "Skill
checks" in the PR description, give the output of `bun run check`. The repo has no PR template, so
add "Skill checks", "Cold read" and "Deslop" as `##` headings.

## Repo structure

```text
skills/<name>/      one skill per folder: SKILL.md, plus any references/ and helper scripts/ it uses
```

The skills CLI finds a skill at `skills/<name>/SKILL.md`, and the folder name matches the `name` in
its frontmatter. Keep `SKILL.md` out of the repo root, because the CLI reads a root `SKILL.md` as
the repo's only skill.

## Checks

Run these from the repo root. CI runs the same three on each pull request and each push to `main`:

```bash
bun run format:check
bun run check
bun run test
```

- `bun run check` runs `chex prose length links readmes skill`, the docs checks that
  [`@zgeoff/chex`](https://github.com/zgeoff/tools/tree/main/packages/chex) ships.
- `bun run test` runs the test beside each script that a skill keeps in its `scripts/` folder.
- `bun run format` rewraps Markdown at 100 columns. The pre-commit hook runs it on the staged files,
  so write each paragraph as one line.

The skills give paths for a repo that installs them, under `.agents/skills/`. In this repo, the same
files sit under `skills/`, so run `bun x @zgeoff/chex skill skills/<skill>` in place of
`bun x @zgeoff/chex skill .agents/skills/<skill>`.

## Commits

Work on a branch, and open a pull request into `main`. The repo merges each PR by squash.

Write each commit message and each PR title as a Conventional Commit in the imperative mood, such as
"add X", never "added X". Add no attribution lines.
