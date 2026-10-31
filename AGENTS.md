# Agent Guidelines

This repo is skills, the one home for Geoff's agent skills: his own user-level skills, the leaf
skills that the fleet's playbooks call, and the shared skills that repo-sync in zgeoff/tools
delivers to other repos. People and agents install them with `npx skills add zgeoff/skills`.

## Required reading

Before you write or edit any skill or any prose in this repo, read
[skills/skill-writing/SKILL.md](skills/skill-writing/SKILL.md) and
[skills/docs-writing/SKILL.md](skills/docs-writing/SKILL.md). Read these copies, not an installed
one, because the file you edit may be the one that changes the rules.

## Repo structure

```text
skills/<name>/      one skill per folder: SKILL.md, plus any references/ and helper scripts/ it uses
```

The skills CLI finds a skill at `skills/<name>/SKILL.md`, and the folder name matches the `name` in
its frontmatter. Keep `SKILL.md` out of the repo root, because the CLI reads a root `SKILL.md` as
the repo's only skill.

## Checks

Run these from the repo root. CI runs the same three on each push to `main`:

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

The skills tell an agent to run a check as `bun x @zgeoff/chex <check>`, and a skill's own script as
`bash .agents/skills/<skill>/scripts/<script>`, the path in a repo that installs them. In this repo
those scripts sit under `skills/`.

## Commits

Commit straight to `main`; this repo takes no pull requests. Write each message as a Conventional
Commit in the imperative mood ("add X", never "added X"), with no attribution lines.
