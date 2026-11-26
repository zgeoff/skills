---
name: pickup
description:
  'Picks up work from a handoff doc: reads it whole, checks each claim against the current state of
  the branches, PRs and tickets, tells the user what changed since it was written, and starts on the
  next action, or on a different one when the next action in the doc is wrong or done. Load it for
  /pickup, and when you start work that a handoff doc in `.handoff/` describes.'
---

# Pickup

Carry on the work a handoff doc describes. The doc was true when someone wrote it. Check each claim
against the current state before you act, and report what you found to the user. You're done when
you've started on the doc's next action, or on the one you chose in its place.

1. Find the doc in `.handoff/`, in the repo's main working tree, which is the first path
   `git worktree list` prints.
   - When there are several docs, take the one whose file name matches what the user named. When the
     user named none, take the one named after the current branch, with each `/` replaced by `-`, as
     the handoff skill names it. When none matches, ask which, and go on once they answer.
   - When there are no docs, tell the user, and stop.
2. Read the whole doc.
3. When "Where things are" in the doc has a wherewerewe session name, read that session's notes.
   `www` is the command of [wherewerewe](https://github.com/zgeoff/wherewerewe). Agents use it to
   keep notes on a long session as short labelled rows: the goal, the next step, what the user
   allows and what's decided.
   1. Run `www attach <name>`, then `www` with no arguments.
   2. When there is no `www` command, or `www attach` refuses, as it does on another machine, go to
      step 4.
   3. When `www` prints no `GRANT` row and the doc's Approvals section lists approvals, save each
      one as the doc has it: `www grant "<the approval>"`.
4. Check each claim in the doc against how things stand now, including:
   - the branches and worktrees, and each change the doc calls uncommitted;
   - each PR's state and checks;
   - the state of each ticket in the doc, in the tracker your session can reach;
   - each process, preview, container or CI run the doc calls running.

   List each difference, and each claim you couldn't check.

5. Decide the next action. Start from the doc's. When a difference makes it wrong or already done,
   or the doc has none, choose another action.
6. Tell the user, in a few lines: the goal, where it stands now, with the differences and the claims
   you couldn't check first, what waits on the user, and the next action.
7. Start on the next action, and carry on with the work. When you chose it, tell the user which
   action you chose and why.

   When `www` printed notes in step 3, write each next step as you take it: `www now "<next step>"`.

Keep the doc after this skill ends. When your session ends before the work lands, rewrite the doc
with the [handoff](../handoff/SKILL.md) skill. When the work has landed and the doc lists nothing
still waiting, delete the doc.

**Reply:** the goal; where it stands now, starting with the differences and the claims you couldn't
check; what waits on the user; and the next action.
