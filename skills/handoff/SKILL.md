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
6. Run `www`. When it exits 0, follow
   [When the session keeps notes in www](#when-the-session-keeps-notes-in-www) before you write the
   doc.

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
   needs the user's approval.
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
keep notes on a long session: the goal, the open tasks, what the user allows and what's decided. Run
`www` with no arguments to print the notes of your session:

- When it exits 0, your session has notes. Follow the steps below.
- When it exits 4, or there is no `www` command, your session has none. Skip this section.
- When it exits 5, run the command on its `Run:` line, then run `www` again.

Leave off `--session`, which reads another session's notes, and `--json`.

1. Update the notes. For each row under `CHANGED SINCE WRITTEN`, run the command in the row, or
   close the task with `www done` or `www drop`.
2. Write where you are on each open task: `www set <id> --note "<detail>"`. Give what the next agent
   needs to start on that task. Run `www show` to read each open task with its note.
3. Run `www` again, and copy each section of the doc from it:

   | Section          | Copy it from                                                                                                                                                                                                                                          |
   | ---------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
   | Goal             | the `GOAL` line                                                                                                                                                                                                                                       |
   | Where it stands  | Done: each row of `www log --op done`, with its evidence. In progress and not started: each open task from `www show`, with its note. Write "note owed" beside a task marked `owed`.                                                                  |
   | Decided          | each row of `www log --op decide`, with who decided                                                                                                                                                                                                   |
   | Approvals        | First list: the `GRANT` section, with the user's words exactly as printed and the `reading:` line under them, then the `APPROVED ONCE` section. Second list: what the `reading:` line says the user kept back, and each `WAITING` row marked `owner`. |
   | Waiting          | the `WAITING` section                                                                                                                                                                                                                                 |
   | Next             | the `NOW` line and its note. When there is no `NOW` line, run `www now <id> "<next step>"` first. Leave `--note` off, because `--note` replaces the task's note.                                                                                      |
   | Where things are | the `WHERE` section, and the session's name, which is the first word `www` prints                                                                                                                                                                     |
   | Do it this way   | the `RULES` section, and each row of `LESSONS` with its reason                                                                                                                                                                                        |
   | Ruled out        | each row of `www log --op ruled-out`                                                                                                                                                                                                                  |

4. Add what `www` didn't print, such as an uncommitted file you copied into `.handoff/<name>/`.

Copy the user's words in `GRANT` exactly. An agent on another machine can't read these notes, and
acts on the doc alone. The next agent on this machine reads them with `www attach <name>`, so the
doc needs the session's name.

Each time `www` prints, it looks up the PR, branch, file or process that a task names. In
[Check it](#check-it), skip a claim that `www` printed with a result. Check each claim it printed
with `no check` or `unchecked`, and each claim you added.

## Check it

Read the doc again as the next agent would. Open what each claim points at: the PR's state, the
branch, the linked test run. Correct each claim that's wrong. Next to each claim that takes more
than a minute to check, also write the link or the command that checks it. For a local test run,
name the commit it ran on. Run it again on the last commit you made.

**Reply:** the doc's path, its next action, and that the next session must run on this machine.
