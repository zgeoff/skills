---
name: mcp-servers
description:
  'Says which calls are free and which need approval on the Axiom, Grafana, Neon, Fly, Cloudflare
  and impz MCP servers, and what never goes into a PR, issue or comment. Load it before you call a
  tool on any of these six servers.'
metadata:
  kind: rule-set
---

# MCP servers

## The rule

- Read freely. Reading costs nothing and changes nothing.
- Treat a change as a Deploy, Infra or Credentials Action, and get the usual approval first.

| Server           | Who uses it                                          | Free to use                                      | An Action                                                      |
| ---------------- | ---------------------------------------------------- | ------------------------------------------------ | -------------------------------------------------------------- |
| Axiom, Grafana   | live checks after a deploy, builders on a prod bug   | logs, traces, metrics, dashboards, alert history | creating or changing monitors, dashboards, notifiers or alerts |
| Neon (read-only) | builders on a database                               | schema, slow queries, query plans                | none: the server can't write                                   |
| Fly              | release and deploy work, builders on Fly-hosted apps | status, logs, releases                           | restart, deploy, scale, destroy, secrets, certs, IPs, volumes  |
| Cloudflare       | builders                                             | docs and search                                  | `execute`                                                      |
| impz             | builders and QA                                      | throwaway `agent-*` imps for repro and tests     | none                                                           |

## Guardrails

- Keep prod logs and query results out of PRs, issues and comments. Post numbers and status codes
  only.
- Use these servers from a local agent only. Imp builders don't get them.
