---
name: figure-it-out
description:
  "Plans and does a job too big for one PR, such as a migration or a change across several systems:
  sets a test that fails until the job is done, splits the work into stacked PRs that each leave the
  code working, checks each PR before starting the next, and logs each decision with its reason.
  Load it for 'figure it out', for an extra-large ticket, and for a job no playbook covers."
---

# Figure it out

A job too big for one PR needs a plan before you change any code. Write down a test that fails until
the whole job is done, the PRs in order, and a check for each PR. Then do the PRs one at a time, and
log each decision with its reason as you make it.

- **Write the acceptance test first.** It's a command or a comparison that fails until the job is
  done. Without it, nobody can tell when the job is finished or what the work proved.
- **Read the work yourself.** Read the diff, run the program or open the page. A subagent reports
  what it meant to do, which may not be what it did.
- **Report each PR that failed, or that you couldn't check.** Don't count it as done. A reviewer
  loses more time finding a hidden failure than reading a reported one.

When you were asked only for a plan, hand it back after [Plan the PRs](#plan-the-prs). Otherwise
hand back the plan, the acceptance test's result, what's still open, the PR that holds the decision
log, and the log review from [Finish](#finish).

## Key rules

- [Before you start](#before-you-start): an acceptance test, a rough size, and how careful to be.
- [Plan the PRs](#plan-the-prs): PRs that each leave the code working, the acceptance test first,
  then the step you're least sure of.
- [Do each PR](#do-each-pr): see its check fail, say what you expect, make the smallest change, and
  keep or revert.
- [Keep a decision log](#keep-a-decision-log): one entry per decision, added as you go, never
  edited.
- [Finish](#finish): rerun the acceptance test on the real program, review the log, and link it in
  the last PR.

## References

- [Log review](./references/log-review.md): at the end of the job, to check the log against your
  session and have another model family read it.

## Before you start

Read the code and the ticket until you can write these at the top of your plan. Log each one, as
[Keep a decision log](#keep-a-decision-log) says, with the phase `plan`.

1. **Acceptance test:** a command or comparison, and the result that means done, such as "every page
   renders with a pixel difference of 0 from the saved screenshots".
2. **Size:** roughly how many PRs and hours, and each blocker you found. Update it when the plan
   changes.
3. **How careful to be:** normal or high. Pick high when a step can't be undone, such as a data
   migration or a change to a public API, or when three or more services or repos depend on the
   change. When you can't decide, pick high. With normal care you take none of these safeguards, and
   with high care you take all of them:
   - a [bake-off](../bake-off/SKILL.md) before you design a step that can't be undone, when it has
     more than one good answer;
   - a review from another model family, through the [second-opinion](../second-opinion/SKILL.md)
     skill, on each PR before you open it;
   - the user's approval before you run a step that can't be undone.

## Plan the PRs

1. Split the work into PRs that each leave the code working once merged in order. Branch each PR
   from the one before it, and merge none of them yourself.
2. Make the first PR the acceptance test, as a script that CI doesn't run yet, because it fails
   until the job is done. That PR's check is that the script runs and fails as expected. The last PR
   adds the script to CI. Run it on the code as it is now, and log the result, so each later run
   compares against it.
3. Put the step you're least sure of next, and setup and tests before features.
4. Give each PR a check, such as a test or a command, that passes when the PR works.
5. Work on two PRs at once only when they touch different files and data. Branch both from the last
   finished PR, give each its own worktree, and keep one decision log for both.
6. Write the plan in your reply: the items from [Before you start](#before-you-start), then a
   numbered list of PRs. Give each PR its check and its kind: bug, feature, refactor, perf, chore or
   investigation. Someone can then file each PR as a ticket of that kind.

When the user is talking with you in this session, show them the plan with the
[show-me](../show-me/SKILL.md) skill. When the job will take more than an hour, wait for their
approval. When an agent started you and no user is here, the agent that started you approves a step
that can't be undone. When you were asked only for a plan, hand it back, and stop.

## Do each PR

A playbook is the written steps for one kind of task, such as a bug fix. When you were given one for
a PR's kind, do its steps as part of step 3 below.

1. Run the PR's check before you change anything, and see it fail. When it passes, the check is
   wrong: fix it in its own commit first. A refactor's check is the existing tests, which pass
   before and after, so skip this step for a refactor.
2. Log what you expect the next small change to do, with `-` for the evidence and the result.
3. Make the smallest change that shows whether you're right, and run the check again. Repeat steps 2
   to 4 until the PR's check passes.
4. Log the result, and act on it:
   - **Passed:** keep the change.
   - **Failed:** revert the change. Plan the PR again. When the second try fails too, stop the job,
     and report it to whoever asked.
   - **Can't tell:** revert the change, fix the check, and try again, twice at most. After that,
     treat it as Failed.

Open each PR, with its check passing in CI, before you start the next. When a subagent did the work,
check its diff yourself. When a subagent makes the check pass without doing the work, reset its work
and give it clearer instructions.

## Keep a decision log

Keep the log in `decisions.tsv`, at the root of the repo's main working tree (the first path
`git worktree list` prints), and keep it out of git. For a job across several repos, use the first
repo's:

```bash
echo decisions.tsv >> "$(git rev-parse --git-path info/exclude)"
```

Add each entry with [`log.sh`](./scripts/log.sh). It adds the time in UTC, and keeps each entry on
one line. Give the log's absolute path when you work in another worktree, and quote each argument
that holds a space, as in this invented example:

```bash
bash <skill_dir>/scripts/log.sh decisions.tsv pr-2 "Cache the parsed config" "Parsing ran on every request" a1b2c3d passed
```

- **phase:** where you are in the job, such as `plan` or `pr-3`.
- **decision:** what you chose or did, in one line.
- **why:** your reason.
- **evidence:** something a reader can open, such as a commit, a PR number, `file:line` or the path
  to a screenshot. Never a paragraph.
- **result:** what happened, such as `passed`, `failed`, `reverted` or `tests pass`.

Add an entry when you:

- choose between approaches;
- get a PR's check result;
- revert a change;
- hit a blocker;
- fix a check. Skip routine steps. Never edit an entry. When one is wrong, add an entry whose `why`
  starts `replaces <time of the wrong entry>`.

When you continue a log that another session started, first add an entry with the phase `resume`. In
its decision, write the times of the other session's first and last entries. In its evidence, write
the file name of your session's transcript, found as [Log review](./references/log-review.md) says.

## Finish

1. Run the acceptance test again on the real program, built from the top of the PR stack, the way a
   user reaches it, such as the running service or the built app.
2. When you fixed the same mistake more than once, add a check that catches it, such as a lint rule,
   a test or a script, in the last PR.
3. Review the log, as [Log review](./references/log-review.md) says.
4. Paste the log into the last PR's description in a `<details>` block.
5. End your reply with a `## Log review` section. Its first line is `Reviewed by: <model>`, or
   `Reviewed by: none` and why. Then list each problem the reviewer raised, the entries it points
   at, and what you did about it, or write "No problems raised".

**Reply:** the plan, the acceptance test's result, what's still open, a link to the log, and the
`## Log review` section.
