# Test prompts

Copy the steps and the prompts here to run the skim test and the builder test. Read
[SKILL.md](../SKILL.md) first: its [Check it](../SKILL.md#check-it) section lists which tests to run
and what to fix after each one.

## Run a test

1. Start a fresh `general-purpose` subagent for each test run, with none of your conversation. Never
   use a fork. A fork knows your intent, so it fills the gaps the test is there to find.
2. Give it a labelled list of what it reads, in this form. Leave out each line that has nothing in
   it.

   ```text
   Design: <path to the design doc, or "the work item after the prompt">
   Work items: <builder test only: the links to the work items the design doc covers>
   Decision records: <the paths the design doc links>
   Code: <builder test only: the repo root; leave out when the repo has no code yet>
   Work item to build: <builder test only: the work item that builds on the most shared contracts, or the work item that holds the design>
   ```

3. Under the list, paste the test's prompt word for word. For a design in a work item, paste the
   work item's text after the prompt.
4. Run both tests in parallel when SKILL.md asks for both.

## Skim test

```text
Read this design the way a reviewer with two minutes would: the opening, the diagram if there is one, the headings and the code sketches. Open no other file. Then say what gets built, what its contracts are, and what you would push back on. Also say how many lines you read before you understood the point, and the 3 places that slowed you most.
```

## Builder test

```text
Plan how you would build the work item named above, and edit no file. Give three lists. First, each question about a contract or a constraint that you would have to ask before you start, including each place where you would have to guess at a contract. Second, each detail you would decide yourself without asking. Third, each passage of the design you would skip as noise for that work item.
```
