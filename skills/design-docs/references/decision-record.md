# Decision record template

Write a record only once the owner has decided. A choice still under discussion goes in the Open
questions section of its design.

Copy the block below to `docs/decisions/NNNN-<slug>.md`. `NNNN` is the next free number, and
`<slug>` is the title in kebab case, such as `0012-holds-expire-after-15-minutes.md`. Never reuse a
number, and never delete a record.

Fill the block this way:

- Replace the example values, which describe an invented warehouse service.
- Set `Date` to the day the owner decided. `Status` is always `decided`.
- Delete the `Design` line when no design doc exists.
- List at least one rejected option. When nobody weighed another option, the choice needs no record.
- Delete Consequences when nothing follows that the Decision does not already say.

```markdown
# 0012: Holds expire after 15 minutes

- Date: 2026-03-01
- Status: decided
- Design: [order holds](../design/order-holds.md)

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

## Change a record

When the owner changes the decision, edit the record in place:

1. Rewrite the title, Decision, Why and Consequences to state the new decision. Keep the file name
   and the number, so links still work.
2. Add an `Updated` line with the date, under `Date`.
3. Move the old choice into Rejected alternatives, with why it lost.
4. Add a `## Changes` section at the end, or a line to it, with the date and the change in one line.

```markdown
- Date: 2026-03-01
- Updated: 2026-04-10
- Status: decided

…

## Changes

- 2026-04-10: the expiry moved from 15 to 20 minutes.
```

When the owner drops a decision with nothing in its place, rewrite the Decision to say the rule no
longer applies, and add the line to `## Changes`.
