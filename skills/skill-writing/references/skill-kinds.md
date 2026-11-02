# Kinds of skill

Pick the kind before you write. A machinery skill and a method skill keep the opening that
[SKILL.md](../SKILL.md#open-with-the-job-and-the-key-rules) sets out, and add the parts below. A
rule set and a project skill leave that opening out.

- [A machinery skill](#a-machinery-skill) covers one repo's tools, such as its migrations or its
  deploy scripts.
- [A method skill](#a-method-skill) teaches a way of working, such as finding out why code is the
  way it is.
- [A rule set](#a-rule-set), such as a code style, holds rules the agent applies while it writes
  something else.
- [A project skill](#a-project-skill) holds one repo's facts for a rule set from this skills repo,
  and the rules the repo replaces, such as project-testing beside testing.

When a skill has a reply line, make it the last line. It starts with "**Reply:**" and names what the
agent hands back, such as "**Reply:** each risk with its proof".

## A machinery skill

Write:

- a line on what it covers;
- the commands, in a table when there's more than one, each with what it needs to run, such as a
  running database or an environment variable;
- the mistakes to avoid, each as a bullet that gives the fact and then what to do about it.

Add a mistake only if an agent with the source open would still lose time to it. A made-up example
of a mistake worth adding:

```markdown
- **The theme cache outlives a test.** [`loadTheme`](../../../src/theme/load-theme.ts) memoises per
  process, so a test that changes a theme file calls `resetThemes()` first.
```

When the agent only runs commands, end the skill without a reply line. When the agent writes
something for a reader, such as a report, say who reads it, and end with a reply line.

## A method skill

Write:

- the attitude you want the agent to take to the work, such as "treat a comment as stale until the
  code agrees with it", and the mistakes it keeps the agent from;
- who reads the agent's output, and what they do with it;
- numbered steps, each with the decision the agent makes in it, such as when to stop;
- a reply line.

When both the user and agents load the skill, write it for the agent. Put how to word the answer for
the user in its own section, such as "When the user asked the question".

## A rule set

Mark it with `kind: rule-set` under a `metadata` key in its frontmatter. Keep the `#` title. Then
put `## References`, when it has any, and the rule sections, one `##` per topic. Leave out the
opening paragraph, `## Key rules`, the hand-back and the reply line: the agent reads a rule set for
the rule that fits what it is writing, and hands nothing back.

In its SKILL.md:

- Start each bullet with what the agent does, with a ban, or with the condition the rule applies
  under: "Name a value for what it holds", "No classes, except a custom error", "When a test changes
  process state, …".
- Never start a bullet with a label and a colon, such as "Exception:", or with "A", "The" or "Each"
  and a noun, such as "A factory builds…".
- Give an example when the agent would otherwise guess the shape, such as a file name or a call.
- Write a short paragraph and a code block for a rule that needs more than a bullet.

## A project skill

Write a project skill in the repo it describes, at `.claude/skills/project-<name>/SKILL.md`, where
`<name>` is the shared rule set it sits beside, such as `project-testing` beside testing.
[Repo-sync](https://github.com/zgeoff/tools/blob/main/docs/architecture/repo-sync.md) copies the
shared skills from this repo into the same `.claude/skills/` folder, and never touches a `project-`
folder. The agent loads both, and where they disagree, the project skill wins. Read the shared skill
before you write, so you know which rules the repo replaces and which it follows.

Write it as a rule set: `kind: rule-set` under `metadata`, the `#` title, `## References` when it
has any, and the bullet rules in [A rule set](#a-rule-set). Then write these sections, in this
order:

1. `## Facts`: a table with the columns Fact and Value. Give it the rows that
   [Facts rows](#facts-rows) lists for the shared skill, in the same order. Write "none" in a row
   that doesn't apply, so the reader sees the gap. When a row holds several items, such as two
   lanes, separate them with semicolons in its one cell. Link the file that holds a value, from
   `../../../`, the repo root. Leave a value that lives in GitHub's settings, such as a repo
   variable, unlinked.
2. `## Departures`: one bullet for each shared rule the repo replaces. Open it with what the repo
   does, link the shared rule's section, and give the reason. Write "None." when the repo follows
   every rule. In project-code-style, put each stricter rule in a topic section, because
   [code-style](../../code-style/SKILL.md) lets a repo add rules. List a departure only for code
   whose shape another tool sets, such as a plugin that a host's API shapes.
3. Then add one `##` section for each topic of the repo that the shared skill can't know, such as a
   test harness or a test helper. When a fact in the table needs more than its cell, such as how to
   start a lane's real system, explain it here.

Never repeat a rule the shared skill states. The agent reads both, and two copies drift apart.

### Facts rows

The Values below say what to write, and hold no links to copy. The terms come from the shared
skills: a test budget and a heavy check from [Jobs](../../ci-design/SKILL.md#jobs) in ci-design, and
a lane from [Lanes](../../testing/references/slow-tests.md#lanes) in testing. Beside a rule set this
section leaves out, add its rows here first, in a pull request to this repo.

project-ci-design:

| Fact                        | Value                                                                                       |
| --------------------------- | ------------------------------------------------------------------------------------------- |
| Visibility                  | public or private                                                                           |
| Test budget                 | the median CI test time, as ci-design defines it                                            |
| `BUN_CHECK_TIMEOUT_MINUTES` | the repo variable that sets the timeout of `bun-checks.yml`                                 |
| `BUN_CHECK_SCRIPTS`         | the repo variable that lists the scripts `bun-checks.yml` runs                              |
| Required checks             | the checks the branch ruleset of `main` requires                                            |
| Heavy checks                | each heavy check, with its runner and its trigger                                           |
| Reusable workflow pin       | how the repo pins the reusable workflows; name the file, never the commit, which goes stale |

project-testing:

| Fact         | Value                                                              |
| ------------ | ------------------------------------------------------------------ |
| Test command | the command that runs the unit tests                               |
| Test timeout | the per-test timeout of the unit run                               |
| Lanes        | each lane's suffix or folder, its real system and its test timeout |
| Test preload | the `preload` entries in `bunfig.toml`                             |
| Test utils   | the folder to search before you write a test helper                |
| Isolation    | `--isolate` or `--no-isolate`, as the test command passes it       |

project-code-style:

| Fact               | Value                                 |
| ------------------ | ------------------------------------- |
| Lint command       | the command CI runs to lint           |
| Lint config        | the lint config file                  |
| Format command     | the command that formats the repo     |
| Type-check command | the command that type-checks the repo |

project-docs-writing:

| Fact        | Value                                    |
| ----------- | ---------------------------------------- |
| Docs index  | the file that lists the repo's docs      |
| Design docs | the folder that holds design docs        |
| Prose check | the command that checks the repo's prose |

A made-up project-ci-design skill:

```markdown
---
name: project-ci-design
description:
  'The CI facts of the Ledgerlark repo, and the ci-design rules it replaces. Load it beside
  ci-design before you change a workflow or a job.'
metadata:
  kind: rule-set
---

# Ledgerlark CI design

## Facts

| Fact                        | Value                                                                                               |
| --------------------------- | --------------------------------------------------------------------------------------------------- |
| Visibility                  | private                                                                                             |
| Test budget                 | 90 s                                                                                                |
| `BUN_CHECK_TIMEOUT_MINUTES` | 10                                                                                                  |
| `BUN_CHECK_SCRIPTS`         | `check test`                                                                                        |
| Required checks             | `checks`                                                                                            |
| Heavy checks                | [`tide-e2e`](../../../.github/workflows/tide-e2e.yml): KVM runner, nightly                          |
| Reusable workflow pin       | a commit on `main`, in [`checks.yml`](../../../.github/workflows/checks.yml); zgeoff/tools moves it |

## Departures

- Run `build` as a job of its own, though [Jobs](../ci-design/SKILL.md#jobs) puts every script in
  `checks`: its artifact upload needs a second runner.

## Release builds

- Run `build` on a tag push only, with `fetch-depth: 0`, so the changelog step sees every commit.
```
