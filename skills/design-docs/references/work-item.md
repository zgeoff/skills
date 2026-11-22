# Work item template

Write each work item's description from this template. A work item is an issue in the work tracker,
such as a Linear or GitHub issue. Open one for each change that ships on its own. When
[Choose where the design goes](../SKILL.md#choose-where-the-design-goes) in SKILL.md calls for a
design doc, write it too, with the [design doc template](./design-doc.md), and link it as step 5
says.

To write the description:

1. Paste what is inside the block under [Template](#template), and write your own title.
2. Replace the example values. They describe an invented app.
3. Delete each `<!-- -->` comment.
4. Keep Outcome and Acceptance, and write the Acceptance lines as
   [Prove acceptance](#prove-acceptance) says. Delete each other section that has nothing to say.
5. When a design doc covers some of the work, link the doc's section under each heading of the work
   item that the doc covers. Write only what the doc leaves out, and repeat none of the doc's text.

When the plan for the work changes later, rewrite each section that changed. Untick each Acceptance
line whose evidence no longer holds, and give the reason in a comment on the issue.

## Prove acceptance

Write each Acceptance line and its evidence as [Acceptance](../../work-items/SKILL.md#acceptance) in
the work-items skill says. When the repo has a wringer verify CLI, prove each behaviour a user sees
with its feature's verdict, and name the feature in the line. When you can name no evidence for a
line, rewrite the line as a behaviour that one of the checks in that Acceptance section can prove.

Run a [wringer](https://github.com/zgeoff/wringer) verify CLI as `bun verify <command>`. The CLI
uses these terms as wringer's
[terms page](https://github.com/zgeoff/wringer/blob/main/docs/reference/terms.md) defines them:

- A **feature** is a named part of the repo that has its own verdict. Its `paths` are the globs of
  the files whose change can alter its behaviour.
- A **journey** is the commands that use one feature, and the end state that shows it works. The
  repo's `verify` skill gives one journey for each feature.
- A **verdict** is the record that `bun verify done` writes. It states that a feature works at its
  current fingerprint, on one target. A verdict goes stale once its feature's fingerprint changes.

Read the terms page for the other terms, such as fingerprint and target.

In CI, `bun verify gate` fails a PR when a changed feature has no verdict at its current
fingerprint. When the Acceptance line names the feature, a reviewer finds the line's verdict among
the ones `bun verify gate` checks. To earn that verdict, the builder drives the feature's journey,
then runs `bun verify done`.

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

<!-- Sketch the function or type at the module's boundary that this work adds or changes, as SKILL.md's "Show contracts as code" says. Show only what changes, in 20 lines at most. -->

```ts
const email = await emails.send({ to, template: 'password-reset', priority: 'urgent' });
// → { emailID: 'e_8f2', queuedAt: '2026-03-02T10:15:00Z' }

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
