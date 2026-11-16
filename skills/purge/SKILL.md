---
name: purge
description:
  "Removes every instance of one named thing from the scope a request gives, such as a folder, a
  repo or every repo of an org, with everything that existed only for it, such as its imports,
  config, docs, tests and CI steps, and proves that a search finds none left. Replaces each instance
  with a stated thing when the request asks for a replacement. Asks nothing once the work starts,
  and ends with open pull requests. Load it for 'purge X', 'remove every X', 'get rid of all X' and
  'replace every X with Y'."
---

# Purge

Remove every instance of one thing from the scope the user gives, and everything that existed only
for it. The user asks once and leaves, so finish without a question. Do exactly what the user asked:
for "every comment", delete every comment, the useful ones included.

- **Settle what the request means before you write a detector.** A purge of the wrong thing still
  ends with an empty search and a large diff.
- **Remove what pointed at the thing.** A deleted flag leaves behind its config key, its docs
  section and the test of its off branch.
- **Change only the thing.** When a purge also tidies the code around it, no script can check the
  diff.

You're done when your detector finds nothing in any repo in scope, each repo's checks pass, and each
pull request is open with green CI. Hand back the count you removed, what you left and why, and the
pull requests. The user reads that to decide whether to merge.

## Key rules

- [Read the request](#read-the-request): the target, what happens to it, the scope and what stays.
  Ask here, and never later.
- [Find every instance](#find-every-instance): a clone of each repo in scope, a detector script, and
  a count for each class of hit.
- [Change it](#change-it): a script for each class with one edit, and subagents that write the new
  text for the rest.
- [Remove what pointed at it](#remove-what-pointed-at-it): unused code, config, prose, tests and
  dependencies, pass after pass until a pass finds nothing.
- [Prove it](#prove-it): the detector at zero, a plain-text search, and each repo's checks.
- [Open the pull requests](#open-the-pull-requests): one per repo when its limits allow, users of a
  thing before its source, and a rerun of the scripts when the base moves.
- [Report](#report): what you removed, what you left, and the pull requests.

## Read the request

Find these in the request before you write a detector:

- **State the target as a rule** that puts any one candidate in or out, such as "every use of
  `LEGACY_MODE`" or "every test title that starts with `should`".
- **Decide what happens to it.** You delete it, or you replace it with a thing the user gives.
- **Take the scope the user gives:** paths, a repo, a list of repos, or every repo of an owner. With
  none given, take the whole repo you are in.
- **Keep each exception the user gives,** and nothing else.

Then test the rule on three candidates. Search the scope for one that is in, one that is out, and
the one you find hardest to decide: the thing under another spelling, inside a string or a comment,
or in generated code. When the rule doesn't decide the third, the request is missing one of the four
items. Stop, and tell the user which item, with that candidate as the example.

A request that points at an example and gives no rule, such as "purge this", fails the test. The
example fits several rules, and each rule gives a different purge.

Ask nothing after this step:

- When a check fails because of your edits, fix it.
- When a check also fails on the base commit, leave it, and report it.
- When you can't change a hit without changing more than the target, leave the hit, and report it.

## Find every instance

1. For a scope of several repos, list them, such as with `gh repo list <owner>`, where `<owner>` is
   the account or org the user gives. Clone each one. A hosted code search covers only each default
   branch, and finds only what a text query matches. Report each repo you can't change, such as an
   archived one.
2. Write a detector, a script that prints every instance with its file and position. Use the
   language's own parser when a text search would miss a form, such as a string split across lines.
3. Keep the detector, and each script you write later, outside the repos. A script committed for one
   purge is one more thing to remove.
4. Run the detector in each repo, and group the hits into classes by the edit each needs. Count each
   class, per repo.
5. Mark each class as scripted or worded. In a scripted class, one rule gives every edit, such as
   "delete the line" or "put `it ` before the title". In a worded class, each hit needs a sentence
   rewritten.
6. When you can't tell whether a hit is an instance, apply the rule from the request. Under a rule
   of "every", the hit is in.
7. Search for forms the detector can't see, such as the target's name inside a string, or a name
   built from parts at run time. Fix each by hand, or report it.

## Change it

- **Edit a scripted class with a script.** Make the script apply each edit by position, and fail
  when any text outside the edit changes. Hand edits of one class drift apart after the first
  hundred hits.
- **Send a worded class to subagents,** about 200 hits each, with a file's hits kept together. Give
  each one this rule: change only what the target requires, and keep every fact. Ask for a mapping
  from each file and old text to the new text, and tell it to edit no file. Apply the mapping with a
  script that finds each old text in its file, and fails when one is missing.
- **Have a fresh subagent read every entry of the mapping.** Ask it for each entry that lost a fact,
  changed its meaning, or gained a claim the old text didn't make. Fix each one.

Report any other fault you see, and leave it.

## Remove what pointed at it

Search for what existed only for the target, and remove each one:

- code that nothing uses now: imports, variables, parameters, types and files;
- config: environment variables, config keys, flags and CI steps;
- prose that describes it: docs, READMEs and code comments;
- tests of behaviour that is gone;
- dependencies that only the target used.

Edit these by hand, in a commit of their own. Keep a reference that something else still uses. One
removal exposes the next, such as a helper whose last caller you deleted, so repeat the search until
a pass finds nothing.

Search every repo in scope on each pass. What pointed at the target can live in another repo, such
as a deploy config that sets a variable the code stopped reading.

For a replacement, update what quoted the old form, such as a snapshot or a list of skipped tests.

## Prove it

1. Run each repo's formatter. An edit that shortens a line can change how the lines around it wrap.
2. Run the detector again in each repo. Expect: zero hits outside the exceptions the user gave.
3. When the target has a name, search each repo for the name as plain text, with docs and config in
   the search. Remove each hit, unless the user gave it as an exception or something else still uses
   it.
4. Run each repo's checks. Run each one where that repo's rules put it, such as CI for a slow test
   suite.

## Open the pull requests

Open one pull request per repo when the repo's limits allow. Before you push, look in the repo's CI
workflows and its contributor docs for a limit on a large change, such as a step that fails past a
number of files. To fit a limit, split by class or by folder into pull requests that each branch
from the default branch and each pass alone.

Commit the scripted edits and the worded edits apart, and paste each script into the pull request
description. A reviewer checks a scripted commit by reading its script, and a worded commit by
reading the text.

When one repo uses the target from another, such as an app that imports a package, open the user's
pull request first, and say in the source's pull request that it merges last. The source's checks
pass with the target gone, and each user breaks on its next update.

Until you hand back, when a default branch moves, run the detector and the scripts again on the new
base. The new base can hold new instances, and a conflict resolved by hand misses them.

## Report

- **Removed:** for each repo, the count for each class, and what else you removed because it pointed
  at the target.
- **Left:** each exception, each repo you couldn't change, each hit you couldn't change alone, each
  reference something else still uses, each check that failed before your edits, and each other
  fault you saw.
- **Pull requests:** each link, with its CI state, how you split, and the order to merge them in.

**Reply:** what you removed, what you left and why, and the pull requests.
