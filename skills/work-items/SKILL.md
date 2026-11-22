---
name: work-items
description:
  Writes a work item that an agent can design or build from alone, in any tracker - one outcome, the
  facts the next agent can't find, what is out of scope, acceptance lines with their evidence, and
  the owner's open decisions kept as questions. Load it before you file, rewrite, split or triage a
  work item, an issue or a ticket, and before you judge whether one is ready to start.
---

# Work items

Write each work item as the whole brief of the agent that picks it up. That agent has only the item.
Hand back each item you filed or changed, whether it is ready, and each decision in it that waits on
the owner. You're done when each item is filed and checked against [Ready](#ready).

## Key rules

- [One item, one outcome](#one-item-one-outcome): split by outcome, never by size.
- [Write it to the template](#write-it-to-the-template): Outcome, Context, Depends on, Acceptance,
  Out of scope and Permissions.
- [Acceptance](#acceptance): one line for each thing someone observes, with the check that proves
  it.
- [Keep the owner's words](#keep-the-owners-words): copy the words that decide something, and ask
  the owner before you change what the item asks for.
- [Ready](#ready): the test an item passes before work starts.

## One item, one outcome

File one item for each outcome that can land by itself. Keep one outcome in one item, however large.
Whoever designs the work splits it into pull requests.

Write the title as the outcome, in plain lowercase: "password reset emails arrive within a minute".
A list of titles then reads as a list of results.

## Write it to the template

Paste the block, and replace its example values, which describe an invented app. Delete each
`<!-- -->` comment. Keep Outcome and Acceptance, and delete any other section that you leave empty.

```markdown
## Outcome

<!-- 1 to 3 sentences: what is true when the work is done. For a bug, what happens now too. Give the end state. The next agent picks the steps. -->

Someone who asks for a password reset gets the email within 1 minute. Today the email can take an
hour.

## Context

<!-- Each fact the next agent can't find alone: links, the files involved, earlier pull requests, the owner's decisions. For a bug, the steps that reproduce it, with their output. -->

- Reset emails wait in the same queue as the weekly newsletter, so a large newsletter delays them.
- The owner wants reset emails sent first, and doesn't want a second email provider.

## Depends on

<!-- Each work item that must be done first, as a link. -->

- [the email queue sends urgent emails first](<link to the item>)

## Acceptance

<!-- One line for each thing someone observes, with the check that proves it. -->

- [ ] A reset email arrives within 1 minute while a newsletter goes out. Evidence: a test that
      queues 10,000 newsletter emails first.
- [ ] The newsletter still reaches everyone on the list. Evidence: the newsletter tests.

## Out of scope

<!-- Only what the owner or the request excludes. Invent no limit. -->

- The wording of the reset email.

## Permissions

<!-- Each thing the next agent may do beyond its own branch and pull request, in the owner's words: a deploy, a paid API with its spend limit, a migration, a post under the owner's name. Grant nothing yourself. -->

- Deploy to staging, to try it with a real inbox.
```

For work that ends in an answer, such as an investigation, add `## Questions to answer`. List each
question with the decision that its answer informs.

Leave the Sketch and Constraints sections to whoever designs the work, as the
[design-docs](../design-docs/references/work-item.md) skill says.

## Acceptance

Write each line as one thing that someone observes, and name the check that will prove it. Name only
the check. The agent that does the work runs it and records the result.

Name one of these checks when it covers the line:

- a CI check, such as the tests, the lint or `chex`;
- a feature's verdict from the repo's `bun verify` CLI. Run `bun verify features` to list the
  features. When the work adds the feature or changes its journey, say so in the line: "Evidence:
  the `password-reset` verdict (new feature)";
- the review of the pull request, for a line about how the code reads;
- a cold read and deslop, for a line about prose.

When none of them covers the line, name what proves it instead:

- for a change to what a person sees on screen, such as a page or a button, a screenshot or a
  recording;
- for anything else, the command to run and the result it shows, such as the version the lockfile
  resolves.

- Make each line for new behaviour fail today and pass when the work is done. A line for behaviour
  the work must keep, such as the newsletter line in the template, passes today too.
- Leave out a line that you can prove only after a release. The work ends before the release.
- When a line needs something that this item doesn't build, such as a fixture or an API, list the
  item that builds it under Depends on.

## Keep the owner's words

Copy the owner's words into the item where they decide something: a name, a value, an example.
Sharpen the wording of the outcome and the acceptance lines yourself.

Keep each open question in Context, marked "For the owner", until the owner answers. Ask the owner,
with the options and your recommendation, before you make:

- a change to the outcome;
- behaviour that the outcome doesn't ask for;
- a weaker form of a limit that the owner set, such as a higher spend limit;
- a choice that costs money, touches security, or can't be undone.

Ask nothing that the item or an earlier answer already settles.

## Ready

When an item isn't ready, file it anyway, and say in your reply what it lacks. An item is ready when
all of these hold:

- An agent that reads only the item can say what done looks like.
- Acceptance has at least one line, with its evidence.
- Each item it depends on is done.
- Context holds no "For the owner" question.
- No merged pull request already does the work.

**Reply:** each item you filed or changed, whether it is ready, and each decision that waits on the
owner.
