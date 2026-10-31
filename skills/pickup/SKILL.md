---
name: pickup
description:
  'Picks up work from a handoff doc: reads it whole, checks each claim against the current state of
  the branches, PRs and tickets, tells the user what changed since it was written, and starts on the
  next action. Load it for /pickup, and when you start work that a handoff doc in `.handoff/`
  describes.'
---

# Pickup

Carry on the work a handoff doc describes. The doc was true when someone wrote it. Check each claim
against now before you act. Report what you found to the user, then start on the next action.

1. Find the doc in `.handoff/`, in the repo's main working tree, which is the first path
   `git worktree list` prints. When there are several docs, take the one whose file name matches
   what the user named. When the user named none, ask which. When there are no docs, tell the user.
   Then stop.
2. Read the whole doc.
3. Check each claim in the doc against how things stand now, including:
   - the branches and worktrees, and each change the doc calls uncommitted;
   - each PR's state and checks;
   - the state of each ticket the doc names, in the tracker your session can reach;
   - each process, preview, container or CI run the doc calls running.

   List each difference, and each claim you couldn't check.

4. Decide the next action. Start from the doc's. When a difference makes it wrong or already done,
   or the doc names none, choose another action.
5. Tell the user, in a few lines: the goal, where it stands now, with the differences and the claims
   you couldn't check first, what waits on the user, and the next action.
6. When the next action is the doc's, start on it. When you chose another, ask the user to approve
   it. Then wait.

When the session ends, rewrite the doc with the [handoff](../handoff/SKILL.md) skill. When the work
has landed, ask the user before you delete the doc.

**Reply:** the goal, where it stands now with the differences first, what waits on the user, and the
next action.
