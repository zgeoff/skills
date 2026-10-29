# Agent Guidelines

This repo is skills, the one home for Geoff's agent skills: his own user-level skills, the leaf
skills that the fleet's playbooks call, and the shared skills that repo-sync in zgeoff/tools
delivers to other repos. People and agents install them with `npx skills add zgeoff/skills`.

## Required reading

Load the `skill-writing` and `docs-writing` skills before you write or edit any skill or any prose
in this repo. Until they move here, read the `SKILL.md` in each one's folder under
`sync/skills/` in zgeoff/tools.

## Repo structure

```text
skills/<name>/      one skill per folder: SKILL.md, plus any references/ and scripts/ it uses
```

The skills CLI finds a skill at `skills/<name>/SKILL.md`, and the folder name matches the `name` in
its frontmatter. Keep `SKILL.md` out of the repo root, because the CLI reads a root `SKILL.md` as
the repo's only skill.

## Commits

Commit straight to `main`; this repo takes no pull requests. Write each message as a Conventional
Commit in the imperative mood ("add X", never "added X"), with no attribution lines.
