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

Find out why code or a decision is the way it is. The code tells you what it does. It never tells
you why. The reason is in what people wrote at the time: commit messages, PRs, tickets, docs, code
comments and agent sessions. Each place that holds such writing is an evidence source.

Trace past the latest commit. Code gets its shape from many decisions. Write "because" only for a
reason someone wrote down. Report a source you couldn't reach as a gap in the search, and say what
you did search. Never write "no reason exists": your caller would stop looking.

Hand one cited report back to your caller. Usually that's an agent about to change the code, such as
a refactor that wants to remove it. It uses the report to decide whether to keep or change the
target. When the user asked the question, give the report the form
[When the user asked the question](#when-the-user-asked-the-question) gives.

## Key rules

- [Anchor](#anchor): pin the target to its commits, PRs and tickets before the fan-out.
- [Sources](#sources): the sources the repo's AGENTS.md declares, or else every source the project
  may have, with each one you can't reach reported as a gap.
- [Fan out](#fan-out): one investigator per source, a reason for each gap and skip, and a short path
  when the anchor already states the reason and the caller plans no change.
- [Weigh](#weigh): a separate subagent sorts the reasons and writes the report.
- [Report](#report): check the weigher's report has its parts, and send it back when one is missing.
- [When the user asked the question](#when-the-user-asked-the-question): a timeline of the
  decisions, before Found.

## References

Give each subagent the absolute path of each file it needs, and tell it to read them first.

- [investigator.md](./references/investigator.md): every investigator, first.
- [weigher.md](./references/weigher.md): the weigher, with the report's full order.
- [git.md](./references/git.md): the investigator for commits and PRs.
- [linear.md](./references/linear.md): the investigator for tickets.
- [agent-sessions.md](./references/agent-sessions.md): the investigator for agent sessions.
- [logs-metrics.md](./references/logs-metrics.md): the investigator for logs and metrics.

A source with no file of its own, such as docs or another ticket tracker, still gets an
investigator, with investigator.md alone.

## Anchor

Name the target: files and lines, symbols, or a decision. When the question is vague, take your best
reading of it, and go on without waiting. Pass that reading to the weigher as the question, so the
report states it.

For code, find the commits that blame shows for the target's lines. `-w -C -C` makes blame look past
whitespace changes and code moved from another file. When blame shows a rename or a format commit,
run it again on that commit's parent, `<hash>^`. `git log --follow` shows where the file was
renamed:

```bash
git blame -w -C -C -L <start>,<end> <file>
git log --follow --oneline -- <file>
```

Find each commit's PR from the `(#123)` at the end of its subject, or with
`gh pr list --search <hash> --state merged`. Note the ticket IDs in each PR's body and branch name.
Stop there. The git investigator goes further back.

For a decision with no code, search the docs and the tickets for its name. Note the ticket, doc or
session where it was made, and the terms that name it.

The anchor is these commits, PRs and ticket IDs, and the terms: the names the code and the tickets
use for the target. Every investigator gets it.

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

When the repo has no such section, tell the weigher so, and treat each of these as a source the
project may have:

- code, its comments, and PRs;
- tickets;
- docs and decision records;
- agent sessions;
- logs and metrics;
- errors;
- analytics.

Either way, a source is reachable when your session has a tool or command for it. Each source you
can't reach is a gap.

## Fan out

Before you start any subagent, decide two things.

First, the short path: when a PR or ticket in the anchor states the reason in words, and the caller
plans no change to the target, answer from it yourself. Give the reason, its quote and link, and
list the sources you didn't search. When the caller plans a change, always run the full fan-out and
the weigher.

Second, which sources you won't search, and why. There are two kinds:

- a gap: the project lacks the source, or your session can't reach it;
- a skip: the source can't bear on the target, such as runtime logs for a build script.

Then, in one message, start one general-purpose subagent for each source left. Each investigator
owns one source, and gets:

- the question;
- the anchor;
- the path of investigator.md, and of the source's own file when one exists.

When the target is defensive code, such as a retry, a timeout, a guard, a flag or a limit, tell each
investigator to look for an incident in the 2 weeks before and after the date its current value
landed.

Each investigator returns Leads: links into other sources, such as a ticket ID found in a PR. When a
lead names an item that the investigator for its source didn't read, start a new investigator with
the same inputs, and the lead as its anchor. Skip a lead into a gap or a skip. Do one round of
leads, then go on to the weigher.

## Weigh

Start one more subagent, the weigher, to sort the reasons and write the report. Give it:

- the question, with any guess in it;
- the anchor;
- every investigator's report;
- each gap and skip, with its reason, and whether the repo declared its sources;
- the path of weigher.md;
- when a change is planned, what the change is.

Don't give it your own reasoning or the answer you hope for. If you want a "yes, safe to change" and
the weigher knows it, it leans that way too.

Hand the weigher's report to your caller as written. Don't soften or firm up its confidence.

## Report

Check that the weigher's report keeps what was found apart from what was inferred, gives every
source a line, and ends with a confidence line. When a change is planned, check that it ends with
what to keep, what can change, what to avoid, and the risk. When a part is missing, send the report
back to the weigher. Don't fix it yourself.

## When the user asked the question

When the user asked the question, tell the weigher that the reader is the user. The report then puts
a timeline of the decisions that shaped the target between the question and Found. weigher.md says
how to draw it. The sections, the quotes and the confidence line stay the same. On the short path,
give the quote and link with no timeline.

**Reply:** the weigher's report, or on the short path your own answer.
