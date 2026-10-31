---
name: bake-off
description:
  'Gets three independent sketches of a design before the agent commits to one: each subagent
  sketches it from a different approach, a model from another family scores the sketches against
  criteria the subagents never saw, and the agent picks one and borrows from the rest. Load it for a
  design that will be costly to change later, such as a public API, a schema or a boundary several
  modules depend on, when more than one design could work.'
---

# Bake-off

Before you commit to a design that will be costly to change later, get three sketches of it. Have a
separate subagent write each sketch, each from a different approach: one agent that writes three
sketches sticks close to its first. Write scoring criteria that the subagents never see. Compare the
sketches, then have a model from another family, from a different vendor, score them without knowing
which approach produced which, score them yourself, and pick one.

- **Run a bake-off only for a design that's costly to change and has more than one good answer.**
  Costly means other code will be built on it: a public API, a schema or a data format, or a
  boundary several modules or repos depend on. More than one good answer shows as goals that pull
  against each other, such as speed against flexibility. For an interface in one module with a few
  callers, or a design with one obvious answer, pick it yourself, and say in your reply what you
  rejected.
- **When you can test the answer, skip the bake-off.** When the question is which option is faster
  or smaller, measure it.
- **Compare the sketches before anyone scores them.** When the sketches read the problem
  differently, the problem isn't clear yet, and scores can't fix that.
- **Rework what you borrow.** A piece pasted from another sketch keeps that sketch's design.

Hand back the report described in [Report](#report). When the user asked for the bake-off, or makes
the design decision, also show them the sketches as their options, as
[When the user decides](#when-the-user-decides) says. When you run the bake-off inside a plan, build
the plan on the pick, after the user answers when the user decides.

## Key rules

- [Criteria](#criteria): 3 to 6, from what the problem needs, kept from the subagents.
- [Sketches](#sketches): 3 subagents, one per approach.
- [Compare](#compare): when the sketches read the problem differently, report that and don't pick.
- [Score](#score): the other model scores the sketch files alone, and you score the same way.
- [Pick](#pick): the highest total, with at most one or two ideas borrowed and reworked.
- [Report](#report): the sketches, the scores, the pick and why, and what you borrowed.
- [When the user decides](#when-the-user-decides): each option drawn on a diagram of the current
  system, through the show-me skill.

## References

- [sketcher.md](./references/sketcher.md): the instructions for each subagent that writes a sketch.
- [red-flags.md](./references/red-flags.md): the design red flags, for you and the other model.

## Criteria

Write 3 to 6 criteria for a good design for this problem, from what the problem needs, such as "a
new payment method touches one file". Leave the red flags in
[red-flags.md](./references/red-flags.md) out of the criteria: each scorer already lowers a score
for each red flag it finds, so a criterion that repeats one would count it twice.

Keep the criteria from the subagents. A subagent that sees them writes to them, and then the scores
can't tell the sketches apart. Keep the requirements you give the subagents to behaviour, so no
criterion slips in as a requirement.

## Sketches

Start 3 subagents in one message. Use your harness's general agent type for each, which is
`general-purpose` in Claude Code. A fourth adds nothing the three approaches below don't cover.

Give each one:

- the absolute path of [sketcher.md](./references/sketcher.md), and the instruction to read that
  file first;
- the problem, and its requirements: the ones you were given, or two or three you write about
  behaviour only, the same for every subagent;
- the paths of the code it touches;
- its own folder in your scratch directory;
- one approach, a different one each:
  1. the smallest design that meets the requirements;
  2. the design that follows the nearest existing pattern in the repo;
  3. the design easiest to extend for the next likely need.

## Compare

When every subagent has returned, read each sketch's reply, and compare what each one takes the
problem to be: which requirements it meets, and how it reads each one.

- **The sketches read the problem differently,** such as one treating a requirement as a hard limit
  and another as a preference: the problem isn't clear yet. Skip scoring, and report what they
  disagree about, with no pick.
- **They read it the same way:** go on to score. When they also draw the same design, that's strong
  evidence for it: say so in the report.

## Score

Load the [second-opinion](../second-opinion/SKILL.md) skill. Copy each sketch's files into a new
folder in your scratch directory named A, B or C, in shuffled order, and note which letter is which
approach. Delete any comment that names the approach. Send the other model:

- the three folders, with none of the subagents' replies;
- your criteria, and red-flags.md;
- the ask: a score from 1 to 5 per criterion per sketch, with any red flag it found, a pick, and a
  reason for each score.

While it works, read every sketch whole, and score each against the same criteria, one criterion at
a time. When second-opinion can't reach another model family, score alone, and say so.

## Pick

Add up each sketch's scores, yours and the other model's together, and pick the highest total. When
two totals tie, pick the one easier to extend without breaking what it guarantees, then the one with
the smaller interface. When the other model ranks a different sketch first, read its reasons. When
they show a fault your scores missed, change your scores, and say in the report what changed.

Borrow at most one or two ideas from the other sketches, and rewrite each one to fit your pick.

## Report

- **The sketches:** every file of each sketch, in full, in a `<details>` block per sketch, because
  you delete the scratch directory when you're done.
- **The scores:** a table with a row per criterion, a column per sketch, and a totals row. Each cell
  is `you / other model`, followed by any red flag you found.
- **Your pick and why,** and each idea you borrowed, with the sketch it came from.
- **The sketches you didn't pick,** and why.
- **Who scored:** the other model's name, or why you scored alone.

When the sketches read the problem differently, the report holds the sketches and what they disagree
about, with no scores and no pick.

## When the user decides

When the user asked for the bake-off, or makes the design decision, load the
[show-me](../show-me/SKILL.md) skill. Draw the current system. Then, for each sketch, draw it on
that same diagram, and show its `01-usage` code under the diagram. Put the score table after the
options, then your pick, then one question: whether the user takes your pick. Put the full report,
with its `<details>` blocks, after the question.

**Reply:** the report; when the user decides, also the options drawn through show-me, the score
table, your pick and the question.
