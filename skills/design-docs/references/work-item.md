# Work item template

Use this for the body of a work item that holds its own design: work in one PR, or a few, that
changes no contract other code depends on. When a design doc covers the work, link the doc's section
in place of the Contract and Constraints sections, and copy nothing from it.

Rewrite the body when the design changes. Put the reason for the change in a comment on the item.

The example values describe an invented warehouse service. Replace them.

````markdown
## Outcome

<!-- 1 or 2 sentences: what is true when the work is done. -->

A hold that nobody releases returns its units to the shelf 15 minutes after it was placed.

## Contract

<!-- Optional. Only the shape that changes, 20 lines at most. Delete the section when nothing visible changes. -->

```ts
interface Hold {
  // …existing fields
  expiresAt: string; // placed + 15 minutes
}
```

## Constraints

- When a hold expires, its units return to the shelf within 1 minute.
- `release` of an expired hold succeeds and changes nothing.

## Acceptance

<!-- Each line: what someone observes, and the evidence: a test, CI or a live check. -->

- [ ] An expired hold's units are back on the shelf. Evidence: a test with a fake clock.
- [ ] Releasing an expired hold returns success. Evidence: a test.

## Out of scope

- Extending a hold.
````
