# AGENTS.md template

Copy the template below into `AGENTS.md` at the repo root, and replace each placeholder. Keep the
headings, their order and each line with no placeholder. Every repo of the owner shares them, so an
agent finds the same rule in the same place in each repo.

| Placeholder       | What goes there                                                                                            |
| ----------------- | ---------------------------------------------------------------------------------------------------------- |
| `<repo>`          | the repo's name                                                                                            |
| `<purpose>`       | what the repo is for, in one clause, such as "a CLI that renames photos by the date they were taken"       |
| `<overview>`      | a link to the doc that explains how the parts fit, such as `[the overview](docs/architecture/overview.md)` |
| `<project-skill>` | a `project-<name>` skill of the repo; give each its own row, or delete the row when it has none            |
| `<shared-skill>`  | the shared skill that the project skill sits beside, such as `testing`                                     |
| `<adds>`          | what the project skill adds or replaces, such as "the repo's test lanes and stand-ins"                     |
| `<folder>`        | each folder at the top two levels, with a line on what it holds                                            |

When the repo has no `docs/` yet, delete the sentence that names `<overview>`. Put a rule of the
repo's own about code, tests, docs or CI in a `project-<name>` skill beside the shared skill on that
topic. Add a section after `## Commits and pull requests` only for a rule that fits no skill, such
as a rule about the repo's hosts.

````markdown
# Agent Guidelines

This repo is <repo>, <purpose>. Read <overview> to see how its parts fit. Hand back a pull request
into `main` with green CI, and never merge it: the repo owner merges every pull request.

## Required reading

The rules a task needs are not repeated here. Load the skill for the work before starting it. The
skills are in `.agents/skills/`, and `.claude/skills` links to that folder.

| Skill             | Load before                                                                 |
| ----------------- | --------------------------------------------------------------------------- |
| `code-style`      | writing, reviewing, or renaming any TypeScript                              |
| `testing`         | designing, writing, or reviewing tests                                      |
| `docs-writing`    | writing or editing any committed prose: `docs/`, READMEs, this file, skills |
| `ci-design`       | adding, changing, or reviewing a workflow, a job or a step                  |
| `skill-writing`   | writing or editing a skill                                                  |
| `cold-read`       | checking a skill you wrote or changed, before its PR                        |
| `deslop`          | editing the prose of a skill you wrote or changed, before its PR            |
| `<project-skill>` | the same, beside `<shared-skill>`: <adds>                                   |

repo-sync delivers each shared skill at the `zgeoff/skills` commit that `zgeoff/tools` pins, and
overwrites a local edit. Never edit a shared skill here. Put a rule of this repo's own about code,
tests, docs or CI in a `project-<name>` skill beside the shared skill on that topic. repo-sync
copies no `design-docs` skill: before you write a design or a decision record, load
[`design-docs`](https://github.com/zgeoff/skills/tree/main/skills/design-docs) from zgeoff/skills.

When you write or edit a skill:

1. Load the `skill-writing`, `cold-read` and `deslop` skills from `.agents/skills/`.
2. Do every step in the "Check it" section of `.agents/skills/skill-writing/SKILL.md`. In its last
   step, tick the Deslop and Cold read lines of the PR template's `## Checks` section, each with the
   short hash of the commit you checked, and leave the chex line for CI.

## Repo structure

<repo> is one Bun workspace.

```text
<folder>/        <what it holds>
  <folder>/      <what it holds>
```

## Packages

- Every external version lives once, in the root `workspaces.catalog`. A package writes `"catalog:"`
  for an external dependency and `"workspace:*"` for an internal one.
- Pin exact versions, with no `^` or `~` ranges. `bun add` saves exact versions; apply the same rule
  to hand-written edits.

## Commands

- `bun run typecheck`, `bun run lint` and `bun run test` are the local checks. Run them before you
  push, and fix every failure.
- `bun run format` fixes formatting, and `bun run check:docs` runs the docs checks.
- lefthook runs the light checks before a commit and a push. Leave the larger checks to CI, because
  the host may have little memory.

## Commits and pull requests

- Every change reaches `main` through a pull request from its own branch. Open it with the repo's
  pull request template.
- Write each commit message and PR title as a Conventional Commit in the imperative mood: "add X",
  never "added X". A squash merge makes the PR title the commit subject.
- Add no attribution lines: no co-author trailers and no generator notes.
````

Write `CLAUDE.md` beside it as one line:

```markdown
See @AGENTS.md for project guidelines.
```
