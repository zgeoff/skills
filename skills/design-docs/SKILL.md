---
name: design-docs
description:
  'Records a technical design as contracts and constraints: inline code sketches, constraint bullets
  and a diagram. A work item holds the design of one outcome. When two or more work items build on a
  shared contract that is not built yet, a design doc holds the design they share. A decision record
  holds a choice that outlives the design doc and its work items. Holds the templates. Load it
  before you write or review a design, a decision record or the design sections of a work item, at
  the end of a design session, and when work with a design doc is built.'
---

# Design docs

Record a design for two readers. The owner is the person you work for, who approves the design. The
owner skims it in two minutes and says yes or no. The builder is the agent or person who implements
it, and starts from it without asking. Settle what is costly to change later, and leave the builder
the rest.

Avoid these mistakes:

- writing down how the design was reached in place of the design: the options shown, the losing
  sketches, review logs, "decided by you on 11 Nov";
- writing to the owner, such as "a default you can change", where the builder needs the rule;
- describing a contract in prose when a code block shows it;
- a design doc per constraint or per decision, where one doc covers every work item on the same
  shared contracts.

Hand back where the design went, each decision record you wrote, and what the tests in
[Check it](#check-it) found and what you fixed.

## Key rules

- [Choose where the design goes](#choose-where-the-design-goes): a work item per outcome, a design
  doc when two or more work items share a contract not built yet, a decision record for a lasting
  choice.
- [Show contracts as code](#show-contracts-as-code): inline code sketches, the call first, then the
  types, with rules in comments.
- [State constraints as bullets](#state-constraints-as-bullets): one rule per line, each one a test
  could check.
- [Leave the details to the builder](#leave-the-details-to-the-builder): settle the contracts, and
  list what the builder decides.
- [Write only the design](#write-only-the-design): present tense, with no dates, names or losing
  options.
- [Keep it short](#keep-it-short): one diagram, one doc per part past about 400 lines, under about
  10 open questions.
- [Write a decision record](#write-a-decision-record): only when a newcomer would undo the choice,
  reversing it is costly, and the rejected option was real.
- [Check it](#check-it): the skim test and the builder test, by fresh subagents.

## References

- [Design doc template](./references/design-doc.md): writing a design doc, splitting a long one, or
  closing one out once its work items are done.
- [Work item template](./references/work-item.md): writing the design sections of a work item,
  Sketch and Constraints, or its Acceptance lines.
- [Decision record template](./references/decision-record.md): writing, changing or removing a
  decision record.
- [Test prompts](./references/test-prompts.md): running the skim test and the builder test.

## Choose where the design goes

Write a work item in the tracker for each outcome that can ship on its own. Add the others when
their condition holds:

| Write a         | When                                                                                       | In                              |
| --------------- | ------------------------------------------------------------------------------------------ | ------------------------------- |
| work item       | always; it holds the whole design when no design doc exists                                | the work tracker                |
| design doc      | two or more work items build on a shared contract that is not built yet                    | `docs/design/<work>.md`         |
| decision record | the owner's choice passes the tests in [Write a decision record](#write-a-decision-record) | `docs/decisions/NNNN-<slug>.md` |

Count as a shared contract any type, API, schema, event, file format or config key that code in more
than one module reads or writes. A config key that one module reads is not a shared contract. Count
as a part any module, service or other unit of the system that owns its own contracts.

Write one design doc for all the work items that build on its shared contracts. Each of those work
items links the doc's sections and repeats none of their text.

## Show contracts as code

Write each contract as a code sketch: an inline code block that shows its shape. Sketch only what
crosses a module boundary, and leave out a parameter, a generic or an option that no caller uses
yet. Never put sketches in separate files. The builder follows a sketch's shapes and the rules in
its comments, and may rename what the sketch's module does not export.

- Show the call first, with a realistic result in a comment. Then show the types it needs. A
  contract with no call, such as a config key or a table, starts at its shape.
- Put a rule that belongs to one field in a comment on that field.
- Mark existing code you extend with `// …existing fields`, and show only what changes.
- Name the module that owns each type in a comment. Leave file paths out: the builder has grep.
- Show each outside system the design reaches, such as a store or a queue, as an interface, with its
  adapters named in a comment.
- Write each sketch in the format the code base uses: its language, its config format, its SQL
  dialect.

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
helper functions, error wording and test layout.

Put a question under "Open questions" only when the owner, a spike or a measurement must settle it.
Name which one, and what the code does until then. Write "the owner", never "you": an agent reads
"you" as itself.

When the design extends existing code, describe only the change. The sketches name the code it
touches, so the design needs no separate list.

## Write only the design

Write in the present tense, about the system that the design builds.

- State each decision as the rule it set. Leave out who decided, when, and the options you showed
  the owner.
- Put a rejected option in its decision record. When the choice has no record, put the option in the
  PR description.
- Rewrite a design when it changes. Never stack an amendment on top, such as "Changed on 12 Nov:
  where the text below differs, this list holds".

## Keep it short

- When a design doc passes about 400 lines with its code, split it into one doc per
  [part](#choose-where-the-design-goes), as the
  [design doc template](./references/design-doc.md#split-a-long-design-doc) says.
- Give a design doc one mermaid diagram of the main path, under Shape, with 10 nodes or fewer. A
  work item, or a design of one function or type, needs none.
- Keep open questions under about 10. More means the design isn't ready to build.

## Write a decision record

Write a record only for a choice that passes all three tests. With a record, the next person who
proposes a rejected option can read why it lost.

- **A capable newcomer would undo it.** With the code open, the choice looks odd or arbitrary. When
  the choice lives in one line of code, write the reason in a comment there, and no record. A
  security boundary always passes this test.
- **It is costly to reverse.** Reversing it takes a data migration, a change to a stored or wire
  format, a move of a security boundary, a break of an external contract, or weeks of rework.
- **The rejected option was real.** A reasonable engineer would pick it on another day. When each
  rejected option is a strawman, write no record.

Put a choice that fails a test where its reader looks:

| The choice                       | Goes in                                                                                                         |
| -------------------------------- | --------------------------------------------------------------------------------------------------------------- |
| a contract, a shape or a rule    | the design doc or the work item, then the architecture doc in `docs/architecture/` once its work items are done |
| the reason for one piece of code | a code comment                                                                                                  |
| build order                      | the work items                                                                                                  |

Write, change or remove a record as the [decision record template](./references/decision-record.md)
says.

## Check it

Run the skim test and the builder test, each with a fresh subagent and its prompt from
[Test prompts](./references/test-prompts.md). Fix what the test finds, run the test once more, fix
that, and stop. For a work item, run only the builder test.

- **Skim test:** when the subagent misses the point, rewrite the opening or the diagram. Fix each
  thing it would push back on, or answer it in the PR.
- **Builder test:** fix each question about a contract or a constraint. A question about a choice
  under "Builder decides" needs no fix.

For a design doc or a decision record, run the docs checks and a cold read too, as the
[docs-writing](../docs-writing/SKILL.md) skill says.

**Reply:** where the design went, each decision record you wrote, and what the tests found and what
you fixed.
