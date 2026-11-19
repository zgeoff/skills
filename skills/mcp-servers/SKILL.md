---
name: mcp-servers
description:
  "Says which calls on the Axiom, Grafana, Neon, Fly, Cloudflare and impz MCP servers you may make
  without asking, which need the user's yes first, and what production data never goes into a PR,
  issue or comment. Load it before you call a tool on any of these six servers."
metadata:
  kind: rule-set
---

# MCP servers

Two mistakes do the most harm with these servers: changing a live system without the user's yes, and
pasting production data where others can read it. The two sections below cover each.

These servers are for agents on the user's own computer. If you run inside an impz microVM, don't
call them, even when they are listed.

## Ask before any change

Make a read without asking: a query, a list, a status, a log search. On Axiom, keep each query to
the narrowest time range the question allows, because Axiom bills a query by the data it scans.

Ask the user for a yes before any call that changes a system, and wait for it. Name the calls and
their targets in one message; one yes covers the calls you named. A yes counts when it comes from
the user, or from an agent the user has said acts for them, because only they answer for what the
change does.

| Server         | Reads, made without asking                                | Changes, which need a yes                                             |
| -------------- | --------------------------------------------------------- | --------------------------------------------------------------------- |
| Axiom, Grafana | logs, traces, metrics, dashboards, alert history          | monitors, dashboards, notifiers, alerts, annotations, incidents       |
| Neon           | schema, slow queries, query plans, `SELECT` statements    | any SQL that writes                                                   |
| Fly            | app status, logs, releases                                | restart, deploy, scale, destroy, `exec`, secrets, certs, IPs, volumes |
| Cloudflare     | docs and search                                           | any `execute` call                                                    |
| impz           | your own `agent-*` microVMs: create, use and destroy them | any change to a microVM with another name                             |

Treat a call the table doesn't name the same way: a read needs no yes, and a change does.

On impz, name each microVM you create `agent-<task>`, and destroy it when your task ends, so the
next agent finds only the microVMs someone is still using.

## Keep production data out of what others read

Post only figures you work out from production data: counts, rates, durations, status codes and
error class names. Never paste a log line, a query row, a request or response body, or a trace
payload into a PR, an issue, a comment, a commit or a test fixture, even trimmed. Production data
can hold users' personal data and secrets, and a PR or an issue may be public. You may show raw data
to the user in the chat.
