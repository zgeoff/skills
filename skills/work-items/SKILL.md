---
name: work-items
description:
  Writes a work item that an agent can design or build from alone, in any tracker - one outcome, the
  facts the next agent can't find, what is out of scope, acceptance lines with their evidence, and
  the owner's open decisions kept as questions. Load it before you file, rewrite, split or triage a
  work item, an issue or a ticket, and before you judge whether one is ready to start.
---

# Work items

Write each work item as the whole brief of the agent that picks it up. That agent has only the
item: it never saw your conversation, the code you read, or what the owner told you. Hand back
each item you filed or changed, and each question in it that waits on the owner.

Avoid these mistakes:

- a task list where the outcome goes;
- a fact that stays in your head;
- behaviour that the owner never asked for;
- an owner's decision that you settled with a guess.

## Key rules

- [One item, one outcome](#one-item-one-outcome): split by outcome, never by size.
- [Write it to the template](#write-it-to-the-template): Outcome, Context, Depends on, Acceptance,
  Out of scope and Permissions.
- [Acceptance](#acceptance): one check per line, each with the evidence that proves it.
- [Keep the owner's words](#keep-the-owners-words): add no behaviour, and leave the owner's
  decisions as questions.
- [Ready](#ready): the test an item passes before work starts.

## One item, one outcome

File one item for each outcome that can land by itself. Keep one outcome in one item, however
large. The design step splits the build.

Write the title as the outcome, in plain lowercase: "expired holds return their units to the
shelf".

## Write it to the template

Paste the block, replace the example values, and delete each `<!-- -->` comment. The example
describes an invented warehouse service. Keep Outcome and Acceptance, and delete each other
section that has nothing to say.

```markdown
## Outcome

<!-- 1 to 3 sentences: what is true when the work is done. For a bug, what happens now too. Give the end state. The builder picks the steps. -->

A hold that nobody releases returns its units to the shelf 15 minutes after it was placed. Today
the units stay held until someone releases them by hand.

## Context

<!-- Each fact the next agent can't find alone: links, the files involved, earlier pull requests, the owner's decisions. For a bug, the steps that reproduce it, with their output. -->

- Holds are placed in the `holds` module, which the checkout calls.
- The owner chose 15 minutes, the length of a checkout session.

## Depends on

<!-- Each work item that must be done first, as a link. -->

- [Holds have an expiry time](<link to the item>)

## Acceptance

<!-- One line for each thing someone observes, with its evidence. -->

- [ ] A buyer sees the units back on the shelf after their hold expires. Evidence: a recording.
- [ ] An expired hold's units are back on the shelf within 1 minute. Evidence: a test with a fake
      clock.

## Out of scope

<!-- Only what the owner or the request excludes. Invent no limit. -->

- Extending a hold.

## Permissions

<!-- Each thing the agent may do beyond its own branch and pull request, in the owner's words: a deploy, a paid API with its spend limit, a migration, a post under the owner's name. Grant nothing yourself. -->

- Run the migration that adds the expiry column, after a backup.
```

For work that ends in an answer, write `## Questions` in place of `## Out of scope`: each
question, and the decision that its answer informs.

The design step adds its own sections, as the
[work item template](../design-docs/references/work-item.md) shows. Leave those sections to it.

## Acceptance

Write each line as one thing that someone observes, with its evidence: a test, a command and its
output, a screenshot or a recording. A change that someone can see needs a screenshot or a
recording.

- Make each line fail today and pass when the work is done.
- Leave out a line that only a release or the live system can prove. The builder can't show it in
  a pull request.
- Check that the thing a line tests exists, or that this item or one it depends on builds it.

## Keep the owner's words

Copy the owner's words into the item where they decide something: a name, a value, an example.
Tighten the scope and the acceptance lines yourself.

Put each of these to the owner as a question, with the options and your recommendation. Leave the
question in the item until the owner answers:

- a change to the outcome;
- behaviour that the outcome doesn't ask for;
- a looser reading of a rule that the owner set;
- a choice that costs money, touches security, or can't be undone.

Ask nothing that the item or an earlier answer already settles.

## Ready

An item is ready when all of these hold:

- An agent that reads only the item can say what done looks like.
- Acceptance has at least one line with evidence.
- Each item it depends on is done.
- No question in it waits on the owner.
- No merged pull request already does the work.

**Reply:** each item you filed or changed, whether it is ready, and each question that waits on
the owner.
