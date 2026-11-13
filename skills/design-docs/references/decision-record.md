# Decision record template

Read [SKILL.md](../SKILL.md) first: it says who the owner is, and when a choice needs a record. This
file holds the record's shape, and how to write, change and remove one. While the owner still weighs
the options, keep the question in the Open questions section of the design doc, or in the work item
when there is no design doc.

When the owner asks you to record a decision, take the request as proof that the owner made it. When
that choice fails one of the [three tests](../SKILL.md#write-a-decision-record), tell the owner
which test it fails, and write the record only if the owner still wants it.

## Write a record

1. Find the highest number in `docs/decisions/`, and take the next one. Start at `0001` when the
   folder is empty or missing.
2. Copy the block below to `docs/decisions/NNNN-<slug>.md`, where `<slug>` is the title in kebab
   case, such as `0012-urgent-emails-go-first.md`.
3. Replace the example values. They describe an invented app.
4. Set `Date` to the day the owner decided.
5. List each option the owner weighed and turned down. When you don't know which options the owner
   weighed, ask the owner. When the owner weighed none, write no record.
6. When Consequences would only repeat the Decision section, delete it.
7. In the design doc, move the question out of Open questions, and link the record from its
   Decisions line.

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
   even though its slug no longer matches the title, so links keep working.
2. Set the `Updated` line under `Date` to the day of the change. Add the line on the first change.
3. Move the old decision into Rejected alternatives, as an option with the reason it lost.
4. Add a dated line to the `## Changes` section at the end, and add the section on the first change.

```markdown
- Date: 2026-03-01
- Updated: 2026-04-10
- Status: decided

…

## Changes

- 2026-04-10: receipt emails became urgent too.
```

## Remove a record

Remove a record when its decision is dropped with nothing in its place. When the owner replaces the
decision with another one, change the record instead. When you find a record whose decision no
longer passes the three tests, ask the owner before you remove it.

Do every step in the PR that deletes the record:

1. Move each part of the decision that still holds into the doc that covers it: the architecture doc
   in `docs/architecture/`, or the design in `docs/design/` when the work is not built. Leave the
   Why and the Rejected alternatives in the file you delete.
2. Search the repo for the record's file name, and for its bare number, such as in a table cell or a
   code comment. Point each citation at the doc from step 1. When the sentence no longer needs the
   citation, delete it.
3. Delete the record with `git rm`.
4. Renumber each later record, so the numbers stay consecutive. For each one, rename the file with
   `git mv`, change the number in its heading, and rewrite each citation of it.

A gap in the numbers reads as a missing record. Links from outside the repo, such as old PRs, then
point at the wrong record or at none. Leave a link to a file at one commit's SHA as it is: that
commit still holds the old file.
