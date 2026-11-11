# Test prompts

Read [SKILL.md](../SKILL.md#check-it) first: it says which tests a design needs, and what to fix
after each one. The design is the design doc, or the work item when no design doc exists.

To run a test:

1. Start a `general-purpose` subagent with none of your conversation. Never use a fork: a fork knows
   what you meant, so it can't find where the design fails to say it.
2. Write a line with the paths it reads: the design, the repo root of the code base, and, for a
   design doc, its work items and decision records that exist. Leave out the code base when no code
   exists yet.
3. Under that line, paste the test's prompt below word for word.
4. Run both tests of a design doc in parallel.

## Skim test

```text
Read this design the way a reviewer with two minutes would: the opening, the diagram, the headings and the code. Then say what gets built, what its contracts are, and what you would push back on. Also say how many lines you read before you understood the point, and the 3 places that slowed you most.
```

## Builder test

```text
You build the first part of this design. List every question you would have to ask before you start, and each place where you would have to guess at a contract. Sort them into questions about a contract or a constraint, and details you would decide yourself. Then list what in the design is noise for the part you build.
```
