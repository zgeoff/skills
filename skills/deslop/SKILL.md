---
name: deslop
description:
  "Edits prose that already exists so it reads plainly: it leads with the reader's situation, turns
  a described process into an instruction, cuts contrast frames, drama and explaining tails, and
  keeps blunt lines blunt. Load it to deslop a skill, a doc, a PR description or a comment, when
  text reads like AI wrote it, and after you fix what a cold read found."
---

# Deslop

Edit text that already exists, in place, until it reads like a person wrote it. Work through it line
by line, and change only what one of [the moves](#the-moves) covers. Leave everything else as it is,
and add no new content.

- **Edit by the moves.** An imitation of a voice copies its surface and keeps its faults. When you
  give the reason for a change, name the feature it fixes, never a persona.
- **Reread each rewrite on its own.** A tidy rewrite can read worse than the line it replaced.
- **Leave a blunt line blunt.** A short, flat line is often the part that already works.

You're done when every line has had one pass, you've reread each rewrite, and
[`check-prose.sh`](../docs-writing/scripts/check-prose.sh) has run. Hand back each change as a
`diff` block, and what you left as it was. Whoever asked reads each change and accepts or rejects
it. For text outside a file, such as a PR description, hand back the changes and leave the source
alone.

## Key rules

- [The moves](#the-moves): lead with the job, give the instruction, and cut contrast frames, drama
  and counted lists.
- [Leave these alone](#leave-these-alone): formats, commands, the frontmatter, and lines that
  already work.
- [Check each rewrite](#check-each-rewrite): read it on its own, and run `check-prose.sh`.
- [Show the changes](#show-the-changes): a heading, a reason and a `diff` block per change.
- [After a cold read](#after-a-cold-read): run the moves again on each section you redrafted.

## The moves

The rules behind the moves live in the [skill-writing](../skill-writing/SKILL.md) skill, under
"Write it plainly". Apply every move to a skill, a PR description or a code comment. In a README,
AGENTS.md or a file in `docs/`, apply only moves 3, 5 and 6, which cut rhetoric. The
[docs-writing](../docs-writing/SKILL.md) skill's rules govern the rest of those files.

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

3. **Cut "X, not Y" and "X rather than Y".** State the move. When the wrong move is likely, say what
   goes wrong with it. Keep a "not" when a reader who skipped it would pick the wrong thing.

   ```diff
      - Sow after the last frost, not before it.
   + Sow after the last frost.
   ```

4. **Split the reason into its own short sentence.** Drop "because" when the order already says it.

   ```diff
   - Mulch the bed in spring, because bare soil dries out by June.
   + Mulch the bed in spring. Bare soil dries out by June.
   ```

5. **Cut drama and explaining tails:** "critical", "worthless", "and that's the point", "has
   failed".

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

8. **Keep blunt lines blunt.** Don't explain them, qualify them or make them more formal.

   ```diff
   - Tomatoes hate frost. This means that they should not be planted out early in the season.
   + Tomatoes hate frost.
   ```

## Leave these alone

- The shape of numbered steps, templates, tables and report formats. An agent copies a format into
  its own output exactly. You may still edit the wording of a sentence inside a step.
- Commands and code blocks.
- The frontmatter. The skill-writing skill sets its form.
- A term that a check or another file depends on. Search the repo for a term before you rename it.
- A line that already reads plainly.

When a section still reads oddly after you rewrite it twice, its structure is the fault. Change it
as "Write it plainly" in the [skill-writing](../skill-writing/SKILL.md) skill says. This is the one
case where you change structure, and the formats above still stay.

## Check each rewrite

Read each rewrite on its own, as if you'd never seen the old line. Look for a new "it" with two
meanings, a list that grew inside a sentence, and a sentence that got longer.

Then run the prose check from the repo root. It sits in the docs-writing skill's `scripts/` folder,
under `.agents/skills/` in most repos. For text outside a file, write it to a file in your scratch
folder first:

```bash
bash .agents/skills/docs-writing/scripts/check-prose.sh <file>
```

Apart from its failures, it prints candidates: possible faults, such as the contrast frames, counted
lists and stock openers a search can find. The script can't tell a fair use from a slip, so judge
each candidate, and fix the slips.

## Show the changes

Give each change its own `###` heading that names the move, one line on why, and a `diff` block with
`-` before and `+` after, so the lines show in colour. When one change touches several places, keep
one heading, and give each place its own `diff` block. Never show the whole file.

End with a short bulleted list of what you left as it was, and why.

## After a cold read

When you fix what a cold read found, you add precision and drift back toward explaining tails,
"because" clauses and long sentences. After you redraft a section for a cold read, run the moves
again on that section.

**Reply:** each change as a `diff` block, and what you left as it was.
