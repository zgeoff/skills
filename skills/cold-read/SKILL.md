---
name: cold-read
description:
  "Runs a cold read of a doc or a skill. A fresh subagent with the writing rules and none of your
  conversation reports each place it got stuck, with the rule that applies quoted word for word. For
  a skill, it also reports each point where an agent doing a real task would have to guess. Use for
  /cold-read <path>, 'cold read this', and before you hand over any doc or skill you wrote."
---

# Cold read

You can't see where your own writing depends on context the reader won't have. You read every
sentence with the conversation, the ticket and the diff in your head, so every sentence makes sense
to you. A fresh subagent, the cold reader, reads the file without them, the way the real reader
will, and reports each place it got stuck.

Tell the cold reader nothing about what the file is for, or it reads with your context after all.
When it reports, redraft the section it got stuck in. A patch to the sentences it quoted keeps the
shape that got it stuck.

You fix the file, run a second cold read on your redraft, and hand back what that second read found,
the findings you declined and why, and any gaps in the rules.

## Key rules

- [Run it](#run-it): one fresh subagent per file, never a fork, told nothing about the change.
- [Act on it](#act-on-it): a call on every finding, and a redraft from the facts.
- [Read it again](#read-it-again): one more cold read on the redraft, then stop.
- [Show the user, when asked](#show-the-user-when-asked): the findings as a table with your call on
  each.

## References

- [Cold reader](./references/cold-reader.md): the cold reader's instructions. Point it here rather
  than paraphrase them, because a paraphrase drops rules the cold reader needs.

## Run it

1. From the repo root, run the scripted checks, and fix what they find in your files:

   ```bash
   bash .agents/skills/docs-writing/scripts/check-length.sh
   bash .agents/skills/docs-writing/scripts/check-links.sh
   ```

   Otherwise the cold reader reports banned words you could have fixed yourself.

2. Find the rules files: [docs-writing](../docs-writing/SKILL.md) and
   [skill-writing](../skill-writing/SKILL.md), plus the repo's project-docs-writing skill when it
   has one. They sit under `.agents/skills/`, or under `skills/` in `zgeoff/skills`, the repo that
   publishes them. Use the copy in the repo you're working in, because the file you're checking may
   be the one that changes the rules. Pass all of them, for a doc as well as a skill.
3. Decide what the file is. Anything an agent reads to do its work, such as a skill, a reference, a
   playbook, a brief or AGENTS.md, is a skill. Anything else is a doc.
4. Spawn one `general-purpose` subagent per file, in parallel when there are several. A skill's
   SKILL.md and each of its references are separate files. Never use a fork: a fork inherits your
   conversation, and the cold reader must not have it.
5. Give each subagent this prompt and nothing else. `<skill_dir>` is the absolute path of this
   skill's folder.

   ```text
   Read <skill_dir>/references/cold-reader.md and follow it as your instructions.
   The file: <absolute path>
   It is a: <doc | skill>
   The rules: <absolute path to each rules file, one per line>
   ```

   Leave out what the file is for, what changed, and what you're worried about. The real reader
   won't have any of that.

## Act on it

Unless the user asked to see the findings, act on them. A bare `/cold-read <path>` means act.

For a skill, the cold reader answers three questions about the top of the file: does it give the
job, the traps to avoid, and what to hand back? If any answer is "no", fix the opening first,
because an agent decides what to do from the top.

Then make a call on every item in the report, whether the cold reader got stuck, guessed, or found a
rule break:

- **Fix it** when the cold reader hit a real problem.
- **Decline it** when the only fix is to copy code into the file, or when the cold reader misread a
  rule. Note the reason in a few words.
- **Report a gap** when the cold reader got stuck and no rule covers it. Fix the sentence too. Tell
  the user the rules may need a new rule, and don't add it yourself: the rules live in
  `zgeoff/skills`, where the user decides.

Redraft every section that has a finding. Start from what the section needs to say, not from the
sentences the cold reader quoted, because a patched sentence keeps the shape that got it stuck.

## Read it again

If the first read found nothing, stop: there's no redraft to read. Otherwise run one more cold read
on the redraft, with a fresh subagent, and act on its findings the same way. Then stop, with no
third read.

If the second read gets stuck in a section you redrafted, the section's structure is wrong, not its
words. Empty the section and write it again in a new order, then report it as left over.

## Show the user, when asked

When the user asks to see the findings, show them before you act, one row per finding, worst first:

| #   | Line | What the cold reader hit                                    | Rule                                 | My call                             |
| --- | ---- | ----------------------------------------------------------- | ------------------------------------ | ----------------------------------- |
| 1   | 42   | Couldn't tell which "the limit" meant                       | Make every reference easy to resolve | Fix: name the rate limit            |
| 2   | 77   | Guessed whether to run the check before or after the commit | (none)                               | Gap: no rule on the order of checks |

- **Rule** is the rule's heading, or "(none)" when no rule applies.
- **My call** is fix, decline or gap, with a reason for a decline.
- For a skill, put the cold reader's task and its three answers above the table.

Then ask which calls to change, and act on the answer.

**Reply:** what the second read found ("clean", or what's left), the findings you declined with
their reasons, and any gaps in the rules. When the user asked to see the findings: the table, and
your question about the calls.
