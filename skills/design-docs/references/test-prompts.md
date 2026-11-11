# Test prompts

Give each test to its own fresh subagent: a new agent with none of your conversation, never a fork.
Pass it the path of the design, the path of the code base, and the prompt below word for word. For a
design doc, also pass the paths of its work items and decision records.

## Skim test

```text
Read this design the way a reviewer with two minutes would: the opening, the diagram, the headings and the code. Then say what gets built, what its contracts are, and what you would push back on. Also say how many lines you read before you understood the point, and the 3 places that slowed you most.
```

## Builder test

```text
You build the first part of this design. List every question you would have to ask before you start, and each place where you would have to guess at a contract. Sort them into questions about a contract or a constraint, and details you would decide yourself. Then list what in the design is noise for the part you build.
```
