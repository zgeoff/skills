# Work item template

Write each work item's description from this template. A work item is an issue in the work tracker,
such as a Linear or GitHub issue, and every piece of work gets one. When
[Choose where the design goes](../SKILL.md#choose-where-the-design-goes) in SKILL.md calls for a
design doc, write it too, with the [design doc template](./design-doc.md), and link it as step 5
says.

To write the description:

1. Paste what is inside the block under [Template](#template), and write your own title.
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
  `bun verify`, prove each behaviour a user sees with its feature's verdict. Name the feature in the
  line.
- Prove each other line with a test, and name the test's subject. With no verify CLI, prove every
  line with a test.
- Leave out a line that only a release or production traffic can prove, such as a rate on a
  production dashboard. A PR never proves such a line before it merges.

The verify CLI uses these terms as wringer's
[terms page](https://github.com/zgeoff/wringer/blob/main/docs/reference/terms.md) defines them. Read
that page for the others, such as fingerprint and target.

- **Feature:** a named part of the repo that has its own verdict. Its `paths` are the globs of the
  files whose change can alter its behaviour.
- **Journey:** the commands that use one feature, and the end state that shows it works. The repo's
  `verify` skill gives one journey for each feature.
- **Verdict:** the record that `bun verify done` writes: a feature works at its current fingerprint,
  on one target. A verdict goes stale once its feature's fingerprint changes.

In CI, `bun verify gate` fails a PR when a changed feature has no verdict at its current
fingerprint. A reviewer matches each Acceptance line to `bun verify gate` by the feature it names.
Whoever builds the work earns the verdict: they drive the feature's journey, then run
`bun verify done`.

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
type SendEmail = { to: string; template: TemplateName; priority: 'urgent' | 'bulk' };
function send(input: SendEmail): Promise<QueuedEmail | UnknownTemplate>; // the queue sends each `urgent` email first
```

## Constraints

<!-- The rules the code must keep, one per line, each one a test could check. -->

- An urgent email reaches the email provider within 1 minute, however many bulk emails wait.
- The queue never drops a bulk email.

## Acceptance

<!-- Each line: what someone observes, and its evidence. -->

- [ ] Someone gets the reset email within 1 minute while a newsletter goes out. Evidence: the
      `password-reset` feature's verdict from `bun verify done`.
- [ ] An urgent email leaves the queue before 10,000 bulk emails that wait. Evidence: a test of the
      queue's order.
- [ ] The newsletter still reaches everyone on the list. Evidence: the `newsletter` feature's
      verdict from `bun verify done`.

## Out of scope

<!-- What a reader might expect this work to do, and it doesn't. -->

- The wording of the reset email.
````
