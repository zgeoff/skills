---
name: correct
description:
  "Finds the mistakes agents keep repeating in a repo, from evidence such as review comments,
  reverts and the user's corrections, and changes the repo so the next agent can't repeat them: a
  better architecture first, then types, then a lint rule whose error names the fix, then a test,
  and a written rule last. Proves each new check fails on a real past mistake. Load it for regular
  repo cleanup, for 'correct this repo', and when the user corrects a mistake a written rule already
  covers."
---

# Correct

Find the mistakes agents keep making in this repo, and change the repo so the next agent can't make
them. Assume the next agent sees only the files it opened, copies the nearest example, and takes the
shortest path that compiles. Aim for a repo where a change that looks right from one file is right
for the whole repo.

- **Count a mistake once it has happened twice.** Once could be bad luck. The exception: when the
  user corrects a mistake a written rule already covers, that counts as the second time.
- **Pick the strongest fix that works.** An agent can skip a written rule and nothing fails. A type
  error or a lint rule fails the build.
- **See each new check fail on a real past mistake.** Until you do, you don't know it catches
  anything.

Your report has three lists: the repeated mistakes and their PRs, **Not fixed** (each repeated
mistake you didn't fix, with the reason), and **Seen once** (each mistake you saw only once). You're
done when each repeated mistake has an open PR with green CI, or a line under Not fixed. The user
reviews and merges each PR. Hand back each repeated mistake with its evidence, the fix you chose,
why a stronger fix didn't work, and the failing run that proves the fix, as [Prove it](#prove-it)
says.

## Key rules

- [Find repeated mistakes](#find-repeated-mistakes): review comments, reverts and the user's
  corrections since the last run; twice counts.
- [Find the written rule](#find-the-written-rule): none, a rule with no check, or a rule with a
  check.
- [Pick the fix](#pick-the-fix): architecture, then types, then a lint rule, then a test, then a
  written rule.
- [Prove it](#prove-it): run each new check on a real past mistake, and see it fail.
- [Open the PRs](#open-the-prs): one PR per repeated mistake, and an exception only on the line that
  breaks the check.
- [When the user corrects you](#when-the-user-corrects-you): the same steps, for one mistake.
- [Reply](#reply): each repeated mistake and its PR, Not fixed, and Seen once.

## Find repeated mistakes

Find where the last run of this skill ended: the newest PR, in any state, with "correct pass" in its
description (`gh pr list --state all --search "correct pass"`). When there's none, start 30 days
back. Read its Seen once list, in its description or in its `correct-pass.md`, then what went wrong
since it was opened:

- review comments on every PR updated since then, open, merged or closed, from people and from
  review bots, and the replies to them;
- reverts, and the commit that fixed what each revert undid;
- tickets and agent sessions, when the repo's AGENTS.md lists where to find them under
  `## Evidence sources`;
- comments in the code that explain a workaround.

Group the mistakes by what went wrong, such as "read the config without its loader". A mistake on
the last run's Seen once list counts toward its group. Keep each group with two or more mistakes in
it, and note where each one happened, such as a PR number or a commit. List each mistake you saw
only once under Seen once, in your report and in every PR this run opens. When this run opens no PR,
open one, with "correct pass" in its description, that writes the Seen once list over a
`correct-pass.md` file at the repo root, so the next run finds it.

## Find the written rule

For each repeated mistake, search the repo's skills, AGENTS.md and docs for a rule that covers it:

- **No rule:** you find no skill, AGENTS.md line or doc that covers the mistake. Pick a fix as
  [Pick the fix](#pick-the-fix) says.
- **A written rule with no check:** agents skipped it. Pick a stronger fix.
- **A rule with a check:** the check misses a case. Find the case it let through, and extend the
  check to cover it.

Some repos hold a copy of a skill that a sync workflow writes from another repo. When the rule lives
in such a copy, change the rule in a PR to the repo the sync workflow names as its source, and put
any check in this repo. Link both PRs in your report. A change to the local copy is lost at the next
sync.

## Pick the fix

Try each fix in this order, and use the first one that makes the mistake fail the build or a test.
When a fix would change more than about 20 files, use the next one, and say why in the PR.

1. **Architecture.** Give each piece of state one owner, and each task one way to do it. Hide a
   module's internals behind its package `exports` or its public entry file. Derive a list from its
   source instead of keeping two by hand. Delete the old way and the dead code an agent would copy.
2. **Types.** Make the wrong state impossible to write.
3. **A lint rule or a CI check,** whose error names what to use instead, such as "use `loadSettings`
   from `config/settings.ts`". When the mistake is already in more places than you can fix in this
   PR, list the existing ones in the linter's own baseline or suppression file, or a plain list of
   paths next to the check, and fail only on a new one.
4. **A test** of the behaviour the mistake broke. When a test of that behaviour still passes with
   the mistake in place, fix that test.
5. **A written rule,** last, and only for a judgment call no check can make. Put it in the skill for
   that area, or in AGENTS.md when no skill covers it.

When a check now enforces a written rule, delete the rule, and say which check runs, as the
[skill-writing](../skill-writing/SKILL.md) skill says.

## Prove it

Take a real mistake from your evidence, such as the code before a fix or a revert. Apply it to the
code as it is now:

- For a lint rule, a CI check or a test, run it: it fails with the mistake, and passes without it.
- For a type or an architecture change, compile it: the mistake fails to compile, or there's no way
  left to write it.

Add each new lint rule, check or test to CI, running the same command you ran locally. When CI
doesn't run the build or the type check yet, add them in a PR of their own, and base the other PRs
on it. When the only evidence is review comments with no code, write the mistake from them, and say
so in the PR.

## Open the PRs

Open one PR per repeated mistake, with "correct pass" in its description. Fix the most frequent
mistakes first. When the user set a limit, such as a number of PRs, stop there. List each mistake
you didn't fix under Not fixed, with the reason.

A baseline file holds existing mistakes, to fix later. An existing line can also be right as it is,
because the check's rule can't apply there. For such a line, ask the user for an exception. When no
user is in the session, open the PR without the check, and list the check under Not fixed. With the
user's approval, mark the exception on that line with the check's disable comment. The comment holds
the reason, an expiry date 90 days out (`YYYY-MM-DD`) and the PR's link. Never turn a check off for
a whole file to fit one case: the rest of the file stops being checked.

## When the user corrects you

When the user corrects a mistake, fix it in the work you're doing. Then look for its written rule,
as [Find the written rule](#find-the-written-rule) says:

- **A rule covers it:** the mistake is a repeat. Pick a stronger fix and prove it, in a PR of its
  own, on a new branch from the default branch.
- **No rule covers it:** write the rule where it belongs, in the PR you're working on, or in a new
  PR when you have none. When an agent is next corrected for that mistake, it finds the rule, and
  the mistake counts as a repeat.

Reply with the rule you found or wrote, and the PR's link.

## Reply

For a full run, **Reply:** each repeated mistake with its evidence, the fix you chose, why a
stronger fix didn't work, the new check's failing run on the past mistake, and its PR's link; the
Not fixed list; and the Seen once list.
