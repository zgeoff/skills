---
name: handoff
description:
  "Writes the handoff doc another agent needs to carry on the work without asking anything: the
  goal, where it stands with evidence, what's decided, what the next agent may do without asking,
  what waits on someone, the next action, where things are, the steps that cost you time, and what
  was ruled out. Load it for /handoff, and before you stop work that another session will pick up."
---

# Handoff

Write the doc the next agent needs to carry on without asking you anything. The next agent reads the
doc with none of this conversation, and acts on what you wrote. You're done when you've run
[Check it](#check-it), and every claim in the doc is true.

- **Write the state as it is now.** Rewrite the whole doc each time. A doc that grows by appending
  turns into a log, and the next agent has to replay it to find where things stand.
- **Make every claim checkable.** Give each "done" its evidence, such as a PR, a commit or a test
  run, and claim only what happened: written, tested, reviewed, merged or deployed.
- **Write for someone who wasn't here.** Plain words, full sentences, and no labels you made up in
  this session. A commit hash or a path is fine where the next agent will type it.

Before you write:

1. When the work is on no branch, make one. Commit and push unfinished work to its branch, so the
   next agent can reach it. Mark the commit as work in progress, and let the hooks run.
2. Find the main working tree: the first path `git worktree list` prints. The doc goes there, where
   removing a worktree can't delete it.
3. From the main working tree, keep `.handoff/` out of git, with a line in the repo's local exclude
   file:

   ```bash
   grep -qx '.handoff/' "$(git rev-parse --git-path info/exclude)" || echo '.handoff/' >> "$(git rev-parse --git-path info/exclude)"
   ```

4. Take the doc's name from the branch you work on, with each `/` replaced by `-`, such as
   `feat-csv-export`. The doc is `.handoff/<name>.md`.
5. When that doc exists, read it. Carry over what still holds into the new doc, approvals included,
   and replace the file.
6. Run `www`. When it exits 0, write the doc as
   [When the session keeps notes in www](#when-the-session-keeps-notes-in-www) says.

Hand back the doc's path, and the next action from it. The doc stays on this machine, so also say
that the next session must run here.

## Key rules

- [The sections](#the-sections): a title, then nine sections in order, each under its own heading,
  with "None" under an empty one.
- [When the session keeps notes in www](#when-the-session-keeps-notes-in-www): update the notes,
  then copy each section from what `www` prints.
- [Check it](#check-it): open what each claim points at, and correct the wrong ones.

## The sections

Start the doc with a `#` title that gives the work in a few words. Then write these in order, each
under its own `##` heading. Under a section with nothing in it, write "None".

1. **Goal.** What the work is for, and why, in two or three sentences. Name a ticket by what it
   does, with its ID after.
2. **Where it stands.** Three lists: done, in progress and not started. Each "done" has its
   evidence. Put a blocked item under Waiting.
3. **Decided.** Each decision, with its reason and who made it, so the next agent doesn't reopen it.
   Link where it was decided, such as a PR comment or a ticket, when you can.
4. **Approvals.** Two lists. The first holds each approval the user gave, for work like this rather
   than for one action, which the next agent may act on without asking. The second holds what still
   needs the user's approval. Write each approval as what the user meant, in plain words the next
   agent can act on. Quote the user only when the exact wording matters.
5. **Waiting.** Each item blocked on someone, with what it waits on and the next step.
6. **Next.** The one action to take first, small enough to start now.
7. **Where things are:**
   - worktrees and branches, and which ones hold work you pushed for this handoff;
   - files the next agent needs that aren't committed, copied into `.handoff/<name>/`, since a
     scratch folder can vanish;
   - running processes, previews and containers, which you leave running, each with how to stop it;
   - where each secret lives, never its value.
8. **Do it this way.** Each step that cost you time and would cost the next agent the same, written
   as the instruction to follow, with its reason, such as "Run the tests from `api/`. From the repo
   root, the integration tests don't run."
9. **Ruled out.** Each approach tried or rejected, and why, so nobody tries it again.

## When the session keeps notes in www

`www` is the command of [wherewerewe](https://github.com/zgeoff/wherewerewe). An agent uses it to
keep notes on a long session as short labelled rows: the goal, the next step, what the user allows
and what's decided. Run `www` with no arguments to print the open rows of your session, grouped by
label:

- When it exits 0, your session has notes. Follow the steps below.
- When it exits 4, or there is no `www` command, your session has none. Skip this section.

1. Update the notes. Close each row about finished work with
   `www done <id> --evidence "<PR, commit or test run>"`, or with `www drop <id>` when it no longer
   matters. Correct a row that is wrong with `www set <id> "<text>"`.
2. Write where you are on each open task: `www set <id> --note "<detail>"`. Give what the next agent
   needs to start on that task. Then write the next step: `www now "<next step>"`.
3. Run `www` again, and write each section of the doc from the rows whose label matches it, such as
   Goal from the `GOAL` row, Next from the `NOW` row and Waiting from the `WAIT` rows. `www` prints
   only the first line of a note, so read each whole note with `www rows | jq`. Write these sections
   from more than one label:

   | Section          | Write it from                                                                                                                                                                                                        |
   | ---------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
   | Where it stands  | Done: each row that `www rows --all \| jq 'select(.closed.how == "done")'` prints, with its evidence. In progress and not started: each open row for a piece of work, such as a `TASK` or a `PR` row, with its note. |
   | Approvals        | First list: each `GRANT` row that allows something. Second list: each `GRANT` row that keeps something back, and each `WAIT` row that waits on the user's approval. Put that `WAIT` row under Waiting too.           |
   | Where things are | each `WHERE` row, and the session's name, which is the first word `www` prints                                                                                                                                       |
   | Do it this way   | each `RULE` row, and each `LESSON` row with its reason                                                                                                                                                               |

4. Add to the doc what you never wrote as a row, such as an approach you ruled out, or an
   uncommitted file you copied into `.handoff/<name>/`.

A `GRANT` row is already what the user meant, so copy each one as `www` prints it. The next agent
acts on the doc, and might never open the notes. Put the session's name in the doc, so that agent
can read them with `www attach <name>`.

## Check it

Read the doc again as the next agent would. Open what each claim points at: the PR's state, the
branch, the linked test run. Correct each claim that's wrong. Next to each claim that takes more
than a minute to check, also write the link or the command that checks it. For a local test run,
name the commit it ran on. Run it again on the last commit you made.

**Reply:** the doc's path, its next action, and that the next session must run on this machine.
