---
name: second-opinion
description:
  'Gets an independent read on your work from another model family: a review of a change, a
  diagnosis after fixes fail, or a judge between sketches. Covers when to ask, who to ask, the blind
  prompt, the reply to ask for, and what to do with the answer. Load it before a review gate, before
  you ask another model about a bug, and before you judge a bake-off.'
---

# Second opinion

Use this skill to get a read on your work from a model that didn't do it. You hand back what the
model said and what you did with it; the [Reply](#after-the-answer) line gives the shape for each
job. Three mistakes make a second opinion worthless:

- you send your conclusion, so the reviewer agrees with it;
- you ask a model of your own family, which shares your blind spots;
- you act on a finding without reproducing it.

## Key rules

- [When to ask](#when-to-ask): a review gate, a diagnosis after two failed fixes, or a bake-off
  judge.
- [Who to ask](#who-to-ask): another model family, at high effort; your own family only as a
  fallback, and say so.
- [Write the prompt](#write-the-prompt): the question and the facts, never your conclusion.
- [Ask for a reply shape](#ask-for-a-reply-shape): one shape per job, with a cap on findings.
- [After the answer](#after-the-answer): reproduce each finding before you act, and say which model
  said what.

## References

- [Commands](./references/commands.md): the command for each model you can ask, its traps, and how
  to add a model.

## When to ask

- **A review gate:** before you hand off a change that the repo's rules or the user require a review
  for.
- **A diagnosis:** after two fixes fail the same reproduction.
- **A judge:** when a bake-off needs its sketches scored. In a bake-off, several agents each sketch
  a solution to the same problem, as code or as a plan, and a judge picks one.
- **The user asks.**

A tool that sees your whole transcript, such as Claude Code's advisor, gives no second opinion in
this sense: it reads your reasoning, so it isn't blind.

## Who to ask

Ask a model from another family. [Commands](./references/commands.md) lists the models in the user's
order of preference: take the first one whose family isn't yours. A model of your own family shares
your training, and with it your blind spots.

Run its command as written. Each command uses the strongest model in its family, at high effort,
because these are the reads you act on. Change the effort only when the user asks.

When the model fails to run, or gives no reply in 15 minutes, try the next model in the list from
another family. When none is left, run the command for your own family with the same prompt, and say
in your reply that the read came from your own family. Never use a fork of your session, because it
inherits your conversation and isn't blind. When your own family fails too, tell the user, and on a
review gate wait for them before you hand off.

## Write the prompt

The reviewer reads only the prompt, so everything in it steers the answer. Write it to a file in
your scratch folder, in this order:

1. The question, such as "find the bug" or "review this change for data loss", and what the change
   is for, in one line.
2. The rules the change must keep. Paste the text of each rule, from the repo's skills or AGENTS.md,
   that covers the files the change touches, because the reviewer can't load your skills.
3. What to read: the command that prints the diff, such as `git diff main...HEAD` for a branch or
   `git diff HEAD` for uncommitted work, or the file paths.
4. The acceptance criteria the work must meet.

For a diagnosis, add after item 3:

- the exact error text;
- what you observed, kept apart from what you suspect;
- each fix you tried, and what happened.

For a judge, add the criteria, and label the sketches A, B and C, with no author or model named, so
the judge can't favour one.

Leave out your transcript and the answer you expect. Never ask the reviewer to confirm a diagnosis:
ask for the cause.

## Ask for a reply shape

End the prompt with the shape of the reply you want:

- **Review:** at most 3 findings, each with where it is, what triggers it, what happens, and the
  check that shows the fault. When the reviewer can run that check, the command and its output. Zero
  findings is a valid answer.
- **Diagnosis:** the evidence for each possible cause, the next check to run, and which cause each
  result points to.
- **Judge:** a score for each sketch on each criterion, with a reason, then a pick.

The cap of 3 makes the reviewer rank its findings, so you get the worst ones, not a list of nits.

## After the answer

Steps 1 to 4 apply to a review and a diagnosis. For a judge, go to step 5.

1. Drop nits and refactors that the change didn't need, without reproducing them, and list them as
   dropped.
2. Reproduce each other finding before you act on it: run the check it gives, or write a test that
   fails. When you can't reproduce a finding, report it as not reproduced, with what you tried.
3. When you and the reviewer disagree, write a test whose result shows which answer is right. Don't
   ask again until you get the answer you prefer.
4. After you fix the findings you reproduced, ask the same model once more, to check only the fixes.
5. Tell the user what each model said, in plain language.

**Reply:** the model and effort you used, then, for each job:

- **Review:** each finding, whether you reproduced it, and what you did about it.
- **Diagnosis:** each cause the model gave, the check you ran, and the cause it confirmed.
- **Judge:** the scores, the pick, and the reason for the pick.
