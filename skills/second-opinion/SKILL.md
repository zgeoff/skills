---
name: second-opinion
description:
  'Gets an independent read on your work from another model family: a review of a change, a
  diagnosis after fixes fail, or a judge between sketches. Covers when to ask, who to ask, the blind
  prompt, the reply to ask for, and what to do with the answer. Load it before a review gate, before
  you ask another model about a bug, and before you have a bake-off's sketches judged.'
---

# Second opinion

You did the work, so you can't read it cold. Ask a model that didn't: one from another family,
because a model from your own family shares your blind spots.

Send it the work and the question. Leave out your conclusion. A reviewer that sees your answer tends
to agree with it.

Reproduce each finding before you act on it, fix what holds, and have the same model check the
fixes. Then hand back what the model said and what you did about each point. The jobs are a review,
a diagnosis and a judge, and the **Reply** line at the end gives the shape for each.

## Key rules

- [When to ask](#when-to-ask): a review before hand-off, a diagnosis after two failed fixes, or a
  judge for a bake-off.
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

- **A review:** before you hand off a change that the repo's rules or the user require a review for.
- **A diagnosis:** after two fixes fail the same reproduction.
- **A judge:** when a bake-off needs its sketches scored. In a bake-off, several agents each sketch
  a solution to the same problem, as code or as a plan, and a judge scores them.
- **The user asks.** Pick the job that fits what they asked about.

Claude Code's advisor, or any tool that sees your whole transcript, doesn't count. It reads your
reasoning, so it isn't blind.

## Who to ask

Ask a model from another family. [Commands](./references/commands.md) lists the models in the user's
order of preference: take the first one whose family isn't yours. A model of your own family shares
your training, and with it your blind spots.

Run its command as written. Each command uses the strongest model in its family, at high effort,
because these are the reads you act on. Change the effort only when the user asks.

When the model fails to run, or gives no reply in 15 minutes, stop it and try the next model in the
list from another family. When none is left, run the command for your own family with the same
prompt, and say in your reply that the read came from your own family. Never use a fork of your
session, because it inherits your conversation and isn't blind. When your own family fails too, tell
the user, and on a review wait for them before you hand off.

## Write the prompt

The reviewer reads only the prompt, so everything in it steers the answer. Write it to a file in
your scratch folder, in this order:

1. The question, such as "find the bug" or "review this change for data loss", and what the change
   is for, in one line.
2. The rules the change must keep. Paste the rules from the repo's skills or AGENTS.md that bear on
   the diff, because the reviewer can't load your skills.
3. What to read: the command that prints the diff, such as `git diff main...HEAD` for a branch or
   `git diff HEAD` for uncommitted work, or the file paths.
4. The acceptance criteria the work must meet.

For a diagnosis, add these after item 3, and keep item 4:

- the exact error text;
- what you observed, kept apart from what you suspect;
- each fix you tried, and what happened;
- a request for the cause. Never ask the reviewer to confirm your diagnosis.

For a judge, put the criteria to score against in place of item 4, and label the sketches A, B and
C, with no author or model named, so the judge can't favour one.

Leave out your transcript and the answer you expect.

## Ask for a reply shape

End the prompt with the shape of the reply you want:

- **Review:** at most 3 findings, each with where it is, what triggers it, what happens, and the
  check that shows the fault. When the reviewer can run that check, the command and its output. Zero
  findings is a valid answer.
- **Diagnosis:** the evidence for each possible cause, the next check to run, and which cause each
  possible result of that check points to.
- **Judge:** a score for each sketch on each criterion, with a reason, then a pick.

With a cap of 3, the reviewer has to rank its findings, and you get the worst ones first.

## After the answer

For a review, follow these steps. For a diagnosis, run the next check the model gave. Treat the
cause the check confirms as the one finding, then follow steps 3 and 4. When the check confirms no
cause, report its result and stop. For a judge, report the model's scores and pick. The bake-off
decides what to do with them.

1. Drop nits and refactors that the change didn't need, without reproducing them, and list them as
   dropped.
2. Reproduce each other finding before you act on it: run the check it gives, or write a test that
   fails. When you can't reproduce a finding, report it as not reproduced, with what you tried.
3. When you and the reviewer disagree, write a test whose result shows which answer is right. Don't
   keep asking until you get the answer you want.
4. After you fix the findings you reproduced, ask the same model once more, to check only the fixes.
   Send it the findings and the diff of your fixes (`git diff <the commit before your fixes>`), and
   ask for the review shape. Stop after that round. Report anything it still finds, without fixing
   it.

**Reply:** in plain language, the model and effort you used, then, for each job:

- **Review:** each finding, whether you reproduced it, and what you did about it, then the dropped
  nits.
- **Diagnosis:** each cause the model gave, the check you ran, and the cause it confirmed.
- **Judge:** the scores, the pick, and the reason for the pick.
