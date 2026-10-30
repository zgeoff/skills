---
name: cold-read
description:
  "Runs a cold read of a doc or a skill. A fresh subagent gets the writing rules and none of your
  conversation, and reports each place it got stuck, with the rule that applies quoted word for
  word. For a skill, it also reports each point where an agent doing a real task would have to
  guess. Use for /cold-read <path>, 'cold read this', and before you hand over any doc or skill you
  wrote."
---

# Cold read

You wrote the file with the conversation, the ticket and the diff in your head, so every sentence
makes sense to you. The real reader has none of that. Hand the file to a fresh subagent, the cold
reader, and let it tell you where it got stuck.

Tell it nothing about what the file is for. If you do, it reads the file the way you do, with your
context filling the gaps.

When it reports, redraft each section it got stuck in. If you patch the sentences it quoted, you
keep the shape that tripped it. Unless the first read was clean, run one more cold read, and stop.

Hand back what's left over after the second read, the findings you declined and why, and any gaps in
the rules. Left over means each second-read finding you didn't fix, and each section you had to
rebuild.

## Key rules

- [Run it](#run-it): one fresh subagent per file, never a fork, told nothing about the change.
- [Act on it](#act-on-it): a call on every finding, and a redraft of each section it hit.
- [Read it again](#read-it-again): one more cold read on the redraft, then stop.
- [Show the user, when asked](#show-the-user-when-asked): the findings as a table with your call on
  each.

## References

- [Cold reader](./references/cold-reader.md): the cold reader's instructions. Point the subagent at
  cold-reader.md itself. If you paraphrase it, you drop rules the cold reader needs.

## Run it

1. From the repo root, run the scripted checks, and fix what they find in your files:

   ```bash
   bash .agents/skills/docs-writing/scripts/check-length.sh
      bash .agents/skills/docs-writing/scripts/check-links.sh
   bash .agents/skills/docs-writing/scripts/check-readmes.sh
   ```

   The cold reader skips what the scripts check, so anything they would catch stays in the file. In
   `zgeoff/skills`, the repo that publishes these skills, the scripts are under `skills/`. Outside a
   repo, skip this step and say so.

2. Find the rules files: [docs-writing](../docs-writing/SKILL.md) and
   [skill-writing](../skill-writing/SKILL.md), plus the repo's project-docs-writing skill when it
   has one. They sit under `.agents/skills/`, or under `skills/` in `zgeoff/skills`. Outside a repo,
   use the user's installed copy. Use the copy in the repo you're working in, because the file
   you're checking may be the one that changes the rules. Pass all of them, for a doc as well as a
   skill.
3. Decide what the file is. Anything an agent reads to do its work, such as a skill, a reference, a
   playbook, a brief or AGENTS.md, is a skill. Anything else is a doc.
4. Spawn one `general-purpose` subagent per file, in parallel when there are several. A skill's
   SKILL.md and each of its references are separate files. Read each file you wrote or changed.
   Never use a fork: a fork inherits your conversation, and the cold reader must not have it.
5. Give each subagent this prompt and nothing else. `<skill_dir>` is the absolute path of the folder
   this SKILL.md is in.

   ```text
   Read <skill_dir>/references/cold-reader.md and follow it as your instructions.
   The file: <absolute path>
   It is a: <doc | skill>
   The rules: <absolute path to each rules file, one per line>
   ```

   Leave out what the file is for, what changed, and what you're worried about. The real reader
   won't know any of it.

## Act on it

Unless the user asked to see the findings, act on them. A bare `/cold-read <path>` means act.

For a skill, the cold reader answers three questions about the top of the file: does it give the
job, the traps to avoid, and what to hand back? If any answer is "no", fix the opening first. An
agent decides what to do from the top.

Then make a call on every item in the report, whether the cold reader got stuck, guessed, or found a
rule break:

- **Fix it** when the cold reader hit a real problem.
- **Decline it** when the only fix is to copy code into the file, or when the cold reader misread
  the file or a rule. Note the reason in a few words, for your reply.
- **Report a gap** when the cold reader got stuck and no rule covers it. Redraft its section too.
  Tell the user the rules may need a new rule, and don't add it yourself: the rules live in
  `zgeoff/skills`, where the user decides.

Redraft every section with a fix or a gap. Start from what the section needs to say, and write it
fresh. If you start from the sentences the cold reader quoted, you keep the shape that got it stuck.

## Read it again

If the first read found nothing, stop. Otherwise run one more cold read on the redraft, with a fresh
subagent, and act on its findings the same way. Then stop. No third read.

If the second read gets stuck in a section you redrafted, change its structure. Empty the section,
write it again in a new order, and report it as left over in your reply.

## Show the user, when asked

When the user asks to see the findings, show them before you act, one row per finding, worst first:

| #   | Line | What the cold reader hit                                    | Rule                      | My call                             |
| --- | ---- | ----------------------------------------------------------- | ------------------------- | ----------------------------------- |
| 1   | 42   | Couldn't tell which "the limit" meant                       | docs-writing, House rules | Fix: name the rate limit            |
| 2   | 77   | Guessed whether to run the check before or after the commit | (none)                    | Gap: no rule on the order of checks |

- **Rule** is the rules file and the section heading, or "(none)" when no rule applies.
- **My call** is fix, decline or gap, with a reason for a decline.
- For a skill, put the cold reader's task and its three answers above the table.

Then ask which calls to change. Act on the answer, then go on to [Read it again](#read-it-again).

**Reply:** what's left over after the second read ("clean" when nothing is, or when the first read
found nothing), the findings you declined with their reasons, and any gaps in the rules. When the
user asked to see the findings: the table, and your question about the calls.
