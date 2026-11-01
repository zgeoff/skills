---
name: skill-writing
description:
  "Writes or reviews an agent skill: what goes in it, the voice it's written in, how it points at
  code instead of copying it, and how to keep it short and true. Load it before you write, edit, or
  review a SKILL.md or a skill's references, and before you answer a review finding on one."
---

# Writing skills

A skill is a briefing for an agent in the middle of a task. It has the code open and none of your
context. It does what you write, copies your examples, and fills every gap with a guess.

So give it what the code can't:

- when to reach for the skill;
- which commands to run, and what each needs;
- the traps that cost an hour;
- the reasons behind rules that look arbitrary.

Link the code instead of copying it, because a copy goes stale and nobody tells the agent. Keep it
short, or the agent skims.

When you write or edit one, hand back the skill's path and its proof: the [check](#check-it) output,
each [cold-read](../cold-read/SKILL.md) finding with how you answered it, and what
[deslop](../deslop/SKILL.md) changed. Put the same proof in the PR description. When you review one,
hand back each finding with its line and the rule it breaks, quoted.

## Key rules

- [Write it plainly](#write-it-plainly): "you", short blunt lines, the reason beside the rule, no
  rhetoric.
- [Open with the job and the key rules](#open-with-the-job-and-the-key-rules): the same opening in
  every skill.
- [What goes in](#what-goes-in): the parts each kind of skill needs, a description that says when to
  load it, and invented examples.
- [Point at the code, don't copy it](#point-at-the-code-dont-copy-it): link the file and say what
  the code can't.
- [Keep it short and true](#keep-it-short-and-true): under the word limit, with rules and no
  incidents.
- [Check it](#check-it): the `chex` checks, deslop and a cold read, with their proof in the PR
  description.

## References

- [Machinery and method skills](./references/skill-kinds.md): writing a new skill, or adding a
  command, a trap, a step or a reply line to one.

## Write it plainly

The agent copies how you write as well as what you say.

- **Say "you", and say what to do.** An agent fed a list of don'ts writes a list of don'ts.
- **Put the reason next to any rule that needs one.** Then the agent can handle a case you didn't
  foresee. "MUST" and "CRITICAL" can't, and agents over-apply them.
- **Make a person or the agent the subject.** "Add a trap only if…", never "a trap earns its place".
  A thing as the actor hides who does the work.
- **Keep short lines short.** "Worth nothing on its own." Don't pad a blunt line with an
  explanation, a qualifier or tidier grammar. The padding is what reads as machine-written.
- **Cut the rhetoric.** No "X is not the job. The job is Y", no aphorisms, no drama words
  ("worthless", "critical"), no point made three ways. Say the instruction and its reason once.
- **Put a list the agent acts on in bullets.** A list inside a sentence is hard to scan, and it
  grows one item at a time.

When a section still reads oddly after two rewrites, change its structure. Cut the list or the
numbered levels it's built on, and say the plain instruction.

The prose rules in [docs-writing](../docs-writing/SKILL.md) apply too. Where they disagree about a
skill, this skill wins.

## Open with the job and the key rules

Every skill opens the same way, because Claude Code and Codex summarise a long session when it runs
out of room, and only the start of a loaded skill survives whole:

1. A paragraph or two: the job, what the agent hands back, if anything, and the main traps. Write
   them for this skill, with no stock opener, and name the traps without a count ("three traps"). A
   method skill repeats the hand-back in a reply line at the end.
2. `## Key rules`: one line per `##` section, with a link and the rule in a phrase. Leave
   `## Key rules`, `## References` and each `###` out of the list.
3. `## References`, when the skill has any: one line per file in `references/`, with the task that
   needs it.

Keep a rule's detail in its section, and change its key rules line when you change the rule.

A rule set, such as a code style, opens differently. It starts with its first rule, and has no
paragraph and no `## Key rules`: its headings are the index. Give each rule one bullet and one
example.

A reference opens with the facts and traps its reader needs first, never with when to open it. What
to hand back stays in SKILL.md, unless the reference is a subagent's brief: then it gives that
subagent's return format.

## What goes in

For the parts of a skill that covers a repo's tools or teaches a way of working, read
[Machinery and method skills](./references/skill-kinds.md).

Write the `description` in the third person: the agent reads it as a label, not an order. It's all
the agent sees when it picks a skill, so say what the skill does and when to load it, in the words a
task would use. The `name` matches the name of the skill's folder.

When a skill is copied into several repos, invent every example, and never use a term only one repo
or team knows. A reader elsewhere can't open the file, or doesn't know the word.

## Point at the code, don't copy it

When you need a name, link the file, in a sentence that says what the code doesn't: a trap, a reason
or a choice. When someone renames the file, `chex links` fails.

Four kinds of copy:

- **A list of members,** one row per file, function or option. Instead, give the rule that defines
  the list and the search that finds it: "each stand-in is a `build-stub-*` file in `test-utils/`;
  search there before you write one". A table of commands is fine.
- **A retelling.** "The script builds, tags, pushes, then rolls out" goes stale with the script.
  Keep the fact the agent acts on ("a failed push leaves the old version serving") and link the
  script.
- **A quote.** A copied error message teaches the old text once the code changes. Quote only when
  the exact words are the point. Otherwise invent the example.
- **A line anchor.** `#L42` points at the wrong line after the next edit. `chex skill` fails on one,
  so link the file and name what to look for in it.

When a review asks for one of these copies, decline it and name this section. When a review shows a
sentence is wrong, fix it.

## Keep it short and true

Keep SKILL.md under the word limit `chex skill` sets. Past it, the agent skims. When a skill grows,
cut first, then move what only some tasks need into a reference. A rule set, such as a code style,
gets a higher limit: mark it with `kind: rule-set` under a `metadata` key in its frontmatter. A
reference never links to another reference: an agent reads a nested file only in part.

Write the rule. The incident, the issue ID and the date go in the PR.

When a script or a lint can check a rule, delete the prose and say which check runs. Put a
mechanical step in a script in the skill's `scripts/` folder, with a test beside it that the repo's
test command runs. Tell the agent to run the script, not read it.

When an agent gets something wrong, fix the rule that should have caught it. A near-copy of the rule
leaves the agent unsure which one to follow. Call each thing by one name: the agent reads a second
word as a second thing.

Leave out anything time-bound, like "until the next release": it goes false unnoticed.

## Check it

From the repo root:

```bash
bun x @zgeoff/chex prose links skill
```

For one skill, run `bun x @zgeoff/chex skill .agents/skills/<skill>`.

When a check flags a sentence you like, rewrite it so the check passes, and tell your caller which
sentence and which check. The check may be wrong.

Then run the `deslop` skill on each section you wrote or changed. Run the `cold-read` skill on each
file of the skill you wrote or changed, fix what it finds, and read again as that skill says.

Give the proof in the PR description of a skill change. The reviewer then sees each step ran. Use
these headings:

- **Skill checks:** the check output.
- **Cold read:** each cold-read finding, from both reads, and how you answered it: fixed, declined
  with the reason, or reported as a gap in the rules.
- **Deslop:** each change deslop made, as a `diff` block, or "none".

**Reply:** the skill's path and its proof, as the PR description gives it.
