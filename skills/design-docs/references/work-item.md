# Work item template

Use this template for a work item's description. A work item is an issue in the work tracker, such
as a Linear or GitHub issue, and covers one outcome that can ship on its own. When work items share
a contract that is not built yet, as
[Choose where the design goes](../SKILL.md#choose-where-the-design-goes) says, write a design doc
too, with the [design doc template](./design-doc.md), and link it as step 5 says.

To write the description:

1. Paste what is inside the block under [Template](#template). Write your own title in the tracker's
   title field.
2. Replace the example values. They describe an invented app.
3. Delete each `<!-- -->` comment.
4. Keep Outcome and Acceptance, and write the Acceptance lines as
   [Prove acceptance](#prove-acceptance) says. Delete each other section you have nothing to put in.
5. When a design doc covers this work item, link the doc's matching section under each heading here
   that the doc covers, such as the doc's Contracts under Sketch. Under that heading, write only
   what the doc leaves out, and repeat none of the doc's text.

When the outcome or the design of the work item changes, rewrite each section the change affects.
Untick each Acceptance line whose evidence no longer holds, and give the reason in a comment on the
work item.

## Prove acceptance

Write each Acceptance line as a behaviour someone can observe, and name its evidence.

- When the repo has a verify CLI built on [wringer](https://github.com/zgeoff/wringer), run as
  `bun verify`, prove each behaviour a user sees with its feature's journey and the verdict
  `bun verify done` records. Name the feature in the line.
- Prove the rest with a test, and name the test's subject.
- Leave out a line that only a release or a live run can prove: a PR merges before either one runs.

## Template

````markdown
## Outcome

<!-- 1 or 2 sentences: what is true when the work item is done. -->

Someone who asks for a password reset gets the email within 1 minute, even while a newsletter goes
out.

## Depends on

<!-- The work items that must be done first, as links. Delete the section when there are none. -->

- [The reset page sends its email through the emails module](<link to the issue>)

## Sketch

<!-- Each function or type that this work item adds or changes, with its module named in a comment. 20 lines at most: show only what changes. -->

```ts
// emails module, called by the password reset page
function send(input: SendEmail): Promise<QueuedEmail | UnknownTemplate>; // `priority: 'urgent'` goes first
```

## Constraints

<!-- The rules the code must keep, one per line, each one a test could check. -->

- An urgent email reaches the email provider within 1 minute, however many bulk emails wait.
- The queue never drops a bulk email.

## Acceptance

<!-- Each line: what someone observes, and its evidence. -->

- [ ] Someone gets the reset email within 1 minute while a newsletter goes out. Evidence: the
      `password-reset` journey in `bun verify`, with its verdict.
- [ ] An urgent email leaves the queue before 10,000 bulk emails that wait. Evidence: a test of the
      queue's order.
- [ ] The newsletter still reaches everyone on the list. Evidence: the newsletter tests.

## Out of scope

<!-- What a reader might expect this work item to do, and it doesn't. -->

- The wording of the reset email.
````
