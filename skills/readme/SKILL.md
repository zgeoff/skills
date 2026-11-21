---
name: readme
description:
  "Makes a project's front page README good enough to sell the project: learns the product from its
  code, writes a lead line, shapes Install and Usage, makes every example real, builds an animated
  hero diagram when the project earns one, tests the page on cold readers, and hands the wording to
  the owner. Load it to write or rework a root README, to add a hero diagram or demo to one, and for
  'make the README better'."
---

# README

Make the front page that decides whether a stranger tries the project. The reader gives it about ten
seconds: what is this, does it fit my problem, how do I start. Treat every claim on the page as
unproven until the code agrees with it, and every example as broken until it passes the repo's own
checks.

The owner reads your work in the PR and owns the wording. You hand back a PR with the README, any
hero files, and what the cold readers said.

## Key rules

- [Learn the product](#learn-the-product): check each claim against the code before you write it.
- [Shape the page](#shape-the-page): a lead line above the demo, Install, then Usage by way of use.
- [Make the examples real](#make-the-examples-real): each one passes the formatter and linter.
- [Build the hero](#build-the-hero): only when motion explains the product better than a sentence.
- [Test it on cold readers](#test-it-on-cold-readers): fix what two readers trip on.
- [Hand the words to the owner](#hand-the-words-to-the-owner): proofread their edits, don't rewrite
  them.

## References

- [Hero diagrams](./references/hero.md): building or changing an animated hero diagram.

## Learn the product

Read the architecture docs and the code for each feature the page will name. Send a subagent to
check the claims you plan to make, one per line, each marked proven, docs only or unclear, with the
file it came from. Owners describe their own product loosely, and a diagram drawn from the loose
version shows traffic that never happens.

Stop when every claim on your list is proven or cut.

## Shape the page

Follow [docs-writing's README rules](../docs-writing/references/readmes.md) for the header, the
sections and the length. On top of them:

- **Put the lead line above the demo.** One sentence on what the project is and who it's for, then
  how you use it. The reader learns what it is before the picture shows it working.
- **Put Install before Usage.** The reader can't use what they haven't installed.
- **Open Usage with the one command that starts the tool**, in its own code block, then what to
  press or type next.
- **Split Usage with a `###` heading per way of using the tool**, such as the TUI, the shell, from
  code, or agents driving it. One long Usage section reads as a wall.
- **Keep each feature to one line and a link.** The detail lives in the linked doc. Cut a safety
  caveat or a list of options from the line; the doc holds it.

## Make the examples real

Paste each code example into a scratch file in the repo, where the repo's config applies, and run
the formatter and the linter on it. Copy the formatted result back, then delete the scratch file.
Keep the formatter's blank lines: an example that doesn't look like the repo's code teaches the
wrong style.

When the real version is too long, cut setup that doesn't teach anything:

- replace connection options with `{ ... }`;
- drop a guard the reader would write anyway, such as a not-found check.

Never cut the part the example exists to show. Run the examples you can, such as a shell one-liner,
and check each claim in an example's lead-in sentence against the code.

## Build the hero

Build an animated hero only when the project's value is something moving between parts, such as
agents messaging each other or requests crossing machines. A static screenshot does the job for a
UI. Read [Hero diagrams](./references/hero.md) before you start, for the process, the craft rules
and what GitHub will play.

## Test it on cold readers

Send three subagents to read the README and watch the hero frames, each with a different persona and
none of your context: a developer new to the project, a designer, and a skeptic who solves the
problem another way. Give each one only the page, and ask:

- what they think the project does, and what each part of the hero is;
- what each label means to them;
- where they got confused, and what questions they were left with;
- whether it makes them want to try it, and what part does the most and the least.

Fix what two or more readers trip on. Bring a single reader's point to the owner as a question. When
a label confuses readers, ask the readers what they'd call it, and offer the owner their words.

For a caption or a lead line, send three writers with different angles, such as a developer-tools
copywriter, a plain-language editor and a brand writer, to critique the draft and offer versions.
Write the final wording yourself from what they agree on.

## Hand the words to the owner

The owner rewrites the page in their own voice. When they edit it, proofread only: typos, a
punctuation mark that breaks the page's pattern, a capital that doesn't match, and the formatter.
Leave their cuts in place. When a cut drops a fact a reader needs, say so once, with the reason, and
take their answer.

**Reply:** the PR link, the README's line count against its target, each claim you cut as unproven,
and the cold readers' findings you fixed or brought to the owner.
