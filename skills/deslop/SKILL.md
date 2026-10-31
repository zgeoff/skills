---
name: deslop
description:
  "Edits prose that already exists so it reads plainly. Its edits lead with the reader's situation,
  turn a described process into an instruction, cut contrast frames ("X, not Y"), drama and a
  sentence that explains the line before it, and keep blunt lines blunt. Load it to deslop a skill, a doc, a PR
  description or a comment, when text reads like AI wrote it, and after you fix what a cold read
  found."
---

# Deslop

Edit text that already exists, in place, until it reads like a person wrote it. Work through it line
by line, and change only what one of [the moves](#the-moves) covers. Leave everything else as it is,
and add no new content.

- **Edit by the moves, never "in the style of" a writer.** Copying a writer's voice copies their
  habits, faults included. When you give the reason for a change, name the prose fault it fixes,
  such as a contrast frame.
- **Reread each rewrite on its own.** A tidy rewrite can read worse than the line it replaced.
- **Leave a blunt line blunt.** Don't pad a short, flat line: it may be the part that already works.

You're done when every line has had one pass, you've reread each rewrite, and
[`check-prose.sh`](../docs-writing/scripts/check-prose.sh) passes. Write your edits into the file,
then hand back each change as a `diff` block, and what you left as it was. Whoever asked reads each
change, and reverts the ones they reject. For text outside a file, such as a PR description, hand
back the changes and leave the source alone.

## Key rules

- [The moves](#the-moves): lead with the job, give the instruction, use plain names, and cut
  contrast frames, drama and counted lists.
- [Leave these alone](#leave-these-alone): formats, commands, the frontmatter, and lines that
  already work.
- [Check each rewrite](#check-each-rewrite): read it on its own, and run `check-prose.sh`.
- [Show the changes](#show-the-changes): a heading, a reason and a `diff` block per change.
- [After a cold read](#after-a-cold-read): run the moves again on each section you redrafted.

## The moves

The rules behind the moves live in the [skill-writing](../skill-writing/SKILL.md) skill, under
"Write it plainly". Apply every move to a skill or its references, a PR description, an issue, a
commit message or a code comment. In a README, AGENTS.md, CLAUDE.md or another doc, apply only moves
3, 5 and 6, which cut rhetoric. Leave other faults in those files alone, and list them in your
hand-back: the [docs-writing](../docs-writing/SKILL.md) skill's rules cover them. Keep blunt lines
blunt there too.

1. **Lead with the job or the reader's situation.** Cut a stock opener, such as "This skill…", "Use
   this file when…" or "Your job is to…".

   ```diff
   - This skill helps you plan a vegetable bed before planting.
   + Plan the vegetable bed before planting.
   ```

2. **Turn a described process into the instruction.**

   ```diff
   - A second gardener walks the bed and notes each plant that gets too little sun.
   + Ask a second gardener to walk the bed and note each plant that gets too little sun.
   ```

3. **Cut contrast frames: "X, not Y" and "X rather than Y".** Say what to do. When the text says the
   reader is likely to do the wrong thing, keep what it says goes wrong. Keep a "not" when a reader
   who skipped it would pick the wrong thing.

   ```diff
   - Sow after the last frost, not before it.
   + Sow after the last frost.
   ```

4. **Split the reason into its own short sentence.** Drop "because" when the order already says it.

   ```diff
   - Mulch the bed in spring, because bare soil dries out by June.
   + Mulch the bed in spring. Bare soil dries out by June.
   ```

5. **Cut drama words,** such as "critical", "worthless" and "has failed", and a sentence that
   explains the line before it, such as a closing "and that's the point".

   ```diff
   - Labelling each row is critical, and a bed without labels has failed.
   + Label each row.
   ```

6. **Cut counted lists and aphorisms.** Name the items, or keep only the instruction.

   ```diff
   - A bed goes wrong in three ways: too much sun, too little water and slugs.
   + A bed goes wrong with too much sun, too little water or slugs.
   ```

   ```diff
   - A plan is only a guess until it rains. Check the bed after the first heavy rain.
   + Check the bed after the first heavy rain.
   ```

7. **Make a person or the reader the subject.** A thing that acts like a person hides who does the
   work.

   ```diff
   - The seed packet decides how deep each seed goes.
   + Sow each seed at the depth on its packet.
   ```

8. **Keep blunt lines blunt.** Don't explain them, qualify them or make them more formal. Cut a
   sentence that explains the line before it.

   ```diff
   - Tomatoes hate frost. This means that they should not be planted out early in the season.
   + Tomatoes hate frost.
   ```

9. **Replace a made-up label with the plain name.** A made-up label is a name the writer coined for
   a thing that developers already call something else. Search the repo for the label first. When
   another file uses it, change both, and list the other file in your hand-back.

   ```diff
   - Check the wilt score each week.
   + Each week, count the plants that wilted.
   ```

## Leave these alone

- The shape of numbered steps, templates, tables and report formats. An agent copies a format into
  its own output exactly. You may still edit the wording of a sentence inside a step.
- Commands and code blocks.
- The frontmatter. The skill-writing skill sets its form.
- A term that a check or a script depends on, such as a heading a script greps for. Search the repo
  for a term before you rename it. A made-up label that only other prose uses gets move 9.
- A line that already reads plainly.

When a section still reads oddly after two rewrites, its structure is the fault. Change it as "Write
it plainly" in the [skill-writing](../skill-writing/SKILL.md) skill says. This is the one case where
you change structure. Numbered steps, templates, tables and report formats still keep their shape:
change only the prose around them.

## Check each rewrite

Read each rewrite on its own, as if you'd never seen the old line. Look for:

- a new "it" with two meanings;
- a list that grew inside a sentence;
- a sentence that got longer.

Then run the prose check from the repo root. It sits in the docs-writing skill's `scripts/` folder,
under `.agents/skills/` in most repos; search for `check-prose.sh` when it isn't there. The check
must pass, so fix each failure, even one no move covers. That is the one exception to changing only
what a move covers. For text outside a file, write it to a file in your scratch folder first:

```bash
bash .agents/skills/docs-writing/scripts/check-prose.sh <file>
```

Apart from its failures, it prints candidates: possible faults, such as the contrast frames, counted
lists and stock openers a search can find. The script can't tell a fair use from a slip, so judge
each candidate, and fix the slips.

## Show the changes

Give each move you used its own `###` heading, named by the move's bold text, one line on why, and a
`diff` block with `-` before and `+` after, so the lines show in colour. When one move changes
several places, keep one heading, and give each place its own `diff` block. Never show the whole
file.

End with a short bulleted list of what you left as it was, and why.

## After a cold read

When you fix what a cold read found, you add precision and drift back toward sentences that explain
the line before them, "because" clauses and long sentences. After you redraft a section for a cold
read, run the moves again on that section.

**Reply:** each change as a `diff` block, and what you left as it was.
