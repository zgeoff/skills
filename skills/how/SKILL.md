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

This skill explains how part of a codebase works, for whoever changes it next. That reader is either
an agent, such as a builder about to change the code or a playbook step with a "how" question, or
the user, when the user asked the question.

A good answer lets the reader predict what the code does in a case the answer never mentions. An
answer that retells the code line by line gives them the names and leaves them unable to predict
anything. Repo docs go stale, so your subagents check each doc claim against the code before the
answer repeats it, and the answer names each part nobody could trace. Hand back the explainer's
answer, written for the agent or for the user, as [Answer](#answer) and
[When the user asked the question](#when-the-user-asked-the-question) say.

## Key rules

- [Read the docs first](#read-the-docs-first): `docs/README.md`, then the architecture doc that owns
  the concept.
- [Simple or complex](#simple-or-complex): one explainer for a simple question; 2 to 4 explorers,
  then one explainer, for a complex one.
- [Answer](#answer): up to six sections, real names and paths, with stale docs and gaps under Traps.
- [When the user asked the question](#when-the-user-asked-the-question): tell the explainer, which
  then draws the flow in frames and drops the list of files.
- [Asked twice](#asked-twice): an answer needed twice is a draft for an architecture doc.

## References

Each subagent reads one file from this skill's `references/` folder, next to this SKILL.md. Give it
the file's absolute path, and tell it to read the file first.

- [explorer.md](./references/explorer.md): each explorer, on a complex question.
- [explainer.md](./references/explainer.md): the explainer, on every question.

## Read the docs first

Before you start any subagent, read what the repo already says:

1. `docs/README.md`, the index of the repo's docs. It names the doc for each concept.
2. The doc in `docs/architecture/` that covers the concept the question asks about. When the index
   names none, search `docs/architecture/` for the concept's name.
3. A decision record in `docs/decisions/`, only when the question turns on why something was built a
   certain way. For more than the record holds, load the [why](../why/SKILL.md) skill.

A doc in `docs/design/` describes work that isn't built yet. Don't use it to explain current
behaviour. When the repo has none of these docs, go on without them.

Give the subagents the paths of the docs you found. explorer.md and explainer.md tell each subagent
to check the docs against the code.

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
each explorer the list of every slice. When every explorer has returned, start one explainer with
all their findings.

When you can't tell which kind a question is, treat it as simple. When the explainer's answer opens
with an "Untraced:" line, run the question again as complex, with that part as one slice.

## Answer

Tell the explainer whether the reader is an agent or the user, and whether the question asks where
new code should live. It writes these sections, and leaves out any that has nothing to say:

1. **Overview:** what the thing is, what it does, and why it exists, in a paragraph or two. The
   reader decides from this whether to read on.
2. **Key concepts:** the types, services and terms the rest uses, each in a line.
3. **How it works:** the longest section. What starts the flow, each step, where the data goes, and
   each point where the flow branches.
4. **Where things live:** the doc that owns each concept, then the files and folders a reader opens
   first.
5. **Placement**, only for "where should this live" or "which layer owns this": the module that
   should own the new code, and the reason, from the owning doc or from where the code puts similar
   things.
6. **Traps:** behaviour that surprises a reader, each doc the code contradicts, and each part nobody
   could trace.

Hand the explainer's answer back. Add to it only your reading of a vague question, at the top, and
the note from [Asked twice](#asked-twice), at the end.

## When the user asked the question

Tell the explainer that the reader is the user. It then draws How it works as diagrams built in
frames, with real names on the boxes, shows the key snippets in code blocks, and leaves out Where
things live unless the user asks for it.

## Asked twice

When you know the same question was asked before, such as from the ticket or the conversation, the
repo's docs don't answer it. Add a line at the end of the answer that says so, and offers to update
the doc that covers the concept, or to write one when none exists. Do the work only when the reader
agrees, under docs-writing's
[architecture-docs reference](../docs-writing/references/architecture-docs.md).

**Reply:** the explainer's answer, written for the agent or for the user.
