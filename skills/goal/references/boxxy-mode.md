# boxxy mode

In boxxy mode, the session files the work as items in [boxxy](https://github.com/zgeoff/boxxy) and
manages each item to its end. boxxy's runner starts an agent on each item, runs it through the
pipeline that its rules file sets for the item's kind, and merges the PR. Write the goal's "Work"
and "For each item" parts from this file. Leave the build steps out of the goal: boxxy's recipes and
phase prompts hold them, and a copy in the goal drifts from them.

Read boxxy's tools, through its MCP server or `boxxy --help`, and its rules file before you write.
Check each fact below against them.

## Intake

Name the source of the work in the goal, such as a tracker project, a filter of small issues, or a
folder of design docs. Then tell the session how to file each source item:

- File one item per source item, written with the work-items skill: the repo, a title, the outcome
  and acceptance lines. Put the source's link, and the path of any design doc, in the item's body.
  boxxy has no field for a tracker issue or a design doc.
- Before filing, search the items for the source's link, and skip a source item that already has
  one. After a compaction, the session can't tell what it filed from memory.
- Set the kind from the rules file. A kind with a design phase runs boxxy's own design first, so
  file a signed-off design's work as a kind that goes straight to build, with the doc's path in the
  body.
- Turn each dependency into a `blocks` relation, with `blockedBy` at filing or a relation added
  later. Only `blocks` makes an item wait.
- File an item that waits on the user's decision as held, with the reason.
- Record each source ID with its item ID in the handoff doc.

In the "Work" part, group the items into batches in the order to file them, and say which to
expedite. boxxy's limits set how many run at once.

## While it runs

- **Notices.** boxxy sends each hold notice to one registered session, and registering a session
  replaces the one that has them now. Ask the user before you put registration in the goal, and name
  the session it would take the notices from. Without it, tell the session how to watch for holds,
  such as a background loop that lists the held items.
- **Holds.** Say which holds the session answers itself and which go to the user. The session
  answers with a note on the item, then a retry, with a phase when the item must go back. The next
  attempt reads every note.
- **Sign-off.** boxxy holds for the owner each PR that matches the sign-off rules in its rules file.
  Say whether the session may approve any of them. When the user hasn't said, those go to the user.
- **The runner.** Say whether the session may pause and resume it.

## Closing

- An item becomes done only when a PR from it merges. Tell the session to close, with a reason, each
  item that ends another way: a design-only item, a duplicate, a declined item or a split.
- When an item ends, update its source: move the tracker issue to done with the PR link, or mark the
  design doc built.
- boxxy runs no release or deploy. When the work ships, add those steps as
  [Direct mode](./direct-mode.md) says.

## Done-when

Write it from boxxy's item states, which the session prints:

- every filed item is done, archived, or held on the user with the exact action listed;
- each source item has its boxxy item, and its tracker issue is updated;
- no item waits with no PR and no hold.

Tell the session to print the item list, filtered to this goal's items, in its last turn.

## Example

An invented boxxy goal, at about 1,900 characters:

```text
/goal Clear every open issue labelled "small" in the Tidepool tracker project through boxxy, and feed in the two signed-off designs in docs/design/export/. Source of truth: the tracker and those design docs.

Work: file in this order, expediting batch 1. 1. The small issues, one item each. 2. The export designs: the CSV export, then the PDF export, which the CSV item blocks.

Filing: write each item with the work-items skill, with the issue or doc link in its body. Search the items for the link first, and never file a source twice. File a signed-off design's work as a build kind. File an issue that needs the owner's decision held. Keep each source ID with its item ID in the handoff doc.

Authority: file, note, hold, release, retry, defer, expedite and close items without asking; answer a hold that a note can fix. Not authorised: signing off a PR boxxy holds for the owner, pausing the runner, registering for notices. Never: a ruleset bypass, printing a secret.

Bring the owner only: a held decision, a sign-off, an item that failed the same retry twice. One at a time, with options and a recommendation, never in the same turn as an explanation.

Watch for holds with a background loop that lists the held items.

Rules: follow AGENTS.md and the skills it lists; a model on every subagent.

Keep a handoff doc in .handoff/ current at each milestone, as the handoff skill says. After a compaction, read it before anything else.

Report: each morning, what merged with PR links, what's held and why.

Done when: every item filed for this goal is done, archived, or held on the owner with the exact action listed; each "small" issue and each design has its item, and each tracker issue is closed or linked to its PR; no item waits with no PR and no hold. Print the item list for this goal in the last turn as the evidence.

When stopped: list each hold with the exact action the owner must take.
```
