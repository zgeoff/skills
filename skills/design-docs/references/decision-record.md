# Decision record template

Copy the block below to `docs/decisions/NNNN-<slug>.md`, with the next free number. Never reuse a
number, and never delete a record.

Write the decision as it stands now. When it changes, edit the record in place: change the Decision,
add or change the `Updated` line, move the old choice into Rejected alternatives, and add a line to
`## Changes`. Leave `## Changes` out until the first change.

The example values describe an invented warehouse service. Replace them.

```markdown
# 0012: Holds expire after 15 minutes

- Date: 2026-03-01
- Updated: 2026-03-09
- Status: decided
- Design: [order holds](../design/order-holds.md)

## Decision

A hold on stock expires 15 minutes after it is placed, and its units return to the shelf. A hold
never extends.

## Why

- 98% of checkouts finish within 6 minutes (measured over 30 days).
- A hold that never expires keeps stock off the shelf after a buyer leaves.

## Rejected alternatives

| Option                       | Why not                                         |
| ---------------------------- | ----------------------------------------------- |
| no expiry, release on cancel | an abandoned checkout never cancels             |
| a hold that extends on use   | a busy checkout page could hold stock for hours |
| a 10-minute expiry           | 4% of checkouts lost their units at payment     |

## Consequences

- A buyer who takes longer than 15 minutes can lose the units at payment.

## Changes

- 2026-03-09: the expiry moved from 10 to 15 minutes.
```

`decided` is the only status. Leave Consequences out when nothing follows that the Decision does not
already say.
