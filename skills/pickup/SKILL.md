---
name: pickup
description:
  'Picks up work from a handoff doc: reads it whole, checks each claim against the current state of
  the branches, PRs and tickets, tells the user what changed since it was written, and starts on the
  next action, or asks the user to approve a different one. Load it for /pickup, and when you start
  work that a handoff doc in `.handoff/` describes.'
---

# Pickup

Carry on the work a handoff doc describes. The doc was true when someone wrote it. Check each claim
against the current state before you act, and report what you found to the user. You're done when
you've started on the doc's next action, or asked the user to approve a different one.

1. Find the doc in `.handoff/`, in the repo's main working tree, which is the first path
   `git worktree list` prints.
   - When there are several docs, take the one whose file name matches what the user named. When the
     user named none, ask which, and go on once they answer.
   - When there are no docs, tell the user, and stop.
2. Read the whole doc.
3. When the doc names a wherewerewe session under "Where things are", bind to it. `www`, the
   wherewerewe command, keeps that session's notes in a store on this machine, and prints them as
   one brief with each checkable claim checked.
   1. Run `www attach <name>`, then `www`, with no `--session` flag and no `--json`, so you read
      only the session bound to you, as text.
   2. When `www` is missing or `attach` is refused, as it is on another machine, go on with no
      store.
   3. When the brief has no `GRANT` section and the doc's Approvals section holds the user's words,
      record them:
      `www grant --may "<their words>" --where <where they said it> --reading "<what they cover; what the user kept back>"`.
      Repeat `--may`, `--not` and `--never`, one per bullet, with each bullet's words whole.
4. Check each claim in the doc against how things stand now, including:
   - the branches and worktrees, and each change the doc calls uncommitted;
   - each PR's state and checks;
   - the state of each ticket in the doc, in the tracker your session can reach;
   - each process, preview, container or CI run the doc calls running.

   After a brief, a claim the brief shows with a result needs no check by hand: the brief has just
   run it. Check by hand each claim it shows with `no check` or `unchecked`, and each claim in the
   doc that the store doesn't hold. Each row under `CHANGED SINCE WRITTEN` is a difference.

   List each difference, and each claim you couldn't check.

5. Decide the next action. Start from the doc's. When a difference makes it wrong or already done,
   or the doc has none, choose another action.
6. Tell the user, in a few lines: the goal, where it stands now, with the differences and the claims
   you couldn't check first, what waits on the user, and the next action.
7. Act on the next action:
   - When it is the doc's, start on it, and carry on with the work.
   - When you chose it, ask the user to approve it, and wait for the answer.

   With a store, write as you go: `www now <id> "<next step>"`. Add `--note "<detail>"` only to
   replace the item's note. A note holds what you need on your next turn to that item.

Keep the doc after this skill ends. When your session ends before the work lands, rewrite the doc
with the [handoff](../handoff/SKILL.md) skill. When the work has landed, ask the user before you
delete the doc.

**Reply:** the goal; where it stands now, starting with the differences and the claims you couldn't
check; what waits on the user; and the next action.
