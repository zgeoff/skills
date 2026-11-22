---
name: break-it
description:
  "Sends subagents to break a change or a design, each in its own worktree, and keeps a bug only
  when a run proves it: a failing test, a script that reproduces it, or output that shows the wrong
  behaviour next to what the change is meant to do. Reports the proven bugs and fixes nothing. Load
  it for 'break it', 'try to break this', 'stress test this change', and before you trust a design
  you can prototype."
---

# Break it

Send subagents to break a change or a design, and keep only the bugs a run proves. A bug report that
reads right but was never run can be wrong, and you can't tell which from the text. Report the
proven bugs, and fix nothing. The user, or the agent that owns the change, decides what to fix.

- **Give every subagent its own worktree.** A script that writes files would break another
  subagent's run.
- **Run each bug again yourself.** A subagent's output can come from the wrong code or a stale
  build.
- **Keep a proven bug even when only one subagent found it.** Each subagent attacks something
  different, so most bugs turn up once.

You're done when you've rerun every bug, removed the worktrees and the temporary branch, and sent
the report. Hand back the report that [Report](#report) describes: the goal, the proven bugs and the
dropped bugs.

## Key rules

- [Before you start](#before-you-start): what to test, and what the change is meant to do, in your
  own words.
- [Send the subagents](#send-the-subagents): 2 or 3 subagents, each in a detached worktree, plus one
  from another model family.
- [Check each bug](#check-each-bug): rerun it, keep it when it breaks what the change is meant to
  do, and merge bugs that fail at the same line or assertion.
- [Report](#report): the goal, the proven bugs, and what you dropped.

## References

- [adversary.md](./references/adversary.md): the instructions for each subagent. Give it the
  absolute path of adversary.md, and tell it to read that file first.

## Before you start

Test what the user names: a branch, a PR or a design. Otherwise test the current branch's diff from
its merge base with the default branch, plus any uncommitted changes. For a design, write it down as
text; each subagent proves a bug with a prototype or a probe of the default branch.

Write down what the change or the design is meant to do, from the user's message, the commits and
the PR description. When you can't tell, ask whoever asked you to run this. When that's the user,
use the [read-back](../read-back/SKILL.md) skill.

## Send the subagents

1. Remove what an earlier run left behind: each worktree under `.worktrees/` named `break-it-*`,
   `rerun-*` or `default-*`, with `git worktree remove --force`, then the branch, with
   `git branch -D break-it-scratch`. Then make a temporary branch, `break-it-scratch`, and leave the
   user's working tree as it is: the user may still be editing in it.
   - **The current branch:** branch from a stash of the uncommitted changes. `git stash create`
     leaves out untracked files. Copy those in the next step.

     ```bash
     ref=$(git stash create)
     git branch break-it-scratch "${ref:-HEAD}"
     ```

   - **A named branch or PR:** branch from its head. For a PR that isn't checked out, fetch it with
     `git fetch origin pull/<n>/head`, and branch from `FETCH_HEAD`.
   - **A design:** branch from the default branch.

2. Make a worktree for each subagent, numbered from 1, under `.worktrees/`. Use `--detach`: git
   checks out one branch in only one worktree.

   ```bash
   git worktree add --detach .worktrees/break-it-1 break-it-scratch
   ```

   For the current branch, copy each file that `git ls-files --others --exclude-standard` lists into
   every worktree. Leave out ignored files, such as `node_modules`, and install dependencies in each
   worktree, one worktree at a time. Installs that run at once can clash in the package manager's
   shared cache.

3. Pick a different area to attack for each subagent, from what the diff touches, such as bad input,
   concurrency or failure handling.
4. When the change crosses several subsystems, start 3 subagents in one message. Otherwise start 2.
   Use your harness's general agent type for each, which is `general-purpose` in Claude Code. Give
   each one:
   - the absolute path of adversary.md;
   - what to test, and the commit the change starts from: the output of
     `git merge-base <default-branch> break-it-scratch`, or for a design, the default branch's head;
   - what the change is meant to do;
   - its worktree's path;
   - its area to attack.
5. Start one more subagent from another model family, through the
   [second-opinion](../second-opinion/SKILL.md) skill, with the same items, its own worktree and a
   different area. The second-opinion skill says whether that model can write files. When it can't,
   tell it to put each test or script's full contents in its reply, with the command to run it.

When a subagent ends without its list, ask it once for the list. If it still sends none, go on
without it, and say so under Dropped.

## Check each bug

Rerun each bug in a fresh detached worktree from `break-it-scratch`, one per bug, numbered like
`.worktrees/rerun-1`. Copy in the files in the bug's Command item, from the subagent's worktree or
its reply, and any untracked files you copied before. Run the command there. When the subagent gave
a count, such as 7/20, the bug shows only in some runs: run it 20 times, and report your own count.

Keep a bug when your rerun shows it at least once, and it breaks what the change is meant to do.
Drop the rest, with the reason. Then rerun each kept bug in `.worktrees/default-<n>`, a detached
worktree of the default branch, with the same files copied in. When the bug also fails there, keep
it, and mark it as there before the change.

When two bugs fail at the same line or the same assertion, merge them into one, and list every
subagent that found it.

Copy each proven bug's test or script into your report. A subagent leaves a script of 40 lines or
more out of its reply. Read that script from the subagent's worktree. Then remove the worktrees with
`git worktree remove --force`, and delete `break-it-scratch`.

## Report

- **Goal:** what the change is meant to do, in your words.
- **Bugs:** for each proven bug, the command, its test or script, your rerun's output, how it breaks
  the goal, and the worktree number of each subagent that found it, or "second opinion". When none
  survive, write "no proven bugs".
- **Dropped:** for each subagent, the bugs you dropped, and why.

**Reply:** the goal, the proven bugs, and the dropped bugs.
