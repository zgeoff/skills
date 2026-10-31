# Log review

The decision log is `decisions.tsv`, kept as the skill's "Keep a decision log" section says. You
never edit an entry: you add a new one that replaces it. Check your own entries against your
session's transcript, then have a model from another family read the log.

The folders that hold transcripts also hold the user's other conversations. Open only your own
transcript.

## Find your transcript

- **Claude Code:** a `.jsonl` file under `~/.claude/projects/`, in the folder named after the
  directory the session started in, with each `/` and `.` replaced by `-`, the leading `/` included.
- **Codex:** a `rollout-*.jsonl` file under `~/.codex/sessions/`, in the folders for the dates the
  session ran on.

To find yours, pick a distinctive phrase from the first message of your session, and search the
folder with `grep -rlF`, which prints file names and nothing else. When several files match, take
the newest. When no file matches, skip the three checks below, but still add entries for decisions
the log misses, from what you remember. Send the reviewer the log alone, and say so in the
`## Log review` section of your reply.

## Check your entries

Your entries start at the `resume` entry whose evidence names your transcript. When the log has no
such entry, you started the log, and your entries start at the top. They end at the next `resume`
entry, or at the end of the log.

Check each of your entries against the transcript:

1. The decision or action happened.
2. You can open its evidence.
3. The evidence shows what the entry claims.

An entry that fails any of these is wrong.

Add an entry, with the phase it happened in, for each decision that shaped the work and has none: a
choice between approaches, a change of plan, or an approach you dropped. Its time is now, so write
when the decision happened in its `why`.

When an entry is wrong, add one with the same phase. Start its `why` with
`replaces <time of the wrong entry>`, then say what happened, with evidence you can open. Do the
same for another session's entry when your own work shows it's wrong.

## Ask another model

Load the [second-opinion](../../second-opinion/SKILL.md) skill. Send the reviewer the paths of the
log and your transcript. Ask it to check the log without redoing the work, and to point out:

- a decision with weak evidence, or none;
- a check the log claims that the transcript doesn't show;
- a choice that looks risky now, such as one made too early, one that grew the job, or one that hid
  a symptom;
- anything a reader skimming the log would miss.

For each problem it raises, open the entries and the evidence it points at, and decide whether the
problem is real. When the problem is a fault in the work, fix the work, and log the fix. When the
problem is a wrong entry, add an entry that replaces it.

You're done when you've acted on each problem. List each one, and what you did about it, in the
`## Log review` section of your reply.
