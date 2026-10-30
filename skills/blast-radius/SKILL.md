---
name: blast-radius
description:
  "Finds what a change could break outside its own diff, and proves the one fact the change is safe
  because of by running the real code. Covers where a symbol search stops, how sure to be, and how
  to report real risks apart from cleared ones. Load it before you hand a change to review when the
  diff touches auth, secrets, money, migrations, deletion, infra permissions, a wire format or a
  public API, or crosses several subsystems; for a major version bump of a dependency; and for 'what
  could this break' or 'blast radius of X'."
---

# Blast radius

Find out what a change could break somewhere else. When you think it breaks nothing, prove it. Write
what you find into the PR description, for the reviewer: the safety fact, how you proved it, and the
risks. When the user asked what the change could break, answer them as
[When the user asked the question](#when-the-user-asked-the-question) says.

Grep already lists the callers. Look for what it can't find, as
[Look where grep stops](#look-where-grep-stops) says. Most changes that look risky are safe because
of one fact. Find that fact and prove it with code you run, because an argument you wrote can be
wrong and still read fine.

## Key rules

- [When to use it](#when-to-use-it): after the tests pass and before review, on a risky diff or a
  major version bump, and when you want to prove a refactor changes nothing.
- [Find the safety fact](#find-the-safety-fact): the one fact the change is safe because of.
- [Look where grep stops](#look-where-grep-stops): the library's source, timing, and what a symbol
  search misses.
- [How sure are you?](#how-sure-are-you): prove the fact with code you run; when you can't, say how
  far you got.
- [Sort the risks](#sort-the-risks): real, cleared or open, with the cheapest test for each real
  one.
- [Write it into the PR](#write-it-into-the-pr): a "Safe because:" line under the PR's Verification
  section.
- [When the user asked the question](#when-the-user-asked-the-question): the change and its reach,
  drawn in frames.

## When to use it

After the tests pass and before review, when the diff:

- touches auth, secrets, money, migrations, deletion or infra permissions;
- changes a wire format or a public API;
- crosses several subsystems;
- bumps a dependency a major version. Read its changelog first.

Use it on a refactor or a chore too, when you want to prove the change does nothing new.

## Find the safety fact

1. Read the change: the diff, the names it adds, changes and deletes, and what it does differently
   now. Include behaviour that changed with no line in the diff, such as a new default in a bumped
   library. Don't know the code around it? Load the [how](../how/SKILL.md) skill.
2. Find the one fact it's safe because of, like "this call only drops cache entries that already
   expired". If it holds, most of the scary cases clear at once. Spend most of your time here.
3. If no single fact covers it, find each fact it needs, and prove each.

## Look where grep stops

- **The library's own source.** Read it at the version the lockfile pins, with any local patch. The
  docs and the code don't always agree.
- **Timing.** What runs in a microtask, on teardown or on unmount, and in what order. If the repo
  has skills on its framework, load them for the timing traps.
- **What a symbol search misses.** The JSON an API returns, a database column, a wire format,
  another language reading the same bytes, a feature flag, a config key, code three calls
  downstream.

Never make up a caller or an API.

## How sure are you?

Prove the fact with code you run. Write a small script in a scratch folder outside the repo. It
calls the exact code you're worried about, in the library the app ships or in the changed code, and
fails loud if the fact is false. Better still, show the fact holding in the running app, if the repo
has a way to drive it.

Keep the script and its output for the PR. They never get committed.

When you can't run anything, say how far you got:

- **Pointed at the line:** you found the line of code that makes the fact true.
- **Walked it through:** you traced the case that would break, step by step, and it never gets
  there.
- **Unproven:** neither. A fact you only stated is worth nothing.

When the diff crosses several subsystems, get a second opinion on the fact. In the
[second-opinion](../second-opinion/SKILL.md) prompt, ask "Find a case where <the fact> is false."

## Sort the risks

Put each risk in one of three groups:

- **Real:** you showed it can happen.
- **Cleared:** you showed it can't, and you say why. A search that finds nothing can clear a risk:
  say what you searched.
- **Open:** you couldn't tell either way, and you say what would settle it.

For each real risk, give how it breaks, the line it starts at, how often real use would hit it, how
bad it is, and the cheapest test or repro that would catch it.

When the change is yours, fix each real risk before review. When the user asked about someone else's
change, report the risks and stop.

## Write it into the PR

Put the safety fact, its proof and the risks in the PR description, under a Verification section.
Add the section when the PR has none. When the PR isn't open yet, add them when you open it. An
invented example:

```markdown
**Safe because:** `clearPrefix("session:")` deletes only keys with that prefix. Ran it.

<details><summary>Proof</summary>

(the script, then its output)

</details>

**Real risks**

- A key named `session:` with no suffix gets deleted too. [cache.ts L40-44](permalink). Hit by real
  use: rarely. Cost: one user logged out. Check: a test that sets `session:` and clears the prefix.

**Cleared**

- The admin cache shares the store but uses the `admin:` prefix, so the clear never reaches it.
- No caller outside `src/cache`: searched the repo for `clearPrefix`.

**Open**

- None.
```

After "Safe because:", say how far you got: "Ran it", "Pointed at the line", "Walked it through" or
"Unproven". Link each line of code with a GitHub permalink, so the reviewer lands on the exact lines
at this commit.

## When the user asked the question

Show the user the change and how far it reaches, in frames built up one at a time, as the
[show-me](../show-me/SKILL.md) skill says. Start with the changed code. Each frame adds one place it
reaches, marked `✓` cleared, `✗` real or `?` open. Under the frames, show the safety fact, the
script and its output, and the lines each real risk starts at, in code blocks. No links.

**Reply:** the safety fact, how far you got and the proof, the real, cleared and open risks, and the
cheapest test for each real risk. When the user asked, give them the frames and code blocks instead.
