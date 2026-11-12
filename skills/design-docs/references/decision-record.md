# Decision record template

Read [SKILL.md](../SKILL.md) first. It says who the owner is, holds the three tests a choice must
pass before it gets a record, and says when to write one. While the owner still weighs the options,
keep the question in the Open questions section of the design doc, or in the work item when there is
no design doc.

When the owner asks you to record a decision, take the request as proof that the owner made it. When
the choice fails one of the three tests, say which test before you write the record.

## Write a record

1. Find the highest number in `docs/decisions/`, and take the next one. Start at `0001` when the
   folder is empty or missing.
2. Copy the block below to `docs/decisions/NNNN-<slug>.md`, where `<slug>` is the title in kebab
   case, such as `0012-holds-expire-after-15-minutes.md`.
3. Replace the example values. They describe an invented warehouse service.
4. Set `Date` to the day the owner decided.
5. List each option the owner weighed and turned down. When you don't know which options the owner
   weighed, ask the owner. When the owner weighed none, write no record.
6. Delete Consequences when the decision leads to nothing beyond what the Decision section says.
7. In the design doc, move the question out of Open questions, and link the record from its
   Decisions line.

```markdown
# 0012: Holds expire after 15 minutes

- Date: 2026-03-01
- Status: decided

## Decision

A hold on stock expires 15 minutes after it is placed, and its units return to the shelf. A hold
never extends.

## Why

- 97% of checkouts finish within 15 minutes (measured over 30 days).
- A hold that never expires keeps stock off the shelf after a buyer leaves.

## Rejected alternatives

| Option                       | Why not                                                |
| ---------------------------- | ------------------------------------------------------ |
| no expiry, release on cancel | an abandoned checkout never cancels                    |
| a hold that extends on use   | a busy checkout page could hold stock for hours        |
| a 5-minute expiry            | 22% of checkouts would lose their units before payment |

## Consequences

- A buyer who takes longer than 15 minutes can lose the units at payment.
```

`Status` stays `decided` for the life of the record. Other docs, code comments and PRs cite a record
by its number, so keep every record and never give its number to another one.

## Change a record

When the owner changes the decision, edit the record in place:

1. Rewrite the title, Decision, Why and Consequences to state the new decision. Keep the file name,
   even though its slug no longer matches the title, so links keep working.
2. Set the `Updated` line under `Date` to the day of the change. Add the line on the first change.
3. Move the old decision into Rejected alternatives, as an option with the reason it lost.
4. Add a dated line to the `## Changes` section at the end, and add the section on the first change.

```markdown
- Date: 2026-03-01
- Updated: 2026-04-10
- Status: decided

…

## Changes

- 2026-04-10: the expiry moved from 15 to 20 minutes.
```

When the owner drops the decision and puts nothing in its place, rewrite the Decision section to say
it no longer applies. Then do steps 2 and 4.
