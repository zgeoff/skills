# Work item template

Paste the block below into the description of an issue in the work tracker, such as a Linear or
GitHub issue, and write your own title. Use it when the work changes no shared contract: no type,
API, schema, event or file format that code outside the change reads or writes. When it changes one,
write a design doc with the [design doc template](./design-doc.md) first.

Fill the block this way:

- Replace the example values, which describe an invented warehouse service, and delete each
  `<!-- -->` comment.
- Keep Outcome and Acceptance. Delete any other section that would be empty.
- When a design doc covers part of the work, put a link to the doc's section under each heading it
  covers, and write only what the doc leaves out. Copy nothing from the doc.
- When the design changes, rewrite the sections it changes, and untick each Acceptance line whose
  evidence no longer holds. Put the reason for the change in a comment on the issue.

````markdown
## Outcome

<!-- 1 or 2 sentences: what is true when the work is done. -->

A hold that nobody releases returns its units to the shelf 15 minutes after it was placed.

## Contract

<!-- The type or signature this change adds or changes inside its own module, 20 lines at most. -->

```ts
interface Hold {
  // …existing fields
  expiresAt: string; // placed + 15 minutes
}
```

## Constraints

<!-- The rules the code must keep, one per line, each one a test could check. -->

- When a hold expires, its units return to the shelf within 1 minute.
- `release` of an expired hold succeeds and changes nothing.

## Acceptance

<!-- Each line: what someone observes, and its evidence: a test, CI or a live check. Tick a line when its evidence lands. -->

- [ ] An expired hold's units are back on the shelf. Evidence: a test with a fake clock.
- [ ] Releasing an expired hold returns success. Evidence: a test.

## Out of scope

- Extending a hold.
````
