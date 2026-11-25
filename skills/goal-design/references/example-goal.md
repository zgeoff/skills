# Example goal

An invented goal for an invented notes app, Tidepool, with every part from
[The parts](../SKILL.md#the-parts). Copy its shape and the length of its parts. Write your own
content: the session acts on every word.

```text
/goal Land Tidepool's open builds to merged, released and deployed, and get the sharing design signed off. Source of truth: the signed-off design docs in docs/design/ and the tracker. Don't reopen a signed-off decision; if one proves unbuildable, stop and ask the owner.

Work (lanes run in parallel; at most 3 builds at once; when two lanes touch the same files, finish one first):
A. Offline sync: fix the review findings on its open PR (TP-41), merge, release, deploy. Then conflict prompts (TP-44).
B. Search: the index rebuild (TP-52), then search filters (TP-53).
C. Held until the sharing design is signed off: shared notebooks (TP-60), then link expiry (TP-61).
D. The sharing design PR (TP-58): run the design tests, deslop, cold read, open the PR, walk the owner through it one section at a time, fold in the answers, merge on sign-off.

For each item: make its ticket a buildable work item, split it if one PR would be too big; check the plan against the design with the advisor; run build-feature with review 'codex'; add a test that fails without the change, and a new verify journey when it's user-facing; verify it as a user with the repo's verify command and publish the report into the PR. Merge when CI is green on the latest push and every finding is answered; rerun a flaky job once, then treat it as real. Rebase before each merge, and merge one PR at a time. Release and deploy after each merge that changes prod. After a deploy, check health and run the read-only prod checks. Clean up worktrees, branches and previews. Move a ticket to Done only with evidence for each acceptance line.

Authority: merge, release and deploy without asking. Not authorised: merging a design PR before the owner signs it off. Never: --admin or a ruleset bypass, a test write to prod, a real payment, printing a secret. When a permission check refuses an action, stop and give the owner the exact command.

Bring the owner only: naming, how the app feels to use, an open technology choice, an outside account, money, and the design walkthrough. One decision at a time, with options and a recommendation, never in the same turn as an explanation. Keep building what doesn't depend on the answer. Record each blocker once, with its next step.

Known waits: the app store review for the mobile build (check it each morning), a test card for paid plans (check the billing settings before each paid-plan test).

Rules: Conventional Commits, no attribution lines, a model on every subagent, follow AGENTS.md and the skills it lists.

Keep a handoff doc in .handoff/ current at each milestone, as the handoff skill says. After a compaction, read it before anything else.

Report: after each merge, two lines: what landed, with the PR link, and what's next.

Done when: every build in lanes A and B is deployed with its post-deploy checks passing, each with its PR link in a report; lane C is held on the design or deployed; the sharing design is merged, or in review with the owner. At the end, state the evidence for each of these lines.

When stopped: list each block with the exact action the owner must take, then give the final report.

Out of scope: the desktop app's theme work, which has its own session.
```
