---
name: skill-writing
description: "Writes or reviews an agent skill: what goes in it, the voice it's written in, how it points at code instead of copying it, and how to keep it short and true. Load it before you write, edit, or review a SKILL.md or a skill's references, and before you answer a review finding on one."
---

# Writing skills

A skill is a briefing for an agent that's in the middle of a task. It has the code open and none
of your context. It follows what you write closely, copies your examples, and fills every gap with
the shortest path that compiles.

The agent can read the code, so give it what the code can't tell it:

- when to reach for this skill;
- which commands to run, and what each needs;
- the traps that cost an hour;
- the reasons behind rules that look arbitrary.

You can get a skill wrong in four ways. You copy the code, and the copy goes out
of date. You list rules with no reasons, and the agent can't judge the case you didn't foresee.
You leave a gap, and the agent fills it with a guess. Or the skill grows until the agent skims it.

When you're done, hand back the skill's path, the output of its checks, and what a
[cold read](../cold-read/SKILL.md) found: a fresh subagent's report of where it got stuck.

## Key rules

- [Write it the way you want the work done](#write-it-the-way-you-want-the-work-done): the agent
  copies the voice as well as the rules.
- [Open with the job and the key rules](#open-with-the-job-and-the-key-rules): the same opening in
  every skill.
- [What goes in](#what-goes-in): commands and traps for machinery; stance, steps and a reply for a
  method.
- [Point at the code, don't copy it](#point-at-the-code-dont-copy-it): link the file and say what
  the code can't.
- [Keep it short and true](#keep-it-short-and-true): under the word limit, and rules rather
  than stories.
- [Check it](#check-it): `check-length.sh` and `check-links.sh`, then a cold read.

## Write it the way you want the work done

An agent copies how a skill is written as well as what it says. Write prohibitions, and it writes
prohibitions back.

- **Put the reason next to each rule whose reason isn't obvious.** With the reason, the agent can
  judge a case you didn't foresee. "MUST" and "CRITICAL" can't do that, and agents over-apply
  them.
- **Address the agent as "you"**, in plain words, because that's how it reads an instruction
  meant for it.
- **Make a person or the agent the subject**, not a thing acting like a person: "add a trap only
  if an agent with the source open would still lose time to it", not "a trap earns its place when
  an agent would still lose time to it". A sentence with a thing as the actor hides who has to do
  the work.
- **Put a list the agent acts on or adds to in bullets.** A list inside a sentence is hard to
  scan, and the next agent that edits it appends one more item to the sentence. Two or three short
  examples inside a sentence are fine.
- **Keep a slogan only next to its full rule.** A slogan like "read first, open the rules
  second" sticks, but only after the paragraph beside it says what it means and why.

The prose rules in [docs-writing](../docs-writing/SKILL.md) apply to a skill too. Where the two
disagree about a skill, this skill wins.

## Open with the job and the key rules

Every skill opens the same way:

1. A paragraph or two on the job and how it goes wrong. A method also says what the agent hands
   back, here and again in its last line.
2. `## Key rules`: one line for each `##` section, with a link and the rule in a phrase. A
   `###` stays inside its section.
3. `## References`, when the skill has any: one line for each file in `references/`, with the task
   that needs it.

When a long session runs out of room, the harness, such as Claude Code or Codex, summarises it.
Only the start of a loaded skill survives in full.

Keep the detail in the section. When you change a rule, change its key rules line too.

A reference opens with a sentence or two on the task it serves and how that task goes wrong.
What to hand back stays in SKILL.md.

## What goes in

In a skill about one repo's machinery, write:

- a line on what it covers;
- the commands, with what each needs, in a table when there's more than one;
- a list of traps, each with what to do about it.

Add a trap only if an agent with the source open would still lose time to it. Put an invented
example in a code block, because `check-links.sh` fails an invented link anywhere else:

```markdown
- **The theme cache outlives a test.** [`loadTheme`](../../../src/theme/load-theme.ts) memoises
  per process, so a test that changes a theme file calls `resetThemes()` first.
```

A method skill teaches a way of working, such as finding out why code is the way it is. In one,
write:

- the stance, and how the work goes wrong;
- who reads the agent's output, and what that reader does with it;
- the steps, with the judgment inside each;
- a last line that says what to hand back, such as "**Reply:** each risk with its proof".

A machinery skill needs a reader and a reply line only when it produces something for someone,
such as a report.

Write the `description` in the third person, because the agent reads it as a label, not an order.
It's all the agent sees when it picks among a hundred skills, so say what the skill does and when
to load it, in a task's words. The `name` matches the folder.

## Point at the code, don't copy it

A copy of the code goes out of date the next time the code changes, and the agent never finds out.
When you need a name, link the file, in a sentence that says what the code doesn't: a trap, a
reason or a choice. A rename then fails `check-links.sh`.

Watch for four kinds of copy:

- **A list of members.** One row per file, function or option is a copy. Give the rule that
  defines the list and the search that finds it: "each stand-in is a `build-stub-*` file in
  `test-utils/`; search there before you write one". A table of commands is fine: the agent
  needs those at the call.
- **A retelling.** "The script builds, tags, pushes, then rolls out" goes out of date with the
  script. Keep the fact the agent acts on ("a failed push leaves the old
  version serving") and link the script.
- **A quote.** A copied error message teaches the old text once the code changes. Quote only when
  the exact words are the point, and otherwise invent the example.
- **A line anchor.** `#L42` points at the wrong line after the next edit.
  [`check-skill.sh`](./scripts/check-skill.sh) fails on one, so link the file and name what to look
  for in it.

When a review asks for one of these four kinds of copy, such as every member of a list, decline it
and name this section. When a review shows a sentence is wrong, fix it.

In a shared skill, one that `zgeoff/skills` delivers to other repos, invent every example. A reader
in another repo can't open a real one.

## Keep it short and true

Keep SKILL.md under the word limit that `check-skill.sh` sets, because past it the agent skims.
When a skill grows, cut first, then move what only some tasks need into a
reference. A reference never links to another reference: an agent reads a nested file only in
part.

Write rules, not stories. The incident, the issue ID and the date go in the PR.

When a script or a lint can check a rule, delete the prose and say which check runs. Put a
mechanical step in a script in the skill's `scripts/` folder, with a test beside it that the repo's
test command runs. Tell the agent to run the script, not read it.

When an agent gets something wrong, fix the rule that should have caught it. A second rule that
nearly repeats it leaves the agent unsure which to follow. Call each thing by one name, because
the agent reads a second word as a second thing.

Leave out anything time-bound, like "until the next release": nobody notices when it goes false.

## Check it

Run these from the repo root:

```bash
bash .agents/skills/docs-writing/scripts/check-length.sh
bash .agents/skills/docs-writing/scripts/check-links.sh
```

`check-length.sh` runs `check-prose.sh` and `check-skill.sh` over every skill. `check-links.sh`
resolves every relative link. To check one skill, run
`bash .agents/skills/skill-writing/scripts/check-skill.sh .agents/skills/<skill>`.

Then run the `cold-read` skill on SKILL.md and on each reference. The checks can't tell whether
the top of the file gives a cold agent the job; a cold read can.

When a check flags a sentence you like, rewrite the sentence so the check passes, and tell the
user. The check may be wrong, and it lives in
`zgeoff/skills`, where the user can change it for every repo.

**Reply:** the skill's path, the check output, and what the cold read found.
