# Test prompts

Read [SKILL.md](../SKILL.md) first, for when to write a work item, a design doc and a decision
record. Its [Check it](../SKILL.md#check-it) section lists which tests to run and what to fix after
each one.

## Run a test

1. Start a `general-purpose` subagent that has none of your conversation. Never use a fork. A fork
   knows your intent, so it fills the gaps the test is there to find.
2. Give it a labelled list of what it reads, in this form. Leave out each line that has nothing in
   it, and leave out `Work item to build` for the skim test.

   ```text
   Design: <path to the design doc, or "the work item after the prompt">
   Work items: <the issue links or paths the design doc lists>
   Decision records: <the paths the design doc links>
   Code: <the repo root; leave out when no code exists yet>
   Work item to build: <one work item the design covers; for a design in a work item, that work item>
   ```

3. Under the list, paste the test's prompt word for word. For a design in a work item, paste the
   work item's text after the prompt.
4. For a design doc, run both tests in parallel. For a work item, run only the builder test.

## Skim test

```text
Read this design the way a reviewer with two minutes would: the opening, the diagram if there is one, the headings and the code. Then say what gets built, what its contracts are, and what you would push back on. Also say how many lines you read before you understood the point, and the 3 places that slowed you most.
```

## Builder test

```text
You build the work item named above. Give three lists. First, each question about a contract or a constraint that you would have to ask before you start, including each place where you would have to guess at a contract. Second, each detail you would decide yourself without asking. Third, what in the design is noise for the work item you build.
```
