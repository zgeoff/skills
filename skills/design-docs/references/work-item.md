# Work item template

A work item is an issue in the work tracker, such as a Linear or GitHub issue. Every piece of work
gets one, and this template is its description. When the work changes a shared contract, as
[SKILL.md](../SKILL.md#choose-where-the-design-goes) defines it, write a design doc too, with the
[design doc template](./design-doc.md), and link it as step 5 says.

To write the description:

1. Paste the block below, and write your own title.
2. Replace the example values. They describe an invented warehouse service.
3. Delete each `<!-- -->` comment.
4. Keep Outcome and Acceptance. Delete each other section that has nothing to say.
5. When a design doc covers some of the work, link the doc's section under each heading the doc
   covers. Write only what the doc leaves out, and repeat none of the doc's text.

When the plan for the work changes later, rewrite each section that changed. Untick each Acceptance
line whose evidence no longer holds, and give the reason in a comment on the issue.

````markdown
## Outcome

<!-- 1 or 2 sentences: what is true when the work is done. -->

A hold that nobody releases returns its units to the shelf 15 minutes after it was placed.

## Sketch

<!-- The function or type inside the module that this work adds or changes. 20 lines at most: show only what changes. -->

```ts
// holds module, called by the scheduler once a minute
function releaseExpiredHolds(now: Date): Promise<number>; // returns the count released
```

## Constraints

<!-- The rules the code must keep, one per line, each one a test could check. -->

- When a hold expires, its units return to the shelf within 1 minute.
- `release` of an expired hold succeeds and changes nothing.

## Acceptance

<!-- Each line: what someone observes, and its evidence: a test, CI or a live check. -->

- [ ] An expired hold's units are back on the shelf. Evidence: a test with a fake clock.
- [ ] Releasing an expired hold returns success. Evidence: a test.

## Out of scope

<!-- What a reader might expect this work to do, and it doesn't. -->

- Extending a hold.
````
