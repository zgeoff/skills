---
name: where-were-we
description:
  'Catches the user up after a gap: when this session lost track of the work, works out where it
  stands from a handoff doc, the chat history, and the current branches, PRs and tickets; then tells
  the user what happened in plain words and lists every decision waiting on them, each one they can
  make from the reply alone. Load it for /where-were-we, when the user comes back to work they left,
  and after a compaction or a long break.'
---

# Where were we

Tell the user where the work stands, and what they need to decide. The user remembers their last
message before the gap, and nothing after it. When this session lost track of the work too, after a
compaction or in a new session, work out where it stands before you tell them anything. Open the
reply with one sentence on what waits on the user. Then say what happened, and list the decisions:
each step only the user can take.

- **Check each fact before you report it.** A PR you remember as open may have merged. Look at each
  PR, branch and ticket again before it goes in the reply, even when you skip
  [Catch yourself up](#catch-yourself-up).
- **Spend the words on the decisions.** Keep the account of what happened short.
- **Let the user decide from the reply alone.** A link can give more detail, but the user shouldn't
  have to open it to decide.

## Key rules

- [Catch yourself up](#catch-yourself-up): only when this session lost track, from the handoff doc,
  the chat history, and the current branches, PRs and tickets.
- [What happened](#what-happened): one sentence on what waits, then under 100 words, with a diagram
  when it helps.
- [The decisions](#the-decisions): each with its link, what it changes for the product's users, the
  evidence, the risk, and your recommendation.

## Catch yourself up

Skip this when this session still holds the whole history of the work. A summary after a compaction
doesn't count. Otherwise read, in this order:

1. The handoff doc, when the repo has one in `.handoff/`. Check it against the current state, as the
   [pickup](../pickup/SKILL.md) skill says.
2. Your chat history on the work: in Claude Code, the `.jsonl` files under `~/.claude/projects/`, in
   the folder for this working directory, newest first. Search them for the branch names and PR
   numbers from step 3 before you read one whole, so do step 3 first when you don't have them. In
   another tool, skip this step.
3. The current state:
   - the branches and worktrees;
   - each PR's state and checks, with `gh pr view`;
   - each ticket named in a PR body.

When the chat history shows three or more tries at the same fix, load the [why](../why/SKILL.md)
skill to find what was tried, and use its answer as evidence for a decision.

## What happened

Open with one sentence that names what waits on the user, or says nothing does.

Then say what happened since their last message, in under 100 words, not counting diagrams:

- When a diagram makes the change clearer, draw it with the [show-me](../show-me/SKILL.md) skill,
  after the opening sentence.
- Link the screenshots already in the PRs.
- Give one line for each thing the user asked for that's still open or has changed since their last
  message: what came of it, and whether it's done, running, failed or not checked. Write it the way
  you'd say it out loud.
- Name each bug you found and fixed along the way.

Leave out hashes, paths and commands, unless the user needs one to act. Call each PR, branch or
agent by a name the user knows.

## The decisions

A decision here is a step only the user can take, such as a choice, an approval, a step that can't
be undone, or access you don't have. Work you can still do yourself isn't one: report it as running,
and do it in the same turn, after you send the reply. List every decision that waits on the user,
including one raised before their last message. Never invent one to fill the reply.

For each decision, give:

- what it is, and its link when it has one;
- what it changes for the product's users, or "nothing";
- the evidence behind your recommendation;
- the risk, even when it's low;
- your recommendation.

When several items need the same decision, such as a set of PRs to merge, write the decision and
your recommendation once, then one bullet per item, riskiest first, each with its link, evidence and
risk. For a choice between options, give each option what it gets the user and what it costs.

Write "unknown" for a fact you don't have.

**Reply:** the opening sentence, what happened, and the decisions.
