---
name: blast-radius
description:
  "Finds what a change could break outside its own diff, and proves the fact that makes the change
  safe by running the real code. Covers what a symbol search misses, how to say how far you got in
  proving it, and how to sort the risks into real, ruled out and open. Load it before you hand a
  change to review when the diff touches auth, secrets, money, migrations, deletion, infra
  permissions, a wire format or a public API, or crosses several subsystems; for a major version
  bump of a dependency; and for 'what could this break' or 'blast radius of X'."
---

# Blast radius

Find out what a change could break somewhere else. When you think it breaks nothing, prove it. Write
what you find for whoever reads it:

- **Your own change:** in the PR description, for the reviewer, as
  [Write it into the PR](#write-it-into-the-pr) says. You're done when every real risk is fixed or
  waits on the user's decision, and the PR section is written.
- **The user asks what a change could break:** in chat, as
  [When the user asks what it could break](#when-the-user-asks-what-it-could-break) says. When it's
  your own change, write the PR section too.

A search for the changed names lists the callers, so run it, then look for what it can't find, as
[Look past the search](#look-past-the-search) says. Look for one fact that makes the change safe,
and prove it with code you run: an argument you only wrote down can be wrong and still read fine.

## Key rules

- [When to use it](#when-to-use-it): after the tests pass and before review, on a risky diff or a
  major version bump, and to prove a refactor changes nothing.
- [Find why it's safe](#find-why-its-safe): the one fact that makes the change safe.
- [Look past the search](#look-past-the-search): the library's source, timing, and what a symbol
  search misses.
- [Prove it](#prove-it): run code that checks the fact; when you can't, say how far you got.
- [Sort the risks](#sort-the-risks): real, ruled out or open, with the cheapest test for each real
  one.
- [Write it into the PR](#write-it-into-the-pr): the fact, its proof and the risks, under the PR
  template's testing heading.
- [Reply](#reply): the fact, how far you got, and the risks.
- [When the user asks what it could break](#when-the-user-asks-what-it-could-break): the change and
  how far it reaches, drawn one step at a time, in chat.

## When to use it

On your own change, after the tests pass and before review, when the diff:

- touches auth, secrets, money, migrations, deletion or infra permissions;
- changes a wire format or a public API;
- crosses several subsystems;
- bumps a dependency a major version.

For a major version bump, read the dependency's changelog before step 1 of
[Find why it's safe](#find-why-its-safe). Use the skill on a refactor or a chore too, when you want
to prove the change does nothing new. When the user asks what someone's change could break, use it
at any time.

## Find why it's safe

1. Read the change: the diff, the names it adds, changes and deletes, and what it now does
   differently. Include behaviour that changed with no line in the diff, such as a new default in a
   bumped library. When you don't know the code around it, load the [how](../how/SKILL.md) skill.
2. Find the one fact that makes it safe, such as "this call only drops cache entries that already
   expired". When that fact holds, it rules out many risky cases at once. Spend most of your time
   here.
3. When no single fact covers it, find each fact it needs, and prove each one.

## Look past the search

- **The library's own source.** Read it at the version the lockfile pins, with any patch the repo
  applies to it, such as a `patch-package` or `bun patch` file. The docs and the code don't always
  agree.
- **Timing.** What runs in a microtask, on teardown or on unmount, and in what order. When the repo
  has skills on its framework, load them for the timing traps.
- **What a symbol search misses.** The JSON an API returns, a database column, a wire format,
  another language reading the same bytes, a feature flag and a config key. Search for each one's
  string form, such as a JSON key or a column name, across every file type.
- **Callers further away.** Search for the callers of each caller, up to three calls away from the
  change.

Name only the callers and APIs you found in the code. The reviewer looks for each one you name.

## Prove it

Prove the fact with code you run. Write a small script in a folder inside the repo that git ignores,
such as one you add to git's local exclude file, so its imports resolve the repo's modules. It calls
the exact code you're worried about, in the installed dependency or in the changed code, and fails
with an error when the fact is false. When the script can't reach the real code path and the repo
has a way to drive the running app, show the fact holding there instead.

Keep the script and its output for the PR. Don't commit them.

Say how far you got, with the strongest level that is fully true. When you can't run anything, use
one of the last three:

- **Ran it:** your script or the running app showed the fact holding against the real code path.
- **Found the line:** you found the line of code that makes the fact true.
- **Traced it:** you followed the case that would break, step by step, and it never gets there.
- **Unproven:** neither. Treat the fact as a guess.

When the diff is one that [When to use it](#when-to-use-it) lists, other than a refactor or a chore,
get a second opinion on the fact. In the [second-opinion](../second-opinion/SKILL.md) prompt, ask
"Find a case where <the fact> is false." Treat each case it finds as a risk to sort.

## Sort the risks

Put each risk in one of three groups:

- **Real:** you showed it can happen.
- **Ruled out:** you showed it can't, and you say why. A search that finds nothing can rule out a
  risk: say what you searched.
- **Open:** you couldn't tell either way, and you say what would settle it.

For each real risk, give:

- how it breaks, and the line it starts at;
- **Hit by real use:** rarely, sometimes or often, with the reason;
- **Cost:** what goes wrong for a user when it happens;
- **Check:** the cheapest test that would catch it.

When the change is yours, fix each real risk before review, add its test, and run the proof again.
Then move the risk to Ruled out, with the fix as the reason. Leave a real risk under Real only when
its fix needs the user's decision, and say so. When the user asked about someone else's change,
report the risks and stop.

## Write it into the PR

Put the fact, its proof and the risks in the PR description, under the PR template's heading for
testing. When the template has none, add a Verification section. When the PR isn't open yet, add
them when you open it. An invented example:

```markdown
**Safe because:** `clearPrefix("session:")` deletes only keys with that prefix. Ran it.

<details><summary>Proof</summary>

(the script, then its output)

</details>

**Real risks**

- A key named `session:` with no suffix gets deleted too. [cache.ts L40-44](permalink). Hit by real
  use: rarely, because only a bug writes a key with no session id. Cost: one user logged out. Check:
  a test that sets `session:` and clears the prefix. Waits on your call: delete such keys or keep
  them.

**Ruled out**

- The admin cache shares the store but uses the `admin:` prefix, so the clear never reaches it.
- No caller outside `src/cache`: searched the repo for `clearPrefix`.

**Open**

- None.
```

After "Safe because:", say how far you got: "Ran it", "Found the line", "Traced it" or "Unproven".
When the change needs several facts, give each its own "Safe because:" line. Push first, then link
each line of code with a GitHub permalink at the head commit, so the reviewer lands on the exact
lines. Update the links after a later push.

## When the user asks what it could break

Show the user the change and how far it reaches, as a sequence of diagrams built up one step at a
time, as the [show-me](../show-me/SKILL.md) skill says. Start with the changed code. Each diagram
adds one place the change reaches, marked `✓` ruled out, `✗` real or `?` open. Under the diagrams,
show the fact, the script and its output, and the line each real risk starts at, in code blocks.
Leave out links: in chat the user reads the code in place.

## Reply

**Reply:** the fact that makes the change safe, how far you got and the proof, the real, ruled-out
and open risks, the cheapest test for each real risk, and, for your own change, a link to the PR
section you wrote. When the user asked what it could break, give the same in the diagrams and code
blocks above.
