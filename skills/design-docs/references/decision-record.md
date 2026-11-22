# Decision record template

When the owner asks you to record a decision, take the request as proof that the owner made it.
Check the choice against the [three tests](../SKILL.md#write-a-decision-record):

- When it fails the first or the second test, tell the owner which test it fails. Write the record
  only if the owner still wants it.
- When it fails the third test, because the owner weighed no other option, write no record. A record
  with no rejected option has nothing to explain. Tell the owner why.

- [Write a record](#write-a-record)
- [Change a record](#change-a-record)
- [Remove a record](#remove-a-record)

## Write a record

Write the record once the owner approves the choice. Until then, keep the choice in the design doc:

- in Open questions, while the owner weighs the options;
- in Decisions, when you propose the choice in a draft design.

With no design doc, state the choice in the work item's description.

Add the record to the PR that adds the design doc. With no design doc, open a PR for the record
alone.

Write one decision per record, and link no design from it: the agent that
[closes out](./design-doc.md#close-out-a-design-doc) the design deletes the design doc.

1. Run `git log --all --name-only --format= -- docs/decisions/` to list every file name the folder
   has held, deleted records included. Take the number after the highest one. Start at `0001` when
   it lists none.
2. Copy the block below to `docs/decisions/NNNN-<slug>.md`, where `<slug>` is the title in kebab
   case, such as `0012-urgent-emails-go-first.md`.
3. Replace the example values. They describe an invented app.
4. Set `Date` to the day the owner decided.
5. List each option the owner weighed and turned down. When you don't know which options the owner
   weighed, ask the owner. When the owner weighed none, write no record.
6. When Consequences would only repeat the Decision section, delete Consequences.
7. In the design doc, give the choice a Decisions line, and end it with a link to the record. Delete
   the choice's entry in Open questions, if it has one.

```markdown
# 0012: Urgent emails go first

- Date: 2026-03-01
- Status: decided

## Decision

An email marked urgent goes out before every bulk email that waits. The app keeps one queue and one
email provider.

## Why

- Password reset emails waited up to an hour behind the weekly newsletter (measured over 30 days).
- One queue keeps one rate limit with the email provider.

## Rejected alternatives

| Option                    | Why not                                                         |
| ------------------------- | --------------------------------------------------------------- |
| a second queue for urgent | two senders can't keep one rate limit with the provider         |
| a second email provider   | a second bill, and a new sender reputation to build             |
| a slower newsletter       | the newsletter takes 9 hours, and a reset still waits behind it |

## Consequences

- A large batch of urgent emails delays the newsletter.
```

`Status` stays `decided` for the life of the record. Cite a record with a relative link to its file.
That way, `chex links` fails on a citation of a record that is gone.

## Change a record

When the owner changes the decision, edit the record in place:

1. Rewrite the title, Decision, Why and Consequences to state the new decision. Keep the file name,
   even when its slug no longer matches the title. Links to the record keep working.
2. On the first change, add an `Updated` line under `Date`. Set it to the day of the change.
3. Move the old decision into Rejected alternatives, as an option with the reason it lost.
4. On the first change, add a `## Changes` section at the end. Add a dated line to it. A reader who
   remembers the old decision sees when it changed. The
   [docs/ tree](../../docs-writing/references/docs-tree.md) in docs-writing allows this list as its
   one exception to keeping history out of `docs/`.

```markdown
- Date: 2026-03-01
- Updated: 2026-04-10
- Status: decided

…

## Changes

- 2026-04-10: urgent emails moved to a queue of their own.
```

## Remove a record

Remove a record when its decision is dropped with nothing in its place. When the owner replaces the
decision with another one, change the record instead. When you find a record whose decision no
longer passes the three tests, ask the owner before you remove it.

Do every step in the PR that deletes the record:

1. Move each part of the decision that still holds into the doc that covers it: the architecture doc
   in `docs/architecture/`, or the design in `docs/design/` when the work is not built. Move neither
   the Why nor the Rejected alternatives: they go with the deleted file.
2. Search the repo for the record's file name, and for its bare number, such as in a table cell or a
   code comment. Point each citation at the doc from step 1. When the sentence no longer needs the
   citation, delete the citation.
3. Delete the record with `git rm`.

Leave the later records' numbers as they are, and never reuse the deleted number. Links from outside
the repo, such as in old PRs, then still point at the right record. To see the record and why it
went, run `git log` on the deleted file.
