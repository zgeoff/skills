---
name: design-docs
description:
  'Records a technical design as contracts and constraints: inline code sketches, constraint bullets
  and a diagram, in a work item for small work, a design doc for big work, and a decision record for
  a choice that outlives both. Holds the templates. Load it before you write or review a design, a
  decision record or the design part of a work item, and at the end of a design session.'
---

# Design docs

Record a design for two readers. The owner, the person you work for who approves the design, skims
it in two minutes and says yes or no. The builder, the agent or person who implements it, starts
from it without asking. Both need the contracts as code and the rules as bullets. Settle what is
costly to change later, and leave the builder the rest.

Avoid these mistakes:

- committing how the design was reached in place of the design: the options shown, the losing
  sketches, review logs, "decided by you on 11 Nov";
- writing to the owner, such as "a default you can change", where the builder needs the rule;
- describing a contract in prose when a code block shows it;
- one design spread over many small docs.

You're done when the skim test and the builder test in [Check it](#check-it) find nothing left to
fix.

## Key rules

- [Choose where the design goes](#choose-where-the-design-goes): a work item for small work, a
  design doc for a shared contract, a decision record for an approved choice.
- [Show contracts as code](#show-contracts-as-code): inline code sketches, the call first, then the
  types, with rules in comments.
- [State constraints as bullets](#state-constraints-as-bullets): one rule per line, each one a test
  could check.
- [Leave the details to the builder](#leave-the-details-to-the-builder): settle the contracts, and
  list what the builder decides.
- [Write the design, not its history](#write-the-design-not-its-history): present tense, with no
  dates, names or losing options.
- [Keep it short](#keep-it-short): one doc, short code blocks, a few open questions.
- [Write a decision record](#write-a-decision-record): for a choice the owner approved, edited in
  place.
- [Check it](#check-it): the skim test and the builder test, by fresh subagents.

## References

- [Design doc template](./references/design-doc.md): writing a design doc, or splitting a long one.
- [Work item template](./references/work-item.md): writing the design part of a work item.
- [Decision record template](./references/decision-record.md): writing or changing a decision
  record.

## Choose where the design goes

A shared contract is a type, API, schema, event, config format or file format that code outside the
change reads or writes.

| Write a         | When                                                                                | In                              |
| --------------- | ----------------------------------------------------------------------------------- | ------------------------------- |
| work item       | the work changes no shared contract, such as a new config key that one module reads | the work tracker                |
| design doc      | the work adds or changes a shared contract, or spans several PRs that share one     | `docs/design/<work>.md`         |
| decision record | the owner chose between options, and the choice will outlive the design             | `docs/decisions/NNNN-<slug>.md` |

A design session with the owner can end in any of these, and needs no design doc unless the table
calls for one. When work has both a design doc and a work item, the work item links the doc's
sections and copies nothing from them.

Once the work is built, the agent that lands its last PR moves what still describes the system into
`docs/architecture/`, points each decision record's design link there, and deletes the design doc.

## Show contracts as code

Write each contract as a code sketch: an inline code block that shows its shape. Never put sketches
in separate files. The builder follows a sketch's shapes and the rules in its comments, and may
change names inside a module and anything a comment marks as illustrative.

- Show the call first, with a realistic result in a comment. Then show the types it needs. A
  contract with no call, such as a config key or a table, starts at its shape.
- Put a rule that belongs to one field in a comment on that field.
- Mark existing code you extend with `// …existing fields`, and show only what changes.
- Name the module that owns each type in a comment. Leave file paths out: the builder has grep.
- Show a port as an interface, with its adapters named in a comment.
- Write each sketch in the format the code base uses: its language, its config format, its SQL
  dialect. Show a table as its columns in a `text` block, one per line with the type and a comment,
  when no SQL is settled.

## State constraints as bullets

Write each constraint as one line that a test or a reviewer could check: an invariant, an order, a
limit, a failure and what happens on it, or something that must never happen.

- Write "when X, Y" for a conditional rule.
- Give the number for a limit: "100 images or 24 MiB per session".
- Add a reason in a short clause only when the rule looks arbitrary without it.
- State each rule once. When a sketch comment holds it, leave it out of the bullets.

## Leave the details to the builder

Settle the contracts, the boundaries between parts, the invariants and the failure behaviour. List
the choices you leave to the builder under "Builder decides", such as internal names, file layout,
helper functions, error wording and test layout. The owner then sees what you left open on purpose.

Put a question under "Open questions" only when the owner, a spike or a measurement has to settle it
before it can be built for good. Give it what the code does until then.

When the design extends existing code, list the symbols it changes in the `Touches` field of the
doc's status line, and describe only the change. Leave out what the builder can read from the code.

## Write the design, not its history

Write in the present tense, about the system that the design builds.

- State each decision as the rule it set. Leave out who decided, when, and the options shown in the
  session.
- Give a rejected option one line in its decision record. Until the record exists, give it a clause
  in the Decisions line, such as "over a per-user cap, because…".
- Rewrite a design when it changes. Never stack an amendment on top, such as "Changed on 12 Nov:
  where the text below differs, this list holds".
- Keep review findings, fact checks and drafts in the PR or the session.

## Keep it short

- Write one design doc per piece of work. When it passes about 400 lines with its code, split it as
  the [design doc template](./references/design-doc.md#split-a-long-design) says.
- Keep each code block under about 40 lines.
- Draw one mermaid diagram of the main path near the top, with 10 nodes or fewer.
- Keep open questions under about 10. More means the design isn't ready to build.

## Write a decision record

Write one for a choice between options that the owner approved, in a session, a review or the PR
that adds the design. When you design alone, put each choice in the design's Decisions section. When
the owner approves the design in review, add the records to the same PR, and set the design's status
to agreed.

Keep it short: the decision in a few lines, the reasons as bullets with any measured figure, and the
rejected options as a table. When the decision changes, edit the record in place, as the
[decision record template](./references/decision-record.md#change-a-record) says. Never delete a
record, and never reuse its number.

## Check it

Run each test with a fresh subagent. Give it the design, the code base, and the test's prompt word
for word. Fix what it finds, run it once more, fix that, and stop. For a work item, run only the
builder test.

1. **Skim test.** "Read this design the way a reviewer with two minutes would: the opening, the
   diagram, the headings and the code. Then say what gets built, what its contracts are, and what
   you would push back on." When the answer misses the point of the design, rewrite the opening or
   the diagram.
2. **Builder test.** "You build the first part of this design. List every question you would have to
   ask before you start, and each place where you would have to guess at a contract." Fix each
   question about a contract or a constraint. A question about a choice under "Builder decides"
   needs no fix.

For a design doc or a decision record, run the docs checks and a cold read too, as the
[docs-writing](../docs-writing/SKILL.md) skill says.

**Reply:** where the design went, each decision record you wrote, and what the two tests found and
what you fixed.
