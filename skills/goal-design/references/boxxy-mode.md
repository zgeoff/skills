# boxxy mode

In boxxy mode, have the session file the work as items in [boxxy](https://github.com/zgeoff/boxxy)
and see each item to its end. boxxy's runner starts an agent on each item, runs it through the
pipeline that boxxy's rules file sets for the item's kind, and merges the PR.

Change the shape of these parts of the goal:

- In **Work**, list batches in the order to file them, in place of lanes. Say which batch to
  expedite. boxxy's limits set how many items run at once, so leave out the most builds at once.
- In **For each item**, put the filing rules from [Intake](#intake), under the label `Filing:`.
  Leave the build steps out: boxxy's recipes and phase prompts hold them, and a copy in the goal
  drifts from them.

Read boxxy's tools, through its MCP server or `boxxy --help`, and its rules file before you write.
When a fact in this file differs from them, follow boxxy.

## Intake

Name the source of the work in the goal, such as a tracker project, a filter of small issues, or a
folder of design docs. Then tell the session how to file each source item:

- File one item per source item with the work-items skill, and give each item the repo, a title, the
  outcome and acceptance lines. In one acceptance line, name the new check that proves the item,
  such as a test that fails without the change, or a new verify journey for a user-facing change.
  Put the source's link, and the path of any design doc, in the item's body. boxxy has no field for
  a tracker issue or a design doc.
- Before filing, search the items for the source's link, and skip a source item whose link is
  already on an item. After a compaction, the session can't tell what it filed from memory.
- Set the kind from the rules file. boxxy runs its own design first for a kind with a design phase,
  so file a signed-off design's work as a kind that goes straight to build, with the doc's path in
  the body.
- Turn each dependency into a `blocks` relation: set `blockedBy` at filing, or add the relation
  later. boxxy gates an item on no other relation.
- File an item that waits on the user's decision as held, with the reason.
- Record each source ID with its item ID in the handoff doc.

## While it runs

- **Notices.** boxxy sends each hold notice to one registered session, and a session that registers
  takes the notices from the session registered before it. Ask the user before you put registration
  in the goal, and name the session it would take the notices from. Without registration, tell the
  session how to watch for holds, such as a background loop that lists the held items.
- **Holds.** Say which holds the session answers itself and which go to the user. Have the session
  answer with a note on the item, then a retry, with a phase when the item must go back. The agent
  on the next attempt reads every note. Send the user an item that fails the same retry twice.
- **Sign-off.** boxxy holds for the owner each PR that matches the sign-off rules in its rules file.
  Say whether the session may approve any of them. When the user hasn't said, send them all to the
  user.
- **The runner.** Say whether the session may pause and resume it.

## Closing

- An item becomes done only when a PR from it merges. Tell the session to close, with a reason, each
  item that ends another way: a design-only item, a duplicate, a declined item or a split.
- When an item ends, update its source: move the tracker issue to done with the PR link, or mark the
  design doc built.
- boxxy runs no release or deploy. When the work ships, add those steps as
  [Direct mode](./direct-mode.md) says.

## Done-when

Write the done-when line from boxxy's item states, which the session prints:

- every filed item is done, archived, or held on the user with the exact action listed;
- each source item has its boxxy item, and each tracker issue is moved to done with its PR link;
- no item is left in the `waiting` state, where an item that ends without a PR stays until the
  session closes it.

Tell the session to print the item list, filtered to this goal's items, in its last turn.

## Example

An invented boxxy goal, at about 2,000 characters:

```text
/goal Clear every open issue labelled "small" in the Tidepool tracker project through boxxy, and feed in the two signed-off designs in docs/design/export/. Source of truth: the tracker and those design docs.

Work: file in this order, expediting batch 1. 1. The small issues, one item each. 2. The export designs: the CSV export, then the PDF export, which the CSV item blocks.

Filing: write each item with the work-items skill, with the issue or doc link in its body, and one acceptance line that names the new test or verify journey that proves it. Search the items for the link first, and never file a source twice. File a signed-off design's work as a build kind. File an issue that needs the owner's decision held. Keep each source ID with its item ID in the handoff doc.

Authority: file, note, hold, release, retry, defer, expedite and close items without asking; answer a hold that a note can fix. Not authorised: signing off a PR boxxy holds for the owner, pausing the runner, registering for notices. Never: a ruleset bypass, printing a secret.

Bring the owner only: a held decision, a sign-off, an item that failed the same retry twice. One at a time, with options and a recommendation, never in the same turn as an explanation.

Holds: watch for them with a background loop that lists the held items.

Rules: follow AGENTS.md and the skills it lists; a model on every subagent.

Keep a handoff doc in .handoff/ current at each milestone, as the handoff skill says. After a compaction, read it before anything else.

Report: each morning, what merged with PR links, what's held and why.

Done when: every item filed for this goal is done, archived, or held on the owner with the exact action listed; each "small" issue and each design has its item, and each tracker issue is moved to done with its PR link; no item is left waiting. Print the item list for this goal in the last turn as the evidence.

When stopped: list each hold with the exact action the owner must take, then give the final report.
```
