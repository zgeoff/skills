---
name: how
description:
  "Explains how a subsystem, a flow or a piece of code works, at the level a senior engineer needs
  before changing it: what it is, its parts, the flow step by step, where each part lives, and the
  traps. Reads the repo's docs first and reports where they differ from the code. Load it for 'how
  does X work', a walkthrough before a change, and 'where should this live' or 'which layer owns
  this'. For why something is built a certain way, load the why skill."
---

# How

Find out how part of a codebase works, for whoever asked. That's usually an agent about to change
the code, often you, and it acts on the answer. When the user asked the question, write for the
user. You read the repo's docs, then start subagents that trace the code and write the answer.

The answer has to let the reader predict what the code does in a case it never mentions. A
line-by-line retelling gives them the function names, and they still can't predict the code. Repo
docs go stale, so don't answer from them yourself: the subagents check each doc claim against the
code. The answer lists each untraced stage, a stage of the flow nobody could follow in the code.
Leave why the code is built this way to the [why](../why/SKILL.md) skill. Hand back the explainer's
answer, written for the agent or for the user, as [Answer](#answer) and
[When the user asked the question](#when-the-user-asked-the-question) say.

## Key rules

- [Read the docs first](#read-the-docs-first): `docs/README.md`, then the architecture doc that owns
  the concept.
- [Simple or complex](#simple-or-complex): one explainer for a simple question; 2 to 4 explorers,
  then one explainer, for a complex one.
- [Answer](#answer): up to six sections, real names and paths, with stale docs and untraced stages
  under Traps.
- [When the user asked the question](#when-the-user-asked-the-question): tell the explainer, which
  then draws the flow in frames, and keeps "Where things live" only when the user asked for it.
- [Asked twice](#asked-twice): when the question came up before, offer to put the answer in the
  docs.

## References

Each subagent reads one file from this skill's `references/` folder, next to this SKILL.md. Give it
the file's absolute path, and tell it to read the file first.

- [explorer.md](./references/explorer.md): each explorer, on a complex question.
- [explainer.md](./references/explainer.md): the explainer, on every question.

## Read the docs first

Before you start any subagent, read what the repo already says:

1. `docs/README.md`, the index of the repo's docs. There you find the doc for each concept.
2. The doc in `docs/architecture/` that covers the concept the question asks about. When the index
   names none, search `docs/architecture/` for the concept's name.
3. A decision record in `docs/decisions/`, only when the question turns on why something was built a
   certain way. For more than the record holds, load the [why](../why/SKILL.md) skill.

A doc in `docs/design/` describes work that isn't built yet. Don't use it to explain current
behaviour. When the repo has none of these docs, go on without them.

Give the subagents the paths of the docs you found. Each subagent checks the docs against the code,
as its brief says.

When the question is vague, take your best reading of it, and give that reading to every subagent as
the question.

## Simple or complex

A simple question covers one module or one function, such as "how does the retry helper decide when
to stop". Start one general-purpose subagent, the explainer, which traces and explains in one pass.

A complex question covers a subsystem across many files or services, such as "how does a message get
from the API to the device". Split the flow into 2 to 4 slices, each a distinct part of it, such as
the API side, the queue and the delivery. When the architecture doc describes these parts, use its
parts. Otherwise, follow the flow from its entry point and cut it where it changes module or
service. In one message, start one general-purpose subagent, an explorer, for each slice, and give
each explorer the list of every slice, so it knows where its slice stops. When every explorer has
returned, start one explainer with all their findings.

When you can't tell which kind a question is, treat it as simple. When you treated it as simple and
the explainer's answer opens with an "Untraced:" line, run the question again as complex: that stage
as one slice, and your own cut of the rest. Do this once. When the second answer still opens with
the line, hand it back with the line.

## Answer

Tell the explainer whether the reader is an agent or the user, and whether the question asks where
new code should live, which adds a "Placement" section. The explorers need neither. The explainer
writes up to six sections, which explainer.md lists.

Hand the explainer's answer back. Add to it only your reading of a vague question, at the top, and
the note from [Asked twice](#asked-twice), at the end.

## When the user asked the question

Tell the explainer that the reader is the user, and whether the user asked for the files, which
keeps the "Where things live" section. It then draws "How it works" in frames: a series of diagrams
in code blocks, each one adding one stage of the flow. It shows the key snippets in code blocks, and
leaves out "Where things live" unless the user asked for it.

## Asked twice

When you know the same question was asked before, such as from the ticket or the conversation, take
it as a sign the repo's docs don't answer it. Add a line at the end of the answer that offers to
update the doc that covers the concept, or to write one when none exists. When the reader is an
agent, it passes the offer to the user. Do the work only when the user agrees, under docs-writing's
[architecture-docs reference](../docs-writing/references/architecture-docs.md).

**Reply:** the explainer's answer, written for the agent or for the user.
