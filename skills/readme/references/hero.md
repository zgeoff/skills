# Hero diagrams

An animated hero diagram shows a project's parts at work, in a loop at the top of the README. A good
one takes many rounds. This file holds how to run those rounds, the craft rules they found, and what
GitHub will play.

Contents: [what GitHub plays](#what-github-plays) · [run the rounds](#run-the-rounds) ·
[the story](#the-story) · [timing](#timing) · [layout](#layout) · [copy](#copy) ·
[check each frame](#check-each-frame)

## What GitHub plays

GitHub shows a README image through `<img>`, which runs no script and loads nothing from outside the
file. So build the hero as one SVG file:

- Animate with SMIL (`<animate>`, `<animateMotion>`, `<set>`). It changes sizes, paths and points,
  and follows curves, in every current browser. Use CSS keyframes only for a plain repeating loop,
  such as a dashed line flowing: CSS can't change a shape, and its support inside `<img>` in Safari
  is unproven.
- Embed every font, image and colour. Use a local font stack, such as `ui-monospace`, instead of a
  web font.
- Start the file with `<?xml version="1.0" encoding="UTF-8"?>` when it holds any character outside
  ASCII, such as an arrow.
- Build a light and a dark file, and choose with `<picture>` and `prefers-color-scheme`. That
  follows the reader's GitHub theme; a media query inside one SVG follows their system theme, which
  can differ.
- Keep each file under about 150 KB.
- Put the alt text on the README's `<img>`: a screen reader ignores an `aria-label` inside an SVG
  shown as an image.

Write the SVG from a script, never by hand, so that a change of timing or text is one edit.

## Run the rounds

- **Start wide.** Send several designers, each with a different direction, in parallel. Shape each
  brief so the results surprise the owner: give each its own idea.
- **Freeze a keeper.** When the owner says they'd ship a version as it stands, copy it to a
  read-only folder and never touch it again.
- **Give every round its own folder.** Never edit the last round in place. The owner compares, and
  sometimes goes back.
- **Keep one comparison page.** Publish every version on one page, newest first, each with a line
  saying what changed and its weakest point.
- **Keep one designer.** After the wide start, send each round to the same designer, so it knows the
  generator. Pass the owner's feedback on in their own words, plus your own call on any choice that
  is cheap to undo.
- **Look before you report.** Render frames at each beat and look at them yourself. A designer's
  report holds what it meant to build.

## The story

- Tell one story: a person asks for something, the parts do it, one part needs the person, the
  person answers, the work finishes. End on the result.
- Draw only traffic that really happens. Check the routing against the architecture before you draw
  it: which part talks to which, and what passes through the middle.
- Give each part one row or one box for its whole life. A second row for the same part reads as a
  second part.
- Use a label that names what a thing does for the viewer, such as "inbox", over the name the code
  uses. A word like "assistant" reads as another AI.

## Timing

- Put every time on one grid. Give every stage the same length, set by the busiest stage. Inside a
  stage, start the action at a fixed offset, snap each beat to a fixed step such as 0.5 s, and hold
  until the next stage. Hand-picked times read as arbitrary, even when the viewer can't say why.
- Use one fade length for everything.
- Give each new line of text time to be read before the next beat: about 0.25 s per word plus 0.5 s.
- Change one thing at a time. Dim what's waiting so the eye goes to what's acting.
- Make every flight between parts take the same time.
- When a quiet stage drags, give it something to do, such as the result arriving. Don't shorten that
  stage alone.
- When one element replaces another in the same place, fade the old one out before the new one comes
  in. A cross-fade blurs the two.

## Layout

- Put a caption band above the scene, the largest text in the frame, with step dots under it: one
  sentence per stage. The caption names what is happening, and the scene shows how. A viewer who
  missed a step sees where they are in the loop.
- Make the caption band transparent, with text colours from GitHub's palette, so it sits on the page
  in both themes. Keep the scene in its own card.
- Keep scene text at 13 px or more at the README's width.
- Keep every path clear of text, and of the parts it doesn't visit.

## Copy

- Make each caption line name what the project does, such as "Agents talk to each other directly",
  not repeat what a terminal in the scene shows.
- Make a message read word for word the same where it's sent and where it lands.
- Cut every line in the scene to the fewest words that keep the story. The caption carries the
  meaning.

## Check each frame

Pause the animation and set its time in a headless browser to render a frame:
`svg.pauseAnimations(); svg.setCurrentTime(t)`. Browser tools that freeze CSS animations don't stop
SMIL.

Render the same offset inside every stage, each beat, and the frames either side of the loop's
restart. Check each one for overlapping text, text off the frame, and the first frame matching the
last.
