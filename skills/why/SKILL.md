---
name: why
description:
  "Finds out why code or a decision is the way it is, from what people wrote at the time: commits,
  PRs, tickets, docs, agent sessions, logs. Sends one investigator to each evidence source the
  project has, has a separate subagent weigh what they found, and returns a cited answer that keeps
  what was found apart from what was inferred. Load it for 'why does X work this way' or 'why did we
  pick Y', and before you remove or change code you don't understand."
---

# Why

Use this skill to find out why code or a decision is the way it is. The code shows what it does,
never why. The reason lives in what people wrote at the time: commit messages, PRs, tickets, docs,
code comments and agent sessions. Each place that holds such writing is an evidence source. You hand
the user one cited report, and the user uses it to decide whether to keep or change the target.
Three mistakes make the answer wrong:

- you read the latest commit and stop, but the shape comes from earlier decisions;
- you write "because" for a reason nobody wrote down;
- you search only the sources you can reach, and report the gaps as "no reason exists".

## Key rules

- [Anchor](#anchor): pin the target to its commits, PRs and tickets before the fan-out.
- [Sources](#sources): the sources the repo's AGENTS.md declares, or else every common source, with
  each one you can't reach reported as a gap.
- [Fan out](#fan-out): one investigator per source, a reason for each source you skip, and a short
  path when the anchor already states the reason and nobody plans a change.
- [Weigh](#weigh): a separate subagent sorts the reasons and writes the report.
- [Report](#report): the order the weigher writes in; every source gets a line.

## References

Give each subagent the absolute path of its file, and tell it to read the file first.

- [investigator.md](./references/investigator.md): every investigator.
- [weigher.md](./references/weigher.md): the weigher.
- [git.md](./references/git.md): the investigator for commits and PRs.
- [linear.md](./references/linear.md): the investigator for tickets.
- [agent-sessions.md](./references/agent-sessions.md): the investigator for transcripts.
- [logs-metrics.md](./references/logs-metrics.md): the investigator for logs and metrics.

A source with no file of its own, such as docs, still gets an investigator, with investigator.md
alone.

## Anchor

Name the target: files and lines, symbols, or a decision. When the question is vague, take your best
reading from the conversation, tell the user in one line, and go on without waiting.

For code, find the commits that introduced the target or changed its behaviour, and skip a move, a
rename or a format change:

```bash
git blame -L <start>,<end> <file>
git log --follow --oneline -- <file>
```

Find each commit's PR from the `(#123)` at the end of its subject, or with
`gh pr list --search <hash> --state merged`. Note the ticket IDs in each PR's body and branch name.
Stop there: the git investigator goes further back.

For a decision with no code, note the ticket, doc or session where it was made, and the terms that
name it.

The anchor is these commits, PRs, ticket IDs and terms. Every investigator gets it.

When the question holds a guess, such as "I assume it's for speed", treat the guess as one
candidate, and check it like any other.

## Sources

Read the `## Evidence sources` section of the repo's AGENTS.md. It names each source the project has
and how to reach it. An invented example:

```markdown
## Evidence sources

- Code and PRs: git, `gh`.
- Tickets: Linear, team WID.
- Docs: `docs/`.
- Agent sessions: the user's machine only, through the `why` skill's reference.
- Logs and metrics: Loki and Prometheus through Grafana, on the tailnet. Logs are kept 7 days.
- Errors: none. Analytics: none.
```

When the repo has no such section, treat each of these as a source the project may have:

- code and PRs;
- tickets;
- docs and decision records;
- agent sessions;
- logs and metrics;
- errors;
- analytics.

A source is reachable when your session has a tool or command for it. Send an investigator to each
reachable source. Report each one you can't reach as a gap, and say in the report that the repo
declared no sources.

## Fan out

In one message, start one general-purpose subagent for each source. Each investigator owns one
source, and gets:

- the question;
- the anchor;
- the path of investigator.md, and of the source's own file when one exists.

When the target is defensive code, such as a retry, a timeout, a guard, a flag or a limit, tell each
investigator to look for an incident in the 2 weeks before and after the date the code landed.

Each investigator returns Leads: links into other sources, such as a ticket ID found in a PR. When a
lead names an item that the investigator for its source didn't read, send that investigator, or a
new one, to read it. Then go on to the weigher.

A source you don't search goes in the report with its reason. There are two kinds:

- a gap: the project lacks the source, or your session can't reach it;
- a skip: the source can't bear on the target, such as runtime logs for a build script.

The short path: when a PR or ticket in the anchor states the reason in words, and neither the user
nor you plans to change the target, answer from it yourself. Give the reason, its quote and link,
and list the sources you didn't search. A planned change always gets the full fan-out and the
weigher.

## Weigh

Start one more subagent, the weigher, to sort the reasons and write the report. Give it:

- the question, with any guess in it;
- the anchor;
- every investigator's report;
- each gap and skip, with its reason, and whether the repo declared its sources;
- the path of weigher.md;
- when a change is planned, what the change is.

Don't give it your own reasoning or the answer you hope for. You may have a stake in the answer,
such as wanting a "yes, safe to change", and the weigher can't share it if it never sees it.

Hand the weigher's report to the user as written. Don't soften or firm up its confidence.

## Report

The weigher writes the report in this order:

1. The question, and what the target does, in two lines.
2. Found: each reason with its quote and link.
3. Inferred: each reason with its chain of evidence.
4. Competing stories, when the evidence fits more than one reason.
5. Unknown: what was searched and not found, with the queries.
6. Sources: one line each, with what was searched, or the gap or skip and its reason.
7. Confidence, in one line.

When a change is planned, it ends with what to keep, what can change, what to avoid, and the risk of
the change.

**Reply:** the weigher's report, or on the short path your own answer.
