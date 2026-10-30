---
name: show-me
description:
  'Shows the user a system, a choice or a change in one chat message: box-drawing diagrams built up
  one part at a time, each option drawn on the same picture of the current system, caller-first
  code, a trade-off table, and the recommendation just before one question. Load it before you
  explain where a system stands, lay out options for a decision, show the shape of a structure, or
  show a before and after.'
---

# Show me

This skill builds one chat message that shows the user what they need to see before they act: where
a system stands, the options for a decision, the shape of a structure, or a change before and after.
Build each diagram up one part at a time, so the user sees which part matters. Draw every option on
the same base picture, so the user can compare them. Give your recommendation after the options, so
the user reads each option on its own terms first.

## Key rules

- [When to draw a diagram](#when-to-draw-a-diagram): grounding, options, a shape, or a before and
  after; not for a fact or a yes-or-no answer.
- [Build a diagram one part at a time](#build-a-diagram-one-part-at-a-time): frames, one new part in
  each, with a line above each frame on what it adds.
- [Draw each option on the base frame](#draw-each-option-on-the-base-frame): the same layout, with
  the point where the option fails marked.
- [Show code from the caller](#show-code-from-the-caller): the call site first, then the one new
  structure.
- [Compare in a table](#compare-in-a-table): one column per option, each row phrased so `✓` is good.
- [Show the source](#show-the-source): the lines the choice rests on, in a code block or a quote,
  never only a file and line.
- [Order the message](#order-the-message): the options first, then your recommendation, then one
  question.
- [Where it goes](#where-it-goes): in the chat, with a wide frame redrawn to fit.

## References

- [A decision message](./references/decision-message.md): a worked example of a message that asks
  the user to choose between options.

## When to draw a diagram

Draw a diagram for one of these four tasks:

- **Grounding:** the system as it is now, before you propose a change, so you and the user start
  from the same diagram.
- **Options for a decision:** each option drawn against the same starting point.
- **A shape:** a pipeline, a state machine, a table and its relations, the processes and how they
  reach each other.
- **Before and after:** the system now, then the system with the change.

Answer anything else in words. A fact, a yes-or-no answer, or a status line needs no diagram.

## Build a diagram one part at a time

A diagram is a series of frames. A frame is one drawing in box-drawing characters, in its own `text`
code block. Draw the first frame with the fewest parts that still show the system correctly, and add
one part in each frame after it. Above each frame, say in one line what it adds, so the user sees
what changed without comparing two frames part by part. When two parts make sense only together, add
them in one frame, and keep a diagram to about five frames.

Two frames show several changes at once instead: an option, and the after frame of a before and
after. In a decision message, build up the base frame only when the user hasn't seen the system;
otherwise show it once.

````markdown
A user publishes a recipe through the API:

```text
┌──────┐  publish   ┌─────┐
│ user │ ─────────▶ │ API │
└──────┘            └─────┘
```

The API stores the recipe:

```text
┌──────┐  publish   ┌─────┐
│ user │ ─────────▶ │ API │
└──────┘            └─────┘
                       │
                       ▼
                   ┌──────┐
                   │  db  │  recipe row
                   └──────┘
```
````

- **Names.** Use the names the code and the conversation already use, so the user can find each
  part.
- **Width.** Keep every line of a frame within 100 characters, indentation included, because a
  terminal wraps a wider line and breaks the boxes.
- **Marks.** On any frame, `✓` marks what holds and `✗` marks what fails, each with a few words that
  say what.

## Draw each option on the base frame

The base frame is the last frame of the current system. Draw each option as one frame: the base
frame, in the same layout, with all of that option's changes. Mark the point where the option fails
with `✗`, such as under a crash or at a limit. A cost with no place in the drawing, such as effort,
goes in the table instead. The user compares options by what moved, so a new layout for an option
hides the difference.

## Show code from the caller

When the options differ in code, show the call site first, because the user judges an option by its
code at the call site. Then show the one new structure the option adds, such as a table or a type.
Leave out every line that is the same in all the options. When the options share code that doesn't
exist yet, such as the function the caller calls, give it one invented name in every option. When
the options differ only in infrastructure, show no code.

## Compare in a table

Put the trade-offs in a table: one column per option, and one row per property the decision turns
on. Phrase each row so that `✓` is good, as in the frames: "Publish returns at once", not "Publish
waits for retries". Give a figure where you have one, such as a time, a count or an effort in hours.
Your own estimate counts: write "about" in front of it. Leave out a row where every option is the
same.

## Show the source

When a choice rests on code, a doc or a rule, show the lines themselves, so the user can check the
claim without opening a file:

- **Code:** the few lines that matter, in a code block tagged with its language, with the file's
  path in the sentence above it.
- **A doc or a rule:** the sentence, as a quote, with the doc's path.

A file and line number alone isn't enough, because the user won't open the file to read it.

## Order the message

A message that asks for a decision goes in this order:

1. The decision, in one line.
2. Where the system is now: the base frame, and the fact that makes the decision necessary.
3. Each option the user could pick: its frame, then its code.
4. The trade-off table.
5. Each option a rule or a hard limit rules out, in one line, with the rule or the limit.
6. Your recommendation and what it costs, in two or three sentences.
7. One question, with the choices named, so the user can answer in a word.

Put each quote from [Show the source](#show-the-source) next to the claim it supports, usually in
step 2 or step 5. Put the recommendation after the options, so the user weighs each option before
they see your pick. Put it just before the question, so the user answers with your reason in view.

Put one decision in a message, so the user answers each on its own, and a later decision can build
on the answer. When there are several, number them ("Decision 2 of 4"), and send the next one after
the user answers.

Ask the question in the message, not through a question tool, because the tool's dialog can hide the
message from the user.

A message for grounding, a shape, or a before and after holds the frames, each with the line above
it that says what it adds. End it with a question only when you need an answer.

## Where it goes

Put the message in the chat. When a frame is wider than 100 characters, redraw it to fit: turn the
line into a second row, or split the frame in two at a natural break, such as a queue.

**Reply:** the message, ending in one question when it asks for a decision.
