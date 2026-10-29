---
name: docs-writing
description:
  "Writes or reviews prose that gets committed to a repo: docs/, READMEs, AGENTS.md, skills and code
  comments. Builds on four published standards, adds the house rules they don't cover, and holds the
  README and docs/ contracts and the scripts that check them. Load it before you write, edit or
  review any of them."
---

# Writing docs

Committed prose is read by someone who wasn't there. They didn't see the conversation, the ticket or
the diff. You can't feel where a sentence leans on that context, because you know what every word
refers to, so check for it on purpose.

Writing a doc goes wrong in four ways:

- a sentence that only makes sense if you were there;
- a copy of the code, which goes out of date without anyone noticing;
- padding: a paragraph that defends a decision nobody attacked;
- prose that keeps every rule and still reads like a machine wrote it.

When you're done, hand back the files you changed, the check output, and what a
[cold read](../cold-read/SKILL.md) found.

The `skill-writing` skill wins over this one for a skill, and a repo's `project-docs-writing` skill
wins for that repo's docs. Committed prose follows this skill, not the register you use in chat.

## Key rules

- [Cut words, keep it readable](#cut-words-keep-it-readable): when a rule makes a sentence worse,
  fix the sentence another way.
- [Four standards](#four-standards): structure, sentences, instructions, and one reading per
  sentence.
- [What goes in](#what-goes-in): the present system, nothing the code says, one owner per fact.
- [Don't copy what the code owns](#dont-copy-what-the-code-owns): describe a list, a number, a name
  or code instead of copying it.
- [House rules](#house-rules): name the actor, and cut the tells of machine-written prose.
- [Shape the doc](#shape-the-doc): open with a summary; a list, table or diagram where each fits.
- [Check it](#check-it): three scripts, then a cold read.

## References

- [Architecture docs](./references/architecture-docs.md): a doc under `docs/architecture/`.
- [The docs/ tree](./references/docs-tree.md): deciding where a doc goes, or writing a design, a
  decision record or a spike.
- [READMEs](./references/readmes.md): writing or reviewing a README.

## Cut words, keep it readable

Write so a tired engineer understands on the first read. Two rules come before all the others:

- **Cut every word that does no work.**
- **When a rule makes a sentence worse, fix the sentence another way.** A sentence that keeps every
  rule and sounds like a machine wrote it has failed.

Vary the rhythm. Use a short sentence for what the reader must remember, and a longer one for a fact
with its condition. Be specific: "a column rename fails the build", not "schema changes can cause
issues".

## Four standards

Open the standard when the summary here doesn't settle a case.

- **[Diátaxis](https://diataxis.fr/), for structure.** One doc, one mode. An architecture doc is an
  explanation, a guide is a tutorial or a how-to, a runbook is a how-to, and `docs/reference/` is
  reference. A how-to assumes competence, reference stays dry, and an explanation may hold a view. A
  README is the exception: each of its sections has its own mode.
- **[Google developer documentation style](https://developers.google.com/style), for sentences.**
  "You", the present tense, the condition before the instruction, the common case first. Never
  "simply" or "easy" in a procedure: if it were simple, the reader wouldn't be here.
- **[ASD-STE100](https://www.asd-ste100.org/), for instructions only**, meaning numbered steps and
  sentences that tell the reader what to do. One instruction per sentence, about 20 words at most,
  one meaning per word, and the warning before the step. Keep STE out of explanation and reference,
  where its short sentences read like orders.
- **Global English, for one reading per sentence**, from John R. Kohl's _The Global English Style
  Guide_:
  - "only" next to the word it changes;
  - no noun strings, slashes or idioms;
  - every "it" and "this" pointing at one thing.

## What goes in

**Describe the system as it is now**, in the present tense. Leave these out, because each goes false
without anyone noticing:

- history and plans;
- temporary states;
- links to the project's own tracker;
- words that describe your change rather than the system, such as "also" or "the new endpoint".

**Cut what the code already says.** Picture the reader with the source file open. If a paragraph
tells them nothing new, delete the paragraph rather than trim its words. Keep a fact that shows only
across several files.

**A bug fix rarely needs a new paragraph.** Rewrite the sentence the change made false. A doc that
grows a paragraph per fix turns into a changelog.

**Give each doc one job and each fact one owner.** A doc serves one reader doing one task. Explain
each fact, with its reason, in one doc, and link to it from the others. When two docs disagree,
check the owner against the code first.

**A code comment** says why the code is the way it is. It follows this section and the house rules.

## Don't copy what the code owns

A copy goes out of date the next time the code changes, and nothing tells the reader.

- **A list.** State the rule that defines it: "every domain service is private". A list of commands
  the reader runs is fine.
- **A config value.** State the rule the value serves: "the pool closes an idle connection before
  the database suspends", not "`idle_timeout` (240 s) closes a connection before the 300 s suspend".
  A measured result is different: give it, with its source.
- **A name.** In a doc, name the role ("the retry policy"), not the function, option or path,
  because a rename breaks the doc without an error. Don't link the source file either. Two
  exceptions:
  - a library's or product's real name, and anything the reader types;
  - a skill, which links the file, as the `skill-writing` skill says.
- **Code.** Put only a command the reader runs or a short invented example in a code block.

## House rules

**Say who does what.** Name the actor. Don't make a thing act like a person ("the field says", "the
reason does the work"), because that hides who acts.

**Don't hedge a decision.** Save "may" and "should" for options that are still open.

**State the rule, then the exception**, in its own sentence. When there are two or more exceptions,
list them.

**Link the owner instead of "as noted above".** Repeat a noun rather than make the reader scroll
back.

**Put the negation on the verb.** "The worker never retries a failed payment" is clear from its
first words. "No worker retries a failed payment" reads as a claim about every worker until the verb
arrives.

**Replace a vague qualifier with the claim.** Give the figure and its source where you'd write
"often". With no figure, delete the qualifier.

**Cut the tells of machine-written prose:**

- a transition that recaps the last paragraph ("With this in place…");
- feature-list voice ("provides", "offers a flexible way to");
- three adjectives on one noun;
- the same move three times, such as "X, not Y";
- a question that only sets up the next sentence;
- a slogan in place of a rule.

A short line that sums up a rule is fine when the rule sits next to it in full.

## Shape the doc

Open a doc in `docs/` with three to six plain sentences on what the system does and what the reader
most needs to know. A README opens as [READMEs](./references/readmes.md) says.

- **Lists or prose.** Put parallel items in a list. Write cause and effect as a paragraph.
- **Tables.** Use one for three or more values that each have two or more attributes, with one value
  per cell.
- **Procedures.** Number the steps, and give the exact expected outcome: "Expect: HTTP 202".
- **Headings.** Name what the section is about, not its role ("Overview"). Use no horizontal rule
  between sections.
- **Formatting.** Tag every code block with a language, link with a path relative to the file, and
  name what each placeholder stands for (`<service_id>`, never `xxx`).
- **Line breaks.** Where oxfmt wraps prose on commit, write each paragraph as one line, because
  hand-wrapping only adds churn to the diff.

### Diagrams for pipelines, state machines, and topologies

Open a section about one of those shapes with one mermaid diagram that uses the prose's names. Under
it, write only what it can't show, such as the invariant on each edge.

## Check it

Run these from the repo root. CI runs the same three:

```bash
bash .agents/skills/docs-writing/scripts/check-length.sh
bash .agents/skills/docs-writing/scripts/check-links.sh
bash .agents/skills/docs-writing/scripts/check-readmes.sh
```

- [`check-length.sh`](./scripts/check-length.sh) checks each README and `docs/` file against its
  cap, then runs `check-prose.sh` over them and every skill.
- [`check-prose.sh`](./scripts/check-prose.sh) fails on what a search can find, such as banned
  words. It also prints candidates: fix the real faults, and leave the rest out of your reply. To
  check other prose, such as AGENTS.md, run
  `bash .agents/skills/docs-writing/scripts/check-prose.sh <path>`.
- `check-links.sh` resolves every relative link.
- `check-readmes.sh` fails on a README that isn't one of the five kinds.

Before the checks, reread each file you changed against this skill. After them, run the `cold-read`
skill on each doc and skill you changed.

**Reply:** the files you changed, the check output, and what the cold read found.
