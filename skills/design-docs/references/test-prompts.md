# Test prompts

Read [SKILL.md](../SKILL.md) first. It defines the work item, the design doc and the decision
record, and its "Check it" section says which tests to run and what to fix after each one.

## Run a test

1. Start a `general-purpose` subagent that has none of your conversation. Never use a fork. A fork
   shares your intent, and the test must find where the design leaves that intent out.
2. Give it a labelled list of what it reads, in this form. Leave out a line that has nothing in it.

   ```text
   Design: <path to the design doc, or the work item's text pasted below>
   Work items: <the issue links or paths the design doc lists>
   Decision records: <the paths the design doc links>
   Code: <the repo root; leave out when no code exists yet>
   Part to build: <the work item to build first, for the builder test>
   ```

3. Under the list, paste the test's prompt word for word.
4. For a design doc, run both tests in parallel.

## Skim test

```text
Read this design the way a reviewer with two minutes would: the opening, the diagram if there is one, the headings and the code. Then say what gets built, what its contracts are, and what you would push back on. Also say how many lines you read before you understood the point, and the 3 places that slowed you most.
```

## Builder test

```text
You build the part named above. Give three lists. First, each question about a contract or a constraint that you would have to ask before you start, including each place where you would have to guess at a contract. Second, each detail you would decide yourself without asking. Third, what in the design is noise for the part you build.
```
