---
name: purge
description:
  "Removes every instance of one named target from the scope a request gives, such as a folder, a
  repo or every repo of an owner, with everything that existed only for it, such as its imports,
  config, docs, tests and CI steps, and proves that a search finds none left. Replaces each instance
  when the request gives a replacement. Asks nothing once the edits start, and ends with open pull
  requests. Load it for 'purge X', 'remove every X', 'get rid of all X' and 'replace every X with
  Y'."
---

# Purge

Remove every instance of one target from the scope the user gives, and everything that existed only
for it. The user asks once and leaves, so ask only in the first step, before any edit. Do exactly
what the user asked: for "every comment", delete every comment, the useful ones included.

- **Settle what the request means before you search.** A purge of the wrong target still ends with
  an empty search and a large diff.
- **Remove what pointed at the target.** A deleted flag leaves behind its config key, its docs
  section and the test of its off branch.
- **Change only the target and what existed only for it.** Then a script can check that nothing else
  changed.

You're done when your search script finds no instance in any repo in scope, apart from the
exceptions and the hits you left and reported, and each pull request is open with green CI, or with
only a failure that its base commit has too. Hand back the [report](#report). When the request is
incomplete, you're done once you reply as [Read the request](#read-the-request) says.

## Key rules

- [Read the request](#read-the-request): the target as a test, the scope and what stays. Ask here
  only.
- [Find every instance](#find-every-instance): fresh copies, a search script, and a count per class
  of hit.
- [Change it](#change-it): edit scripts for scripted classes, and subagents for worded ones.
- [Remove what pointed at it](#remove-what-pointed-at-it): unused code, config, prose, tests and
  dependencies, until a pass finds nothing.
- [Prove it](#prove-it): the search script at zero, a plain-text search, and each repo's checks.
- [Open the pull requests](#open-the-pull-requests): one per repo within its limits, and the
  dependent repo's first.
- [Report](#report): what you removed, what you left, and the pull requests.

## Read the request

Find these items in the request:

- **The target.** State it as a test that puts any one candidate in or out, such as "every use of
  `LEGACY_MODE`" or "every test title that starts with `should`".
- **What happens to it.** Delete it, or put the replacement the user gives in its place.
- **The scope.** Take what the user gives: paths, a repo, a list of repos, or every repo of an
  owner. With none given, take the whole repo you are in.
- **What stays.** Keep each exception the user gives. Leave any other hit only when a rule below
  says to, and report it.

Then try the test on a candidate that is in, one that is out, and the one you find hardest to
decide, such as the target under another spelling, in a comment, or in generated code. When the test
doesn't decide the hardest one, the request is incomplete. Reply with that candidate and the item
that would settle it, and end your run.

A request that points at an example and gives no test, such as "purge this", is incomplete. The
example fits several tests.

Ask nothing after this step:

- When a check fails because of your edits, fix it.
- When a check also fails on the base commit, leave it, and report it.
- When you can't change a hit without changing more than the target, leave the hit, and report it.

## Find every instance

1. Work in a fresh copy of each repo, outside the user's checkout: a clone, or a worktree on a new
   branch for the repo you are in. For an owner, list the repos with `gh repo list <owner>`, where
   `<owner>` is the account or org the user gives. Report each repo you can't change, such as an
   archived one.
2. Write a search script that prints every instance with its file and position, and run it on the
   copies. A hosted code search finds only what a text query matches. Use the language's parser when
   a text search would miss a form, such as a string split across lines.
3. Keep every script you write outside the repos. A committed script is one more file to remove.
4. Run the search script in each repo. When the test leaves a hit undecided, count it in. You can no
   longer ask, and the user asked for every one.
5. Group the hits into classes by the edit each needs, and count each class, per repo.
6. Mark each class as scripted, where one instruction gives every edit, such as "delete the line",
   or as worded, where each hit needs a sentence rewritten.
7. Look by hand for forms the search script misses, such as the target's name inside a string, and
   fix each one. Report each form you can't search for, such as a name built at run time.

## Change it

- **Edit a scripted class with an edit script.** Make it apply each edit by position, and fail when
  any text outside the edit changes. Edits made by hand stop matching each other after the first
  hundred.
- **Send a worded class to subagents,** about 200 hits each, with a file's hits kept together. Tell
  each one to change only what the target requires, and to keep every fact. Ask for JSON that maps
  each file and old text to the new text, and tell the subagent to edit no file. Apply the JSON with
  an edit script that fails when an old text is missing from its file, or is there twice.
- **Give each batch of new text to a fresh subagent.** Ask it for each entry that lost a fact,
  changed its meaning, or gained a claim the old text didn't make. Fix those entries by hand, and
  run the edit script again.

When an edit script fails, restore each file it touched, fix the script or the JSON entry it names,
and run it again. Report any other fault, and leave it.

## Remove what pointed at it

Remove each thing that existed only for the target:

- code that nothing uses now, such as imports, variables, parameters, types and files;
- config, such as environment variables, config keys, flags and CI steps;
- prose that describes it, in docs, READMEs and code comments;
- tests of behaviour that is gone;
- dependencies that only the target used.

Edit these by hand, in their own commit. Keep a reference that something else still uses. Repeat the
search in every repo in scope until a pass finds nothing. One removal exposes the next, such as a
helper whose last caller you deleted. A deploy config in another repo can still set a variable the
code stopped reading.

For a replacement, update what quoted the old form, such as a snapshot.

## Prove it

1. Run each repo's formatter on the files you changed. When it changes a line outside your edits,
   revert that line, and report the file.
2. Run the search script again in each repo. Expect: zero hits apart from the exceptions and the
   hits you left and reported.
3. When the target has a name, search each repo for the name as plain text, docs and config
   included. Remove or replace each hit that isn't an exception and that nothing else uses.
4. Run each repo's checks where its docs say, such as in CI for a slow test suite.

## Open the pull requests

Open one pull request per repo. Before you push, look in its CI workflows and contributor docs for a
limit on a large change, such as a step that fails past a number of files. To fit one, split by
class or folder into pull requests that each branch from the default branch and pass alone.

Commit the scripted edits and the worded edits apart, and paste the search script and each edit
script into the pull request description. A reviewer checks a scripted commit by reading its script,
and a worded commit by reading the text.

When one repo takes the target from another, such as an app that imports a package, open the app's
pull request first, and say in the package's pull request that it merges last. The package's checks
pass with the target gone, so a package merged first breaks each app on its next update.

Before you hand back, run the search script and the edit scripts again on each default branch that
moved. The new base can hold new instances, and a conflict resolved by hand misses them.

## Report

- **Removed:** for each repo, the count for each class, and what else you removed with it.
- **Left:** each exception, each repo or hit you couldn't change, each reference still in use, each
  check that failed before your edits, and each other fault you saw.
- **Pull requests:** each link, with its CI state, how you split, and the merge order.

**Reply:** what you removed, what you left and why, and the pull requests; for an incomplete
request, the undecided candidate and the item that would settle it.
