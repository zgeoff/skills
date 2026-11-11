---
name: design-docs
description:
  'Records a technical design as contracts and constraints: inline code sketches, constraint bullets
  and a diagram, in a work item for small work, a design doc for big work, and a decision record for
  a choice that outlives both. Holds the templates. Load it before you write or review a design, a
  decision record or the design part of a work item, and at the end of a design session.'
---

# Design docs

Record a design so the owner can skim it in two minutes and say "yes, that's a good design", and a
builder agent can start from it without asking. Both readers want the same thing: the contracts as
code, the rules as bullets, and nothing else. The builder is capable, so give it a workable starting
point that holds the upfront thinking, and leave it the rest.

Avoid these mistakes:

- committing the working record of the design (options, bake-off losers, review logs, "decided by
  you on 11 Nov") in place of the result;
- writing to the owner ("a default you can change") where the builder needs the rule;
- describing a contract in prose when a code block shows it;
- splitting one design into many small docs, or growing one doc into a wall.

Hand back where the design lives and the result of the two tests in [Check it](#check-it).

## Key rules

- [Pick the home](#pick-the-home): a work item for small work, a design doc for big work, a decision
  record for a lasting choice.
- [Show contracts as code](#show-contracts-as-code): inline blocks, the call first, then the types,
  with rules in comments.
- [State constraints as bullets](#state-constraints-as-bullets): one rule per line, each one a test
  could check.
- [Leave the blanks to the builder](#leave-the-blanks-to-the-builder): settle the shape, and list
  what the builder decides.
- [Write down the result](#write-down-the-result): present tense, for the builder, with no history.
- [Keep it skimmable](#keep-it-skimmable): one doc per design, short blocks, few open points.
- [Write a decision record](#write-a-decision-record): only for a choice the owner approved, edited
  in place.
- [Check it](#check-it): the skim test and the builder test, by fresh subagents.

## References

- [Design doc template](./references/design-doc.md): writing a design doc.
- [Work item template](./references/work-item.md): writing the design part of a work item.
- [Decision record template](./references/decision-record.md): writing or changing a decision
  record.

## Pick the home

| Home            | Use it when                                                                                                                           | Lives in                        |
| --------------- | ------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------- |
| Work item       | The work fits in one PR, or a few, and changes no contract that other code depends on.                                                | the work tracker                |
| Design doc      | The work adds or changes a boundary, such as an API, a schema, a wire format or a port, or it spans several PRs that share contracts. | `docs/design/<work>.md`         |
| Decision record | A choice between options will outlive the design, and the owner approved it.                                                          | `docs/decisions/NNNN-<slug>.md` |

A design session with the owner does not by itself call for a design doc. At its end, put each
result in the home the table picks: often a work item and a decision record are enough.

A design doc describes work not yet built. Once the code is built, move what still describes the
system into `docs/architecture/`, point each decision record's design link there, and delete the
design. The [docs/ tree](../docs-writing/references/docs-tree.md) sets those folders.

## Show contracts as code

Put every contract in an inline code block in the doc: a function signature, a type, a tool's input
and output, a table's columns, a config key, an event's payload. Never keep sketches in separate
files. Treat a sketch as a starting point with design thinking behind it: the builder may change its
details.

- Show the call first, with a realistic result in a comment. Then show the types it needs.
- Put a rule that belongs to one field in a comment on that field.
- Mark existing code you extend with `// …existing fields`, and show only what changes.
- Name the module that owns each type in a comment. Leave file paths out: the builder has grep.
- Show a port as an interface with its adapters named in a comment. Show a flow as a short numbered
  list or a diagram.
- Use the language of the code base. Use pseudo-DDL in a `text` block for a table, and `jsonc` for
  config.

## State constraints as bullets

Write each constraint as one line that a test or a reviewer could check: an invariant, an ordering,
a limit, a failure and what happens on it, what must never happen.

- Write "when X, Y" for a conditional rule.
- Give the number for a limit: "100 images or 24 MiB per session".
- Add a reason in a short clause only when the rule looks arbitrary without it.
- Put the rule once. When a code comment holds it, leave it out of the bullets.

## Leave the blanks to the builder

Settle what is costly to change later: the contracts, the boundaries, the invariants and the failure
behaviour. List the rest under "Builder decides", such as internal names, file layout, helper
functions, error wording and test layout. The list tells the owner what was left open on purpose,
and tells the builder where it may choose.

Leave out what the builder can read from the code. When the design extends existing code, name the
symbols it touches in the header and describe only the change.

## Write down the result

Write in the present tense, about the system the design builds, for the builder.

- State each decision as the rule it set. The owner's name, the date and the options shown in the
  session stay out.
- Give a rejected option one line in a decision record, never a section in the design.
- Rewrite a design when it changes. Never stack an amendment on top, such as "Changed on 12 Nov:
  where the text below differs, this list holds".
- Keep review findings, fact checks and drafts in the PR or the session.

## Keep it skimmable

- Write one design doc per piece of work. When it passes about 400 lines with its code, split it at
  a boundary into `docs/design/<work>/`, with a README that lists each doc and the one diagram of
  the whole.
- Keep each code block under about 40 lines. Show the shape, and leave the implementation to the
  builder.
- Draw one diagram of the main path near the top, with about 10 nodes at most. Use mermaid.
- Keep open points under about 10. More means the design is not done.
- Give each open point the person who settles it, the owner or the builder, and the behaviour the
  build uses until then.

## Write a decision record

Write one for a choice between options that the owner approved, in a session, a review or the PR
that adds the design. When you design alone, list each choice in the design's Decisions section, and
write the record once the owner approves it.

Keep it short: the decision in a few lines, the reasons as bullets with any measured figure, and the
rejected options as a table. When the decision changes, edit the record in place and add a line to
its `## Changes` list. Never delete a record, and never reuse its number.

## Check it

Run each test with a fresh subagent that gets only the design, the code base and the test's prompt.
Fix what each finds, then run it once more.

1. **Skim test.** Ask: "Read this design for two minutes, then say what gets built, what its
   contracts are, and what you would push back on." When the answer misses the point of the design,
   the opening or the diagram is wrong.
2. **Builder test.** Ask: "You build the first slice of this design. List every question you would
   have to ask before you start, and each place where you would have to guess at a contract." Fix
   each question about a contract or a constraint. A question about a detail under "Builder decides"
   needs no fix.

Run the docs checks and a cold read too, as the [docs-writing](../docs-writing/SKILL.md) skill says.
A design that passes them can still fail both tests.

**Reply:** where the design lives, each decision record you wrote, and what the skim test and the
builder test found and what you fixed.
