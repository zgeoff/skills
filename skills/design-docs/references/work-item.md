# Work item template

A work item is an issue in the work tracker, such as a Linear or GitHub issue. Every piece of work
gets one, and this template is its description. When
[Choose where the design goes](../SKILL.md#choose-where-the-design-goes) in SKILL.md calls for a
design doc, write it too, with the [design doc template](./design-doc.md), and link it as step 5
says.

To write the description:

1. Paste the block below, and write your own title.
2. Replace the example values. They describe an invented app.
3. Delete each `<!-- -->` comment.
4. Keep Outcome and Acceptance, and write the Acceptance lines as
   [Prove acceptance](#prove-acceptance) says. Delete each other section that has nothing to say.
5. When a design doc covers some of the work, link the doc's section under each heading the doc
   covers. Write only what the doc leaves out, and repeat none of the doc's text.

When the plan for the work changes later, rewrite each section that changed. Untick each Acceptance
line whose evidence no longer holds, and give the reason in a comment on the issue.

## Prove acceptance

Write each Acceptance line as a behaviour someone can observe, and name its evidence.

- When the repo has a verify CLI built on [wringer](https://github.com/zgeoff/wringer), run as
  `bun verify`, prove each behaviour a user sees with its feature's journey and the verdict
  `bun verify done` records. Name the feature in the line.
- Prove the rest with a test, and name the test's subject.
- Leave out a line that only a release or a live run can prove. No PR can prove it before it merges.

## Template

````markdown
## Outcome

<!-- 1 or 2 sentences: what is true when the work is done. -->

Someone who asks for a password reset gets the email within 1 minute, even while a newsletter goes
out.

## Depends on

<!-- The work items that must be done first, as links. Delete the section when there are none. -->

- [The reset page sends its email through the emails module](<link to the issue>)

## Sketch

<!-- The function or type inside the module that this work adds or changes. 20 lines at most: show only what changes. -->

```ts
// emails module, called by the password reset page
function send(input: SendEmail): Promise<QueuedEmail | UnknownTemplate>; // `priority: 'urgent'` goes first
```

## Constraints

<!-- The rules the code must keep, one per line, each one a test could check. -->

- An urgent email reaches the email provider within 1 minute, however many bulk emails wait.
- The queue never drops a bulk email.

## Acceptance

<!-- Each line: what someone observes, and its evidence: a `bun verify` journey and its verdict when the repo has a verify CLI, or a test. Leave out a line that only a release or a live run can prove. -->

- [ ] Someone gets the reset email within 1 minute while a newsletter goes out. Evidence: the
      `password-reset` journey in `bun verify`, with its verdict.
- [ ] An urgent email leaves the queue before 10,000 bulk emails that wait. Evidence: a test of the
      queue's order.
- [ ] The newsletter still reaches everyone on the list. Evidence: the newsletter tests.

## Out of scope

<!-- What a reader might expect this work to do, and it doesn't. -->

- The wording of the reset email.
````
