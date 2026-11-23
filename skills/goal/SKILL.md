---
name: goal
description:
  "Writes the text of a /goal for a long autonomous Claude Code session: the outcome and its source
  of truth, the ordered work with its dependencies, the steps for each item, what the session may do
  without asking, what it brings the user, the known waits, the rules, the handoff doc, the reports,
  a done-when the Stop hook can judge, and what to do when stopped. Hands back text to paste, under
  the 4,000-character limit. Load it for 'write a goal', 'set up a /goal', and when a walkthrough
  agrees a big new scope for a running goal."
---

# Goal

Write the text of a `/goal` that the user pastes into a Claude Code session. A `/goal` sets a Stop
hook: after each turn, a small model reads the goal and the conversation and decides whether the
condition holds, and the session can't stop until it does. The session agent then works for hours
with nobody to ask, so the goal is its whole contract. Write it for an agent that obeys each word
and guesses at each gap.

Hand back the goal as one `text` block that starts with `/goal `, its character count, whether it
replaces a running goal, and each question you still have for the user. You're done when the text
passes [Check it](#check-it).

## Key rules

- [When to write or refresh one](#when-to-write-or-refresh-one): a new long run, or a big new scope
  agreed for a running one.
- [Pick the mode](#pick-the-mode): direct, where the session builds each item, or boxxy, where it
  files and manages items.
- [Gather the facts first](#gather-the-facts-first): the source of truth, the live state of every
  item, and the user's decisions.
- [The parts](#the-parts): twelve parts, in order, in the example goal's shape.
- [The done-when](#the-done-when): state each line as evidence the session can show in the
  conversation.
- [Fit the limit](#fit-the-limit): 4,000 characters at most; cut words, then point at a doc.
- [Check it](#check-it): read it as the session agent, then as the Stop hook, then count.

## References

- [Example goal](./references/example-goal.md): the shape to copy.
- [Direct mode](./references/direct-mode.md): each item's steps, from the repo's tools.
- [boxxy mode](./references/boxxy-mode.md): a goal that files work in boxxy, with an example.

## When to write or refresh one

Write a goal for a session that runs unattended for more than a few turns.

Refresh a running goal when the user agrees a big new scope with you, such as new work from a design
walkthrough or a new grant. Write the whole goal again from the current state: drop each item that
landed, keep each approval the user still grants, and add the new work. Tell the user the new
`/goal` replaces the running one.

Leave a small change out of the goal. Tell the session in chat, and have it record the change in its
handoff doc.

## Pick the mode

In direct mode, the session builds each item itself. In boxxy mode, the session files the work in
boxxy, which starts an agent on each item, and the session manages the items to their end. Take the
mode the user asked for, and ask when they named none. Then read that mode's reference.

## Gather the facts first

1. Find the source of truth for the work, such as a tracker project, a set of design docs or a
   signed-off plan. Name it in the goal, so the session can check each claim against it.
2. Check the live state of each item: its PR, its branch, its CI and its ticket. Write only what is
   true now. When you call a merged PR open, the session redoes it. When you can't check an item,
   say so in the goal, and make checking it the session's first step for that item.
3. Collect each decision the user made, and where it's recorded. Name them in the goal, so the
   session doesn't reopen them.
4. Collect what the user lets the session do without asking, and what the user keeps. Take them from
   this conversation, the user's instruction files and any earlier goal. When the user hasn't said,
   ask before you write. Never grant an action the user didn't grant: the session acts on each grant
   for hours, with nobody watching.

## The parts

Write these in order. Open the goal with the outcome. Give each later part except the handoff line a
short label the session can scan, such as `Authority:`. Name the user the way the session knows
them.

1. **Outcome.** The end state, then the source of truth. Add the decisions the session must not
   reopen, and what to do when one proves unbuildable: stop and ask.
2. **Work.** The items as ordered lanes, such as `A.`, `B.` and `C.`. Inside a lane, list the items
   in the order they must land. Say which lanes run in parallel, the most builds at once, and what
   to do when two lanes touch the same files: finish one first. Mark an item held on a decision or a
   design, and say what releases it. Name each item by what it does, with its ticket ID after. In
   boxxy mode, write this part as [boxxy mode](./references/boxxy-mode.md) says.
3. **For each item.** Each item's steps, by its kind of work, from the mode's reference:
   [Direct mode](./references/direct-mode.md) or [boxxy mode](./references/boxxy-mode.md).
4. **Authority.** Three lists: what the session may do without asking, what it isn't authorised to
   do, and what it must never do. Put each action that is hard to undo in one of the three. Add what
   to do when a permission check refuses an action: stop and give the user the exact command.
5. **Bring the user.** The decisions that are the user's, such as naming, money or an outside
   account. Then how to ask: one decision at a time, with options and a recommendation, never in the
   same turn as an explanation. Tell the session to keep building what doesn't depend on the answer,
   and to record each blocker once, with its next step.
6. **Known waits.** Each outside wait, such as a review or a card the user must add, with how to
   check it.
7. **Rules.** The house rules the session must not drift from, such as commit style, no attribution,
   a model on every subagent, and the repo's AGENTS.md and its skills. List only the rules a long
   run tends to break.
8. **Handoff.** Always include this line, in these words or close to them: "Keep a handoff doc in
   `.handoff/` current at each milestone, as the handoff skill says. After a compaction, read it
   before anything else." A compaction drops most of the conversation, and the session gets its
   place back from the doc.
9. **Reports.** When the session reports, and in what shape, such as two lines after each merge:
   what landed, linked, and what's next.
10. **Done when.** The lines the Stop hook judges, as [The done-when](#the-done-when) says.
11. **When stopped.** What the session does once the condition holds: list each block with the exact
    action the user must take, and give the final report.
12. **Out of scope.** Name the nearby work the session might be tempted to start, so it doesn't.
    Leave this part out when there is none.

Copy the shape from the [example goal](./references/example-goal.md).

## The done-when

The Stop hook's model reads only the conversation. It runs no command and opens no file, so it can
judge only what the session printed. Write each line as an end state with its evidence, such as
"every PR in lanes A and B is merged, with its link in a report".

- Give each line a state the session can reach without the user, or a held state: "deployed, or
  blocked on the user with the exact action listed".
- Never write "when the work is done" or "when it's good enough". The model can't judge either, and
  the session runs on or stops early.
- Tell the session to print the evidence for each line in its last turn.

## Fit the limit

`/goal` takes up to 4,000 characters, as [the /goal docs](https://code.claude.com/docs/en/goal) say.
Save the condition to `goal.txt` in your scratch folder, without the `/goal ` before it, and count
it:

```bash
wc -m < goal.txt
```

When the goal runs over, cut in this order:

1. Each word that does no work, and each rule the session gets from the repo's AGENTS.md.
2. Detail the session can find: point at the design doc, the ticket or the runbook that holds it.
3. Steps you can move into a doc the session reads, such as a plan in `.handoff/`. Name that doc in
   the goal.

Keep the authority lists, the handoff line and the done-when whole. The session can look up a step,
but it learns what it may do and when to stop only from the goal.

## Check it

1. Read the goal as the session agent, with none of this conversation. For each item, ask: do I know
   what to do, in what order, and when to stop and ask? Fix each gap.
2. Read the done-when as the Stop hook's model. For each line, ask: could I tell from the
   conversation alone that this holds? Rewrite each line that needs a command or a file.
3. Check each name, ID and PR state against the live state again.
4. Count the characters, and cut as [Fit the limit](#fit-the-limit) says.

**Reply:** the goal as one `text` block that starts with `/goal `, its character count, whether it
replaces a running goal, and each question for the user.
