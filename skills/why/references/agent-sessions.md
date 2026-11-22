# Agent sessions

Read this file after investigator.md when your caller makes you the investigator for agent sessions.
investigator.md defines the target, the anchor and the sections of your return, such as Gaps and
Leads. After step 5, search for the other side, as investigator.md says, then stop.

The user makes decisions in chats with agents, and the chat can be the only record. A user's
decision is one the user typed, or the only proposal in an agent's message when the user's next
message said yes to it. Report a user's decision as direct evidence, quoting both messages when the
agent proposed it, with the user as the author. A yes to a message with several proposals is
indirect evidence, as step 4 says. A transcript's entries of type `user` also hold launch prompts,
tool results, task notices and messages from other agents. These look like the user typed them.

A transcript is a `.jsonl` file with one entry per line. The transcripts live on the user's machine:

- Claude Code: `~/.claude/projects/<slug>/`, one file per session, with subagents under
  `<session-id>/subagents/`. `<slug>` is the session's working directory with each `/` and `.`
  turned into `-`.
- Codex: `~/.codex/sessions/<year>/<month>/<day>/rollout-*.jsonl`. Each file's first entry, of type
  `session_meta`, holds the session's working directory.
- Any other store the `## Evidence sources` section of the repo's AGENTS.md lists.

When none of these stores exists, you are on a machine without them. Put this source under Gaps in
your return.

1. Search with `grep -rn`, which gives each hit's file and line. Search for the anchor's ticket IDs,
   its PR numbers as `#123\b` or `pull/123`, and its terms. Search every folder for the ticket IDs
   and the PR numbers. A session about the repo can start in any directory. Search for a term only
   in the repo's sessions. A common word hits every project. For Claude Code, the repo's sessions
   are the folders whose name starts with the repo's slug, which includes its worktrees. For Codex,
   those are the files whose `session_meta` working directory is inside the repo. Never match a
   quote or a backslash in the text you search for: the JSON escapes each one, so the match fails. A
   regex token such as `\b` matches no character, so keep it.
2. For each hit, read the 3 entries before and after its line. Read further when the decision isn't
   settled there. Each entry's `timestamp` gives its date. When a search hits more than 20 entries,
   read the ones nearest the anchor's commit dates first.
3. Pick out the user's typed words:
   - Claude Code: an entry with `"type": "user"` whose `message.content` is a string. Skip one that
     starts with a tag, such as `<task-notification>`.
   - Codex: an `event_msg` entry whose `payload.type` is `user_message`.
   - Either: skip an entry that reads as one agent writing to another, such as a relayed message.
4. When the user replied "ok" to a message with several proposals, report that as indirect evidence.
   The reply doesn't show which proposal the user meant.
5. Every user entry in a file under `subagents/` comes from the parent agent, never the user. Report
   it as indirect evidence when it shows the reasoning behind a decision.
